import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import {
  createWorld, C, LOC, at, makeArc, halo, createBeacon, createPerson,
  createVehicle, createCrate, heightAt,
} from './world.js';
import { SignalPost } from './post.js';

const DURATION = 120;
const clamp = THREE.MathUtils.clamp;
const smooth = THREE.MathUtils.smoothstep;
const params = new URLSearchParams(location.search);
const captureMode = params.get('capture') === '1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Quality tiers. Phones and low-power hardware get a lighter scene: mobile
// GPUs have hard memory and fill-rate budgets, and blowing them loses the
// WebGL context entirely (the "white screen" failure).
const coarsePointer = matchMedia('(pointer: coarse)').matches;
const smallScreen = Math.min(innerWidth, innerHeight) < 760;
const lowMemory = (navigator.deviceMemory !== undefined && navigator.deviceMemory <= 4)
  || (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4);
const lowTier = !captureMode && (coarsePointer || smallScreen || lowMemory);
if (lowTier) document.body.classList.add('low-tier');

function pickPixelRatio(cap) {
  const ratioCap = cap ?? (lowTier ? 1.25 : 1.5);
  const budget = lowTier ? 1400000 : 3200000;
  const raw = Math.min(devicePixelRatio || 1, ratioCap);
  const pixels = innerWidth * innerHeight * raw * raw;
  return pixels > budget ? Math.max(0.8, raw * Math.sqrt(budget / pixels)) : raw;
}

const mount = document.getElementById('scene');

function showFallback(message) {
  const fallback = document.getElementById('fallback');
  if (message) {
    const copy = fallback.querySelector('[data-fallback-copy]');
    if (copy) copy.textContent = message;
  }
  document.getElementById('loading')?.classList.add('loaded');
  fallback.hidden = false;
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: lowTier,
    preserveDrawingBuffer: captureMode,
    powerPreference: lowTier ? 'default' : 'high-performance',
  });
} catch (error) {
  showFallback();
  throw error;
}
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  renderer.setAnimationLoop(null);
  showFallback('The graphics context was interrupted on this device. Reload to restart the scenario.');
});
renderer.setPixelRatio(pickPixelRatio());
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !lowTier;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = lowTier ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.info.autoReset = false;
mount.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '5' });
mount.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(C.sky);
scene.fog = new THREE.Fog(C.fog, 70, 190);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 480);
camera.position.set(52, 48, 64);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.4, -2);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 5;
controls.maxDistance = 130;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = Math.PI * 0.475;
controls.enablePan = true;

const hemi = new THREE.HemisphereLight(0x91b9b7, 0x17261c, 1.45);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd8a3, 2.5);
sun.position.set(-28, 42, 24);
sun.castShadow = !lowTier;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 120 });
sun.shadow.normalBias = 0.045;
sun.shadow.bias = -0.00015;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x659da7, 0.72);
fill.position.set(28, 20, -26); scene.add(fill);
const bounce = new THREE.DirectionalLight(0x375f4e, 0.25);
bounce.position.set(0, -6, 4); scene.add(bounce);

const ground = new THREE.Mesh(new THREE.CircleGeometry(350, 80).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x081716, roughness: 1 }));
ground.position.y = -1.62; scene.add(ground);

function createStars(count = 650) {
  const positions = [];
  let seed = 71237;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2, y = 24 + random() * 90, radius = 115 + random() * 70;
    positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xc5d9ca, size: 0.19, transparent: true, opacity: 0.55, depthWrite: false }));
}
const stars = createStars(lowTier ? 350 : 650); scene.add(stars);
const moon = halo(0xb8d6cc, 12); moon.position.set(58, 48, -88); scene.add(moon);

// The bloom/grade pipeline is the largest per-frame cost; low tier renders
// the scene directly with ACES tone mapping instead.
let post = lowTier ? null : new SignalPost(renderer, innerWidth, innerHeight);
let world;
try {
  world = await createWorld(scene, { low: lowTier });
} catch (error) {
  console.error(error);
  showFallback('The scenario data could not be loaded. Check your connection and reload.');
  throw error;
}
const peopleLayer = new THREE.Group(), resourceLayer = new THREE.Group(), trustLayer = new THREE.Group(), signalLayer = new THREE.Group();
world.root.add(peopleLayer, resourceLayer, trustLayer);
world.radio.add(signalLayer);

const storyDefs = {
  care: {
    number: '01', category: 'CARE', requester: 'Woy Woy', responder: 'Kincumber', origin: 'Woy Woy', destination: 'Kincumber',
    start: 24, sendEnd: 31, journeyStart: 34, journeyDuration: 17, agent: 'person', resource: 'care',
    title: 'A check-in becomes a care circuit.',
    need: 'Weekly medication pickup + three check-ins', offer: '$30 per week · direct agreement',
    requestDetail: 'Marina in Woy Woy needs a reliable weekly pharmacy pickup and three short check-ins for her father. The request includes the pharmacy window, mobility notes, and a verified contact.',
    responseDetail: 'Jonah in Kincumber accepts the recurring circuit. His identity, availability, and previous completed exchanges stay attached to the agreement.',
    agreement: 'They agree on Tuesday pickup, Monday/Wednesday/Friday check-ins, and $30 per week. The terms are explicit before anyone travels.',
    completion: 'Medication reaches Woy Woy and the first check-in is logged. The recurring agreement and care history remain with both neighbours.',
  },
  garden: {
    number: '02', category: 'FOOD ↔ LABOUR', requester: 'Woy Woy', responder: 'Umina Beach', origin: 'Umina Beach', destination: 'Woy Woy', preAgreed: true, offlineJourneyStart: 22,
    start: 28, sendEnd: 33, journeyStart: 35, journeyDuration: 12, agent: 'person', resource: 'eggs',
    title: 'A standing garden trade outlives the cloud.',
    need: 'Lawn mowing + winter garden tidy', offer: 'One dozen eggs + next season’s seedlings',
    requestDetail: 'A Woy Woy household has an overgrown yard and no mower. The work is scoped to one visit: front lawn, edges, and green-waste stacking.',
    responseDetail: 'An Umina Beach grower had already accepted online before the storm, adding a dozen eggs now and native seedlings when the next batch is ready.',
    agreement: 'This agreement was stored by both neighbours before the outage. No new match is required, so the short physical journey can still happen.',
    completion: 'The garden is cleared and the eggs change hands. Their next seedling exchange remains a local commitment, not a pending cloud request.',
  },
  skills: {
    number: '03', category: 'SKILLS', requester: 'Gosford', responder: 'Wyong', origin: 'Wyong', destination: 'Gosford',
    start: 37, sendEnd: 44, journeyStart: 45, journeyDuration: 17, agent: 'person', resource: 'skills',
    title: 'Two kinds of knowledge cross the coast.',
    need: 'Four beginner guitar lessons', offer: 'Four coding tutoring sessions',
    requestDetail: 'A Gosford musician wants four beginner lessons for a teenager, starting with rhythm, chord changes, and a practice plan that needs no expensive equipment.',
    responseDetail: 'A Wyong developer offers the lessons and asks for one-to-one coding tutoring in return: HTML, Python fundamentals, and help finishing a small project.',
    agreement: 'Four lessons for four tutoring sessions. They agree on forty-five-minute sessions, accessible venues, and a shared record of what each person learns.',
    completion: 'The first guitar lesson finishes in Gosford. A reciprocal tutoring booking remains attached to the same trusted connection.',
  },
  repair: {
    number: '04', category: 'REPAIR', requester: 'MacMasters Beach', responder: 'Noraville', origin: 'Noraville', destination: 'MacMasters Beach',
    start: 46, sendEnd: 54, journeyStart: 55, journeyDuration: 22, agent: 'truck', resource: 'repair',
    title: 'A mechanic keeps a local business moving.',
    need: 'Diagnose + repair a delivery van', offer: 'Two surf lessons + board rental',
    requestDetail: 'A MacMasters Beach caterer’s van will not start. The request includes the fault code, battery history, safe parking location, and photos taken before the outage.',
    responseDetail: 'A Noraville mobile mechanic confirms the likely alternator fault, packs the required parts, and offers a fixed diagnostic visit rather than an open-ended estimate.',
    agreement: 'The mechanic supplies the repair; the caterer supplies two beginner surf lessons and board rental. Parts are approved separately before departure.',
    completion: 'The van runs again, restoring the caterer’s deliveries. The surf-lesson return remains scheduled and the repair record stays reusable.',
  },
  ride: {
    number: '05', category: 'MOBILITY', requester: 'Kincumber', responder: 'Gosford', origin: 'Kincumber', destination: 'Gosford', preAgreed: true, offlineJourneyStart: 28,
    start: 50, sendEnd: 54, journeyStart: 56, journeyDuration: 15, agent: 'vehicle', resource: 'ride',
    title: 'An agreed hospital ride still matters.',
    need: 'Return ride to Gosford Hospital physiotherapy', offer: 'Dinner + a contribution to fuel',
    requestDetail: 'A Kincumber resident needs a return trip for a physiotherapy appointment, with room for a folding walker and fifteen minutes of buffer at arrival.',
    responseDetail: 'A Gosford driver confirmed online the previous evening. Accessibility needs, pickup time, dinner, and the fuel contribution were already understood.',
    agreement: 'The outage cannot cancel a journey already agreed by two people. The driver proceeds without needing a new internet match.',
    completion: 'The passenger reaches the appointment with the return pickup confirmed. Trust and accessibility notes remain for a future ride.',
  },
  website: {
    number: '06', category: 'DIGITAL ↔ TRADE', requester: 'Blue Haven', responder: 'Wyong', origin: 'Wyong', destination: 'Blue Haven',
    start: 60, sendEnd: 67, journeyStart: 68, journeyDuration: 15, agent: 'vehicle', resource: 'website',
    title: 'A local skill becomes a visible livelihood.',
    need: 'Website + booking page for a landscaper', offer: '$1,200, or equivalent garden work',
    requestDetail: 'A Blue Haven landscaper needs a small bilingual website, service-area map, enquiry form, and a handover session so the business can update its own content.',
    responseDetail: 'A Wyong developer accepts with a defined scope: five pages, mobile layouts, two revision rounds, analytics setup, and a recorded handover.',
    agreement: 'They can settle at $1,200 or exchange an agreed amount of garden design and maintenance. Either path is recorded as the same clear scope.',
    completion: 'The site content and booking flow are ready for handover. When connectivity returns, publishing can proceed without repeating the local coordination.',
  },
  market: {
    number: '07', category: 'ENTERPRISE', requester: 'The Entrance', responder: 'Budgewoi', origin: 'Budgewoi', destination: 'The Entrance',
    start: 71, sendEnd: 77, journeyStart: 79, journeyDuration: 15, agent: 'vehicle', resource: 'market',
    title: 'A market stall opens through reciprocity.',
    need: 'Two people for a Saturday market stall', offer: '20% of sales + a candle-making session',
    requestDetail: 'A maker at The Entrance needs two helpers for setup, customer service, and pack-down. The request states hours, lifting needs, and how sales will be counted.',
    responseDetail: 'Two Budgewoi neighbours accept as a team. One handles payments and stock; the other covers the stall while the maker demonstrates candle pouring.',
    agreement: 'The team shares 20% of recorded sales and receives a candle-making session. Everyone sees the same hours, responsibilities, and return before setup begins.',
    completion: 'The stall opens on time and the shared sales record closes the loop. The team keeps a repeatable market-day arrangement.',
  },
  bees: {
    number: '08', category: 'FOOD ↔ MENTORING', requester: 'Wyee', responder: 'Somersby', origin: 'Somersby', destination: 'Wyee',
    start: 82, sendEnd: 89, journeyStart: 91, journeyDuration: 17, agent: 'person', resource: 'honey',
    title: 'The northern exchange is a living legacy.',
    need: 'Beginner beekeeping mentoring in Wyee', offer: '50/50 share of first-season honey',
    requestDetail: 'A Wyee household has space for a hive but needs safe mentoring: site selection, protective equipment, seasonal inspections, and when to call an experienced beekeeper.',
    responseDetail: 'A Somersby beekeeper offers six visits across the season and a shared inspection checklist, with safety and biosecurity requirements made explicit.',
    agreement: 'Six mentoring visits in exchange for half the first-season honey. If there is no harvest, the mentoring still stands and no debt is invented.',
    completion: 'The first inspection is complete in Wyee. A season-long relationship now links the northern edge of the map to the Somersby ridges.',
  },
};

const storyKeys = Object.keys(storyDefs);
const storyRuntime = {};
const labelObjects = [];
const majorLabels = new Set(['Wyee', 'Blue Haven', 'Budgewoi', 'Noraville', 'Norah Head', 'Wyong', 'The Entrance', 'Terrigal', 'Gosford', 'Kincumber', 'Woy Woy', 'Umina Beach', 'Somersby']);
for (const [key, place] of Object.entries(world.geo.places)) {
  const major = majorLabels.has(key);
  if (lowTier && !major) continue;
  const element = document.createElement('button');
  element.type = 'button'; element.className = `map-label ${major ? 'major' : 'minor'}`;
  element.textContent = place.name.toUpperCase(); element.setAttribute('aria-label', `Focus ${place.name}`);
  element.addEventListener('click', event => { event.stopPropagation(); focusPlace(key); });
  const label = new CSS2DObject(element); label.position.copy(at(key, majorLabels.has(key) ? 1.15 : 0.72));
  world.root.add(label); labelObjects.push(label);
}
for (const [key, relay] of Object.entries(world.geo.relays)) {
  const element = document.createElement('button');
  element.type = 'button'; element.className = 'map-label relay-map-label'; element.textContent = `${relay.name.toUpperCase()} · RELAY`;
  element.setAttribute('aria-label', `Select ${relay.name} relay`);
  element.addEventListener('click', event => { event.stopPropagation(); selectRelay(key, true); });
  const label = new CSS2DObject(element); label.position.copy(at(key, 2.55)); world.root.add(label); labelObjects.push(label);
}

// An illustrative graph: local nodes favour nearby neighbours and elevated relays.
// Every route below is recomputed when a relay is removed.
const graph = new Map();
const nodeKeys = [...Object.keys(world.geo.places), ...Object.keys(world.geo.relays)];
nodeKeys.forEach(key => graph.set(key, []));
function nodeDistance(a, b) {
  const pa = LOC[a].p, pb = LOC[b].p;
  return Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
}
function connect(a, b) {
  if (a === b) return;
  const weight = nodeDistance(a, b);
  if (!graph.get(a).some(edge => edge.to === b)) graph.get(a).push({ to: b, weight });
  if (!graph.get(b).some(edge => edge.to === a)) graph.get(b).push({ to: a, weight });
}
const placeKeys = Object.keys(world.geo.places), relayKeys = Object.keys(world.geo.relays);
for (const key of placeKeys) {
  placeKeys.filter(other => other !== key).sort((a, b) => nodeDistance(key, a) - nodeDistance(key, b)).slice(0, 2).forEach(other => {
    if (nodeDistance(key, other) < 13) connect(key, other);
  });
  relayKeys.slice().sort((a, b) => nodeDistance(key, a) - nodeDistance(key, b)).slice(0, 2).forEach(relay => {
    if (nodeDistance(key, relay) < 24) connect(key, relay);
  });
}
for (const relay of relayKeys) {
  relayKeys.filter(other => other !== relay).forEach(other => { if (nodeDistance(relay, other) < 46) connect(relay, other); });
  placeKeys.slice().sort((a, b) => nodeDistance(relay, a) - nodeDistance(relay, b)).slice(0, 6).forEach(place => {
    if (nodeDistance(relay, place) < 20) connect(relay, place);
  });
}

function shortestPath(start, end, offline = null) {
  if (start === offline || end === offline) return null;
  const distances = new Map(nodeKeys.map(key => [key, Infinity]));
  const previous = new Map(), unvisited = new Set(nodeKeys.filter(key => key !== offline));
  distances.set(start, 0);
  while (unvisited.size) {
    let current = null, best = Infinity;
    for (const key of unvisited) {
      const value = distances.get(key);
      if (value < best) { best = value; current = key; }
    }
    if (current === null || best === Infinity) break;
    unvisited.delete(current);
    if (current === end) break;
    for (const edge of graph.get(current)) {
      if (!unvisited.has(edge.to)) continue;
      const candidate = best + edge.weight;
      if (candidate < distances.get(edge.to)) { distances.set(edge.to, candidate); previous.set(edge.to, current); }
    }
  }
  if (!Number.isFinite(distances.get(end))) return null;
  const path = [end];
  while (path[0] !== start) path.unshift(previous.get(path[0]));
  return { path, hops: path.length - 1, cost: distances.get(end) };
}

function radioRoute(keys, color = C.signal, layer = signalLayer) {
  const group = new THREE.Group(), path = new THREE.CurvePath();
  if (!keys || keys.length < 2) return { group, path, packet: new THREE.Group(), echo: halo(color, 0.5), keys: keys || [], hops: 0 };
  keys.forEach((key, index) => {
    if (index === keys.length - 1) return;
    const next = keys[index + 1];
    const a = at(key, relayKeys.includes(key) ? 2.05 : 0.95);
    const b = at(next, relayKeys.includes(next) ? 2.05 : 0.95);
    const arc = makeArc(a, b, 0.45, color, 0.014);
    arc.material.opacity = 0; arc.userData.a = key; arc.userData.b = next;
    path.add(arc.userData.curve); group.add(arc);
  });
  const packet = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color }));
  packet.add(core, halo(color, 0.9)); group.add(packet);
  const echo = halo(color, 0.48); group.add(echo);
  layer.add(group);
  return { group, path, packet, echo, keys, hops: keys.length - 1 };
}

function disposeRoute(route) {
  if (!route) return;
  route.group.removeFromParent();
  route.group.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material && object.material.map !== undefined && !object.isSprite) object.material.dispose();
  });
}

function routeName(key) { return LOC[key]?.name || key; }
let offlineRelay = null;
let relayImpact = { affected: 0, addedHops: 0, maxDelay: 0, isolated: 0 };

function computeRoutes(rebuild = true) {
  const relayStates = Object.fromEntries(relayKeys.map(key => [key, key !== offlineRelay]));
  relayImpact = { affected: 0, addedHops: 0, maxDelay: 0, isolated: 0 };
  for (const [key, runtime] of Object.entries(storyRuntime)) {
    const def = runtime.def;
    if (!runtime.base) runtime.base = shortestPath(def.requester, def.responder);
    const current = shortestPath(def.requester, def.responder, offlineRelay);
    const changed = (runtime.base?.path.join('|') || 'none') !== (current?.path.join('|') || 'none');
    const addedHops = current && runtime.base ? Math.max(0, current.hops - runtime.base.hops) : 0;
    const extraDistance = current && runtime.base ? Math.max(0, current.cost - runtime.base.cost) : 0;
    runtime.delay = !def.preAgreed && current ? Math.min(14, addedHops * 2.5 + extraDistance * 0.12) : 0;
    runtime.currentPath = current;
    if (offlineRelay && changed) {
      relayImpact.affected++;
      relayImpact.addedHops += addedHops;
      relayImpact.maxDelay = Math.max(relayImpact.maxDelay, runtime.delay);
      if (!current) relayImpact.isolated++;
    }
    if (rebuild && runtime.route) disposeRoute(runtime.route);
    runtime.route = rebuild ? radioRoute(current?.path) : runtime.route;
  }
  return relayStates;
}

// A faint structural view of the actual base paths and relay backbone.
const topologyEdges = new Set();
for (const key of storyKeys) {
  const path = shortestPath(storyDefs[key].requester, storyDefs[key].responder)?.path || [];
  for (let i = 0; i < path.length - 1; i++) topologyEdges.add([path[i], path[i + 1]].sort().join('|'));
}
for (const relay of relayKeys) {
  const nearest = relayKeys.filter(key => key !== relay).sort((a, b) => nodeDistance(relay, a) - nodeDistance(relay, b))[0];
  if (nearest) topologyEdges.add([relay, nearest].sort().join('|'));
}
for (const signature of topologyEdges) {
  const [a, b] = signature.split('|');
  const arc = makeArc(at(a, relayKeys.includes(a) ? 1.8 : 0.8), at(b, relayKeys.includes(b) ? 1.8 : 0.8), 0.5, C.signal, 0.007);
  arc.material.opacity = 0.02; arc.userData.a = a; arc.userData.b = b; world.meshTopology.add(arc);
}

function journeyLine(curve) {
  const line = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(48, curve.curves.length * 3), 0.022, 5, false), new THREE.MeshBasicMaterial({
    color: C.amber, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  peopleLayer.add(line);
  return line;
}

for (const [key, def] of Object.entries(storyDefs)) {
  const beacon = createBeacon(def.requester); world.root.add(beacon); beacon.visible = false;
  beacon.traverse(object => { object.userData.story = key; });
  const trust = makeArc(at(def.requester, 0.65), at(def.responder, 0.65), 0.65, C.mint, 0.018);
  trust.material.opacity = 0; trustLayer.add(trust);
  const road = world.routeCurve(key), line = journeyLine(road);
  let agent;
  if (def.agent === 'truck') {
    agent = world.assets.truck || createVehicle();
    if (!agent.parent) world.root.add(agent);
  } else if (def.agent === 'vehicle') agent = createVehicle(key === 'market' ? 0xc79b68 : 0x8fae9d);
  else agent = createPerson(key === 'bees' ? 0xd7f99a : key === 'skills' ? 0x92b9ae : 0xe3b67d);
  peopleLayer.add(agent); agent.visible = false;
  if (def.resource === 'eggs' || def.resource === 'honey' || def.resource === 'market') {
    const crate = createCrate(def.resource === 'honey' ? 'honey' : def.resource === 'eggs' ? 'eggs' : 'food');
    crate.position.set(0.42, 0.05, -0.2); crate.scale.setScalar(0.75); agent.add(crate);
  }
  const returnToken = new THREE.Mesh(
    def.resource === 'care' ? new THREE.CylinderGeometry(0.11, 0.11, 0.035, 16) : new THREE.IcosahedronGeometry(0.11, 1),
    new THREE.MeshStandardMaterial({ color: C.amber, emissive: 0x7a4c16, emissiveIntensity: 0.55, metalness: def.resource === 'care' ? 0.5 : 0 }),
  );
  returnToken.visible = false; resourceLayer.add(returnToken);
  storyRuntime[key] = { def, beacon, trust, road, line, agent, returnToken, base: null, currentPath: null, route: null, delay: 0 };
}
const relayStates = computeRoutes();

// Existing arrangements use the ordinary internet before the outage.
const internetRuntime = {};
for (const key of storyKeys.filter(key => storyDefs[key].preAgreed)) {
  const def = storyDefs[key], group = new THREE.Group();
  const a = makeArc(at(def.requester, 0.9), world.cloud.position, 1.2, C.blue, 0.014);
  const b = makeArc(world.cloud.position, at(def.responder, 0.9), 1.2, C.blue, 0.014);
  const path = new THREE.CurvePath(); path.add(a.userData.curve); path.add(b.userData.curve);
  group.add(a, b); world.root.add(group);
  const packet = halo(C.blue, 0.8); group.add(packet);
  internetRuntime[key] = { group, path, packet, a, b };
}

const ambientPackets = [];
const ambientPairs = [
  ['Ettalong Beach', 'Woy Woy'], ['Terrigal', 'The Entrance'], ['Tuggerah', 'Wyong'],
  ['Toukley', 'Norah Head'], ['Doyalson', 'Wyee'], ['Narara', 'Somersby'],
];
ambientPairs.forEach(([a, b], index) => {
  const path = shortestPath(a, b)?.path;
  if (!path) return;
  const route = radioRoute(path); route.group.scale.setScalar(1);
  ambientPackets.push({ route, offset: index / ambientPairs.length });
});

function pathPoint(curve, u, object, offset = 0) {
  const point = curve.getPoint(clamp(u, 0, 1));
  object.position.copy(point); object.position.y += offset;
  return point;
}
function orientOnPath(object, curve, u) {
  const direction = curve.getTangent(clamp(u, 0.001, 0.999));
  object.rotation.y = Math.atan2(direction.x, direction.z);
}
function animateWalk(person, t, moving) {
  const legs = person.userData.legs;
  if (!legs) return;
  legs[0].rotation.x = moving ? Math.sin(t * 7) * 0.45 : 0;
  legs[1].rotation.x = moving ? -Math.sin(t * 7) * 0.45 : 0;
}

function timesFor(def, runtime) {
  if (!meshOn && def.preAgreed) return { journeyStart: def.offlineJourneyStart, complete: def.offlineJourneyStart + def.journeyDuration };
  const delay = meshOn ? runtime.delay : 0;
  return { journeyStart: def.journeyStart + delay, complete: def.journeyStart + delay + def.journeyDuration };
}

function storyState(key, t) {
  const def = storyDefs[key], runtime = storyRuntime[key], times = timesFor(def, runtime);
  if (!meshOn) {
    if (def.preAgreed) {
      if (t < 18) return 'agreed-online';
      if (t < times.journeyStart) return 'agreed-offline';
      if (t < times.complete) return 'journey';
      if (t < times.complete + 2) return 'complete';
      return 'trust';
    }
    return t >= 20 ? 'unmatched' : 'quiet';
  }
  if (def.preAgreed) {
    if (t < 18) return 'agreed-online';
    if (t < times.journeyStart) return 'agreed-offline';
    if (t < times.complete) return 'journey';
    if (t < times.complete + 2) return 'complete';
    return 'trust';
  }
  if (!runtime.currentPath && t >= def.start) return 'isolated';
  if (t < 20) return 'quiet';
  if (t < def.start) return 'waiting';
  if (t < def.sendEnd + runtime.delay) return t < def.start + 1.4 ? 'request' : 'matching';
  if (t < times.journeyStart) return 'agreed';
  if (t < times.complete) return 'journey';
  if (t < times.complete + 2) return 'complete';
  return 'trust';
}

function storyComplete(key, t) {
  return ['complete', 'trust'].includes(storyState(key, t));
}
function storyAgreed(key, t) {
  return ['agreed-online', 'agreed-offline', 'agreed', 'journey', 'complete', 'trust'].includes(storyState(key, t));
}
function stageIndex(state) {
  return {
    quiet: -1, waiting: -1, unmatched: 0, isolated: 0, request: 0, matching: 1,
    'agreed-online': 2, 'agreed-offline': 2, agreed: 2, journey: 3, complete: 4, trust: 5,
  }[state] ?? -1;
}
function stateLabel(key, t) {
  const state = storyState(key, t), runtime = storyRuntime[key], def = storyDefs[key];
  const labels = {
    quiet: 'Online catalogue', waiting: 'Request queued', unmatched: 'No new match available', isolated: 'No radio route',
    request: 'Request composed', matching: `Matching · ${runtime.currentPath?.hops || 0} radio hops`,
    'agreed-online': 'Agreed via internet', 'agreed-offline': 'Previously agreed · journey valid',
    agreed: 'Agreement confirmed', journey: 'Physical journey underway', complete: 'Exchange complete', trust: 'Trust retained',
  };
  return labels[state] + (!meshOn && !def.preAgreed && t >= 20 ? ' · internet offline' : '');
}

function stageCopy(key, t) {
  const def = storyDefs[key], runtime = storyRuntime[key], state = storyState(key, t);
  if (state === 'quiet') return 'Antidosis is reachable through the ordinary internet. Two standing local agreements have already been confirmed; six new requests will arrive after the outage.';
  if (state === 'waiting') return `A ${def.category.toLowerCase()} request is queued in ${def.requester}. Follow the full agreement to see its scope, responder, return, and real road journey.`;
  if (state === 'unmatched') return `${def.need} remains a real local possibility, but no new responder can be discovered through the unavailable internet. Existing physical agreements are unaffected.`;
  if (state === 'isolated') return `Removing ${routeName(offlineRelay)} leaves no route between ${def.requester} and ${def.responder}. Restore the relay or inspect another exchange.`;
  if (state === 'request') return def.requestDetail;
  if (state === 'matching') return `${def.requestDetail} The concise request is crossing ${runtime.currentPath?.hops || 0} actual graph hops toward ${def.responder}.`;
  if (state === 'agreed-online' || state === 'agreed-offline') return def.agreement;
  if (state === 'agreed') return `${def.responseDetail} ${def.agreement}`;
  if (state === 'journey') {
    const road = world.geo.routes[key];
    return `${def.responder} → ${def.destination}: ${road.distanceKm} km by the bundled OSRM road route, approximately ${road.minutes} minutes under its routing estimate. Radio coordinated the agreement; the journey stays physical.`;
  }
  return def.completion;
}

const cameraKeys = [
  { t: 0, p: [52, 48, 64], q: [0, 1.4, -2] },
  { t: 10, p: [50, 46, 62], q: [0, 1.4, -2] },
  { t: 20, p: [51, 45, 62], q: [0, 1.5, 1] },
  { t: 30, p: [-27, 25, 43], q: [-3, 1.1, 18] },
  { t: 42, p: [-20, 22, 38], q: [-3, 1.2, 20] },
  { t: 52, p: [38, 35, 35], q: [5, 1.2, 8] },
  { t: 62, p: [44, 33, 13], q: [10, 1.1, 5] },
  { t: 73, p: [36, 30, -27], q: [9, 1.2, -9] },
  { t: 85, p: [46, 32, -35], q: [14, 1.1, -16] },
  { t: 98, p: [33, 28, -51], q: [8, 1.2, -20] },
  { t: 110, p: [55, 52, 67], q: [0, 1.4, -2] },
  { t: 120, p: [52, 48, 64], q: [0, 1.4, -2] },
];
const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3(), nextCamPos = new THREE.Vector3(), nextCamTarget = new THREE.Vector3();
function cinematicCamera(t) {
  let index = 0;
  while (index < cameraKeys.length - 2 && t > cameraKeys[index + 1].t) index++;
  const a = cameraKeys[index], b = cameraKeys[index + 1], u = smooth(t, a.t, b.t);
  camPos.fromArray(a.p).lerp(nextCamPos.fromArray(b.p), u);
  camTarget.fromArray(a.q).lerp(nextCamTarget.fromArray(b.q), u);
  if (camera.aspect < 0.9) camPos.sub(camTarget).multiplyScalar(1.45).add(camTarget);
  camera.position.copy(camPos); controls.target.copy(camTarget); camera.lookAt(camTarget);
}

let simT = 0, paused = reducedMotion || captureMode, meshOn = true, explore = false;
let activeChapter = '', manualStory = null, selectedDetail = 'care';
const layers = { radio: true, people: true, resources: true, trust: true, labels: true };
const ui = Object.fromEntries([
  'opening', 'story-card', 'story-time', 'story-place', 'story-title', 'story-copy', 'exchange-pair',
  'need-text', 'offer-text', 'story-progress', 'stage-track', 'stage-label', 'resolved-count', 'return-count',
  'network-state', 'network-state-dot', 'route-label', 'route-value', 'ending', 'elapsed', 'timeline',
  'broadcast-text', 'relay-button', 'relay-label', 'relay-select', 'relay-impact', 'explore-button', 'play-button',
  'toast', 'atlas-dialog', 'atlas-list', 'exchange-dialog', 'place-select',
].map(id => [id, document.getElementById(id)]));
const endingTitle = ui.ending.querySelector('h2'), endingCopy = document.getElementById('ending-copy');
const stageNames = ['Request', 'Match', 'Agreement', 'Journey', 'Complete', 'Trust'];
ui['stage-track'].innerHTML = stageNames.map(name => `<span><i></i><small>${name}</small></span>`).join('');
for (const key of relayKeys) {
  const option = document.createElement('option'); option.value = key; option.textContent = world.geo.relays[key].name; ui['relay-select'].appendChild(option);
}
for (const [key, place] of Object.entries(world.geo.places)) {
  const option = document.createElement('option'); option.value = key; option.textContent = place.name; ui['place-select'].appendChild(option);
}
const atlasButtons = {}, atlasStatus = {};
for (const key of storyKeys) {
  const def = storyDefs[key], button = document.createElement('button');
  button.type = 'button'; button.className = 'atlas-item'; button.dataset.atlas = key;
  button.innerHTML = `<span class="atlas-number">${def.number}</span><span class="atlas-main"><small>${def.category} · ${def.requester} ↔ ${def.responder}</small><strong>${def.title}</strong><span>${def.need}</span><em data-atlas-status></em></span><span class="atlas-arrow" aria-hidden="true">→</span>`;
  button.addEventListener('click', () => { ui['atlas-dialog'].close(); openExchange(key); });
  ui['atlas-list'].appendChild(button); atlasButtons[key] = button;
  atlasStatus[key] = button.querySelector('[data-atlas-status]');
}
const storyNavButtons = [...document.querySelectorAll('[data-story]')];

function activeStoryAt(t) {
  if (t < 20) return null;
  let active = 'care';
  for (const key of storyKeys) if (t >= storyDefs[key].start) active = key;
  return active;
}

function setStoryCard(key, t) {
  const state = key ? storyState(key, t) : t < 18 ? 'outage' : 'awakening';
  const chapter = `${key || 'coast'}|${state}|${meshOn}|${offlineRelay}|${storyRuntime[key]?.currentPath?.path.join(',')}`;
  if (chapter === activeChapter) return;
  activeChapter = chapter;
  if (key) {
    const def = storyDefs[key];
    ui['story-time'].textContent = `${def.number} · ${def.category}`;
    ui['story-place'].textContent = `${def.requester.toUpperCase()} ↔ ${def.responder.toUpperCase()}`;
    ui['story-title'].textContent = def.title;
    ui['story-copy'].textContent = stageCopy(key, t);
    ui['need-text'].textContent = def.need; ui['offer-text'].textContent = def.offer;
    ui['exchange-pair'].hidden = false;
    ui['stage-label'].textContent = stateLabel(key, t);
    const currentStage = stageIndex(state);
    [...ui['stage-track'].children].forEach((element, index) => {
      element.classList.toggle('done', index < currentStage);
      element.classList.toggle('current', index === currentStage);
      element.classList.toggle('blocked', ['unmatched', 'isolated'].includes(state) && index === 0);
    });
  } else if (state === 'outage') {
    ui['story-time'].textContent = '18:42'; ui['story-place'].textContent = 'INTERNET UPLINK LOST';
    ui['story-title'].textContent = 'The cloud goes silent.';
    ui['story-copy'].textContent = 'The coast still holds the same people, vehicles, food, tools and skills. Two journeys were agreed online yesterday. Six new requests still need a way to find their responders.';
    ui['exchange-pair'].hidden = true;
    ui['stage-label'].textContent = 'Existing agreements remain valid';
    [...ui['stage-track'].children].forEach(element => element.className = '');
  } else {
    ui['story-time'].textContent = '18:43'; ui['story-place'].textContent = meshOn ? 'LOCAL MESH · FUTURE SCENARIO' : 'INTERNET-ONLY COMPARISON';
    ui['story-title'].textContent = meshOn ? 'A second coordination layer wakes.' : 'Two journeys continue. Six requests wait.';
    ui['story-copy'].textContent = meshOn
      ? 'Rooftop nodes and six elevated solar relays begin passing concise requests and agreements. Each exchange must find an actual route through this graph.'
      : 'The garden trade and hospital ride were agreed online, so their physical journeys proceed. New care, skills, repair, website, market, and beekeeping matches cannot be discovered.';
    ui['exchange-pair'].hidden = true;
    ui['stage-label'].textContent = meshOn ? 'Local radio coordination' : 'No new internet matching';
    [...ui['stage-track'].children].forEach(element => element.className = '');
  }
}

let toastTimer = 0;
function toast(message) {
  ui.toast.textContent = message; ui.toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => ui.toast.classList.remove('visible'), 4200);
}

function formatTime(t) {
  const seconds = Math.floor(t);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function updateRelayUi() {
  const name = routeName(offlineRelay || ui['relay-select'].value);
  ui['relay-button'].disabled = !meshOn;
  ui['relay-select'].disabled = !meshOn;
  ui['relay-button'].setAttribute('aria-pressed', String(Boolean(offlineRelay)));
  ui['relay-label'].textContent = offlineRelay ? `Restore ${name}` : `Disable ${name}`;
  if (!meshOn) ui['relay-impact'].textContent = 'Relay tests require the future mesh scenario.';
  else if (!offlineRelay) ui['relay-impact'].textContent = 'Choose any relay. Removing it recomputes every new exchange path.';
  else if (!relayImpact.affected) ui['relay-impact'].textContent = `${name} is offline. No current shortest path used it; all routes remain unchanged.`;
  else ui['relay-impact'].textContent = `${name} offline · ${relayImpact.affected} path${relayImpact.affected === 1 ? '' : 's'} changed · +${relayImpact.addedHops} hops · up to ${Math.round(relayImpact.maxDelay)}s delay${relayImpact.isolated ? ` · ${relayImpact.isolated} isolated` : ''}.`;
}

let lastPanelUpdate = 0, lastElapsedSecond = -1;
function updateUi(t, force = false) {
  // Cheap per-frame chrome: fades, progress bars, the scrubber.
  const openingOpacity = 1 - smooth(t, 6, 10);
  document.body.classList.toggle('opening-active', openingOpacity > 0.05);
  ui.opening.style.opacity = openingOpacity;
  ui.opening.style.transform = `translateY(${(1 - openingOpacity) * -12}px)`;
  const cardOpacity = smooth(t, 10, 13) * (1 - smooth(t, 110, 113));
  ui['story-card'].style.opacity = cardOpacity;
  ui['story-card'].style.transform = `translateY(${(1 - cardOpacity) * 8}px)`;
  const endingOpacity = smooth(t, 112, 115);
  ui.ending.style.opacity = endingOpacity;
  ui.ending.setAttribute('aria-hidden', endingOpacity < 0.5 ? 'true' : 'false');

  const storyKey = manualStory || activeStoryAt(t);
  if (storyKey) {
    const def = storyDefs[storyKey], runtime = storyRuntime[storyKey], times = timesFor(def, runtime);
    const progress = storyComplete(storyKey, t) ? 1 : clamp((t - def.start) / Math.max(1, times.complete - def.start), 0, 1);
    ui['story-progress'].firstElementChild.style.width = `${progress * 100}%`;
  } else ui['story-progress'].firstElementChild.style.width = `${clamp(t / 20, 0, 1) * 100}%`;

  const second = Math.floor(t);
  if (second !== lastElapsedSecond) { lastElapsedSecond = second; ui.elapsed.textContent = formatTime(t); }
  ui.timeline.value = t; ui.timeline.style.setProperty('--progress', `${t / DURATION * 100}%`);

  // Heavier DOM work (card text, counters, lists) runs at ~8Hz — per-frame
  // text writes were a major source of jank on slower machines.
  const now = performance.now();
  if (!force && now - lastPanelUpdate < 120) return;
  lastPanelUpdate = now;

  setStoryCard(storyKey, t);
  const completed = storyKeys.filter(key => storyComplete(key, t)).length;
  const agreed = storyKeys.filter(key => storyAgreed(key, t)).length;
  ui['resolved-count'].textContent = completed; ui['return-count'].textContent = agreed;
  if (t < 11) {
    ui['network-state'].textContent = 'INTERNET ONLINE'; ui['network-state-dot'].style.background = '#78b9ca';
    ui['route-label'].textContent = 'Cloud coordination'; ui['route-value'].textContent = '2 standing agreements';
    ui['broadcast-text'].textContent = 'ONLINE · CENTRAL COAST EXCHANGE';
  } else if (t < 20) {
    ui['network-state'].textContent = 'UPLINK LOST'; ui['network-state-dot'].style.background = '#ff7d6b';
    ui['route-label'].textContent = 'New internet matching'; ui['route-value'].textContent = 'Unavailable';
    ui['broadcast-text'].textContent = 'SIGNAL LOST · INTERNET';
  } else {
    ui['network-state'].textContent = meshOn ? 'LOCAL MESH ACTIVE' : 'INTERNET ONLY'; ui['network-state-dot'].style.background = meshOn ? '#d7f99a' : '#ff7d6b';
    ui['route-label'].textContent = meshOn ? 'Selected radio path' : 'Existing agreements';
    const key = storyKey || 'care', runtime = storyRuntime[key];
    ui['route-value'].textContent = meshOn
      ? storyDefs[key].preAgreed ? 'Previously agreed online' : runtime.currentPath ? `${runtime.currentPath.hops} hops${runtime.delay ? ` · +${Math.round(runtime.delay)}s` : ''}` : 'Isolated'
      : '2 can proceed · 6 wait';
    ui['broadcast-text'].textContent = meshOn ? 'ON AIR · 6 RELAYS · 44 COMMUNITIES' : 'OFFLINE · 2 PRIOR AGREEMENTS';
  }
  ui['explore-button'].textContent = explore ? 'Resume tour' : 'Explore';
  ui['explore-button'].setAttribute('aria-pressed', String(explore));
  ui['play-button'].setAttribute('aria-label', paused ? 'Play scenario' : 'Pause scenario');
  ui['play-button'].firstElementChild.className = paused ? 'play-icon' : 'pause-icon';
  storyNavButtons.forEach(button => button.classList.toggle('active', button.dataset.story === storyKey));
  for (const key of storyKeys) {
    atlasStatus[key].textContent = stateLabel(key, t);
    atlasStatus[key].dataset.state = storyState(key, t);
  }
  updateRelayUi();

  if (endingOpacity > 0.01) {
    if (meshOn) {
      endingTitle.innerHTML = completed === 8 ? 'The internet went down.<br><em>The coast didn’t.</em>' : `The network carried ${completed} exchanges.<br><em>${8 - completed} still need a route.</em>`;
      endingCopy.innerHTML = `${completed} needs answered · ${agreed} returns agreed.<br>From Woy Woy to Wyee, trust remains after the signal fades.`;
    } else {
      endingTitle.innerHTML = 'Two journeys continued.<br><em>Six new requests waited.</em>';
      endingCopy.innerHTML = 'Real internet agreements still matter.<br>The future mesh adds a way to make new local matches when the cloud is gone.';
    }
  }
  if (ui['exchange-dialog'].open) renderExchangeDetail(selectedDetail, t);
}

function renderExchangeDetail(key, t) {
  selectedDetail = key;
  const def = storyDefs[key], runtime = storyRuntime[key], road = world.geo.routes[key];
  document.getElementById('detail-title').textContent = def.title;
  document.getElementById('detail-subtitle').textContent = `${def.number} · ${def.category} · ${def.requester} ↔ ${def.responder}`;
  document.getElementById('detail-need').textContent = def.need;
  document.getElementById('detail-return').textContent = def.offer;
  document.getElementById('detail-requester').textContent = def.requestDetail;
  document.getElementById('detail-responder').textContent = def.responseDetail;
  document.getElementById('detail-agreement').textContent = def.agreement;
  document.getElementById('detail-road').textContent = `${def.origin} → ${def.destination} · ${road.distanceKm} km · OSRM estimate ${road.minutes} min`;
  document.getElementById('detail-radio').textContent = def.preAgreed
    ? 'Previously matched online; no new radio route is required.'
    : !meshOn ? 'Internet-only: no new match after the outage.'
      : runtime.currentPath ? `${runtime.currentPath.hops} hops · ${runtime.currentPath.path.map(routeName).join(' → ')}${runtime.delay ? ` · +${Math.round(runtime.delay)} scenario seconds` : ''}` : 'No available path with the selected relay offline.';
  document.getElementById('detail-stage-copy').textContent = stageCopy(key, t);
  document.getElementById('detail-stage-label').textContent = stateLabel(key, t);
  const currentStage = stageIndex(storyState(key, t));
  document.getElementById('detail-timeline').innerHTML = stageNames.map((name, index) => `<span class="${index < currentStage ? 'done' : index === currentStage ? 'current' : ''}"><i></i><strong>${name}</strong></span>`).join('');
}

function openExchange(key) {
  manualStory = key; selectedDetail = key; paused = true;
  if (simT < 20) simT = storyDefs[key].start + 1.5;
  renderExchangeDetail(key, simT); ui['exchange-dialog'].showModal(); sample(simT); draw();
}

function focusStory(key) {
  if (!storyDefs[key]) return;
  manualStory = key; selectedDetail = key; simT = storyDefs[key].start + 1.5; paused = true; explore = false;
  sample(simT); draw();
}

function focusRoute(key) {
  const def = storyDefs[key], midpoint = at(def.requester, 0.7).lerp(at(def.responder, 0.7), 0.5);
  const distance = nodeDistance(def.requester, def.responder);
  camera.position.copy(midpoint).add(new THREE.Vector3(distance * 0.7 + 7, distance * 0.65 + 9, distance * 0.85 + 8));
  controls.target.copy(midpoint); camera.lookAt(midpoint); controls.update();
  manualStory = key; explore = true; paused = true;
  if (ui['exchange-dialog'].open) ui['exchange-dialog'].close();
  sample(simT); draw(); toast(`${def.requester} ↔ ${def.responder} · ${world.geo.routes[key].distanceKm} km road route`);
}

function focusPlace(key) {
  if (!LOC[key]) return;
  const target = at(key, 0.8);
  camera.position.copy(target).add(new THREE.Vector3(9, 11, 13)); controls.target.copy(target); camera.lookAt(target); controls.update();
  explore = true; paused = true; ui['place-select'].value = key; sample(simT); draw();
  const elevation = world.geo.places[key]?.elevation;
  toast(`${routeName(key)}${elevation !== undefined ? ` · terrain source ${Math.round(elevation)} m` : ''} · drag to orbit`);
}

function wholeCoast() {
  explore = true; paused = true; camera.position.set(52, 48, 64); controls.target.set(0, 1.4, -2); controls.update(); sample(simT); draw();
  toast('Whole coast · Umina Beach to Wyee Point · 44 mapped communities');
}

function updateRadioRoute(runtime, t, active) {
  const route = runtime.route, def = runtime.def;
  if (!route || !runtime.currentPath) return;
  const start = def.start, end = def.sendEnd + runtime.delay;
  const amount = meshOn && !def.preAgreed && layers.radio && runtime.currentPath
    ? smooth(t, start - 1, start + 1) * (0.35 + 0.65 * (1 - smooth(t, end + 4, end + 9))) : 0;
  route.group.children.forEach(child => {
    if (child.isMesh && child.userData.curve) child.material.opacity = amount * (active ? 0.72 : 0.1);
  });
  const sending = meshOn && !def.preAgreed && t >= start && t <= end;
  route.packet.visible = sending; route.echo.visible = sending;
  if (sending) {
    const u = clamp((t - start) / Math.max(0.1, end - start), 0, 1);
    route.packet.position.copy(route.path.getPoint(u));
    route.echo.position.copy(route.path.getPoint(Math.max(0, u - 0.035)));
    route.echo.material.opacity = 0.35;
  }
}

function sample(inputT, forceUi = true) {
  const t = ((inputT % DURATION) + DURATION) % DURATION;
  const stormAmount = smooth(t, 7, 14) * (1 - smooth(t, 102, 118));
  const internetAmount = 1 - smooth(t, 11, 17);
  const meshAmount = meshOn ? smooth(t, 19, 26) : 0;
  const dawnAmount = smooth(t, 104, 119);
  const states = Object.fromEntries(relayKeys.map(key => [key, key !== offlineRelay]));
  world.sampleEnvironment(t, stormAmount, internetAmount, meshAmount, dawnAmount, states);
  scene.background.set(C.sky).lerp(new THREE.Color(0x536c5b), dawnAmount * 0.52);
  scene.fog.color.copy(scene.background);
  hemi.intensity = 1.35 + dawnAmount * 0.8;
  sun.intensity = 2.25 + dawnAmount * 1.25;
  sun.color.set(0xffd8a3).lerp(new THREE.Color(0xffc780), dawnAmount);
  stars.material.opacity = (0.52 - stormAmount * 0.38) * (1 - dawnAmount);
  moon.material.opacity = 0.32 * (1 - dawnAmount);

  for (const [key, runtime] of Object.entries(storyRuntime)) {
    const def = runtime.def, state = storyState(key, t), times = timesFor(def, runtime);
    const resolved = storyComplete(key, t), active = t >= def.start && !resolved;
    runtime.beacon.visible = def.preAgreed || t >= 19;
    const color = resolved ? C.mint : ['unmatched', 'isolated'].includes(state) ? C.coral : active || def.preAgreed ? C.amber : C.coral;
    for (const part of ['tip', 'ring', 'stem', 'glow']) runtime.beacon.userData[part].material.color.set(color);
    const pulse = 1 + Math.sin(t * 3.1 + Number(def.number)) * 0.12 * (resolved ? 0.25 : 1);
    runtime.beacon.userData.ring.scale.setScalar(pulse);
    runtime.beacon.userData.glow.material.opacity = resolved ? 0.35 : ['unmatched', 'isolated'].includes(state) ? 0.72 : 0.62;
    runtime.beacon.userData.tip.rotation.y = t * 0.7;
    updateRadioRoute(runtime, t, (manualStory || activeStoryAt(t)) === key);

    const canJourney = def.preAgreed || (meshOn && Boolean(runtime.currentPath));
    const journeyVisible = canJourney && t >= times.journeyStart - 1.2 && t <= times.complete + 4;
    runtime.line.material.opacity = journeyVisible && layers.people
      ? smooth(t, times.journeyStart - 1.2, times.journeyStart + 0.5) * (1 - smooth(t, times.complete + 1, times.complete + 4)) * 0.62 : 0;
    const travelling = canJourney && t >= times.journeyStart && t < times.complete;
    runtime.agent.visible = canJourney && layers.people && t >= (def.preAgreed ? 18 : def.start) && (t >= times.journeyStart - 1 || resolved);
    const travel = clamp((t - times.journeyStart) / def.journeyDuration, 0, 1);
    if (runtime.agent.visible) {
      pathPoint(runtime.road, travel, runtime.agent, 0.02);
      orientOnPath(runtime.agent, runtime.road, travel);
      animateWalk(runtime.agent, t, travelling);
    }

    const trustAmount = resolved ? smooth(t, times.complete, times.complete + 3) : 0;
    runtime.trust.material.opacity = trustAmount * 0.55;
    runtime.returnToken.visible = resolved && layers.resources;
    if (runtime.returnToken.visible) {
      const u = (t * 0.1 + Number(def.number) * 0.13) % 1;
      const start = at(def.destination, 0.9), end = at(def.requester, 0.9);
      runtime.returnToken.position.copy(start).lerp(end, u);
      runtime.returnToken.position.y += Math.sin(u * Math.PI) * 1.2;
      runtime.returnToken.rotation.y = t;
    }
  }

  for (const [key, runtime] of Object.entries(internetRuntime)) {
    const visible = internetAmount > 0.01;
    runtime.a.material.opacity = internetAmount * 0.55;
    runtime.b.material.opacity = internetAmount * 0.55;
    runtime.packet.visible = visible;
    if (visible) {
      const u = (t * 0.12 + (key === 'ride' ? 0.45 : 0)) % 1;
      runtime.packet.position.copy(runtime.path.getPoint(u));
      runtime.packet.material.opacity = internetAmount * 0.9;
    }
  }

  ambientPackets.forEach(({ route, offset }) => {
    const visible = meshOn && t > 25 && layers.radio;
    route.group.children.forEach(child => { if (child.isMesh && child.userData.curve) child.material.opacity = visible ? 0.018 : 0; });
    route.packet.visible = route.echo.visible = visible;
    if (visible) {
      const u = (t * 0.045 + offset) % 1;
      route.packet.position.copy(route.path.getPoint(u));
      route.echo.position.copy(route.path.getPoint(Math.max(0, u - 0.03)));
      route.packet.scale.setScalar(0.5);
    }
  });

  peopleLayer.visible = layers.people;
  resourceLayer.visible = layers.resources;
  trustLayer.visible = layers.trust;
  world.radio.visible = layers.radio;
  labelObjects.forEach(label => { label.visible = layers.labels; });
  if (!explore) cinematicCamera(t);
  updateUi(t, forceUi);
}

const clock = new THREE.Clock();
let frameEMA = 16, frameCount = 0, qualityStep = 0, needsDraw = true;
function draw() {
  controls.enableDamping = explore && !captureMode;
  controls.update(); renderer.info.reset();
  if (post) post.render(scene, camera); else renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
function disablePostPipeline() {
  if (!post) return;
  post = null;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  scene.traverse(object => { if (object.material) object.material.needsUpdate = true; });
}
// If frames stay slow, shed cost in order: pixel ratio, shadows, bloom.
function adaptQuality(dt) {
  if (captureMode) return;
  frameEMA = frameEMA * 0.95 + dt * 1000 * 0.05; frameCount++;
  if (frameCount < 150 || frameCount % 150 !== 0 || frameEMA <= 30) return;
  qualityStep++;
  if (qualityStep === 1) {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1));
    renderer.setSize(innerWidth, innerHeight); post?.setSize(innerWidth, innerHeight);
  } else if (qualityStep === 2 && renderer.shadowMap.enabled) {
    renderer.shadowMap.enabled = false; sun.castShadow = false;
    scene.traverse(object => { if (object.material) object.material.needsUpdate = true; });
  } else if (qualityStep === 3) disablePostPipeline();
}
function tick() {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (!paused) {
    simT = (simT + dt) % DURATION;
    if (manualStory) manualStory = null;
    sample(simT, false); adaptQuality(dt); draw();
  } else if (needsDraw) {
    // Paused scenes only redraw on demand — idle phones should not burn GPU.
    needsDraw = false; draw();
  }
}
controls.addEventListener('change', () => { needsDraw = true; });
renderer.domElement.addEventListener('wheel', () => { needsDraw = true; }, { passive: true });
if (!captureMode) renderer.setAnimationLoop(tick);

window.__seek = value => {
  const numeric = Number(value);
  paused = true; simT = Number.isFinite(numeric) ? ((numeric % DURATION) + DURATION) % DURATION : 0;
  explore = false; sample(simT); controls.update(); draw();
};
window.__play = () => { if (captureMode) return; paused = false; manualStory = null; clock.getDelta(); updateUi(simT); };
window.__pause = () => { paused = true; updateUi(simT); };
window.__metrics = () => ({
  calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
  pixelRatio: renderer.getPixelRatio(), frameMs: Number(frameEMA.toFixed(2)), quality: qualityStep,
  tier: lowTier ? 'low' : 'high', post: Boolean(post), shadows: renderer.shadowMap.enabled,
  time: simT, meshOn, offlineRelay, relayImpact: { ...relayImpact }, layers: { ...layers },
  places: Object.keys(world.geo.places).length, roads: world.roads.ways, homes: world.town.userData.count,
  trees: world.trees.userData.count, assetBounds: world.assetBounds,
  exchanges: Object.fromEntries(storyKeys.map(key => [key, {
    state: storyState(key, simT), path: storyRuntime[key].currentPath?.path || null,
    hops: storyRuntime[key].currentPath?.hops ?? null, delay: storyRuntime[key].delay,
    complete: storyComplete(key, simT), roadKm: world.geo.routes[key].distanceKm,
  }])),
});
window.__story = key => focusStory(key);
window.__relay = (key, offline = true) => {
  if (!relayKeys.includes(key)) return false;
  ui['relay-select'].value = key; offlineRelay = offline ? key : null; computeRoutes(); activeChapter = ''; sample(simT); draw(); return true;
};
window.__mode = value => setMesh(Boolean(value));
window.__place = key => focusPlace(key);

function setMesh(value) {
  meshOn = value;
  document.getElementById('mesh-on').classList.toggle('active', meshOn);
  document.getElementById('mesh-off').classList.toggle('active', !meshOn);
  document.getElementById('mesh-on').setAttribute('aria-pressed', String(meshOn));
  document.getElementById('mesh-off').setAttribute('aria-pressed', String(!meshOn));
  activeChapter = ''; sample(simT); draw();
  toast(meshOn ? 'Future mesh enabled · new local requests can be coordinated by radio.' : 'Internet-only · prior agreements continue; six new requests cannot find responders.');
}

function selectRelay(key, announce = false) {
  if (!relayKeys.includes(key)) return;
  ui['relay-select'].value = key; updateRelayUi();
  if (announce) {
    const relay = world.relays.find(item => item.userData.key === key);
    if (relay) {
      const target = relay.position.clone(); camera.position.copy(target).add(new THREE.Vector3(8, 9, 11)); controls.target.copy(target); controls.update();
      explore = true; paused = true; sample(simT); draw();
    }
    toast(`${routeName(key)} selected · use the resilience button to disable or restore it.`);
  }
}

document.querySelectorAll('[data-story]').forEach(button => button.addEventListener('click', () => focusStory(button.dataset.story)));
ui['play-button'].addEventListener('click', () => { paused = !paused; if (!paused) manualStory = null; clock.getDelta(); updateUi(simT); });
document.getElementById('restart-button').addEventListener('click', () => {
  simT = 0; paused = captureMode || reducedMotion; explore = false; manualStory = null; sample(simT); clock.getDelta(); draw();
});
ui.timeline.addEventListener('input', event => {
  simT = Number(event.target.value) % DURATION; paused = true; explore = false; manualStory = null; sample(simT); draw();
});
document.getElementById('mesh-on').addEventListener('click', () => setMesh(true));
document.getElementById('mesh-off').addEventListener('click', () => setMesh(false));
ui['relay-select'].addEventListener('change', () => selectRelay(ui['relay-select'].value));
ui['relay-button'].addEventListener('click', () => {
  if (!meshOn) return;
  const selected = ui['relay-select'].value;
  offlineRelay = offlineRelay === selected ? null : selected;
  computeRoutes(); activeChapter = ''; sample(simT); draw();
  const name = routeName(selected);
  toast(offlineRelay
    ? `${name} removed · ${relayImpact.affected} paths changed, +${relayImpact.addedHops} hops, ${relayImpact.isolated} isolated.`
    : `${name} restored · all routes recomputed.`);
});
ui['explore-button'].addEventListener('click', () => {
  explore = !explore; if (!explore) cinematicCamera(simT); updateUi(simT); draw();
});
document.getElementById('whole-coast-button').addEventListener('click', wholeCoast);
ui['place-select'].addEventListener('change', () => { if (ui['place-select'].value) focusPlace(ui['place-select'].value); });
renderer.domElement.addEventListener('pointerdown', () => { needsDraw = true; if (!captureMode) { explore = true; updateUi(simT); } });

document.getElementById('atlas-button').addEventListener('click', () => { paused = true; updateUi(simT); ui['atlas-dialog'].showModal(); });
document.getElementById('close-atlas').addEventListener('click', () => ui['atlas-dialog'].close());
document.getElementById('story-detail-button').addEventListener('click', () => openExchange(manualStory || activeStoryAt(simT) || 'care'));
document.getElementById('route-focus-button').addEventListener('click', () => focusRoute(manualStory || activeStoryAt(simT) || 'care'));
document.getElementById('close-exchange').addEventListener('click', () => ui['exchange-dialog'].close());
document.getElementById('detail-follow').addEventListener('click', () => { const key = selectedDetail; ui['exchange-dialog'].close(); focusStory(key); });
document.getElementById('detail-focus').addEventListener('click', () => focusRoute(selectedDetail));

const layersPanel = document.getElementById('layers-panel'), layersButton = document.getElementById('layers-button');
function setLayersOpen(open) { layersPanel.hidden = !open; layersButton.setAttribute('aria-expanded', String(open)); }
layersButton.addEventListener('click', () => setLayersOpen(layersPanel.hidden));
document.getElementById('close-layers').addEventListener('click', () => { setLayersOpen(false); layersButton.focus(); });
document.querySelectorAll('[data-layer]').forEach(input => input.addEventListener('change', () => {
  layers[input.dataset.layer] = input.checked; sample(simT); draw();
}));

const about = document.getElementById('about-dialog');
document.getElementById('about-button').addEventListener('click', () => { paused = true; about.showModal(); updateUi(simT); });
document.getElementById('close-about').addEventListener('click', () => about.close());
for (const dialog of [about, ui['atlas-dialog'], ui['exchange-dialog']]) {
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}

const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
let pointerDown = null;
renderer.domElement.addEventListener('pointerdown', event => { pointerDown = [event.clientX, event.clientY]; });
renderer.domElement.addEventListener('pointerup', event => {
  if (!pointerDown || Math.hypot(event.clientX - pointerDown[0], event.clientY - pointerDown[1]) > 5) return;
  pointer.x = event.clientX / innerWidth * 2 - 1; pointer.y = -(event.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const targets = [...Object.values(storyRuntime).map(runtime => runtime.beacon), ...world.relays];
  const hits = raycaster.intersectObjects(targets, true);
  if (!hits.length) return;
  const object = hits[0].object;
  if (object.userData.story) focusStory(object.userData.story);
  else if (object.userData.relayKey) selectRelay(object.userData.relayKey, true);
});

function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(pickPixelRatio());
  renderer.setSize(innerWidth, innerHeight); post?.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', () => { resize(); sample(simT); needsDraw = true; draw(); });

resize();
sample(simT); controls.update(); draw();
document.getElementById('loading').classList.add('loaded');
clearTimeout(window.__SCENE_WATCHDOG__);
window.__SCENE_READY__ = true;
const tParam = params.get('t');
if (tParam !== null) window.__seek(tParam);
