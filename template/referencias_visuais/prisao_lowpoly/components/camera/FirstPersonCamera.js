import * as THREE from 'three';
import { clamp, easeInOut, angleDelta, envelope } from '../../systems/AnimationSystem.js';
import { CLIPS } from '../characters/CharacterAnimations.js';

const _v = new THREE.Vector3();
const _e = new THREE.Euler(0, 0, 0, 'YXZ');

/** Evaluates a look target to [yaw, pitch] from the eye position. */
function anglesTo(eye, target) {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dz = target.z - eye.z;
  return [Math.atan2(dx, dz), Math.atan2(dy, Math.hypot(dx, dz))];
}

/**
 * First-person (POV) camera riding the protagonist's eyes.
 * Pure in time: call controller.update(t) first, then poseAt(t) / update(t).
 *
 *   pov.look({ start: 2, at: [x, y, z] })              world point (or fn(t) -> Vector3 for moving targets)
 *   pov.look({ start: 4 })                             back to "forward" (body heading)
 *   pov.look({ start: 6, yaw: 0.4, pitch: -0.7 })      relative to the body heading
 *   pov.shake({ start: 9, intensity: 1 })
 *   pov.fov({ start: 5, fov: 60, duration: 0.8 })      dialogue push-in
 */
export class FirstPersonCamera {
  constructor(controller, { fov = 70, bob = 1, handheld = 1, forwardOffset = 0.06 } = {}) {
    this.ctl = controller;
    this.ch = controller.c;
    this.baseFov = fov;
    this.bob = bob;
    this.handheld = handheld;
    this.forwardOffset = forwardOffset;
    this.looks = [{ start: -Infinity, duration: 0, yaw: 0, pitch: -0.06 }];
    this.shakes = [];
    this.fovs = [];
    this._headHidden = false;
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
  }

  look({ start = 0, duration = 0.7, at = null, yaw = 0, pitch = -0.06 } = {}) {
    this.looks.push({ start, duration, at, yaw, pitch });
    this.looks.sort((a, b) => a.start - b.start);
    return this;
  }

  shake({ start = 0, intensity = 1, duration = 0.8 } = {}) {
    this.shakes.push({ start, intensity, duration });
    return this;
  }

  fov({ start = 0, fov = 60, duration = 0.8 } = {}) {
    this.fovs.push({ start, fov, duration });
    this.fovs.sort((a, b) => a.start - b.start);
    return this;
  }

  /** Hide head, face and neck so the camera can sit inside them (body and hands stay visible). */
  setHeadHidden(hidden) {
    if (hidden === this._headHidden) return;
    this._headHidden = hidden;
    const { head, neck } = this.ch.joints;
    head.traverse((o) => {
      if (o.isMesh) o.visible = !hidden;
    });
    for (const o of neck.children) if (o.isMesh) o.visible = !hidden;
  }

  /** Camera pose at time t: { position, quaternion, fov }. */
  poseAt(t) {
    const root = this.ctl.rootAt(t);
    const heading = this.ch.root.rotation.y;
    const eye = this.ch.face.eyeAnchor.getWorldPosition(this._p);

    // look direction: keys blended in order, each one easing in over its duration
    let yaw = heading + this.looks[0].yaw;
    let pitch = this.looks[0].pitch;
    for (let i = 1; i < this.looks.length; i++) {
      const k = this.looks[i];
      if (t < k.start) break;
      let ky;
      let kp;
      if (k.at) {
        const target = typeof k.at === 'function' ? k.at(t) : _v.set(...k.at);
        [ky, kp] = anglesTo(eye, target);
      } else {
        ky = heading + k.yaw;
        kp = k.pitch;
      }
      const w = easeInOut((t - k.start) / Math.max(0.001, k.duration));
      yaw += angleDelta(yaw, ky) * w;
      pitch += (kp - pitch) * w;
    }

    // gait: nod + roll locked to the step cycle (the eye height already bobs with the hips)
    let roll = 0;
    let runW = 0;
    if (root.kind === 'walk' || root.kind === 'run') {
      const clip = CLIPS[root.kind];
      const φ = (Math.PI * 2 * root.dist) / (clip.stride * this.ch.def.height);
      const w = clamp(root.speed / (root.track.nominal * 0.55)) * this.bob;
      const k = root.kind === 'run' ? 2 : 1;
      pitch += Math.sin(2 * φ) * 0.009 * k * w;
      roll += Math.sin(φ) * 0.012 * k * w;
      yaw += Math.sin(φ) * 0.006 * k * w;
      if (root.kind === 'run') runW = w;
    }

    // handheld drift (always on, tiny)
    const h = this.handheld;
    yaw += (Math.sin(t * 0.7) * 0.6 + Math.sin(t * 1.9 + 1) * 0.4) * 0.004 * h;
    pitch += (Math.sin(t * 0.9 + 2) * 0.6 + Math.sin(t * 2.3) * 0.4) * 0.003 * h;

    // shakes
    const pos = this._shakePos || (this._shakePos = new THREE.Vector3());
    pos.set(0, 0, 0);
    for (const s of this.shakes) {
      const u = (t - s.start) / s.duration;
      if (u < 0 || u > 1) continue;
      const a = s.intensity * (1 - u) ** 2;
      yaw += a * 0.03 * Math.sin(t * 37 + s.start);
      pitch += a * 0.035 * Math.sin(t * 43 + 1);
      roll += a * 0.025 * Math.sin(t * 31 + 2);
      pos.set(Math.sin(t * 53) * 0.015 * a, Math.sin(t * 47) * 0.015 * a, 0);
    }

    // fov
    let fov = this.baseFov;
    for (const f of this.fovs) {
      if (t < f.start) break;
      fov += (f.fov - fov) * easeInOut((t - f.start) / f.duration);
    }
    fov += runW * 6;

    _e.set(clamp(pitch, -1.35, 1.35), yaw + Math.PI, roll, 'YXZ');
    const q = this._q.setFromEuler(_e);
    const position = eye.clone().add(pos);
    // push slightly forward so the hidden head never clips the near plane
    position.add(_v.set(0, 0, -this.forwardOffset).applyQuaternion(q));
    this._yaw = yaw;
    this._pitch = pitch;
    return { position, quaternion: q.clone(), fov };
  }

  /**
   * Turns the protagonist's torso/neck a little toward where the camera looks, so arms and
   * hands stay coherent with the view. Call after controller.update(t), before poseAt(t).
   */
  alignBody(t) {
    const heading = this.ch.root.rotation.y;
    const eye = this.ch.face.eyeAnchor.getWorldPosition(new THREE.Vector3());
    let yaw = heading;
    for (let i = 1; i < this.looks.length; i++) {
      const k = this.looks[i];
      if (t < k.start) break;
      const ky = k.at ? anglesTo(eye, typeof k.at === 'function' ? k.at(t) : _v.set(...k.at))[0] : heading + k.yaw;
      yaw += angleDelta(yaw, ky) * easeInOut((t - k.start) / Math.max(0.001, k.duration));
    }
    const off = clamp(angleDelta(heading, yaw), -1.2, 1.2);
    const j = this.ch.joints;
    j.spine.rotation.y += off * 0.15;
    j.chest.rotation.y += off * 0.25;
    j.neck.rotation.y += off * 0.25;
  }

  /** Apply to a THREE camera. */
  update(camera, t) {
    this.setHeadHidden(true);
    this.alignBody(t);
    const p = this.poseAt(t);
    camera.position.copy(p.position);
    camera.quaternion.copy(p.quaternion);
    if (camera.fov !== p.fov) {
      camera.fov = p.fov;
      camera.updateProjectionMatrix();
    }
    return p;
  }
}

export { envelope };
