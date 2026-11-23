import * as THREE from 'three';
import { clamp, easeInOut } from '../../systems/AnimationSystem.js';

const _t = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _up = new THREE.Vector3(0, 1, 0);

/**
 * Free first-person rig for shots where the body cannot carry the camera (lying in bed, peeking over an edge).
 * Pure in time, same API flavour as FirstPersonCamera:
 *   rig.key({ start, duration, pos: [x,y,z] })       eye position keys (eased, applied in order)
 *   rig.look({ start, duration, at: [x,y,z] | fn })  look-target keys
 *   rig.shake({ start, intensity, duration }), rig.fov({ start, fov, duration })
 * Breathing adds a slow rise/fall of the eye; handheld adds tiny drift.
 */
export class RigCamera {
  /** up: the direction of the top of the head (lying on the back: toward the head of the bed, not the sky). */
  constructor({ pos, at, fov = 70, breath = 1, handheld = 1, up = [0, 1, 0] }) {
    this.pos0 = new THREE.Vector3(...pos);
    this.at0 = new THREE.Vector3(...at);
    this.up0 = new THREE.Vector3(...up).normalize();
    this.baseFov = fov;
    this.breath = breath;
    this.handheld = handheld;
    this.keys = [];
    this.looks = [];
    this.shakes = [];
    this.fovs = [];
  }

  key({ start = 0, duration = 1, pos, up = null }) {
    this.keys.push({ start, duration, pos: new THREE.Vector3(...pos), up: up ? new THREE.Vector3(...up).normalize() : null });
    this.keys.sort((a, b) => a.start - b.start);
    return this;
  }

  look({ start = 0, duration = 0.8, at }) {
    this.looks.push({ start, duration, at });
    this.looks.sort((a, b) => a.start - b.start);
    return this;
  }

  shake({ start = 0, intensity = 1, duration = 0.6 }) {
    this.shakes.push({ start, intensity, duration });
    return this;
  }

  fov({ start = 0, fov = 60, duration = 0.8 }) {
    this.fovs.push({ start, fov, duration });
    this.fovs.sort((a, b) => a.start - b.start);
    return this;
  }

  poseAt(t) {
    const p = this.pos0.clone();
    const up = this.up0.clone();
    for (const k of this.keys) {
      if (t < k.start) break;
      const w = easeInOut((t - k.start) / Math.max(0.001, k.duration));
      p.lerp(k.pos, w);
      if (k.up) up.lerp(k.up, w).normalize();
    }
    const a = this.at0.clone();
    for (const k of this.looks) {
      if (t < k.start) break;
      const target = typeof k.at === 'function' ? k.at(t) : _t.set(...k.at);
      a.lerp(target, easeInOut((t - k.start) / Math.max(0.001, k.duration)));
    }
    // breathing: the chest lifts the head a few millimetres
    const br = Math.sin(t * Math.PI * 2 * 0.24) * 0.006 * this.breath;
    p.y += br;
    a.y += br * 0.5;
    const h = this.handheld;
    a.x += (Math.sin(t * 0.7) * 0.6 + Math.sin(t * 1.9 + 1) * 0.4) * 0.006 * h;
    a.y += (Math.sin(t * 0.9 + 2) * 0.6 + Math.sin(t * 2.3) * 0.4) * 0.005 * h;
    let roll = 0;
    for (const s of this.shakes) {
      const u = (t - s.start) / s.duration;
      if (u < 0 || u > 1) continue;
      const k = s.intensity * (1 - u) ** 2;
      a.x += k * 0.03 * Math.sin(t * 37 + s.start);
      a.y += k * 0.035 * Math.sin(t * 43 + 1);
      p.y += k * 0.01 * Math.sin(t * 47);
      roll += k * 0.02 * Math.sin(t * 31 + 2);
    }
    let fov = this.baseFov;
    for (const f of this.fovs) {
      if (t < f.start) break;
      fov += (f.fov - fov) * easeInOut((t - f.start) / f.duration);
    }
    _m.lookAt(p, a, up.lengthSq() > 1e-6 ? up : _up);
    const q = new THREE.Quaternion().setFromRotationMatrix(_m);
    if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
    return { position: p, quaternion: q, fov: clamp(fov, 20, 110) };
  }

  // CameraDirector treats every 'pov' shot alike: nothing to hide or align here
  setHeadHidden() {}

  alignBody() {}

  update(camera, t) {
    const pose = this.poseAt(t);
    camera.position.copy(pose.position);
    camera.quaternion.copy(pose.quaternion);
    if (camera.fov !== pose.fov) {
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
    }
    return pose;
  }
}
