import { keys, smooth, easeInOut, easeOut, bump, clamp } from '../../systems/AnimationSystem.js';

/**
 * Procedural clips. pose(P, c) writes offsets into Pose P (weight 1); the system blends them.
 * c = { t (local s), time (absolute s), u (0..1 progress), dur, params, ch (character), phase, speed }
 * layer 'base' replaces idle (weights normalised); 'additive' stacks on top.
 */

const SIDES = [
  [1, 'L'],
  [-1, 'R'],
];
const TAU = Math.PI * 2;

// ---------- idle ----------
function idle(P, c) {
  const id = c.ch.def.idle;
  const T = c.time + (c.ch.def.seed % 17) * 1.37;
  const br = Math.sin(T * TAU * id.breath);
  P.rot('spine', br * 0.006).rot('chest', -br * 0.012).rot('neck', br * 0.007);
  for (const [s, S] of SIDES) {
    P.lift[S] += br * 0.0025;
    P.rot('shoulder' + S, 0, 0, s * br * 0.01).rot('elbow' + S, -br * 0.012);
  }
  const sway = (Math.sin(T * 0.42) * 0.7 + Math.sin(T * 0.17 + 2) * 0.3) * id.sway;
  P.rot('hips', 0, 0, sway * 0.012).rot('spine', 0, 0, -sway * 0.016);
  for (const [, S] of SIDES) P.rot('thigh' + S, 0, 0, -sway * 0.012).rot('ankle' + S, 0, 0, sway * 0.012);
  const look = id.look;
  P.rot('head', Math.sin(T * 0.53 + 0.5) * 0.015 * look, (Math.sin(T * 0.31) * 0.6 + Math.sin(T * 0.77 + 1) * 0.4) * 0.07 * look, Math.sin(T * 0.29 + 1.3) * 0.012 * look);
}

// ---------- locomotion (phase comes from distance travelled: no foot sliding) ----------
function gait(P, c, g) {
  const φ = c.phase;
  for (const [s, S] of SIDES) {
    const ph = s > 0 ? φ : φ + Math.PI;
    const θ = g.thigh * Math.sin(ph); // forward swing of this leg
    const swing = Math.max(0, Math.cos(ph)); // leg travelling forward
    const knee = g.kneeStance + g.kneeSwing * swing ** 1.4;
    P.rot('thigh' + S, -θ - g.lean * 0.5, 0, 0);
    P.rot('knee' + S, knee);
    P.rot('ankle' + S, θ - knee * 0.65 - g.toe * swing + g.lean * 0.5);
    // opposite arm swing, elbow bends more as the arm comes forward
    P.rot('shoulder' + S, g.arm * Math.sin(ph), 0, s * 0.03);
    P.rot('elbow' + S, -(g.elbow + g.elbowSwing * Math.max(0, -Math.sin(ph))));
    P.curl[S] += g.fist;
  }
  const sL = Math.sin(φ);
  P.hips[1] += -g.bob * Math.abs(Math.sin(φ)) + g.bob * 0.4;
  P.rot('hips', 0, g.twist * sL, g.tilt * Math.cos(φ));
  P.rot('spine', g.lean, 0, 0);
  P.rot('chest', g.lean * 0.4, -g.twist * 1.3 * sL, -g.tilt * Math.cos(φ) * 0.6);
  // head stabilises against the body (secondary motion)
  P.rot('head', -g.lean * 1.2 + g.bob * 2 * Math.abs(Math.sin(φ)), g.twist * 0.4 * sL, 0);
}

const WALK = { thigh: 0.42, kneeStance: 0.1, kneeSwing: 0.85, toe: 0.12, arm: 0.34, elbow: 0.12, elbowSwing: 0.28, bob: 0.024, twist: 0.07, tilt: 0.03, lean: 0.04, fist: 0.15 };
const RUN = { thigh: 0.72, kneeStance: 0.35, kneeSwing: 1.55, toe: 0.25, arm: 0.65, elbow: 1.25, elbowSwing: 0.2, bob: 0.05, twist: 0.12, tilt: 0.04, lean: 0.2, fist: 0.75 };

// ---------- sit / stand ----------
function seated(P, c, q, lean) {
  const d = c.ch.dims;
  const drop = d.ankleH + d.shinLen + d.thighDrop - d.hipY; // hips height when thighs are horizontal
  const fold = 1.5 * q;
  const br = Math.sin(c.time * TAU * c.ch.def.idle.breath) * q;
  P.rot('chest', -br * 0.014).rot('neck', br * 0.008);
  P.hips[1] += drop * q - 0.03 * lean;
  P.hips[2] += -0.36 * q - 0.04 * lean;
  P.rot('spine', 0.05 * q + lean).rot('chest', 0.03 * q).rot('head', -0.04 * q - lean * 0.55);
  for (const [s, S] of SIDES) {
    P.rot('thigh' + S, -fold, 0, s * 0.07 * q);
    P.rot('knee' + S, fold);
    P.rot('ankle' + S, 0, 0, -s * 0.07 * q);
    P.rot('shoulder' + S, -0.32 * q - 0.25 * lean, 0, -s * 0.05 * q);
    P.rot('elbow' + S, -0.85 * q);
    P.curl[S] += 0.25 * q;
  }
}

export const CLIPS = {
  idle: { layer: 'base', pose: idle },

  walk: { layer: 'base', stride: 1.3, pose: (P, c) => gait(P, c, WALK) },

  run: { layer: 'base', stride: 2.3, pose: (P, c) => gait(P, c, RUN) },

  /** Body part of an in-place turn (root rotation comes from the root track). params.delta */
  turn: {
    layer: 'additive',
    duration: 0.9,
    pose(P, c) {
      const d = c.params.delta ?? 0;
      const u = c.u;
      const lead = easeInOut(clamp(u * 1.7)) - easeInOut(u); // head turns first
      P.rot('head', 0, d * lead * 0.55, 0).rot('neck', 0, d * lead * 0.25, 0).rot('chest', 0, d * lead * 0.15, 0);
      P.gaze[0] += Math.sign(d) * bump(u * 1.4) * 0.6;
      const first = d > 0 ? 'L' : 'R';
      const second = d > 0 ? 'R' : 'L';
      for (const [S, b] of [[first, bump((u - 0.1) / 0.4)], [second, bump((u - 0.45) / 0.4)]]) {
        P.rot('thigh' + S, -0.32 * b).rot('knee' + S, 0.65 * b).rot('ankle' + S, -0.33 * b);
      }
      P.hips[1] -= 0.012 * bump(u);
    },
  },

  /** Look left, hold, look right, hold, back. params.amount (default 1) */
  lookAround: {
    layer: 'additive',
    duration: 3.8,
    fadeIn: 0.2,
    fadeOut: 0.3,
    pose(P, c) {
      const a = c.params.amount ?? 1;
      const ks = [[0, 0], [0.5, 0.6], [1.5, 0.55], [2.3, -0.6], [3.2, -0.55], [3.8, 0]];
      const yaw = keys(c.t, ks) * a;
      const pitch = keys(c.t, [[0, 0], [0.5, -0.06], [1.5, 0.02], [2.3, -0.04], [3.8, 0]]) * a;
      P.rot('head', pitch, yaw * 0.6, -yaw * 0.06).rot('neck', 0, yaw * 0.25, 0).rot('chest', 0, yaw * 0.15, 0);
      P.gaze[0] += keys(c.t + 0.15, ks) * a * 1.1; // eyes lead the head
    },
  },

  /** Point with one arm. params.side 'R'|'L', params.yaw (radians, body turns toward it) */
  point: {
    layer: 'additive',
    arms: (p) => [p.side ?? 'R'],
    duration: 2.6,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const S = c.params.side ?? 'R';
      const s = S === 'L' ? 1 : -1;
      const D = c.dur;
      const a = keys(c.t, [[0, 0], [0.18, -0.12], [0.55, 1.08], [0.78, 1], [D - 0.55, 1], [D, 0]]);
      const raise = Math.max(0, a);
      const yaw = (c.params.yaw ?? 0) * raise;
      P.rot('shoulder' + S, -1.42 * a + (c.params.pitch ?? 0) * raise, 0, s * 0.06 * raise);
      P.rot('elbow' + S, 0.14 * raise).rot('wrist' + S, -0.12 * raise, 0, 0);
      P.curl[S] += 0.95 * raise;
      P.point[S] += raise;
      P.rot('spine', 0, yaw * 0.35, 0).rot('chest', 0, -s * 0.12 * raise + yaw * 0.4, 0);
      P.rot('head', 0.04 * raise, s * 0.12 * raise + yaw * 0.25, 0);
      P.gaze[0] += (s * 0.3 + yaw) * raise;
    },
  },

  /** Sit down (holds seated). params.standAt (local s) rises again. Root = point in front of the seat. */
  sit: {
    layer: 'base',
    duration: Infinity,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const down = c.t / 1.1;
      let q = easeInOut((down - 0.15) / 0.85);
      let lean = 0.32 * bump(down);
      const up = c.params.standAt;
      if (up !== undefined && c.t > up) {
        const v = (c.t - up) / 1.2;
        q *= 1 - easeInOut((v - 0.2) / 0.8);
        lean = 0.5 * bump(v);
      }
      seated(P, c, q, lean);
    },
  },

  /** Rise from a seated start (use when a scene begins with the character sitting). */
  stand: {
    layer: 'base',
    duration: 1.4,
    fadeIn: 0,
    fadeOut: 0.2,
    pose(P, c) {
      const v = c.t / 1.2;
      seated(P, c, 1 - easeInOut((v - 0.2) / 0.8), 0.5 * bump(v));
    },
  },

  /** Conversational body motion: nods, tilts, alternating hand gestures. params.intensity */
  talk: {
    layer: 'additive',
    duration: 4,
    fadeIn: 0.3,
    fadeOut: 0.4,
    pose(P, c) {
      const k = c.params.intensity ?? 1;
      const t = c.t;
      const sd = c.ch.def.seed;
      P.rot('head', 0.045 * Math.sin(t * 4.7 + sd) * k, 0.05 * Math.sin(t * 1.6 + sd) * k, 0.035 * Math.sin(t * 2.2 + 1) * k);
      P.rot('chest', 0.018 * Math.sin(t * 2.6) * k, 0.03 * Math.sin(t * 1.3 + 2) * k, 0);
      const segLen = 1.6;
      const seg = Math.floor(t / segLen);
      const f = (t % segLen) / segLen;
      const g = bump(f) ** 1.5 * k;
      const which = (seg + sd) % 3;
      for (const [s, S] of SIDES) {
        const on = which === 2 ? 0.5 : (which === 0) === (S === 'R') ? 1 : 0.15;
        const a = g * on;
        P.rot('shoulder' + S, -0.32 * a, 0, s * 0.12 * a).rot('elbow' + S, -0.85 * a).rot('wrist' + S, -0.2 * a, s * 0.9 * a, 0);
        P.curl[S] += -0.15 * a;
      }
    },
  },

  /** Surprise reaction: fast recoil with overshoot, then settles. */
  react: {
    layer: 'additive',
    duration: 1.7,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const r = keys(c.t, [[0, 0], [0.1, 1.12], [0.24, 0.95], [0.75, 0.6], [1.7, 0]]);
      P.rot('spine', -0.1 * r).rot('chest', -0.12 * r).rot('neck', -0.06 * r).rot('head', -0.12 * r);
      for (const [s, S] of SIDES) {
        P.lift[S] += 0.022 * r;
        P.rot('shoulder' + S, -0.45 * r, 0, s * 0.22 * r).rot('elbow' + S, -1.0 * r).rot('wrist' + S, -0.3 * r);
        P.curl[S] += -0.4 * r;
        P.rot('thigh' + S, -0.05 * r).rot('knee' + S, 0.1 * r).rot('ankle' + S, -0.05 * r);
      }
      P.hips[1] -= 0.015 * r;
      P.hips[2] -= 0.03 * r;
      P.gaze[1] += 0.2 * r;
    },
  },

  /** Cowering fear with trembling (held while the track lasts). */
  fear: {
    layer: 'base',
    duration: 4,
    fadeIn: 0.4,
    fadeOut: 0.6,
    pose(P, c) {
      const tr = (Math.sin(c.time * 41) * 0.6 + Math.sin(c.time * 29 + 1) * 0.4) * (c.params.tremble ?? 1);
      const look = Math.sin(c.time * 0.9) * 0.12;
      P.rot('spine', 0.2).rot('chest', 0.15 + tr * 0.008).rot('neck', 0.08);
      P.rot('head', 0.14 + tr * 0.01, -0.3 + look, 0.06);
      P.hips[1] -= 0.05;
      P.hips[2] -= 0.04;
      for (const [s, S] of SIDES) {
        P.lift[S] += 0.024;
        P.rot('shoulder' + S, -0.72 + tr * 0.01, 0, -s * 0.06).rot('elbow' + S, -1.75).rot('wrist' + S, 0.2, s * 0.3, 0);
        P.curl[S] += 0.7;
        P.rot('thigh' + S, -0.26).rot('knee' + S, 0.5).rot('ankle' + S, -0.24);
      }
      P.gaze[0] += -0.4 + look;
    },
  },
};

// ---------- arm gestures made for the first-person camera (hands enter the frame) ----------

/** Standard in-hold-out curve with a little anticipation and overshoot. */
const gesture = (t, D, rise = 0.5) => keys(t, [[0, 0], [0.12, -0.06], [rise, 1.06], [rise + 0.2, 1], [D - 0.45, 1], [D, 0]]);

function arms(P, sides, a, { sx, sz = 0, el, wx = 0, wy = 0, curl = 0, lift = 0 }) {
  for (const [s, S] of SIDES) {
    if (!sides.includes(S)) continue;
    P.rot('shoulder' + S, sx * a, 0, s * sz * a).rot('elbow' + S, el * a).rot('wrist' + S, wx * a, s * wy * a, 0);
    P.curl[S] += curl * a;
    P.lift[S] += lift * a;
  }
}

Object.assign(CLIPS, {
  /** Raise both hands in front of the face, palms up (handcuffs, blood, a note...). */
  // POV note: a 9:16 frame is narrow (about +-22 deg horizontally), so these gestures bring the
  // hands toward the body's midline instead of straight forward from the shoulders.
  lookHands: {
    layer: 'additive',
    arms: () => ['L', 'R'],
    duration: 2.4,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const a = gesture(c.t, c.dur, 0.55);
      arms(P, ['L', 'R'], a, { sx: -0.9, sz: -0.42, el: -1.25, wx: -0.2, wy: 1.3, curl: -0.1 });
      P.rot('head', 0.35 * Math.max(0, a));
    },
  },
  /** Reach forward to grab something (bars, a door, a hand). params.side 'R'|'L'|'both', params.height (rad) */
  reach: {
    layer: 'additive',
    arms: (p) => (p.side === 'both' ? ['L', 'R'] : [p.side ?? 'R']),
    duration: 2.2,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const a = gesture(c.t, c.dur, 0.5);
      const side = c.params.side ?? 'R';
      const sides = side === 'both' ? ['L', 'R'] : [side];
      const grip = keys(c.t, [[0, -0.2], [0.45, -0.25], [0.7, 0.75], [c.dur - 0.4, 0.75], [c.dur, 0]]);
      arms(P, sides, Math.max(0, a), { sx: -1.25 + (c.params.height ?? 0), sz: side === 'both' ? -0.22 : -0.3, el: 0.05, wx: 0.1 });
      for (const S of sides) P.curl[S] += grip;
      P.rot('chest', 0.05 * a);
    },
  },
  /** Carry a tray in front of the waist (cafeteria line). Hold as long as the track lasts. */
  holdTray: {
    layer: 'additive',
    arms: () => ['L', 'R'],
    duration: 6,
    fadeIn: 0.45,
    fadeOut: 0.45,
    pose(P) {
      arms(P, ['L', 'R'], 1, { sx: -0.55, sz: -0.3, el: -1.15, wx: 0.1, wy: 1.45, curl: 0.35 });
    },
  },
  /** Hands up, palms forward (surrender / "calma"). */
  raiseHands: {
    layer: 'additive',
    arms: () => ['L', 'R'],
    duration: 2.6,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const a = gesture(c.t, c.dur, 0.35);
      arms(P, ['L', 'R'], a, { sx: -0.55, sz: 0.55, el: -1.9, wx: 0.2, wy: -0.4, curl: -0.3, lift: 0.015 });
      P.rot('spine', -0.04 * a);
    },
  },
});

// ---------- object interactions (third-person characters: keys, locks, sliding doors) ----------

const lerpKeys = (t, ks) => {
  // ks: [[time, {sx, sz, el, wx, wy, curl}], ...] -> interpolated pose object (smooth between keys)
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, a] = ks[i - 1];
      const [t1, b] = ks[i];
      const u = smooth(clamp((t - t0) / (t1 - t0)));
      const o = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = (a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * u;
      return o;
    }
  }
  return ks[ks.length - 1][1];
};

function armPose(P, S, o, w = 1) {
  const s = S === 'L' ? 1 : -1;
  P.rot('shoulder' + S, (o.sx ?? 0) * w, (o.sy ?? 0) * s * w, s * (o.sz ?? 0) * w)
    .rot('elbow' + S, (o.el ?? 0) * w)
    .rot('wrist' + S, (o.wx ?? 0) * w, s * (o.wy ?? 0) * w, (o.wz ?? 0) * w);
  P.curl[S] += (o.curl ?? 0) * w;
}

const REST = { sx: 0, sz: 0, el: 0, wx: 0, wy: 0, curl: 0 };

Object.assign(CLIPS, {
  /** Take the key ring from the right hip and hold it in front of the chest. Hold while the track lasts. */
  takeKeys: {
    layer: 'additive',
    arms: () => ['R'],
    duration: 4,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const D = c.dur;
      const o = lerpKeys(c.t, [
        [0, REST],
        [0.35, { sx: 0.18, sz: 0.12, el: -0.55, wx: 0.1, curl: 0.2 }],
        [0.45, { sx: 0.18, sz: 0.12, el: -0.55, wx: 0.1, curl: 0.85 }],
        [0.95, { sx: -0.5, sz: -0.28, el: -1.4, wx: 0.25, wy: 0.6, curl: 0.85 }],
        [D - 0.5, { sx: -0.46, sz: -0.24, el: -1.32, wx: 0.25, wy: 0.6, curl: 0.85 }],
        [D, { sx: 0, sz: 0.02, el: -0.25, curl: 0.85 }],
      ]);
      armPose(P, 'R', o);
      P.rot('head', 0.12 * bump(c.t / 1.0), 0, 0); // glance down at the belt
    },
  },

  /** Put a key in a lock in front of the body and turn it (params.turnAt, local s). Right hand. */
  unlock: {
    layer: 'additive',
    arms: () => ['R'],
    duration: 1.6,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const D = c.dur;
      const ta = c.params.turnAt ?? 0.6;
      const reach = { sx: -0.95 + (c.params.height ?? 0), sz: c.params.sz ?? -0.3, el: -0.45, wx: 0.15, wy: 0.3, curl: 0.85 };
      const o = lerpKeys(c.t, [
        [0, { sx: -0.46, sz: -0.24, el: -1.32, wx: 0.25, wy: 0.6, curl: 0.85 }],
        [Math.min(0.45, ta - 0.1), reach],
        [D - 0.35, reach],
        [D, { sx: -0.1, sz: 0.0, el: -0.35, curl: 0.85 }],
      ]);
      armPose(P, 'R', o);
      const turn = bump((c.t - ta + 0.08) / 0.5);
      P.rot('wristR', 0, -1.1 * turn, 0);
      P.rot('chest', 0.06 * Math.min(1, c.t / 0.4), 0.08, 0).rot('head', 0.22, 0.1, 0);
    },
  },

  /** Grab a sliding door with one hand and sweep it sideways (params.side, params.dir +1 outward / -1 inward). */
  shove: {
    layer: 'additive',
    arms: (p) => [p.side ?? 'L'],
    duration: 1.6,
    fadeIn: 0,
    fadeOut: 0,
    pose(P, c) {
      const S = c.params.side ?? 'L';
      const dir = c.params.dir ?? 1;
      const D = c.dur;
      const a = dir > 0 ? 0.05 : 0.95;
      const b = dir > 0 ? 0.95 : 0.0;
      const grab = (k) => ({ sx: -0.95 + 0.3 * k, sz: k, el: -0.35, wx: 0.1, curl: 0.85 });
      const o = lerpKeys(c.t, [
        [0, REST],
        [0.4, grab(a)],
        [0.5, grab(a)],
        [D - 0.45, grab(b)],
        [D, REST],
      ]);
      armPose(P, S, o);
      const sw = (o.sz - a) * (S === 'L' ? 1 : -1);
      P.rot('chest', 0.05, sw * 0.25, 0).rot('spine', 0, sw * 0.12, 0).rot('head', 0.12, sw * 0.2, 0);
    },
  },
});

// ---------- authored performance (keyframed offsets, for dialogue scenes) ----------

/**
 * keyed: params.keys = [[t, { 'head.x': .2, 'shoulderL.z': .3, curlR: .8, gazeX: .4, 'hips.y': -.02, pointL: 1 }], ...]
 * t is local to the track start; values ease between keys (smooth). params.arms = ['L','R'] makes the
 * track own those arms (other clips stop moving them). params.swing = { joint: 'kneeL', amp, freq } adds a
 * slow idle swing (dangling leg, tapping foot).
 */
function applyKeyed(P, o, w = 1) {
  for (const [k, v] of Object.entries(o)) {
    const dot = k.indexOf('.');
    if (dot > 0) {
      const j = k.slice(0, dot);
      const ax = 'xyz'.indexOf(k[dot + 1]);
      if (j === 'hips') P.hips[ax] += v * w;
      else if (P.r[j]) P.r[j][ax] += v * w;
    } else if (k === 'curlL' || k === 'curlR') P.curl[k[4]] += v * w;
    else if (k === 'pointL' || k === 'pointR') P.point[k[5]] += v * w;
    else if (k === 'liftL' || k === 'liftR') P.lift[k[4]] += v * w;
    else if (k === 'gazeX') P.gaze[0] += v * w;
    else if (k === 'gazeY') P.gaze[1] += v * w;
  }
}

CLIPS.keyed = {
  layer: 'additive',
  arms: (p) => p.arms ?? [],
  duration: Infinity,
  fadeIn: 0,
  fadeOut: 0,
  pose(P, c) {
    applyKeyed(P, lerpKeys(c.t, c.params.keys));
    for (const s of c.params.swing ?? []) {
      const j = s.joint;
      const v = Math.sin(c.time * Math.PI * 2 * s.freq + (s.phase ?? 0)) * s.amp;
      if (P.r[j]) P.r[j][0] += v;
    }
  },
};

export const CLIP_NAMES = Object.keys(CLIPS);
export { smooth, easeOut };
