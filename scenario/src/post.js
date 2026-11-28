import * as THREE from 'three';

const quadVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

function safeTexture() {
  return `
    vec3 safeColor(vec3 c){
      c=clamp(c,vec3(0.),vec3(64.));
      if(c.r!=c.r)c.r=0.; if(c.g!=c.g)c.g=0.; if(c.b!=c.b)c.b=0.;
      return c;
    }`;
}

export class SignalPost {
  constructor(renderer, width, height) {
    this.renderer = renderer;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    const options = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.sceneTarget = new THREE.WebGLRenderTarget(1, 1, { ...options, depthBuffer: true });
    this.brightTarget = new THREE.WebGLRenderTarget(1, 1, options);
    this.blurTarget = new THREE.WebGLRenderTarget(1, 1, options);
    this.bright = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tInput: { value: this.sceneTarget.texture }, uThreshold: { value: 0.82 } },
      vertexShader: quadVertex,
      fragmentShader: `varying vec2 vUv; uniform sampler2D tInput; uniform float uThreshold; ${safeTexture()}
        void main(){vec3 c=safeColor(texture2D(tInput,vUv).rgb);float l=max(c.r,max(c.g,c.b));
        float knee=.28;float soft=clamp(l-uThreshold+knee,0.,2.*knee);soft=soft*soft/(4.*knee+.0001);
        float contribution=max(soft,l-uThreshold)/max(l,.0001);gl_FragColor=vec4(c*contribution,1.);}`,
    });
    this.blur = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tInput: { value: null }, uDirection: { value: new THREE.Vector2() } },
      vertexShader: quadVertex,
      fragmentShader: `varying vec2 vUv; uniform sampler2D tInput; uniform vec2 uDirection;
        void main(){vec3 c=texture2D(tInput,vUv).rgb*.227027;
        c+=texture2D(tInput,vUv+uDirection*1.384615).rgb*.316216;
        c+=texture2D(tInput,vUv-uDirection*1.384615).rgb*.316216;
        c+=texture2D(tInput,vUv+uDirection*3.230769).rgb*.070270;
        c+=texture2D(tInput,vUv-uDirection*3.230769).rgb*.070270;
        gl_FragColor=vec4(c,1.);}`,
    });
    this.composite = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: {
        tScene: { value: this.sceneTarget.texture }, tBloom: { value: this.brightTarget.texture },
        uBloom: { value: 0.42 }, uExposure: { value: 1.08 },
      },
      vertexShader: quadVertex,
      fragmentShader: `varying vec2 vUv; uniform sampler2D tScene; uniform sampler2D tBloom;
        uniform float uBloom; uniform float uExposure; ${safeTexture()}
        vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
        void main(){
          vec3 base=safeColor(texture2D(tScene,vUv).rgb);
          vec3 bloom=safeColor(texture2D(tBloom,vUv).rgb);
          vec3 c=base+bloom*uBloom;
          float lum=dot(c,vec3(.2126,.7152,.0722));
          c+=vec3(-.012,.012,.012)*(1.-clamp(lum,0.,1.));
          c+=vec3(.018,.006,-.008)*clamp(lum-.45,0.,1.);
          c=aces(c*uExposure);
          vec2 p=vUv-.5;float vignette=1.-dot(p,p)*.32;c*=vignette;
          float dither=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5;
          c+=dither/255.;
          gl_FragColor=vec4(c,1.);
          #include <colorspace_fragment>
        }`,
    });
    this.setSize(width, height);
  }

  setSize(width, height) {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const w = Math.max(1, Math.floor(size.x)), h = Math.max(1, Math.floor(size.y));
    this.sceneTarget.setSize(w, h);
    this.brightTarget.setSize(Math.max(1, Math.floor(w / 4)), Math.max(1, Math.floor(h / 4)));
    this.blurTarget.setSize(this.brightTarget.width, this.brightTarget.height);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.sceneTarget); r.render(scene, camera);
    this.quad.material = this.bright;
    r.setRenderTarget(this.brightTarget); r.render(this.scene, this.camera);
    this.quad.material = this.blur;
    this.blur.uniforms.tInput.value = this.brightTarget.texture;
    this.blur.uniforms.uDirection.value.set(1 / this.brightTarget.width, 0);
    r.setRenderTarget(this.blurTarget); r.render(this.scene, this.camera);
    this.blur.uniforms.tInput.value = this.blurTarget.texture;
    this.blur.uniforms.uDirection.value.set(0, 1 / this.brightTarget.height);
    r.setRenderTarget(this.brightTarget); r.render(this.scene, this.camera);
    this.quad.material = this.composite;
    r.setRenderTarget(null); r.render(this.scene, this.camera);
  }
}
