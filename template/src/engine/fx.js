// Efeitos de desastre (Pacote 3, aprovado em 19/11/2026). Tudo é função de t (sem Math.random).
// Exemplo completo: episodes/fxtest/scene.js (composição FxTest).
//   createFire      fogo "realista" (pedido do usuário): lençóis de chama translúcidos em degradê, SEM contorno,
//                   2 camadas por foco, brilho no chão, fumaça cinza bem leve, cinzas, luz quente tremulando.
//                   Use junto: lights.set('darkness') + scene.fog = FogExp2(0x8a6240, 0.07 * fire.amount).
//   createWindowFx  janela de noite: chuva, relâmpago, silhueta lá fora, vidro trincando
//   createFlood     água subindo com ondulação, espuma nas paredes, jatos pelas frestas, respingos
//   createUnderwater névoa azul-esverdeada, cáusticas no chão/teto, bolhas, destroços boiando
import * as THREE from 'three';
import {mesh, G, flat, toon} from './toon.js';

const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const GLSL = /* glsl */ `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a*vnoise(p); p *= 2.03; a *= .5; } return s; }
vec4 srgb(vec3 c, float a){ return vec4(pow(c, vec3(2.2)), a); } // cores em sRGB -> linear (o pós converte de volta)
`;
const VERT_UV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const VERT_WORLD = `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w; }`;
const billboardY = (obj, cam) => { obj.rotation.y = Math.atan2(cam.position.x - obj.position.x, cam.position.z - obj.position.z); };

// ---------------------------------------------------------------- FOGO
/**
 * flames: [{x, y, z, w, h, at}] — base da chama no chão/objeto; at = quando acende (cresce em 0,8 s).
 * smoke: {y, x0, x1, z0, z1} — camada de fumaça sob o teto.
 */
// Fogo "realista" (pedido do usuário): sem contorno, bordas em degradê, translúcido, base mais clara,
// várias línguas por lençol de chama, brilho no chão e névoa quente. Duas camadas por foco dão volume.
const FLAME_FRAG = GLSL + `uniform float time, grow, seed, layer; varying vec2 vUv;
  void main(){
    vec2 uv = vUv;
    float sp = 1.6 + layer * .5;
    // altura de cada língua de fogo varia ao longo de x e no tempo
    float tips = .55 + .5 * fbm(vec2(uv.x * 5.5 + seed, time * .9 + seed));
    float n = fbm(vec2(uv.x * 7. + seed * 1.3, uv.y * 2.4 - time * sp));
    float n2 = fbm(vec2(uv.x * 14. - seed, uv.y * 4.5 - time * sp * 1.6));
    float v = (tips * grow - uv.y) / max(tips * grow, .05) + (n - .5) * .7 + (n2 - .5) * .35;
    float edge = smoothstep(0., .18, uv.x) * smoothstep(1., .82, uv.x);   // laterais somem
    float a = smoothstep(.0, .4, v) * edge * smoothstep(0., .04, uv.y);
    if (a < .01) discard;
    vec3 c = mix(vec3(1., .45, .08), vec3(1., .70, .22), smoothstep(.12, .45, v));
    c = mix(c, vec3(1., .88, .48), smoothstep(.45, .85, v));
    c = mix(c, vec3(1., .96, .78), smoothstep(.9, 1.3, v));
    gl_FragColor = vec4(pow(c, vec3(2.2)) * 1.3, a * (.9 - layer * .2));
  }`;
const GLOW_FRAG = GLSL + `uniform float amount; varying vec2 vUv;
  void main(){ float d = length((vUv - .5) * vec2(1., 1.)) * 2.; float a = pow(max(0., 1. - d), 2.) * amount;
    if (a < .005) discard; gl_FragColor = vec4(pow(vec3(1., .55, .2), vec3(2.2)), a); }`;

export function createFire({flames, smoke}) {
  const group = new THREE.Group();
  const items = flames.map((f, i) => {
    const w = f.w ?? 1.4, h = f.h ?? 2.2;
    const layers = [0, 1].map((layer) => {
      const geo = new THREE.PlaneGeometry(w * (1 - layer * 0.25), h * (1 - layer * 0.3), 1, 1);
      geo.translate(0, (h * (1 - layer * 0.3)) / 2, 0);
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        uniforms: {time: {value: 0}, grow: {value: 0}, seed: {value: hash(i * 2 + layer + 1) * 10}, layer: {value: layer}},
        vertexShader: VERT_UV, fragmentShader: FLAME_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      }));
      m.position.set(f.x, f.y ?? 0, f.z);
      m.renderOrder = 2 + layer;
      group.add(m);
      return m;
    });
    // brilho no chão (poça de luz quente) + halo atrás da chama
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.4, w * 2.4).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: {amount: {value: 0}}, vertexShader: VERT_UV, fragmentShader: GLOW_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    pool.position.set(f.x, (f.y ?? 0) + 0.012, f.z);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.2, h * 1.3), new THREE.ShaderMaterial({
      uniforms: {amount: {value: 0}}, vertexShader: VERT_UV, fragmentShader: GLOW_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    halo.position.set(f.x, (f.y ?? 0) + h * 0.4, f.z);
    group.add(pool, halo);
    return {layers, pool, halo, f};
  });

  let smokeMesh = null;
  if (smoke) {
    const sw = smoke.x1 - smoke.x0, sd = smoke.z1 - smoke.z0;
    const geo = new THREE.PlaneGeometry(sw, sd).rotateX(Math.PI / 2);
    smokeMesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: {time: {value: 0}, amount: {value: 0}},
      vertexShader: VERT_UV, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      fragmentShader: GLSL + `uniform float time, amount; varying vec2 vUv;
        void main(){
          float n = fbm(vUv * vec2(3., 3.) + vec2(time * .08, time * .04));
          float a = smoothstep(.25, .85, n + amount * .45 - .2) * .38 * amount;   // véu cinza suave, quase transparente
          if (a < .005) discard;
          gl_FragColor = srgb(vec3(.56, .54, .55), a);
        }`,
    }));
    smokeMesh.position.set((smoke.x0 + smoke.x1) / 2, smoke.y, (smoke.z0 + smoke.z1) / 2);
    group.add(smokeMesh);
  }
  // fumaça subindo: nuvens grandes e muito transparentes
  const puffMat = (i) => new THREE.ShaderMaterial({
    uniforms: {time: {value: 0}, a: {value: 0}, seed: {value: hash(i + 77) * 9}},
    vertexShader: VERT_UV, transparent: true, depthWrite: false,
    fragmentShader: GLSL + `uniform float time, a, seed; varying vec2 vUv;
      void main(){ float d = length(vUv - .5) * 2.; float n = fbm(vUv * 3. + seed + time * .1);
        float al = smoothstep(1., .2, d + (n - .5) * .6) * a; if (al < .004) discard;
        gl_FragColor = srgb(vec3(.6, .58, .58), al); }`,
  });
  const puffs = Array.from({length: 14}, (_, i) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), puffMat(i));
    group.add(p);
    return p;
  });

  // cinzas escuras e algumas brasas
  const embers = Array.from({length: 60}, (_, i) => {
    const e = new THREE.Mesh(G.sphere(i % 4 === 0 ? 0.009 : 0.006, 6, 5), flat(i % 4 === 0 ? 0xffb347 : 0x3a2c38));
    group.add(e);
    return e;
  });

  const light = new THREE.PointLight(0xffa04a, 0, 6, 1.4);
  const warm = new THREE.HemisphereLight(0xffb377, 0x3a2416, 0); // ambiente quente (evita o tom rosado com luz azul)
  group.add(light, warm);

  return {
    group,
    update(t, camera) {
      let total = 0, cx = 0, cz = 0;
      for (const {layers, pool, halo, f} of items) {
        const g = Math.min(1, Math.max(0, (t - f.at) / 1.0));
        for (const m of layers) {
          m.material.uniforms.time.value = t;
          m.material.uniforms.grow.value = 0.25 + 0.75 * g;
          m.visible = g > 0;
          billboardY(m, camera);
        }
        const flick = 0.85 + 0.1 * Math.sin(t * 13 + f.x * 5) + 0.05 * Math.sin(t * 29 + f.z);
        pool.material.uniforms.amount.value = g * 0.55 * flick;
        halo.material.uniforms.amount.value = g * 0.12 * flick;
        halo.visible = pool.visible = g > 0;
        billboardY(halo, camera);
        total += g; cx += f.x * g; cz += f.z * g;
      }
      const amount = Math.min(1, total / items.length * 1.3);
      this.amount = amount;
      if (smokeMesh) {
        smokeMesh.material.uniforms.time.value = t;
        smokeMesh.material.uniforms.amount.value = amount;
      }
      puffs.forEach((p, i) => {
        const src = items[i % items.length].f;
        const u = (t * (0.07 + hash(i) * 0.05) + hash(i + 3)) % 1;
        const live = t > src.at + 0.5;
        p.visible = live;
        if (!live) return;
        p.position.set(src.x + (hash(i + 5) - 0.5) * 0.8 + Math.sin(t * 0.4 + i) * 0.2, 1.2 + u * 1.4, src.z + (hash(i + 8) - 0.5) * 0.6);
        p.scale.setScalar(1.2 + u * 1.8);
        p.material.uniforms.time.value = t;
        p.material.uniforms.a.value = 0.16 * Math.sin(Math.PI * u) * amount;
        billboardY(p, camera);
      });
      embers.forEach((e, i) => {
        const src = items[i % items.length].f;
        const live = t > src.at + 0.3;
        e.visible = live;
        if (!live) return;
        const u = (t * (0.18 + hash(i) * 0.25) + hash(i + 50)) % 1;
        e.position.set(src.x + Math.sin(t * 1.3 + i) * 0.3 + (hash(i + 9) - 0.5) * 1.2,
          (src.y ?? 0) + 0.2 + u * 2.4, src.z + Math.cos(t * 1.1 + i) * 0.25 + (hash(i + 19) - 0.5) * 0.8);
      });
      if (total > 0) { light.position.set(cx / total, 1.0, cz / total + 0.4); }
      light.intensity = amount * (6 + Math.sin(t * 17) * 0.8 + Math.sin(t * 7.3) * 0.6);
      warm.intensity = amount * (1.4 + Math.sin(t * 11) * 0.12);
    },
  };
}

// ---------------------------------------------------------------- JANELA (noite, chuva, relâmpago, silhueta, trinca)
const crackTexture = () => {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  const segs = [];
  const cx = 300, cy = 230;
  for (let r = 0; r < 11; r++) {
    let a = (r / 11) * Math.PI * 2 + hash(r) * 0.4, px = cx, py = cy;
    const len = 6 + Math.floor(hash(r + 20) * 6);
    for (let s = 0; s < len; s++) {
      a += (hash(r * 13 + s) - 0.5) * 0.6;
      const nx = px + Math.cos(a) * (22 + hash(s + r) * 18), ny = py + Math.sin(a) * (22 + hash(s + r * 3) * 18);
      segs.push([px, py, nx, ny]);
      if (hash(r * 7 + s) > 0.75) segs.push([nx, ny, nx + Math.cos(a + 0.9) * 40, ny + Math.sin(a + 0.9) * 40]);
      px = nx; py = ny;
    }
  }
  for (let k = 0; k < 3; k++) { // anéis concêntricos quebrados
    const R = 40 + k * 45;
    for (let s = 0; s < 14; s++) {
      if (hash(k * 31 + s) < 0.45) continue;
      const a0 = (s / 14) * Math.PI * 2, a1 = a0 + 0.35;
      segs.push([cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R]);
    }
  }
  x.lineCap = 'round';
  for (const [w, col] of [[7, '#141824'], [2.6, '#f4f8ff']]) {
    x.strokeStyle = col; x.lineWidth = w;
    for (const [a, b, cc, d] of segs) { x.beginPath(); x.moveTo(a, b); x.lineTo(cc, d); x.stroke(); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/** Janela de noite que cobre a original. update(t, {flashes:[t], crackAt, silhouette:{from, x}}) */
export function createWindowFx({w = 1.38, h = 0.88} = {}) {
  const group = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
    uniforms: {time: {value: 0}, flash: {value: 0}, silOn: {value: 0}, silX: {value: 0.6}, aspect: {value: w / h}},
    vertexShader: VERT_UV,
    fragmentShader: GLSL + `uniform float time, flash, silOn, silX, aspect; varying vec2 vUv;
      void main(){
        vec3 c = mix(vec3(.16,.21,.36), vec3(.07,.09,.17), vUv.y);
        float hill = .2 + .05 * sin(vUv.x * 9.) + .03 * sin(vUv.x * 23.);
        float tree = step(fract(vUv.x * 11.) , .5) * .1 * (1. - abs(fract(vUv.x * 11.) - .25) * 4.);
        bool ground = vUv.y < hill + max(tree, 0.);
        if (ground) c = vec3(.03,.04,.08);
        float col = floor(vUv.x * 70.);
        float rain = step(.55, h21(vec2(col, 3.))) * step(fract(vUv.y * 2.5 + time * 3.2 + h21(vec2(col, 7.))), .1);
        c = mix(c, vec3(.55,.62,.78), rain * .5);
        c = mix(c, vec3(.86,.91,1.), flash * (ground ? .25 : 1.));
        // silhueta lá fora (cabeça + ombros), preta chapada com olhos brancos; recortada pela janela
        vec2 q = vec2((vUv.x - silX) * aspect, vUv.y);
        float headD = length(q - vec2(0., .62)) - .1;
        float body = length((q - vec2(0., .12)) / vec2(.24, .42)) - 1.;
        if (silOn > .5 && (headD < 0. || body < 0.)) {
          c = vec3(.008,.01,.02);
          float eye = min(length(q - vec2(-.035, .64)), length(q - vec2(.035, .64)));
          if (eye < .014) c = vec3(.95,.96,1.);
        }
        gl_FragColor = srgb(c, 1.);
      }`,
  }));
  sky.position.z = 0.03;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
    uniforms: {time: {value: 0}, crack: {value: 0}, crackTex: {value: crackTexture()}},
    vertexShader: VERT_UV, transparent: true, depthWrite: false,
    fragmentShader: GLSL + `uniform float time, crack; uniform sampler2D crackTex; varying vec2 vUv;
      void main(){
        vec2 p = vUv * vec2(26., 12.);
        vec2 cell = floor(p); vec2 f = fract(p);
        float on = step(h21(cell + 11.), .3);
        float y = fract(time * (.15 + h21(cell) * .3) + h21(cell + 3.));
        float drop = on * step(length(vec2((f.x - .5) * 2.2, (f.y - (1. - y)) * 1.4)), .09);
        float trail = on * step(abs(f.x - .5), .025) * step(1. - y, f.y) * .4;
        vec4 col = vec4(vec3(.8,.88,1.), drop * .7 + trail * .3);
        vec2 cu = vec2(vUv.x, 1. - vUv.y);
        vec4 ck = texture2D(crackTex, cu);
        float reveal = step(length((vUv - vec2(.586, .55)) * vec2(1.57, 1.)), crack * .9);
        col = mix(col, vec4(ck.rgb, 1.), ck.a * reveal);
        if (col.a < .02) discard;
        gl_FragColor = vec4(pow(col.rgb, vec3(2.2)), col.a);
      }`,
  }));
  glass.position.z = 0.06;
  // moldura nova com cruz
  const fr = 0xf0ede4;
  const bars = [[w + 0.1, 0.06, 0, h / 2 + 0.03], [w + 0.1, 0.06, 0, -h / 2 - 0.03], [0.06, h, -w / 2 - 0.03, 0], [0.06, h, w / 2 + 0.03, 0],
    [0.04, h, 0, 0], [w, 0.04, 0, 0]].map(([bw, bh, x, y]) => { const b = mesh(G.box(bw, bh, 0.05), fr, {outline: 2.5}); b.position.set(x, y, 0.07); return b; });
  group.add(sky, glass, ...bars);
  const flashLight = new THREE.DirectionalLight(0xc8d8ff, 0);
  flashLight.position.set(-3, 2, 0);
  return {
    group,
    flashLight,
    update(t, {flashes = [], crackAt = Infinity, silhouette = null} = {}) {
      let fl = 0;
      for (const f of flashes) {
        const u = t - f;
        if (u >= 0 && u < 0.6) fl = Math.max(fl, (u < 0.08 ? 1 : u < 0.14 ? 0.3 : u < 0.22 ? 0.9 : Math.max(0, 1 - (u - 0.22) / 0.38)));
      }
      sky.material.uniforms.time.value = t;
      sky.material.uniforms.flash.value = fl;
      glass.material.uniforms.time.value = t;
      glass.material.uniforms.crack.value = Math.min(1, Math.max(0, (t - crackAt) / 0.18));
      flashLight.intensity = fl * 3;
      sky.material.uniforms.silOn.value = silhouette && t >= silhouette.from ? 1 : 0;
      if (silhouette) sky.material.uniforms.silX.value = silhouette.x + Math.sin(t * 0.7) * 0.01;
    },
  };
}

// ---------------------------------------------------------------- ALAGAMENTO
/**
 * bounds {x0, x1, z0, z1}: retângulo do cômodo. update(t, {level, jets:[{p:[x,y,z], dir:[dx,dz], at}], camera})
 */
export function createFlood(bounds) {
  const {x0, x1, z0, z1} = bounds;
  const group = new THREE.Group();
  const hits = Array.from({length: 6}, () => new THREE.Vector3(99, 0, 99));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0, 64, 64).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: {time: {value: 0}, b: {value: new THREE.Vector4(x0, x1, z0, z1)}, hits: {value: hits}},
    transparent: true,
    vertexShader: `uniform float time; varying vec2 vUv; varying vec3 vW;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0);
        w.y += (sin(w.x * 5.5 + time * 2.1) + sin(w.z * 7.1 - time * 1.7) + sin((w.x + w.z) * 3.3 + time * 1.2)) * .012;
        vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL + `uniform float time; uniform vec4 b; uniform vec3 hits[6]; varying vec2 vUv; varying vec3 vW;
      void main(){
        vec3 c = vec3(.18,.50,.53);
        float n = fbm(vW.xz * 2.2 + vec2(time * .25, -time * .18));
        if (n > .6) c = vec3(.30,.64,.66);
        if (n < .36) c = vec3(.12,.38,.41);
        float d = min(min(vW.x - b.x, b.y - vW.x), min(vW.z - b.z, b.w - vW.z));
        float foam = step(d, .05 + .05 * vnoise(vW.xz * 14. + time * 1.5));
        for (int i = 0; i < 6; i++) {
          float r = length(vW.xz - hits[i].xz);
          foam = max(foam, step(r, .10 + .07 * vnoise(vW.xz * 18. + time * 3.)));
          foam = max(foam, step(abs(r - .22 - fract(time * 1.3 + float(i) * .37) * .25), .012));
        }
        if (foam > .5) c = vec3(.85,.95,.93);
        gl_FragColor = srgb(c, .93);
      }`,
  }));
  water.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  group.add(water);

  const jetMat = new THREE.ShaderMaterial({
    uniforms: {time: {value: 0}},
    vertexShader: VERT_UV,
    fragmentShader: GLSL + `uniform float time; varying vec2 vUv;
      void main(){
        float s = fract(vUv.x * 7. - time * 6. + vUv.y * .3);
        vec3 c = s < .55 ? vec3(.86,.96,.95) : vec3(.42,.74,.76);
        if (abs(vUv.y - .5) > .47) c = vec3(.10,.22,.26);
        gl_FragColor = srgb(c, 1.);
      }`,
  });
  const jets = [];
  const splash = Array.from({length: 30}, () => {
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), flat(0xe6f6f3));
    group.add(s);
    return s;
  });
  return {
    group,
    update(t, {level = 0, jets: jetDefs = [], camera}) {
      water.visible = level > 0.005;
      water.position.y = level;
      water.material.uniforms.time.value = t;
      jetMat.uniforms.time.value = t;
      while (jets.length < jetDefs.length) { const m = new THREE.Mesh(new THREE.BufferGeometry(), jetMat); group.add(m); jets.push(m); }
      splash.forEach((s) => (s.visible = false));
      jetDefs.forEach((j, i) => {
        const m = jets[i];
        const on = t >= j.at;
        m.visible = on;
        hits[i].set(99, 0, 99);
        if (!on) return;
        const grow = Math.min(1, (t - j.at) / 0.25);
        const [px, py, pz] = j.p;
        const reach = (0.45 + Math.max(0, py - level) * 0.9) * grow * (j.power ?? 1);
        const p0 = new THREE.Vector3(px, py, pz);
        const p2 = new THREE.Vector3(px + j.dir[0] * reach, Math.max(level, py - (py - level) * grow), pz + j.dir[1] * reach);
        const p1 = p0.clone().lerp(p2, 0.4); p1.y = py + 0.08 + 0.1 * grow;
        m.geometry.dispose();
        m.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, p1, p2), 20, j.r ?? 0.022, 6, false);
        hits[i].copy(p2);
        for (let k = 0; k < 5; k++) {
          const s = splash[i * 5 + k];
          if (!s) break;
          const u = (t * 2.2 + hash(i * 9 + k)) % 1;
          const a = hash(i * 5 + k) * Math.PI * 2;
          s.visible = grow > 0.5;
          s.position.set(p2.x + Math.cos(a) * 0.08 * (1 + u), level + 0.03 + Math.sin(u * Math.PI) * 0.18, p2.z + Math.sin(a) * 0.08 * (1 + u));
          s.scale.setScalar(1.2 - u);
          if (camera) s.lookAt(camera.position);
        }
      });
    },
  };
}

// ---------------------------------------------------------------- SUBMERSO
/** Liga com enable(true): névoa, fundo, cáusticas, bolhas. floaters: objetos que boiam/giram. */
export function createUnderwater(scene, {x0, x1, z0, z1, floorY = 0, ceilY = 2.7, color = 0x2a7178, density = 0.22}) {
  const group = new THREE.Group();
  const caustic = (y, flip) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(flip ? Math.PI / 2 : -Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: {time: {value: 0}},
      vertexShader: VERT_WORLD, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      fragmentShader: GLSL + `uniform float time; varying vec2 vUv; varying vec3 vW;
        void main(){
          vec2 p = vW.xz * 2.4; vec2 i = floor(p), f = fract(p); float d = 9.;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 g = vec2(float(x), float(y)); vec2 o = vec2(h21(i + g), h21(i + g + 7.));
            o = .5 + .38 * sin(time * .7 + 6.28 * o);
            d = min(d, length(g + o - f));
          }
          if (d > .3) discard;
          gl_FragColor = srgb(vec3(.65,.95,.92), .28);
        }`,
    }));
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    group.add(m);
    return m;
  };
  const cs = [caustic(floorY + 0.012, false), caustic(ceilY - 0.012, true)];
  const bubbles = Array.from({length: 36}, (_, i) => {
    const b = mesh(G.sphere(0.018 + hash(i + 4) * 0.025, 12, 10), 0xd8f3ee, {outline: 1.2});
    group.add(b);
    return b;
  });
  const fog = new THREE.FogExp2(color, density);
  const bg = new THREE.Color(color);
  const floaters = [];
  let saved = null;
  return {
    group,
    addFloater(obj, seed) { floaters.push({obj, seed, base: obj.position.clone(), rot: obj.rotation.clone()}); group.add(obj); },
    enable(on) {
      if (on && !saved) { saved = {fog: scene.fog, bg: scene.background}; scene.fog = fog; }
      if (!on && saved) { scene.fog = saved.fog; scene.background = saved.bg; saved = null; }
      group.visible = on;
    },
    update(t) {
      if (saved) scene.background = bg;
      cs.forEach((c) => (c.material.uniforms.time.value = t));
      bubbles.forEach((b, i) => {
        const u = (t * (0.18 + hash(i) * 0.2) + hash(i + 30)) % 1;
        b.position.set(x0 + 0.3 + hash(i + 2) * (x1 - x0 - 0.6) + Math.sin(t * 2.5 + i) * 0.04,
          floorY + u * (ceilY - floorY), z0 + 0.3 + hash(i + 3) * (z1 - z0 - 0.6));
      });
      for (const f of floaters) {
        const s = f.seed;
        f.obj.position.set(f.base.x + Math.sin(t * 0.35 + s) * 0.25, f.base.y + Math.sin(t * 0.5 + s * 2) * 0.12, f.base.z + Math.cos(t * 0.3 + s) * 0.2);
        f.obj.rotation.set(f.rot.x + t * 0.25 * (hash(s) - 0.5) * 2, f.rot.y + t * 0.2, f.rot.z + Math.sin(t * 0.4 + s) * 0.5);
      }
    },
  };
}
