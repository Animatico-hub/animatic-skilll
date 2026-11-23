import * as THREE from 'three';
import { createEnvironment, buildRoom, mountOnWall, mountDoor, worldBox, concreteTexture, TILE } from './EnvironmentKit.js';
import { createBunkBed } from '../objects/BunkBed.js';
import { createWallClock } from '../objects/Fixtures.js';
import { createKeyRing } from '../objects/Props.js';
import {
  createHouseDoor, createWindow, createSofa, createTVUnit, createCoffeeTable, createSideTable, createLamp,
  createLightSwitch, createCeilingBulb, createPhone, createFamilyPhoto, createWardrobe, createRug,
} from '../objects/HouseObjects.js';
import { mat, canvasTexture, texturedMat } from '../../lib/materials.js';

/**
 * "A Casa": one-storey house at night (metres, +Y up).
 *   sala      x -3.0..1.5,  z -4.0..0.0   front door (n wall, x = -0.4) + window (n wall, x = -2.0)
 *   corredor  x  1.7..6.7,  z -2.2..-1.0  opens from the sala (archway), back door at its end (e wall)
 *   quarto 1  x  1.7..4.2,  z -5.0..-2.4  (the girl's), door from the corridor at x = 3.0
 *   quarto 2  x  4.4..6.7,  z -5.0..-2.4  (the owner's), door at x = 5.5
 *   varanda   outside the front door, z 0.2..2.4, porch light; street light far away
 * Interactives: doors {front, back, quarto1, quarto2}, lights {lamp, tableLamp, sala, corredor, porch, tv},
 * clock, phone, keys, photo. Lights are set for "night"; the episode switches them.
 */
const H = 2.6;
const WALL = 0.2;

function plankTexture() {
  return canvasTexture('planks', 512, 512, (ctx, w, h) => {
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const y = (r * h) / rows;
      const shift = (r % 2) * 0.5 + (r % 3) * 0.17;
      for (let k = -1; k < 3; k++) {
        const x = ((k + shift) * w) / 2;
        const v = 0.86 + ((r * 7 + k * 3) % 5) * 0.035;
        ctx.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(108 * v)},${Math.round(74 * v)})`;
        ctx.fillRect(x, y, w / 2, h / rows);
        ctx.fillStyle = 'rgba(40,25,15,0.55)';
        ctx.fillRect(x, y, 3, h / rows);
      }
      ctx.fillStyle = 'rgba(40,25,15,0.6)';
      ctx.fillRect(0, y, w, 3);
    }
  }, { repeat: true });
}

export function createHouse() {
  const env = createEnvironment('Casa');
  const g = env.group;
  env.atmosphere = { background: 0x05070b, fog: null, exposure: 1 };
  const wood = texturedMat(plankTexture(), 0xffffff, { roughness: 0.75 });
  const ceiling = mat(0xe6e1d6, { roughness: 0.95 });
  const plaster = (c) => mat(c, { roughness: 0.92 });
  const room = (x, z, color, doors) => buildRoom(g, { x, z, height: H, wall: WALL, dado: 0, stripe: null, high: plaster(color), floor: wood, floorTile: [1.6, 1.6], ceilingMaterial: ceiling, doors });

  // ---------------- rooms ----------------
  const sala = room([-3.0, 1.5], [-4.0, 0.0], 0xd8cfbf, [
    { side: 'n', at: -0.4, width: 1.0, height: 2.17 }, // front door
    { side: 'n', at: -2.0, width: 1.1, height: 2.05 }, // window (sill added below)
    { side: 'e', at: -1.6, width: 1.2, height: 2.3 }, // archway to the corridor
  ]);
  g.add(worldBox([-2.55, -1.45], [0, 0.95], [0, WALL], plaster(0xd8cfbf), TILE.block)); // window sill wall
  const corredor = room([1.7, 6.7], [-2.2, -1.0], 0xd3cbbb, [
    { side: 'w', at: -1.6, width: 1.2, height: 2.3 },
    { side: 's', at: 3.0, width: 1.0, height: 2.17 },
    { side: 's', at: 5.5, width: 1.0, height: 2.17 },
    { side: 'e', at: -1.6, width: 1.0, height: 2.17 }, // back door
  ]);
  const quarto1 = room([1.7, 4.2], [-5.0, -2.4], 0xdcc6c4, [{ side: 'n', at: 3.0, width: 1.0, height: 2.17 }]);
  const quarto2 = room([4.4, 6.7], [-5.0, -2.4], 0xc8cdd2, [{ side: 'n', at: 5.5, width: 1.0, height: 2.17 }]);

  // ---------------- doors ----------------
  const doors = {
    front: mountDoor(g, createHouseDoor({ color: 0x6e4a32, peephole: true }), sala, 'n', -0.4),
    back: mountDoor(g, createHouseDoor({ color: 0x8a6a4c, glass: true }), corredor, 'e', -1.6),
    quarto1: mountDoor(g, createHouseDoor({ color: 0xece6da, frame: 0xece6da }), quarto1, 'n', 3.0),
    quarto2: mountDoor(g, createHouseDoor({ color: 0xece6da, frame: 0xece6da }), quarto2, 'n', 5.5),
  };
  // a closed door with nothing behind it (bathroom), on the corridor's north wall
  const bath = createHouseDoor({ color: 0xece6da, frame: 0xece6da });
  mountOnWall(g, bath.group, corredor, 'n', 4.2, 0);
  bath.group.position.z -= 0.03;
  doors.front.setOpen(0);

  // ---------------- sala ----------------
  const tv = createTVUnit();
  // the living set sits left of the front door, so the way door -> room -> corridor stays free
  mountOnWall(g, tv.group, sala, 's', -1.1, 0);
  const sofa = createSofa();
  sofa.position.set(-1.1, 0, -1.25);
  sofa.rotation.y = Math.PI; // faces the TV
  const table = createCoffeeTable();
  table.group.position.set(-1.1, 0, -2.45);
  const rug = createRug({ w: 2.2, d: 1.5 });
  rug.position.set(-1.1, 0, -2.3);
  g.add(sofa, table.group, rug);
  const lamp = createLamp({ height: 1.5, intensity: 3.2, distance: 7.5, castShadow: true });
  lamp.group.position.set(1.15, 0, -3.6); // corner by the TV: lights the room without blocking the POV
  g.add(lamp.group);
  const entry = createSideTable();
  entry.group.position.set(0.75, 0, -0.32);
  g.add(entry.group);
  const tableLamp = createLamp({ height: 0.42, intensity: 1.1, distance: 3.5 });
  tableLamp.group.position.set(0.88, entry.top, -0.3);
  const photo = createFamilyPhoto();
  photo.position.set(0.62, entry.top, -0.28);
  photo.rotation.y = Math.PI + 0.25; // faces into the room
  const keys = createKeyRing({ seed: 11 });
  keys.position.set(0.72, entry.top + 0.005, -0.42);
  keys.rotation.set(Math.PI / 2, 0, 0.6); // lying on the table
  g.add(tableLamp.group, photo, keys);
  const phone = createPhone();
  phone.group.position.set(-0.95, table.top + 0.005, -2.4);
  phone.group.rotation.set(-Math.PI / 2, 0, 0.4); // face up on the coffee table
  g.add(phone.group);
  mountOnWall(g, createWindow(), sala, 'n', -2.0, 1.5);
  const clock = createWallClock();
  mountOnWall(g, clock.group, sala, 'w', -2.0, 1.95);
  mountOnWall(g, createLightSwitch(), sala, 'n', 0.25, 1.2);
  mountOnWall(g, createLightSwitch(), sala, 'e', -0.85, 1.2);
  const salaBulb = createCeilingBulb();
  salaBulb.group.position.set(-0.75, H, -2.0);
  g.add(salaBulb.group);

  // ---------------- corredor ----------------
  const hallBulb = createCeilingBulb({ intensity: 1.6 });
  hallBulb.group.position.set(4.2, H, -1.6);
  g.add(hallBulb.group);
  mountOnWall(g, createLightSwitch(), corredor, 'n', 2.1, 1.2);

  // ---------------- quartos ----------------
  const bed1 = createBunkBed({ single: true, blanket: 0xc77a8a, seed: 9 });
  bed1.group.position.set(2.15, 0, -4.0);
  const bed2 = createBunkBed({ single: true, blanket: 0x5a6a7a, seed: 10, width: 1.2 });
  bed2.group.position.set(5.25, 0, -4.0);
  const w1 = createWardrobe({ color: 0xe4d8c4 });
  w1.position.set(3.6, 0, -4.68);
  const w2 = createWardrobe({ color: 0x8a7258 });
  w2.position.set(6.2, 0, -3.4);
  w2.rotation.y = -Math.PI / 2;
  g.add(bed1.group, bed2.group, w1, w2);
  mountOnWall(g, createWindow({ width: 0.8, height: 0.8, curtain: 0xd9a0ac }), quarto1, 's', 2.8, 1.5);
  mountOnWall(g, createWindow({ width: 0.8, height: 0.8 }), quarto2, 's', 5.6, 1.5);
  mountOnWall(g, createLightSwitch(), quarto1, 'n', 2.35, 1.2);
  mountOnWall(g, createLightSwitch(), quarto2, 'n', 4.85, 1.2);

  // ---------------- outside: porch, street, sky ----------------
  const ground = mat(0x141a12, { roughness: 1 });
  g.add(worldBox([-3.4, 1.9], [-0.1, 0.0], [WALL, 2.4], texturedMat(concreteTexture(), 0x6a6862, { roughness: 0.9 }), TILE.floor, { cast: false }));
  g.add(worldBox([-30, 30], [-0.14, -0.04], [2.4, 30], ground, TILE.floor, { cast: false }));
  g.add(worldBox([6.9, 20], [-0.14, -0.04], [-12, 2.4], ground, TILE.floor, { cast: false }));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), new THREE.MeshBasicMaterial({ color: 0x0a1424 }));
  sky.position.set(0, 10, 25);
  sky.rotation.y = Math.PI;
  g.add(sky);
  const porch = createCeilingBulb({ color: 0xffc27a, intensity: 2.2, distance: 6 });
  porch.group.position.set(-0.4, 2.45, 0.55);
  porch.group.scale.setScalar(0.6);
  g.add(porch.group);
  // outdoor wall light above the front window: whoever stands at the window is readable from inside
  const windowLight = new THREE.PointLight(0xffd2a0, 1.3, 3.2, 2);
  windowLight.position.set(-2.0, 2.35, 0.45);
  const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.08), new THREE.MeshStandardMaterial({ color: 0xfff1d8, emissive: 0xffd2a0, emissiveIntensity: 1.5 }));
  sconce.position.set(-2.0, 2.35, WALL + 0.04);
  g.add(windowLight, sconce);
  // cold street light: it reaches the porch and enters through the front window (contrast with the warm lamps)
  const street = new THREE.SpotLight(0xbcd0ff, 6, 25, 0.6, 0.7, 1.2);
  street.position.set(-6, 5, 9);
  street.target.position.set(-1.5, 0, 0.5);
  g.add(street, street.target);
  const moon = new THREE.SpotLight(0x9fb6e0, 6, 9, 0.5, 0.8, 1.4); // through the front window onto the sala floor
  moon.position.set(-2.6, 2.6, 2.2);
  moon.target.position.set(-1.5, 0, -2.2);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.bias = -0.0008;
  g.add(moon, moon.target);
  const streetLamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdfe8ff }));
  streetLamp.position.copy(street.position);
  g.add(streetLamp, worldBox([-6.05, -5.95], [0, 5], [8.95, 9.05], mat(0x2a2a2a), TILE.block));

  // ---------------- night base light ----------------
  g.add(new THREE.HemisphereLight(0x3e5070, 0x14110e, 0.16));
  const tvLight = new THREE.PointLight(0x7da2d6, 0, 4, 2);
  tvLight.position.set(-1.1, 1.0, -3.5);
  g.add(tvLight);
  // warm bounce fill inside (no shadows, slow falloff): faces and walls readable without killing the night mood
  const fills = [
    [0xffc58f, 1.1, 6.5, [-0.7, 1.5, -2.0]], // sala
    [0xffcf9e, 0.55, 4.5, [4.2, 1.5, -1.6]], // corredor
    [0xd9c2b0, 0.18, 3.0, [2.95, 1.4, -3.7]], // quarto 1 (door ajar light)
    [0xc9c6c8, 0.18, 3.0, [5.55, 1.4, -3.7]], // quarto 2
  ].map(([c, i, d, p]) => {
    const l = new THREE.PointLight(c, i, d, 1);
    l.position.set(...p);
    l.userData.base = i;
    g.add(l);
    return l;
  });
  const lights = {
    lamp, tableLamp, sala: salaBulb, corredor: hallBulb, porch,
    tv: { setOn(l) { tv.setOn(l * 0.8); tvLight.intensity = 0.8 * l; } },
    // fill(level): scales the bounce light (0 = blackout scene)
    fill: { setOn(l) { for (const f of fills) f.intensity = f.userData.base * l; } },
  };
  // default night: floor lamp on, hall dim, porch on, TV off, ceiling light off
  lamp.setOn(1);
  tableLamp.setOn(1);
  hallBulb.setOn(0.6);
  porch.setOn(1);
  salaBulb.setOn(0);
  lights.tv.setOn(0);

  env.interactives = { doors, lights, clock, phone, keys, photo, rooms: { sala, corredor, quarto1, quarto2 } };

  // ---------------- basic collision: floor areas you can stand on, minus furniture footprints ----------------
  const areas = [
    ...[sala, corredor, quarto1, quarto2].map((r) => [r.x0, r.x1, r.z0, r.z1]),
    // openings overlap the shrunk room areas on both sides (narrow areas are not shrunk)
    [-0.85, 0.05, -0.45, 0.45], // front doorway
    [1.2, 2.05, -2.15, -1.05], // archway sala -> corredor
    [2.55, 3.45, -2.65, -1.95], [5.05, 5.95, -2.65, -1.95], // bedroom doorways
    [6.45, 7.1, -2.05, -1.15], // back doorway
    [-3.3, 1.8, 0.2, 2.3], // porch (outside)
  ];
  const blockers = [
    [-2.1, -0.1, -1.7, -0.8], // sofa
    [-1.65, -0.55, -2.75, -2.15], // coffee table
    [-1.8, -0.4, -4.0, -3.55], // TV unit
    [0.47, 1.03, -0.53, -0.1], // entry table
    [1.05, 1.25, -3.7, -3.5], // floor lamp
    [1.7, 2.6, -5.0, -3.0], [4.6, 5.9, -5.0, -3.0], // beds
    [3.1, 4.1, -5.0, -4.4], [5.9, 6.7, -3.9, -2.9], // wardrobes
  ];
  const inside = (x, z, [a, b, c, d], m = 0) => x > a - m && x < b + m && z > c - m && z < d + m;
  /** true when a body of radius r can stand at (x, z) without entering a wall or a piece of furniture */
  env.isWalkable = (x, z, r = 0.2) => areas.some((A) => inside(x, z, [A[0] + r, A[1] - r, A[2] + r, A[3] - r]) || (inside(x, z, A) && A[1] - A[0] < 1.3 && A[3] - A[2] < 1.3)) && !blockers.some((B) => inside(x, z, B, r));
  /** checks a walk path [[x,z],...] every 5 cm; returns the first blocked point or null */
  env.checkPath = (pts, r = 0.2) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.05));
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n;
        const z = z0 + ((z1 - z0) * k) / n;
        if (!env.isWalkable(x, z, r)) return [+x.toFixed(2), +z.toFixed(2)];
      }
    }
    return null;
  };
  env.updaters.push(() => {});

  // ---------------- anchors (feet, facing) and POV camera points (eye ~1.62) ----------------
  env.characterAnchor('owner_door', [0.15, 0, -0.8], Math.PI); // inside, next to the front door (outside its swing), facing the room
  env.characterAnchor('woman_porch', [-0.4, 0, 1.15], Math.PI); // outside, facing the door
  env.characterAnchor('woman_window', [-2.0, 0, 0.75], Math.PI);
  env.characterAnchor('girl_hall', [5.6, 0, -1.6], -Math.PI / 2); // at the end of the corridor, facing the sala
  env.characterAnchor('protagonist_sofa', [-1.1, 0, -1.6], Math.PI);
  env.cameraPoint('pov_sala', [1.15, 1.62, -3.55], [-1.3, 1.0, -0.6], 70);
  env.cameraPoint('pov_corredor', [0.9, 1.62, -1.6], [6.7, 1.15, -1.6], 70);
  env.cameraPoint('pov_entrada', [-0.55, 1.62, -3.6], [-0.75, 1.25, 0.0], 70);
  env.cameraPoint('pov_sofa', [-1.1, 1.15, -1.45], [-1.1, 0.9, -3.9], 70);
  return env;
}
