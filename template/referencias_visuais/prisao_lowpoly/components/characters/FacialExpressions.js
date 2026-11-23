import { envelope, lerp, clamp } from '../../systems/AnimationSystem.js';

/**
 * Face state channels (all small, readable values):
 * browTilt (+ = inner ends down / angry, - = inner ends up / worried), browRaise (m), browAsym (m, + raises left)
 * eyeOpen (1 = rest, <1 squint, >1 wide), lowLid (0..1 cheek/lower lid raise), pupil (scale)
 * smile (+ corners up, - down), open (jaw 0..1), width (mouth width scale)
 */
export const EXPRESSIONS = {
  neutral: {},
  angry: { browTilt: 0.42, browRaise: -0.005, browAsym: 0, eyeOpen: 0.78, lowLid: 0.35, pupil: 0.9, smile: -0.55, open: 0.04, width: 1.06 },
  scared: { browTilt: -0.4, browRaise: 0.008, browAsym: 0, eyeOpen: 1.25, lowLid: 0, pupil: 0.75, smile: -0.45, open: 0.32, width: 1.12 },
  surprised: { browTilt: -0.12, browRaise: 0.013, browAsym: 0, eyeOpen: 1.32, lowLid: 0, pupil: 0.85, smile: 0, open: 0.75, width: 0.82 },
  suspicious: { browTilt: 0.18, browRaise: 0, browAsym: 0.009, eyeOpen: 0.58, lowLid: 0.5, pupil: 1, smile: -0.2, open: 0, width: 0.94, gaze: [0.65, -0.05] },
  happy: { browTilt: -0.12, browRaise: 0.004, browAsym: 0, eyeOpen: 0.8, lowLid: 0.45, pupil: 1.05, smile: 0.85, open: 0.18, width: 1.12 },
};
export const EXPRESSION_NAMES = Object.keys(EXPRESSIONS);

/** The character's own neutral face (personality lives in the preset). */
export function baselineFace(def) {
  const f = def.face;
  return {
    browTilt: f.browTilt ?? 0,
    browRaise: f.browRaise ?? 0,
    browAsym: 0,
    eyeOpen: f.eyeOpen ?? 1,
    lowLid: f.lowLid ?? 0,
    pupil: 1,
    smile: 0,
    open: 0,
    width: 1,
    gaze: [...(f.gaze ?? [0, 0])],
  };
}

const CHANNELS = ['browTilt', 'browRaise', 'browAsym', 'eyeOpen', 'lowLid', 'pupil', 'smile', 'open', 'width'];

/**
 * Blends expression tracks in start order over the baseline.
 * track: { name, start, end = Infinity, fadeIn = 0.25, fadeOut = 0.35, intensity = 1 }
 */
export function evaluateFace(base, tracks, t) {
  const s = { ...base, gaze: [...base.gaze] };
  for (const tr of tracks) {
    const w = envelope(t, tr.start, tr.end ?? Infinity, tr.fadeIn ?? 0.25, tr.fadeOut ?? 0.35) * (tr.intensity ?? 1);
    if (w <= 0) continue;
    const e = EXPRESSIONS[tr.name] ?? {};
    for (const k of CHANNELS) s[k] = lerp(s[k], e[k] ?? base[k], w);
    const g = e.gaze ?? base.gaze;
    s.gaze[0] = lerp(s.gaze[0], g[0], w);
    s.gaze[1] = lerp(s.gaze[1], g[1], w);
  }
  return s;
}

/**
 * Writes a face state onto the head rig. blink 0..1 closes the upper lids.
 * mouthOverride (from lip sync) can replace open/width/round.
 */
export function applyFace(character, s, blink = 0, mouthOverride = null) {
  const { eyes, brows, mouth, rest } = character.face;
  const open = s.eyeOpen * (1 - blink);
  for (const e of eyes) {
    e.lid.position.y = 0.01475 - (1 - Math.min(open, 1)) * 0.0135 + Math.max(0, open - 1) * 0.003;
    e.lowLid.position.y = -0.0095 + clamp(s.lowLid) * 0.006;
    e.root.scale.y = 1 + Math.max(0, s.eyeOpen - 1) * 0.9;
    e.pupil.scale.setScalar(s.pupil);
    e.pupil.position.x = clamp(s.gaze[0], -1, 1) * 0.0055;
    e.pupil.position.y = clamp(s.gaze[1], -1, 1) * 0.0022;
  }
  brows.forEach((b, i) => {
    const side = i === 0 ? 1 : -1;
    b.rotation.z = side * s.browTilt;
    b.position.y = rest.browY[i] + s.browRaise + side * s.browAsym * 0.5;
  });
  // lip sync rides on top of the expression: jaw adds to it, width/round scale it
  const m = mouthOverride
    ? {
        open: Math.max(s.open ?? 0, (s.open ?? 0) * 0.4 + (mouthOverride.open ?? 0)),
        width: s.width * (mouthOverride.width ?? 1),
        round: Math.max(s.round ?? 0, mouthOverride.round ?? 0),
      }
    : s;
  const jaw = clamp(m.open ?? 0, 0, 1.2);
  const smile = clamp(s.smile, -1, 1) * (1 - clamp(jaw) * 0.4);
  bendLip(mouth.upper, smile * 0.0068, 0);
  bendLip(mouth.lower, smile * 0.006, jaw * -0.0012);
  mouth.upper.position.y = rest.upperY + jaw * 0.0012 + smile * 0.0006;
  mouth.lower.position.y = rest.lowerY - jaw * 0.0115 + smile * 0.0008;
  mouth.inner.scale.y = 0.05 + jaw * 1.05;
  mouth.inner.position.y = -0.002 - jaw * 0.0045;
  mouth.inner.scale.x = 1 - (m.round ?? 0) * 0.35;
  mouth.teeth.visible = jaw > 0.12;
  mouth.group.scale.x = (m.width ?? s.width) * (1 - (m.round ?? 0) * 0.3);
}

/** Corners up (amount > 0) or down along a parabola; mid sags by `mid`. */
function bendLip(lip, amount, mid) {
  const geo = lip.geometry;
  const base = geo.userData.base;
  const hw = geo.userData.halfW;
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const nx = base[i * 3] / hw;
    p.setY(i, base[i * 3 + 1] + amount * nx * nx + mid * (1 - nx * nx));
  }
  p.needsUpdate = true;
}
