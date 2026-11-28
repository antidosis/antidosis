import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const C = {
  sky: 0x071113, fog: 0x0a191a, land: 0x18312d, high: 0x365143,
  coast: 0x6a7054, water: 0x082b33, road: 0x3c4640, roadEdge: 0x7b8170,
  ink: 0x0a1112, amber: 0xffbd67, mint: 0xa8f0c6, signal: 0xd7f99a,
  coral: 0xff7d6b, blue: 0x78b9ca, warm: 0xffd89b,
};

function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(4172026);
const clamp = THREE.MathUtils.clamp;
const smooth = THREE.MathUtils.smoothstep;
let GEO = null;
let waterBytes = null;
let extents = null;
export const LOC = {};

function project(lon, lat) {
  return [
    (lon - GEO.center.lon) * 111.32 * Math.cos(THREE.MathUtils.degToRad(GEO.center.lat)) * GEO.kmScale,
    (GEO.center.lat - lat) * 111.32 * GEO.kmScale,
  ];
}

function setGeography(data) {
  GEO = data;
  const a = project(data.bounds.west, data.bounds.north);
  const b = project(data.bounds.east, data.bounds.south);
  extents = { minX: a[0], maxX: b[0], minZ: a[1], maxZ: b[1] };
  const binary = atob(data.grid.water);
  waterBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) waterBytes[i] = binary.charCodeAt(i);
  Object.assign(LOC, data.places, data.relays);
}

function gridCoordinates(x, z) {
  const n = GEO.grid.size;
  return [
    clamp((x - extents.minX) / (extents.maxX - extents.minX), 0, 1) * (n - 1),
    clamp((z - extents.minZ) / (extents.maxZ - extents.minZ), 0, 1) * (n - 1),
  ];
}

export function isWater(x, z) {
  if (!GEO) return false;
  const [gx, gy] = gridCoordinates(x, z);
  const col = Math.round(gx), row = Math.round(gy), i = row * GEO.grid.size + col;
  return Boolean(waterBytes[i >> 3] & (1 << (i & 7)));
}

export function waterField(x, z) { return isWater(x, z) ? 1 : -1; }

export function heightAt(x, z) {
  if (!GEO) return 0;
  const [gx, gy] = gridCoordinates(x, z);
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const x1 = Math.min(GEO.grid.size - 1, x0 + 1), y1 = Math.min(GEO.grid.size - 1, y0 + 1);
  const fx = gx - x0, fy = gy - y0, n = GEO.grid.size, h = GEO.grid.heights;
  const top = h[y0 * n + x0] * (1 - fx) + h[y0 * n + x1] * fx;
  const bottom = h[y1 * n + x0] * (1 - fx) + h[y1 * n + x1] * fx;
  const elevation = top * (1 - fy) + bottom * fy;
  return isWater(x, z) ? -0.32 : Math.max(0.025, elevation * GEO.verticalScale);
}

export function at(key, lift = 0) {
  const p = typeof key === 'string' ? LOC[key] : key;
  const xz = p.p || [p.x, p.z];
  return new THREE.Vector3(xz[0], Math.max(0.055, heightAt(xz[0], xz[1])) + lift, xz[1]);
}

function mat(color, roughness = 0.85, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,.9)');
  g.addColorStop(0.35, 'rgba(255,255,255,.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
export const haloMap = glowTexture();

export function halo(color, scale = 1) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloMap, color, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sprite.scale.setScalar(scale);
  return sprite;
}

function createTerrain() {
  const n = GEO.grid.size, positions = [], colors = [], indices = [];
  const low = new THREE.Color(C.land), high = new THREE.Color(C.high);
  const coast = new THREE.Color(C.coast), underwater = new THREE.Color(0x102827);
  const color = new THREE.Color();
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = row * n + col;
      const x = extents.minX + (extents.maxX - extents.minX) * col / (n - 1);
      const z = extents.minZ + (extents.maxZ - extents.minZ) * row / (n - 1);
      const water = Boolean(waterBytes[i >> 3] & (1 << (i & 7)));
      const elevation = GEO.grid.heights[i] * GEO.verticalScale;
      positions.push(x, water ? -0.34 - Math.min(0.25, Math.max(0, elevation) * 0.08) : Math.max(0.02, elevation), z);
      if (water) color.copy(underwater);
      else {
        color.copy(low).lerp(high, clamp(elevation / 3.8, 0, 1));
        let shore = false;
        for (let dr = -2; dr <= 2 && !shore; dr++) for (let dc = -2; dc <= 2; dc++) {
          const rr = clamp(row + dr, 0, n - 1), cc = clamp(col + dc, 0, n - 1), j = rr * n + cc;
          if (waterBytes[j >> 3] & (1 << (j & 7))) { shore = true; break; }
        }
        if (shore && elevation < 0.42) color.lerp(coast, 0.66);
        color.offsetHSL(0, 0, (rand() - 0.5) * 0.035);
      }
      colors.push(color.r, color.g, color.b);
      if (row < n - 1 && col < n - 1) {
        const a = i, b = i + 1, c = i + n, d = i + n + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98 }));
  mesh.receiveShadow = true;
  return mesh;
}

function createWater() {
  const n = GEO.grid.size, positions = [], shores = [], indices = [];
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const i = row * n + col;
    const x = extents.minX + (extents.maxX - extents.minX) * col / (n - 1);
    const z = extents.minZ + (extents.maxZ - extents.minZ) * row / (n - 1);
    positions.push(x, 0.015, z);
    let mixed = false;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const rr = clamp(row + dr, 0, n - 1), cc = clamp(col + dc, 0, n - 1), j = rr * n + cc;
      const a = Boolean(waterBytes[i >> 3] & (1 << (i & 7)));
      const b = Boolean(waterBytes[j >> 3] & (1 << (j & 7)));
      if (a !== b) mixed = true;
    }
    shores.push(mixed ? 1 : 0);
    if (row < n - 1 && col < n - 1) {
      const ids = [i, i + 1, i + n, i + n + 1];
      const count = ids.reduce((sum, id) => sum + Boolean(waterBytes[id >> 3] & (1 << (id & 7))), 0);
      if (count >= 2) indices.push(i, i + n, i + 1, i + 1, i + n, i + n + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aShore', new THREE.Float32BufferAttribute(shores, 1));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uStorm: { value: 0 }, uDawn: { value: 0 },
      uDeep: { value: new THREE.Color(C.water) }, uGlow: { value: new THREE.Color(0x397a7b) },
    },
    vertexShader: `
      uniform float uTime; uniform float uStorm; attribute float aShore;
      varying vec3 vWorld; varying float vWave; varying float vShore;
      void main(){vec3 p=position; float w=sin(p.x*.82+uTime*.32)*cos(p.z*.73-uTime*.24);
      w+=sin((p.x+p.z)*1.8-uTime*.38)*.32; p.y+=w*(.012+uStorm*.018);
      vWave=w; vShore=aShore; vWorld=(modelMatrix*vec4(p,1.)).xyz;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `
      uniform float uTime; uniform float uStorm; uniform float uDawn;
      uniform vec3 uDeep; uniform vec3 uGlow; varying vec3 vWorld; varying float vWave; varying float vShore;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){float ripple=pow(max(0.,sin(vWorld.x*2.7+vWorld.z*1.8+uTime*.38)),18.);
      float broad=.5+.5*sin(vWorld.x*.19-vWorld.z*.16+uTime*.035);
      float sparkle=step(.997,hash(floor(vWorld.xz*8.)+floor(uTime*.45)))*.18;
      float foam=vShore*pow(.5+.5*sin(vWorld.x*5.+vWorld.z*3.-uTime*.55),5.)*.12;
      vec3 col=mix(uDeep,uGlow,.10+broad*.06+vWave*.018);
      col+=uGlow*(ripple*.055+sparkle+foam)*(1.-uStorm*.55);
      col=mix(col,vec3(.22,.32,.27),uDawn*.2); gl_FragColor=vec4(col,1.);}`,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function roadGeometry(kind) {
  const positions = [], indices = [];
  const major = kind === 'major';
  for (const road of GEO.roads) {
    const isMajor = road.kind !== 'secondary';
    if (isMajor !== major) continue;
    const points = road.points.map(([lon, lat]) => project(lon, lat));
    const width = road.kind === 'motorway' || road.kind === 'trunk' ? 0.065 : major ? 0.048 : 0.031;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
      if (length < 0.003) continue;
      const nx = -dz / length * width, nz = dx / length * width;
      const base = positions.length / 3;
      for (const [p, side] of [[a, -1], [a, 1], [b, -1], [b, 1]]) {
        const x = p[0] + nx * side, z = p[1] + nz * side;
        positions.push(x, Math.max(0.07, heightAt(x, z) + 0.055), z);
      }
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function createRoads() {
  const group = new THREE.Group();
  const major = new THREE.Mesh(roadGeometry('major'), mat(0x4b5148, 0.96));
  const minor = new THREE.Mesh(roadGeometry('minor'), mat(C.road, 0.98));
  major.receiveShadow = minor.receiveShadow = true;
  major.material.polygonOffset = minor.material.polygonOffset = true;
  major.material.polygonOffsetFactor = minor.material.polygonOffsetFactor = -1;
  group.add(minor, major);
  return { group, major, minor, ways: GEO.roads.length };
}

export function routeCurve(key) {
  const route = GEO.routes[key];
  const path = new THREE.CurvePath();
  const points = route.points.map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    return new THREE.Vector3(x, Math.max(0.14, heightAt(x, z) + 0.12), z);
  });
  for (let i = 0; i < points.length - 1; i++) path.add(new THREE.LineCurve3(points[i], points[i + 1]));
  path.userData = { distanceKm: route.distanceKm, minutes: route.minutes };
  return path;
}

function gableGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0); shape.lineTo(0.5, 0); shape.lineTo(0, 0.34); shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.75, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -0.375);
  return geometry;
}

function roadIndex() {
  const cells = new Set();
  for (const road of GEO.roads) for (const [lon, lat] of road.points) {
    const [x, z] = project(lon, lat);
    cells.add(`${Math.round(x / 0.18)},${Math.round(z / 0.18)}`);
  }
  return cells;
}

function createTown() {
  const group = new THREE.Group(), count = 1080;
  const bases = new THREE.InstancedMesh(new THREE.BoxGeometry(0.48, 0.32, 0.4), mat(0xb5b4a2), count);
  const roofs = new THREE.InstancedMesh(gableGeometry(), mat(0x55635d, 0.72, 0.08), count);
  const windows = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.09, 0.018), new THREE.MeshStandardMaterial({
    color: 0xffdca3, emissive: 0xffb45f, emissiveIntensity: 1.25, roughness: 0.5,
  }), count);
  bases.castShadow = roofs.castShadow = true;
  bases.receiveShadow = roofs.receiveShadow = true;
  const dummy = new THREE.Object3D(), roads = roadIndex(), places = Object.values(GEO.places);
  const storyPlaces = ['Woy Woy', 'Kincumber', 'Umina Beach', 'Gosford', 'Wyong', 'Noraville', 'MacMasters Beach', 'Blue Haven', 'Budgewoi', 'The Entrance', 'Somersby', 'Wyee'];
  let n = 0, attempts = 0;
  while (n < count && attempts++ < 32000) {
    const place = places[Math.floor(rand() * places.length)];
    const angle = rand() * Math.PI * 2, radius = 0.45 + Math.sqrt(rand()) * (1.15 + rand() * 1.35);
    const x = place.p[0] + Math.cos(angle) * radius, z = place.p[1] + Math.sin(angle) * radius * 0.72;
    if (x < extents.minX + 0.3 || x > extents.maxX - 0.3 || z < extents.minZ + 0.3 || z > extents.maxZ - 0.3 || isWater(x, z)) continue;
    if (roads.has(`${Math.round(x / 0.18)},${Math.round(z / 0.18)}`)) continue;
    if (storyPlaces.some(key => Math.hypot(LOC[key].p[0] - x, LOC[key].p[1] - z) < 0.46)) continue;
    const y = heightAt(x, z), scale = 0.65 + rand() * 0.62, yaw = rand() * Math.PI * 2;
    dummy.position.set(x, y + 0.16 * scale, z); dummy.rotation.set(0, yaw, 0); dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix(); bases.setMatrixAt(n, dummy.matrix);
    bases.setColorAt(n, new THREE.Color().setHSL(0.10 + rand() * 0.08, 0.08 + rand() * 0.1, 0.52 + rand() * 0.18));
    dummy.position.y = y + 0.32 * scale; dummy.updateMatrix(); roofs.setMatrixAt(n, dummy.matrix);
    roofs.setColorAt(n, new THREE.Color().setHSL(0.08 + rand() * 0.4, 0.1 + rand() * 0.12, 0.25 + rand() * 0.16));
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    dummy.position.set(x, y + 0.18 * scale, z).addScaledVector(forward, 0.21 * scale);
    const lit = rand() > 0.36 ? scale : 0.001;
    dummy.scale.set(lit, lit, lit); dummy.updateMatrix(); windows.setMatrixAt(n, dummy.matrix);
    n++;
  }
  bases.count = roofs.count = windows.count = n;
  bases.instanceMatrix.needsUpdate = roofs.instanceMatrix.needsUpdate = windows.instanceMatrix.needsUpdate = true;
  group.add(bases, roofs, windows);
  group.userData.count = n;
  return group;
}

function createTrees() {
  const group = new THREE.Group(), count = 2200;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.045, 0.4, 5), mat(0x3d392c), count);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.26, 1), mat(0x244638), count);
  trunks.castShadow = crowns.castShadow = true;
  const dummy = new THREE.Object3D(), roads = roadIndex(), places = Object.values(GEO.places);
  let n = 0, attempts = 0;
  while (n < count && attempts++ < 48000) {
    const x = extents.minX + 0.5 + rand() * (extents.maxX - extents.minX - 1);
    const z = extents.minZ + 0.5 + rand() * (extents.maxZ - extents.minZ - 1);
    if (isWater(x, z) || roads.has(`${Math.round(x / 0.18)},${Math.round(z / 0.18)}`)) continue;
    if (places.some(p => Math.hypot(p.p[0] - x, p.p[1] - z) < 0.8)) continue;
    const y = heightAt(x, z), scale = 0.55 + rand() * 1.25;
    dummy.position.set(x, y + 0.2 * scale, z); dummy.scale.set(scale, scale, scale); dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.updateMatrix(); trunks.setMatrixAt(n, dummy.matrix);
    dummy.position.y = y + 0.5 * scale;
    dummy.scale.set(scale * (0.75 + rand() * 0.4), scale * (0.95 + rand() * 0.45), scale);
    dummy.updateMatrix(); crowns.setMatrixAt(n, dummy.matrix);
    crowns.setColorAt(n, new THREE.Color().setHSL(0.32 + rand() * 0.07, 0.25 + rand() * 0.2, 0.16 + rand() * 0.12));
    n++;
  }
  trunks.count = crowns.count = n; group.add(trunks, crowns); group.userData.count = n;
  return group;
}

function createStreetLights() {
  const group = new THREE.Group(), max = 96;
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.018, 0.58, 5), mat(0x59645f, 0.6, 0.35), max);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 6, 5), new THREE.MeshBasicMaterial({ color: C.warm }), max);
  const dummy = new THREE.Object3D(); let n = 0;
  for (const key of Object.keys(GEO.routes)) {
    const curve = routeCurve(key);
    for (let i = 1; i <= 10 && n < max; i++) {
      const p = curve.getPoint(i / 11);
      dummy.position.set(p.x + 0.13, p.y + 0.27, p.z + 0.13); dummy.scale.setScalar(1); dummy.updateMatrix(); poles.setMatrixAt(n, dummy.matrix);
      dummy.position.y = p.y + 0.58; dummy.updateMatrix(); bulbs.setMatrixAt(n, dummy.matrix); n++;
    }
  }
  poles.count = bulbs.count = n; group.add(poles, bulbs);
  return group;
}

function createSolarRelay(key) {
  const group = new THREE.Group(); group.position.copy(at(key));
  const metal = mat(0x899993, 0.42, 0.55);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 1.35, 8), metal);
  pole.position.y = 0.675; pole.castShadow = true; group.add(pole);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.035, 0.45), new THREE.MeshStandardMaterial({
    color: 0x173d4c, roughness: 0.28, metalness: 0.55, emissive: 0x0c2730, emissiveIntensity: 0.35,
  }));
  panel.position.set(0.22, 0.9, 0); panel.rotation.z = -0.35; panel.castShadow = true; group.add(panel);
  for (let i = -2; i <= 2; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.009, 0.44), new THREE.MeshBasicMaterial({ color: 0x54727a }));
    line.position.set(0.22 + i * 0.115, 0.925 - i * 0.04, 0); line.rotation.z = -0.35; group.add(line);
  }
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.018, 1.15, 6), metal);
  antenna.position.set(-0.16, 1.52, 0); group.add(antenna);
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.25, 0.32, 0.2, 2, 0.025), mat(0xc5c7b7, 0.55, 0.15));
  box.position.set(0, 0.5, 0); group.add(box);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: C.signal }));
  lamp.position.set(-0.16, 2.1, 0); group.add(lamp);
  const glow = halo(C.signal, 0.8); glow.position.copy(lamp.position); group.add(glow);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.43, 0.46, 48), new THREE.MeshBasicMaterial({
    color: C.signal, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false,
  }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; group.add(ring);
  const waves = [];
  for (let i = 0; i < 3; i++) {
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.4, 48), new THREE.MeshBasicMaterial({
      color: C.signal, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
    }));
    wave.rotation.x = -Math.PI / 2; wave.position.y = 0.035; group.add(wave); waves.push(wave);
  }
  group.userData = { lamp, glow, ring, waves, key, relayKey: key };
  group.traverse(object => { object.userData.relayKey = key; });
  return group;
}

function createRooftopNode(key) {
  const group = new THREE.Group(); group.position.copy(at(key));
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, 0.62, 6), mat(0x8c9a91, 0.5, 0.4));
  pole.position.y = 0.62; group.add(pole);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: C.amber }));
  tip.position.y = 0.96; group.add(tip);
  const glow = halo(C.amber, 0.55); glow.position.copy(tip.position); group.add(glow);
  group.userData = { tip, glow, key };
  return group;
}

export function makeArc(a, b, lift = 2.2, color = C.amber, radius = 0.018) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y += lift + a.distanceTo(b) * 0.055;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const material = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 5, false), material);
  tube.userData.curve = curve;
  return tube;
}

function createCloudCore() {
  const group = new THREE.Group(); group.position.set(0, 14.5, 1);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 2), new THREE.MeshBasicMaterial({
    color: C.blue, wireframe: true, transparent: true, opacity: 0.23,
  })); group.add(shell);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 2), new THREE.MeshStandardMaterial({
    color: 0x93bac0, emissive: 0x5c939e, emissiveIntensity: 1.1, roughness: 0.35,
  })); group.add(core);
  const glow = halo(C.blue, 5); group.add(glow);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2 + i * 0.42, 0.012, 5, 80), new THREE.MeshBasicMaterial({
      color: C.blue, transparent: true, opacity: 0.3,
    }));
    ring.rotation.set(Math.PI / (2.4 + i * 0.25), i * 0.7, 0); group.add(ring); rings.push(ring);
  }
  group.userData = { shell, core, glow, rings };
  return group;
}

function createStorm() {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0x172326, transparent: true, opacity: 0, roughness: 1, depthWrite: false });
  for (let i = 0; i < 24; i++) {
    const cloud = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + rand() * 2.2, 1), cloudMat);
    cloud.position.set(extents.minX + rand() * (extents.maxX - extents.minX), 16 + rand() * 3, -8 + rand() * 33);
    cloud.scale.y = 0.38 + rand() * 0.22; group.add(cloud);
  }
  const rainCount = 1300, positions = new Float32Array(rainCount * 3), seeds = new Float32Array(rainCount);
  for (let i = 0; i < rainCount; i++) {
    positions[i * 3] = extents.minX + rand() * (extents.maxX - extents.minX);
    positions[i * 3 + 1] = rand() * 22;
    positions[i * 3 + 2] = extents.minZ + rand() * (extents.maxZ - extents.minZ);
    seeds[i] = rand();
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  rainGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const rainMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uStorm: { value: 0 } },
    vertexShader: `attribute float aSeed; uniform float uTime; uniform float uStorm; varying float vA;
      void main(){vec3 p=position; p.y=mod(p.y-uTime*(4.+aSeed*3.),22.); p.x+=sin(aSeed*40.)*uTime*.12;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=(1.1+aSeed)*clamp(95./-mv.z,1.,4.); vA=uStorm*(.12+aSeed*.3);}`,
    fragmentShader: `varying float vA; void main(){vec2 p=gl_PointCoord-.5; if(abs(p.x)>.12)discard; gl_FragColor=vec4(.55,.72,.72,vA*(1.-abs(p.y)*1.6));}`,
  });
  const rain = new THREE.Points(rainGeo, rainMat); group.add(rain);
  const boltPoints = [];
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    boltPoints.push(new THREE.Vector3(-9 + u * 3 + (rand() - 0.5) * 0.8 * Math.sin(u * Math.PI), 18 - u * 16, 12 + (rand() - 0.5) * 0.6));
  }
  const bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(boltPoints), new THREE.LineBasicMaterial({
    color: 0xc9e5d5, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
  })); group.add(bolt);
  group.userData = { cloudMat, rainMat, bolt };
  return group;
}

function createFarField() {
  const group = new THREE.Group(), material = mat(0x102523);
  for (let i = 0; i < 26; i++) {
    const angle = i / 26 * Math.PI * 2;
    const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(7 + rand() * 5, 1), material);
    hill.position.set(Math.cos(angle) * (88 + rand() * 18), 1, Math.sin(angle) * (88 + rand() * 18));
    hill.scale.y = 0.55 + rand() * 0.6; group.add(hill);
  }
  return group;
}

function createBoats() {
  const group = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    let x = 0, z = 0, attempts = 0;
    do { x = -8 + rand() * 34; z = -20 + rand() * 48; } while (!isWater(x, z) && attempts++ < 200);
    if (!isWater(x, z)) continue;
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.65, 4), mat(i % 3 ? 0xa6b4a6 : 0xc47e58));
    hull.rotation.x = Math.PI / 2; hull.rotation.y = Math.PI / 4; hull.scale.y = 0.5; boat.add(hull);
    if (i % 2 === 0) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.55, 5), mat(0x82715a)); mast.position.y = 0.3; boat.add(mast);
      const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([]), mat(0xd6d5bc));
      sail.geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.52, 0, 0, 0.08, 0, 0.32, 0.1, 0], 3));
      sail.geometry.computeVertexNormals(); boat.add(sail);
    }
    boat.position.set(x, 0.09, z); boat.rotation.y = rand() * Math.PI * 2; boat.userData.phase = rand() * Math.PI * 2;
    group.add(boat);
  }
  return group;
}

function createLighthouseBeam() {
  const group = new THREE.Group();
  const fadeCanvas = document.createElement('canvas'); fadeCanvas.width = 8; fadeCanvas.height = 128;
  const context = fadeCanvas.getContext('2d'), gradient = context.createLinearGradient(0, 128, 0, 0);
  gradient.addColorStop(0, '#000000'); gradient.addColorStop(0.35, '#202020');
  gradient.addColorStop(0.82, '#b0b0b0'); gradient.addColorStop(1, '#ffffff');
  context.fillStyle = gradient; context.fillRect(0, 0, 8, 128);
  const fade = new THREE.CanvasTexture(fadeCanvas);
  const material = new THREE.MeshBasicMaterial({
    color: 0xe8f4cf, alphaMap: fade, transparent: true, opacity: 0.055, side: THREE.FrontSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  for (const direction of [0, Math.PI]) {
    const geometry = new THREE.ConeGeometry(1.1, 15, 32, 1, true);
    geometry.translate(0, -7.5, 0); geometry.rotateZ(-Math.PI / 2);
    const beam = new THREE.Mesh(geometry, material); beam.rotation.y = direction; group.add(beam);
  }
  const glow = halo(0xe8f4cf, 1.7); group.add(glow);
  group.userData.material = material;
  return group;
}

export function createBeacon(key, color = C.coral) {
  const group = new THREE.Group(); group.position.copy(at(key, 0.06));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.3, 40), new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false,
  })); ring.rotation.x = -Math.PI / 2; group.add(ring);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.25, 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }));
  stem.position.y = 0.65; group.add(stem);
  const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color }));
  tip.position.y = 1.35; group.add(tip);
  const glow = halo(color, 1.05); glow.position.copy(tip.position); group.add(glow);
  group.userData = { ring, stem, tip, glow, key, baseColor: color };
  return group;
}

export function createPerson(color = C.amber) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.24, 3, 7), mat(color, 0.8));
  body.position.y = 0.36; body.castShadow = true; group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0xc99978, 0.9));
  head.position.y = 0.66; head.castShadow = true; group.add(head);
  const legMat = mat(0x273b3c), legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.18, 2, 5), legMat);
    leg.position.set(side * 0.05, 0.13, 0); group.add(leg); legs.push(leg);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshBasicMaterial({ color: 0x020707, transparent: true, opacity: 0.32, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; group.add(shadow);
  group.userData.legs = legs;
  return group;
}

export function createVehicle(color = 0x8fae9d) {
  const group = new THREE.Group(), bodyMat = mat(color, 0.55, 0.15), tyreMat = mat(0x17201e);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.88), bodyMat); bed.position.y = 0.26; group.add(bed);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.38), bodyMat); cab.position.set(0, 0.44, 0.3); group.add(cab);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.02), mat(0x284b52, 0.25, 0.4)); glass.position.set(0, 0.48, 0.5); group.add(glass);
  for (const x of [-0.28, 0.28]) for (const z of [-0.27, 0.28]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), tyreMat);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.14, z); group.add(wheel);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: 0x020707, transparent: true, opacity: 0.28, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.scale.y = 1.5; shadow.position.y = 0.02; group.add(shadow);
  return group;
}

export function createCrate(type = 'food') {
  const group = new THREE.Group();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.28), mat(0x9a6d3e)); crate.position.y = 0.11; crate.castShadow = true; group.add(crate);
  if (type === 'eggs' || type === 'honey') {
    for (let i = 0; i < 6; i++) {
      const item = new THREE.Mesh(type === 'honey' ? new THREE.CylinderGeometry(0.035, 0.04, 0.11, 7) : new THREE.SphereGeometry(0.045, 8, 6), mat(type === 'honey' ? 0xe2a84d : 0xf1ddbd));
      item.position.set((i % 3 - 1) * 0.085, 0.25, (Math.floor(i / 3) - 0.5) * 0.1); group.add(item);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const loaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.15, 3, 7), mat(0xd69a54));
      loaf.rotation.z = Math.PI / 2; loaf.position.set(0, 0.25, (i - 1) * 0.08); group.add(loaf);
    }
  }
  return group;
}

function batchStaticAsset(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), buckets = new Map(), originals = [];
  root.traverse(mesh => {
    if (!mesh.isMesh || Array.isArray(mesh.material) && mesh.material.length !== 1) return;
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const signature = [material.color?.getHexString(), material.emissive?.getHexString(), material.emissiveIntensity,
      material.roughness, material.metalness, material.transparent, material.opacity, material.map?.uuid,
      material.normalMap?.uuid, material.side].join('|');
    if (!buckets.has(signature)) buckets.set(signature, { material, geometries: [] });
    let geometry = mesh.geometry.clone();
    if (geometry.index) geometry = geometry.toNonIndexed();
    for (const name of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geometry.deleteAttribute(name);
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    if (!geometry.attributes.uv) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
    buckets.get(signature).geometries.push(geometry); originals.push(mesh);
  });
  const batch = new THREE.Group(); batch.name = 'Batched render detail';
  for (const { material, geometries } of buckets.values()) {
    const geometry = mergeGeometries(geometries, false);
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = !material.transparent; mesh.receiveShadow = true; batch.add(mesh);
    geometries.forEach(g => g.dispose());
  }
  originals.forEach(mesh => { mesh.visible = false; }); root.add(batch);
  return batch;
}

export async function createWorld(scene) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const response = await fetch(new URL(`${baseUrl}data/coast.json`, location.href));
  if (!response.ok) throw new Error(`Geography ${response.status}`);
  setGeography(await response.json());

  const root = new THREE.Group(); scene.add(root);
  const width = extents.maxX - extents.minX, depth = extents.maxZ - extents.minZ;
  const base = new THREE.Mesh(new RoundedBoxGeometry(width + 0.8, 1.15, depth + 0.8, 4, 0.25), mat(0x0b1c1c, 0.82, 0.1));
  base.position.set((extents.minX + extents.maxX) / 2, -1.0, (extents.minZ + extents.maxZ) / 2);
  base.receiveShadow = true; root.add(base);
  const terrain = createTerrain(), water = createWater(), roads = createRoads();
  const town = createTown(), trees = createTrees();
  root.add(terrain, water, roads.group, town, trees, createStreetLights());
  scene.add(createFarField());

  const cloud = createCloudCore(); root.add(cloud);
  const internet = new THREE.Group(); root.add(internet);
  const internetPlaces = [...new Set(Object.values(GEO.routes).flatMap(route => [route.origin, route.destination]))];
  for (const key of internetPlaces) {
    const arc = makeArc(at(key, 0.85), cloud.position, 1.5, C.blue, 0.009);
    arc.material.opacity = 0.18; arc.userData.place = key; internet.add(arc);
  }

  const radio = new THREE.Group(); root.add(radio);
  const nodeKeys = internetPlaces;
  const nodes = nodeKeys.map(key => createRooftopNode(key));
  nodes.forEach(node => radio.add(node));
  const relays = Object.keys(GEO.relays).map(key => createSolarRelay(key));
  relays.forEach(relay => radio.add(relay));
  const meshTopology = new THREE.Group(); radio.add(meshTopology);
  const storm = createStorm(); root.add(storm);
  const boats = createBoats(); root.add(boats);

  const world = {
    root, geo: GEO, extents, terrain, water, roads, town, trees, cloud, internet,
    radio, nodes, relays, meshTopology, storm, boats, routeCurve, assets: {},
    sampleEnvironment(t, stormAmount, internetAmount, meshAmount, dawnAmount, relayStates) {
      water.material.uniforms.uTime.value = t;
      water.material.uniforms.uStorm.value = stormAmount;
      water.material.uniforms.uDawn.value = dawnAmount;
      storm.userData.cloudMat.opacity = stormAmount * 0.34;
      storm.userData.rainMat.uniforms.uTime.value = t;
      storm.userData.rainMat.uniforms.uStorm.value = stormAmount;
      const flash = Math.exp(-Math.pow((t - 13.1) * 3.5, 2)) + 0.65 * Math.exp(-Math.pow((t - 15.4) * 4.2, 2));
      storm.userData.bolt.material.opacity = flash * 0.85;
      cloud.userData.shell.material.opacity = 0.025 + internetAmount * 0.22;
      cloud.userData.core.material.emissiveIntensity = 0.06 + internetAmount * 1.15;
      cloud.userData.glow.material.opacity = internetAmount * 0.55;
      cloud.userData.rings.forEach((ring, i) => {
        ring.material.opacity = internetAmount * (0.26 - i * 0.045);
        ring.rotation.z = t * (0.025 + i * 0.008);
      });
      cloud.rotation.y = t * 0.055;
      internet.children.forEach(arc => { arc.material.opacity = internetAmount * 0.17; });
      meshTopology.children.forEach(arc => {
        const offline = [arc.userData.a, arc.userData.b].some(key => relayStates[key] === false);
        arc.material.opacity = meshAmount * (offline ? 0.008 : 0.085) * (1 - dawnAmount * 0.72);
        arc.material.color.set(offline ? C.coral : C.signal);
      });
      nodes.forEach((node, i) => {
        const pulse = 0.65 + 0.35 * Math.sin(t * 2 + i * 1.7);
        node.userData.tip.material.color.set(meshAmount > 0.05 ? C.signal : C.amber);
        node.userData.glow.material.opacity = meshAmount * pulse * 0.65;
      });
      relays.forEach((relay, i) => {
        const key = relay.userData.key;
        const online = meshAmount > 0.03 && relayStates[key] !== false;
        const failed = relayStates[key] === false;
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.6 + i * 2.1);
        relay.userData.lamp.material.color.set(online ? C.signal : failed ? C.coral : C.amber);
        relay.userData.glow.material.color.set(online ? C.signal : failed ? C.coral : C.amber);
        relay.userData.glow.material.opacity = online ? meshAmount * pulse : failed ? 0.42 : 0;
        relay.userData.ring.material.color.set(online ? C.signal : failed ? C.coral : C.amber);
        relay.userData.ring.material.opacity = online ? meshAmount * 0.25 : failed ? 0.16 : 0.04;
        relay.userData.ring.scale.setScalar(1 + meshAmount * 0.18 * pulse);
        relay.userData.waves.forEach((wave, j) => {
          const phase = (t * 0.18 + j / 3) % 1;
          wave.scale.setScalar(1 + phase * 5.5);
          wave.material.opacity = online ? meshAmount * (1 - phase) * 0.12 * (1 - dawnAmount * 0.7) : 0;
        });
      });
      boats.children.forEach((boat, i) => {
        boat.position.y = 0.09 + Math.sin(t * 0.7 + boat.userData.phase) * (0.015 + stormAmount * 0.025);
        boat.rotation.z = Math.sin(t * 0.45 + i) * (0.025 + stormAmount * 0.05);
      });
      if (world.assets.lighthouseBeam) {
        world.assets.lighthouseBeam.rotation.y = t * 0.17;
        world.assets.lighthouseBeam.userData.material.opacity = (0.022 + stormAmount * 0.025) * (1 - dawnAmount * 0.9);
      }
    },
  };

  try {
    const assetUrl = path => new URL(`${baseUrl}assets/${path}`, location.href).href;
    const [{ createAsset: createTruck }, { createAsset: createHouse }, { createAsset: createLighthouse }] = await Promise.all([
      import(/* @vite-ignore */ assetUrl('truck/asset.mjs')),
      import(/* @vite-ignore */ assetUrl('house/asset.mjs')),
      import(/* @vite-ignore */ assetUrl('lighthouse/asset.mjs')),
    ]);
    const [truck, house, lighthouse] = await Promise.all([
      createTruck(THREE, { states: 'lazy', sharedResources: true }),
      createHouse(THREE, { states: 'lazy', sharedResources: true }),
      createLighthouse(THREE, { states: 'lazy', sharedResources: true }),
    ]);
    batchStaticAsset(truck); batchStaticAsset(house); batchStaticAsset(lighthouse);

    const truckPlacement = new THREE.Group(); truckPlacement.add(truck);
    const truckSize = new THREE.Box3().setFromObject(truck).getSize(new THREE.Vector3());
    truckPlacement.scale.setScalar(1.05 / Math.max(truckSize.x, truckSize.z));
    truckPlacement.position.copy(at('Noraville', 0.08)); root.add(truckPlacement); world.assets.truck = truckPlacement;

    const housePlacement = new THREE.Group(); housePlacement.add(house);
    const houseSize = new THREE.Box3().setFromObject(house).getSize(new THREE.Vector3());
    housePlacement.scale.setScalar(1.8 / Math.max(houseSize.x, houseSize.z));
    const hp = at('Kincumber'); housePlacement.position.set(hp.x + 0.72, hp.y + 0.02, hp.z + 0.65);
    housePlacement.rotation.y = -0.65;
    house.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
    root.add(housePlacement); world.assets.house = housePlacement;

    const lighthousePlacement = new THREE.Group(); lighthousePlacement.add(lighthouse);
    const lighthouseSize = new THREE.Box3().setFromObject(lighthouse).getSize(new THREE.Vector3());
    lighthousePlacement.scale.setScalar(3.8 / lighthouseSize.y);
    lighthousePlacement.position.copy(at('Norah Head', 0.02));
    lighthouse.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
    root.add(lighthousePlacement); world.assets.lighthouse = lighthousePlacement;
    const lighthouseBeam = createLighthouseBeam();
    lighthouseBeam.position.copy(lighthousePlacement.position); lighthouseBeam.position.y += 3.25;
    root.add(lighthouseBeam); world.assets.lighthouseBeam = lighthouseBeam;
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshBasicMaterial({ color: 0x020707, transparent: true, opacity: 0.25, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.copy(lighthousePlacement.position); shadow.position.y += 0.015; root.add(shadow);
    world.assetBounds = { truck: truckSize.toArray(), house: houseSize.toArray(), lighthouse: lighthouseSize.toArray() };
  } catch (error) {
    console.warn('Detailed landmark assets could not be loaded; geographic scene remains available.', error);
  }
  return world;
}
