import { Pose, JOINTS, envelope, clamp, hash, pathMotion, turnMotion, angleDelta } from '../../systems/AnimationSystem.js';
import { CLIPS } from './CharacterAnimations.js';
import { baselineFace, evaluateFace, applyFace } from './FacialExpressions.js';

const SIDES = [
  [1, 'L'],
  [-1, 'R'],
];

/**
 * Drives one character from a deterministic timeline (absolute seconds).
 *
 *   ctl.walkTo([[x,z], ...], { start: 1 })      root motion + walk cycle
 *   ctl.play('point', { start: 4, params: { side: 'R' } })
 *   ctl.expression('angry', { start: 3 })
 *   ctl.update(time)                            pure: any frame, any order
 *
 * With no tracks it plays idle (breathing, sway, blinking, saccades).
 */
export class CharacterController {
  constructor(character) {
    this.c = character;
    this.tracks = [];
    this.rootTracks = [];
    this.faceTracks = [];
    this.gazeTracks = [];
    this.mouth = null; // optional fn(time) -> { open, width, round } (lip sync)
    this.home = null;
    this.base = baselineFace(character.def);
    this._pose = new Pose();
    this._tmp = new Pose();
  }

  // ---------- authoring ----------

  clear() {
    this.tracks = [];
    this.rootTracks = [];
    this.faceTracks = [];
    this.gazeTracks = [];
    this.home = null;
    return this;
  }

  /** Play a clip. Returns the track's end time. */
  play(name, { start = 0, duration, fadeIn, fadeOut, params = {}, weight = 1 } = {}) {
    const clip = CLIPS[name];
    if (!clip) throw new Error('Unknown clip ' + name);
    const dur = duration ?? clip.duration ?? 2;
    this.tracks.push({ name, clip, start, end: start + dur, dur, fadeIn: fadeIn ?? clip.fadeIn ?? 0.3, fadeOut: fadeOut ?? clip.fadeOut ?? 0.3, params, weight });
    return start + dur;
  }

  _captureHome() {
    if (!this.home) this.home = { x: this.c.root.position.x, z: this.c.root.position.z, y: this.c.root.position.y, heading: this.c.root.rotation.y };
  }

  /** Walk (or run) along world points [[x,z],...]. Returns arrival time. */
  walkTo(points, { start = 0, speed, run = false } = {}) {
    this._captureHome();
    const from = this.rootAt(start);
    const spd = speed ?? (run ? 3.4 : 1.25);
    const motion = pathMotion([[from.x, from.z], ...points], { start, speed: spd, startHeading: from.heading });
    this.rootTracks.push({ kind: run ? 'run' : 'walk', motion, nominal: spd });
    return motion.end;
  }

  runTo(points, opts = {}) {
    return this.walkTo(points, { ...opts, run: true });
  }

  /** Turn in place to a heading (radians) or toward a world point { at: [x,z] }. Returns end time. */
  turnTo(target, { start = 0, duration = 0.9 } = {}) {
    this._captureHome();
    const from = this.rootAt(start);
    const heading = Array.isArray(target?.at) ? Math.atan2(target.at[0] - from.x, target.at[1] - from.z) : target;
    const motion = turnMotion(from.heading, heading, { start, duration, x: from.x, z: from.z });
    this.rootTracks.push({ kind: 'turn', motion });
    this.play('turn', { start, duration, fadeIn: 0, fadeOut: 0, params: { delta: angleDelta(from.heading, heading) } });
    return start + duration;
  }

  /** Sit down at start; optional standAt (absolute) gets up again. Root = spot in front of the seat. */
  sit({ start = 0, standAt } = {}) {
    return this.play('sit', { start, params: standAt !== undefined ? { standAt: standAt - start } : {} });
  }

  expression(name, { start = 0, duration = Infinity, fadeIn = 0.25, fadeOut = 0.35, intensity = 1 } = {}) {
    this.faceTracks.push({ name, start, end: start + duration, fadeIn, fadeOut, intensity });
    this.faceTracks.sort((a, b) => a.start - b.start);
    return this;
  }

  /** Eye direction override [x, y] in -1..1 (x > 0 = character's left). */
  look(gaze, { start = 0, duration = Infinity, fade = 0.12 } = {}) {
    this.gazeTracks.push({ gaze, start, end: start + duration, fade });
    return this;
  }

  // ---------- evaluation ----------

  /** Root position/heading at time t from the root timeline (home when idle). */
  rootAt(t) {
    const h = this.home ?? { x: this.c.root.position.x, z: this.c.root.position.z, heading: this.c.root.rotation.y };
    let state = { x: h.x, z: h.z, heading: h.heading, speed: 0, dist: 0, kind: null, track: null };
    for (const rt of this.rootTracks) {
      if (t < rt.motion.start) break;
      const s = rt.motion.at(t);
      state = { ...s, kind: t <= rt.motion.end ? rt.kind : null, track: rt };
    }
    return state;
  }

  update(time) {
    const ch = this.c;
    const j = ch.joints;
    const P = this._pose;
    const tmp = this._tmp;
    resetPose(P);

    // root motion
    const root = this.rootTracks.length ? this.rootAt(time) : null;
    if (root) {
      ch.root.position.x = root.x;
      ch.root.position.z = root.z;
      ch.root.rotation.y = root.heading;
    }

    // base layer: locomotion + base clips; idle fills the remaining weight
    const bases = [];
    if (root && (root.kind === 'walk' || root.kind === 'run')) {
      const clip = CLIPS[root.kind];
      const w = clamp(root.speed / (root.track.nominal * 0.55));
      if (w > 0) bases.push({ clip, w, ctx: { phase: (Math.PI * 2 * root.dist) / (clip.stride * ch.def.height), speed: root.speed, params: {} } });
    }
    for (const tr of this.tracks) {
      if (tr.clip.layer !== 'base') continue;
      const w = envelope(time, tr.start, tr.end, tr.fadeIn, tr.fadeOut) * tr.weight;
      if (w > 0) bases.push({ clip: tr.clip, w, tr });
    }
    // arm ownership: gestures like point/reach take their arm away from every other clip
    const own = { L: 0, R: 0 };
    for (const tr of this.tracks) {
      if (!tr.clip.arms || time < tr.start || time > tr.end) continue;
      const w = Math.min(clamp((time - tr.start) / 0.25), clamp((tr.end - time) / 0.25));
      for (const S of tr.clip.arms(tr.params)) own[S] = Math.max(own[S], w);
    }
    const mask = { L: 1 - own.L, R: 1 - own.R };

    let sum = bases.reduce((a, b) => a + b.w, 0);
    const norm = sum > 1 ? 1 / sum : 1;
    const idleW = Math.max(0, 1 - sum);
    if (idleW > 0) this._eval(CLIPS.idle, tmp, time, null, {}, idleW, P, mask);
    for (const b of bases) this._eval(b.clip, tmp, time, b.tr, b.ctx ?? {}, b.w * norm, P, mask);

    // additive layer
    for (const tr of this.tracks) {
      if (tr.clip.layer !== 'additive') continue;
      const w = envelope(time, tr.start, tr.end, tr.fadeIn, tr.fadeOut) * tr.weight;
      if (w > 0) this._eval(tr.clip, tmp, time, tr, {}, w, P, tr.clip.arms ? null : mask);
    }

    // write to the skeleton
    for (const name of JOINTS) {
      const g = j[name];
      const b = ch.basePose[name];
      const r = P.r[name];
      g.rotation.set(b.rot.x + r[0], b.rot.y + r[1], b.rot.z + r[2]);
      g.position.copy(b.pos);
    }
    j.hips.position.x += P.hips[0];
    j.hips.position.y += P.hips[1];
    j.hips.position.z += P.hips[2];
    j.shoulderL.position.y += P.lift.L;
    j.shoulderR.position.y += P.lift.R;
    for (const [s, S] of SIDES) setFingers(ch.hands[S], s, P.curl[S], P.point[S]);

    // face
    const face = evaluateFace(this.base, this.faceTracks, time);
    face.gaze[0] += P.gaze[0];
    face.gaze[1] += P.gaze[1];
    for (const g of this.gazeTracks) {
      const w = envelope(time, g.start, g.end, g.fade, g.fade);
      if (w > 0) {
        face.gaze[0] += (g.gaze[0] - face.gaze[0]) * w;
        face.gaze[1] += (g.gaze[1] - face.gaze[1]) * w;
      }
    }
    const sacc = this._saccade(time);
    face.gaze[0] += sacc[0];
    face.gaze[1] += sacc[1];
    applyFace(ch, face, this._blink(time, face), this.mouth ? this.mouth(time) : null);
  }

  _eval(clip, tmp, time, tr, extra, w, out, mask = null) {
    resetPose(tmp);
    const t = tr ? time - tr.start : time;
    const dur = tr ? tr.dur : Infinity;
    clip.pose(tmp, { t, time, u: Number.isFinite(dur) ? clamp(t / dur) : 0, dur, params: tr ? tr.params : extra.params ?? {}, ch: this.c, phase: extra.phase ?? 0, speed: extra.speed ?? 0 });
    out.add(tmp, w, mask);
  }

  /** Deterministic blinks (a bit more often when the eyes are wide). */
  _blink(time, face) {
    const seed = this.c.def.seed;
    const period = face.eyeOpen > 1.1 ? 2.2 : 3.4;
    const t = time + seed * 0.37;
    const k = Math.floor(t / period);
    const startAt = k * period + hash(seed, k) * (period - 0.4);
    const u = (t - startAt) / 0.16;
    return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0;
  }

  /** Small deterministic eye darts. */
  _saccade(time) {
    const seed = this.c.def.seed;
    const look = this.c.def.idle.look;
    const sp = 2.1;
    const t = time + seed;
    const k = Math.floor(t / sp);
    const val = (n) => [(hash(seed + 7, n) - 0.5) * 0.4 * look, (hash(seed + 11, n) - 0.5) * 0.25 * look];
    const a = val(k - 1);
    const b = val(k);
    const m = clamp((t - k * sp) / 0.07);
    return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
  }
}

function resetPose(P) {
  for (const n of JOINTS) {
    const r = P.r[n];
    r[0] = r[1] = r[2] = 0;
  }
  P.hips[0] = P.hips[1] = P.hips[2] = 0;
  P.lift.L = P.lift.R = 0;
  P.curl.L = P.curl.R = 0;
  P.point.L = P.point.R = 0;
  P.gaze[0] = P.gaze[1] = 0;
}

/** curl: 0 relaxed, 1 fist, < 0 spread. point: 0..1 straightens the index finger. */
function setFingers(hand, s, curl, point) {
  const f = hand.userData.fingers;
  const c = clamp(curl, -0.4, 1.1);
  f.forEach((fg, i) => {
    const ci = i === 0 ? c * (1 - point) - 0.15 * point : c;
    fg.base.rotation.z = -s * (0.18 + 1.2 * ci);
    fg.tip.rotation.z = -s * (0.32 + 1.25 * ci);
  });
  hand.userData.thumb.rotation.set(-0.55 - 0.2 * Math.max(0, c), 0, -s * (0.35 + 0.45 * c));
}
