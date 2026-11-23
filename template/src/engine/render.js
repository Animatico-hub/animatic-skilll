// Renderizador: cena -> render target (MSAA) -> passe de lente barril leve -> canvas.
// Também os presets de iluminação.
import * as THREE from 'three';
import {RESOLUTION} from './toon.js';

/**
 * opts: barrel (lente), shadows (sombras PCF suaves: a luz precisa de castShadow e os objetos de castShadow/receiveShadow),
 * bloom (0 = desligado; ~0.6–1.2 = brilho em volta do que passa do threshold: telas, TV, LED, relâmpago),
 * threshold (luminância a partir da qual brilha), vignette (0..1, escurece as bordas — quarto escuro).
 * Bloom: bright-pass em 1/4 da resolução + 2 rodadas de blur gaussiano separável; somado antes da lente.
 */
export function createRenderer(canvas, width, height, {barrel = 0.22, shadows = false, bloom = 0, threshold = 0.75, vignette = 0} = {}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  RESOLUTION.set(width, height);
  const rt = new THREE.WebGLRenderTarget(width, height, {samples: 4, type: THREE.HalfFloatType});
  const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)); return s; };

  // bloom
  const bw = Math.max(1, Math.round(width / 4)), bh = Math.max(1, Math.round(height / 4));
  const rtA = bloom ? new THREE.WebGLRenderTarget(bw, bh, {type: THREE.HalfFloatType}) : null;
  const rtB = bloom ? new THREE.WebGLRenderTarget(bw, bh, {type: THREE.HalfFloatType}) : null;
  const bright = bloom && quad(new THREE.ShaderMaterial({
    uniforms: {tDiffuse: {value: rt.texture}, threshold: {value: threshold}},
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float threshold; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.2126,.7152,.0722));
        gl_FragColor = vec4(c * smoothstep(threshold, threshold + .25, l), 1.); }`,
  }));
  const blurMat = bloom && new THREE.ShaderMaterial({
    uniforms: {tDiffuse: {value: null}, dir: {value: new THREE.Vector2()}},
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
      void main(){ vec3 s = texture2D(tDiffuse, vUv).rgb * .227;
        s += (texture2D(tDiffuse, vUv + dir * 1.385).rgb + texture2D(tDiffuse, vUv - dir * 1.385).rgb) * .316;
        s += (texture2D(tDiffuse, vUv + dir * 3.231).rgb + texture2D(tDiffuse, vUv - dir * 3.231).rgb) * .070;
        gl_FragColor = vec4(s, 1.); }`,
  });
  const blur = bloom && quad(blurMat);

  const post = quad(new THREE.ShaderMaterial({
    uniforms: {tDiffuse: {value: rt.texture}, tBloom: {value: rtA?.texture ?? null}, bloom: {value: bloom}, vig: {value: vignette},
      k: {value: barrel}, aspect: {value: width / height}},
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform sampler2D tBloom; uniform float bloom, vig, k, aspect; varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        vec2 q = vec2(p.x * aspect, p.y);
        float r2 = dot(q, q) / (aspect * aspect + 1.0);
        vec2 uv = p * (1.0 + k * r2) / (1.0 + k) * 0.5 + 0.5;
        vec3 c = texture2D(tDiffuse, uv).rgb;
        if (bloom > 0.0) c += texture2D(tBloom, uv).rgb * bloom;
        c *= 1.0 - vig * smoothstep(0.35, 1.25, length(p * vec2(0.9, 0.75)));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }));

  return {
    renderer,
    render(scene, camera) {
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      if (bloom) {
        renderer.setRenderTarget(rtA); renderer.render(bright, postCam);
        for (const r of [1, 2]) {
          blurMat.uniforms.tDiffuse.value = rtA.texture; blurMat.uniforms.dir.value.set(r / bw, 0);
          renderer.setRenderTarget(rtB); renderer.render(blur, postCam);
          blurMat.uniforms.tDiffuse.value = rtB.texture; blurMat.uniforms.dir.value.set(0, r / bh);
          renderer.setRenderTarget(rtA); renderer.render(blur, postCam);
        }
      }
      renderer.setRenderTarget(null);
      renderer.render(post, postCam);
    },
    dispose() { rt.dispose(); rtA?.dispose(); rtB?.dispose(); renderer.dispose(); },
  };
}

// ---- Iluminação ----
const PRESETS = {
  normal:   {hemiSky: 0xfffaf0, hemiGround: 0x9aa0b0, hemi: 1.9, key: 0xfff1dc, keyI: 1.5, bg: 0x20232c},
  tension:  {hemiSky: 0x7f8fc8, hemiGround: 0x2c3150, hemi: 1.25, key: 0x9fb2ff, keyI: 1.0, bg: 0x0b0d16},
  darkness: {hemiSky: 0x4a5690, hemiGround: 0x141828, hemi: 0.55, key: 0x8fa2ff, keyI: 0.6, bg: 0x05060b},
};

export function createLights(scene) {
  const hemi = new THREE.HemisphereLight();
  const key = new THREE.DirectionalLight();
  key.position.set(-1.5, 3, 2.5);
  scene.add(hemi, key);
  const a = new THREE.Color(), b = new THREE.Color();
  const mix = (ca, cb, k, out) => out.copy(a.set(ca)).lerp(b.set(cb), k);
  /** set('normal', 'tension', 0..1) */
  return {
    set(from, to = from, k = 0) {
      const A = PRESETS[from], B = PRESETS[to];
      mix(A.hemiSky, B.hemiSky, k, hemi.color);
      mix(A.hemiGround, B.hemiGround, k, hemi.groundColor);
      hemi.intensity = THREE.MathUtils.lerp(A.hemi, B.hemi, k);
      mix(A.key, B.key, k, key.color);
      key.intensity = THREE.MathUtils.lerp(A.keyI, B.keyI, k);
      scene.background = mix(A.bg, B.bg, k, scene.background?.isColor ? scene.background : new THREE.Color());
    },
  };
}
