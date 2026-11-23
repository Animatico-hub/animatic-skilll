import * as THREE from 'three';
import { clamp, easeInOut, lerp } from '../../systems/AnimationSystem.js';

const _dummy = new THREE.PerspectiveCamera();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

/** Pose looking from position to target. */
export function lookPose(position, target, fov, roll = 0) {
  _dummy.position.copy(position);
  _dummy.up.copy(UP);
  _dummy.lookAt(target);
  if (roll) _dummy.rotateZ(roll);
  return { position: position.clone(), quaternion: _dummy.quaternion.clone(), fov };
}

const v3 = (p) => (p instanceof THREE.Vector3 ? p.clone() : new THREE.Vector3(...p));
const eyeOf = (ch) => ch.face.eyeAnchor.getWorldPosition(new THREE.Vector3());
const forwardOf = (ch) => new THREE.Vector3(Math.sin(ch.root.rotation.y), 0, Math.cos(ch.root.rotation.y));

/** Small slow rotation noise so locked-off shots still feel filmed. */
function handheld(pose, t, amount) {
  if (!amount) return pose;
  _e.set((Math.sin(t * 0.8) * 0.6 + Math.sin(t * 2.1) * 0.4) * 0.006 * amount, (Math.sin(t * 0.6 + 1) * 0.6 + Math.sin(t * 1.7) * 0.4) * 0.008 * amount, Math.sin(t * 0.5) * 0.004 * amount);
  pose.quaternion.multiply(_q.setFromEuler(_e));
  return pose;
}

/**
 * Shot evaluators: (t, shot) -> { position, quaternion, fov }. All pure in time
 * (characters must already be updated for t).
 */
export const SHOTS = {
  pov: (t, s) => s.camera.poseAt(t),

  static: (t, s) => handheld(lookPose(v3(s.position), v3(s.target), s.fov ?? 55), t, s.handheld ?? 1),

  /** Move between two framings over `duration` seconds from the shot start. */
  dolly(t, s) {
    const u = easeInOut((t - s.start) / (s.duration ?? 3));
    const p = v3(s.from[0]).lerp(v3(s.to[0]), u);
    const tg = v3(s.from[1]).lerp(v3(s.to[1]), u);
    return handheld(lookPose(p, tg, lerp(s.fov ?? 55, s.toFov ?? s.fov ?? 55, u)), t, s.handheld ?? 0.6);
  },

  /** Third person behind a character; the camera lags its root path by `lag` seconds. */
  follow(t, s) {
    const ctl = s.controller;
    const ch = ctl.c;
    const lagged = ctl.rootAt(t - (s.lag ?? 0.35));
    const h = lagged.heading;
    const fwd = _a.set(Math.sin(h), 0, Math.cos(h));
    const right = _b.set(-Math.cos(h), 0, Math.sin(h));
    const dist = s.distance ?? 2.3;
    const pos = new THREE.Vector3(lagged.x, s.height ?? 1.85, lagged.z).addScaledVector(fwd, -dist).addScaledVector(right, s.side ?? 0.45);
    const now = forwardOf(ch);
    const target = new THREE.Vector3(ch.root.position.x, s.targetHeight ?? 1.35, ch.root.position.z).addScaledVector(now, s.ahead ?? 1.4);
    return handheld(lookPose(pos, target, s.fov ?? 60), t, s.handheld ?? 0.8);
  },

  /** Over the shoulder of `from`, framing `to`'s face (dialogue). side > 0 = from's right shoulder. */
  overShoulder(t, s) {
    const a = eyeOf(s.from);
    const b = eyeOf(s.to);
    const dir = b.clone().sub(a).setY(0).normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const pos = a.clone().addScaledVector(dir, -(s.back ?? 0.75)).addScaledVector(right, s.side ?? 0.38).add(new THREE.Vector3(0, s.up ?? 0.08, 0));
    const target = b.clone().add(new THREE.Vector3(0, -0.06, 0)).addScaledVector(right, s.offset ?? 0.12);
    return handheld(lookPose(pos, target, s.fov ?? 48), t, s.handheld ?? 0.8);
  },

  /** Face close-up from the character's front, `angle` radians off-axis. */
  closeUp(t, s) {
    const ch = s.character;
    const e = eyeOf(ch);
    const h = ch.root.rotation.y + (s.angle ?? 0.35);
    const pos = e.clone().add(new THREE.Vector3(Math.sin(h), 0, Math.cos(h)).multiplyScalar(s.distance ?? 0.95)).add(new THREE.Vector3(0, s.up ?? -0.02, 0));
    return handheld(lookPose(pos, e.clone().add(new THREE.Vector3(0, -0.05, 0)), s.fov ?? 42), t, s.handheld ?? 1);
  },

  orbit(t, s) {
    const c = v3(s.center);
    const a = (s.angle ?? 0) + (t - s.start) * (s.speed ?? 0.25);
    const pos = c.clone().add(new THREE.Vector3(Math.sin(a) * (s.radius ?? 3), s.height ?? 1.6, Math.cos(a) * (s.radius ?? 3)));
    return lookPose(pos, c, s.fov ?? 55);
  },
};

/**
 * Shot timeline with cuts or blends, global shakes, and POV head hiding.
 *   director.shot({ start: 0, type: 'pov', camera: pov })
 *   director.shot({ start: 8, type: 'overShoulder', from: guard, to: hero, blend: 0 })
 *   director.shot({ start: 11, type: 'follow', controller: heroCtl, blend: 0.8 })
 */
export class CameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.shots = [];
    this.shakes = [];
    this.override = null; // force a shot object (demo buttons)
  }

  shot(s) {
    if (!SHOTS[s.type]) throw new Error('Unknown shot ' + s.type);
    this.shots.push({ blend: 0, ...s });
    this.shots.sort((a, b) => a.start - b.start);
    return this;
  }

  shake({ start = 0, intensity = 1, duration = 0.8 } = {}) {
    this.shakes.push({ start, intensity, duration });
    return this;
  }

  /** Index of the active shot at t. */
  activeIndex(t) {
    let idx = 0;
    for (let i = 0; i < this.shots.length; i++) if (this.shots[i].start <= t) idx = i;
    return idx;
  }

  evaluate(t) {
    const list = this.override ? [{ ...this.override, start: -Infinity, blend: 0 }] : this.shots;
    let i = 0;
    for (let k = 0; k < list.length; k++) if (list[k].start <= t) i = k;
    const cur = list[i];
    // POV owns the protagonist's head visibility
    for (const s of list) if (s.type === 'pov') s.camera.setHeadHidden(false);
    const blendU = cur.blend > 0 && i > 0 ? clamp((t - cur.start) / cur.blend) : 1;
    const povShot = cur.type === 'pov' ? cur : blendU < 0.5 && list[i - 1]?.type === 'pov' ? list[i - 1] : null;
    if (povShot) {
      povShot.camera.setHeadHidden(true);
      povShot.camera.alignBody(t);
    }
    let pose = SHOTS[cur.type](t, cur);
    if (blendU < 1) {
      const prev = SHOTS[list[i - 1].type](t, list[i - 1]);
      const w = easeInOut(blendU);
      pose = {
        position: prev.position.clone().lerp(pose.position, w),
        quaternion: prev.quaternion.clone().slerp(pose.quaternion, w),
        fov: lerp(prev.fov, pose.fov, w),
      };
    }
    // global shakes
    for (const s of this.shakes) {
      const u = (t - s.start) / s.duration;
      if (u < 0 || u > 1) continue;
      const a = s.intensity * (1 - u) ** 2;
      _e.set(a * 0.035 * Math.sin(t * 43 + 1), a * 0.03 * Math.sin(t * 37), a * 0.025 * Math.sin(t * 31 + 2));
      pose.quaternion.multiply(_q.setFromEuler(_e));
      pose.position.add(new THREE.Vector3(Math.sin(t * 53) * 0.02 * a, Math.sin(t * 47) * 0.02 * a, 0));
    }
    return { pose, shot: cur };
  }

  update(t) {
    const { pose, shot } = this.evaluate(t);
    const cam = this.camera;
    cam.position.copy(pose.position);
    cam.quaternion.copy(pose.quaternion);
    if (Math.abs(cam.fov - pose.fov) > 1e-4) {
      cam.fov = pose.fov;
      cam.updateProjectionMatrix();
    }
    return shot;
  }
}
