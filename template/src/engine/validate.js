// Posicionamento por bounding box + validação geométrica da cena (rodar antes de renderizar).
import * as THREE from 'three';

const A = new THREE.Box3(), B = new THREE.Box3(), C = new THREE.Box3();
const v = new THREE.Vector3(), n = new THREE.Vector3();
const TOL = 0.004; // 4 mm

const worldBox = (o, out) => { o.updateWorldMatrix(true, true); return out.setFromObject(o); };

/**
 * Apoia `obj` sobre o topo da superfície usando as dimensões reais (bounding box).
 * x/z opcionais em coordenadas do pai. Registra o apoio para a validação.
 */
export function place(obj, surface, {x, z, name} = {}) {
  if (x !== undefined) obj.position.x = x;
  if (z !== undefined) obj.position.z = z;
  const top = worldBox(surface, B).max.y;
  obj.position.y += top - worldBox(obj, A).min.y;
  obj.userData.support = surface;
  obj.userData.prop = name ?? obj.userData.prop ?? 'objeto';
  return obj;
}

/**
 * Checagens estáticas:
 *  - objeto apoiado encostando na superfície (sem flutuar/enterrar) e dentro dela
 *  - interseção entre objetos apoiados
 *  - painéis com texto voltados para a câmera POV
 */
export function validateStatic(root, eye) {
  const issues = [];
  const props = [];
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (o.userData.support) {
      props.push(o);
      const s = worldBox(o.userData.support, B);
      const b = worldBox(o, A);
      const gap = b.min.y - s.max.y;
      if (Math.abs(gap) > TOL) issues.push(`${o.userData.prop}: ${gap > 0 ? 'flutuando' : 'enterrado'} ${(Math.abs(gap) * 100).toFixed(1)} cm`);
      if (b.min.x < s.min.x - TOL || b.max.x > s.max.x + TOL || b.min.z < s.min.z - TOL || b.max.z > s.max.z + TOL) {
        issues.push(`${o.userData.prop}: para fora da superfície de apoio`);
      }
    }
    if (o.userData.panel) {
      o.getWorldPosition(v);
      n.set(0, 0, 1).transformDirection(o.matrixWorld);
      if (n.dot(v.clone().sub(eye).negate()) <= 0) issues.push(`${o.userData.panel}: texto virado para o lado errado`);
    }
  });
  for (let i = 0; i < props.length; i++) {
    for (let j = i + 1; j < props.length; j++) {
      worldBox(props[i], A).expandByScalar(-TOL);
      if (A.intersectsBox(worldBox(props[j], B).expandByScalar(-TOL))) {
        issues.push(`${props[i].userData.prop} atravessa ${props[j].userData.prop}`);
      }
    }
  }
  return issues;
}

/**
 * Roda scene.validate() uma vez por render (só no frame 0) e escreve UMA linha no log:
 * "[validação] OK" ou "[validação] N problema(s): a | b". `npm run check` e `npm run qa -- --comp X` leem essa linha.
 * Toda composição chama isto logo depois de criar a cena: reportValidation(scene.current, frame).
 */
export function reportValidation(scene, frame) {
  if (frame !== 0) return;
  if (!scene.validate) { console.warn('[validação] AVISO: a cena não tem validate()'); return; }
  const issues = scene.validate();
  console.warn(issues.length ? `[validação] ${issues.length} problema(s): ${issues.join(' | ')}` : '[validação] OK');
}

/**
 * Checagem animada: amostra o tempo e verifica se partes do personagem (ex.: mãos)
 * atravessam objetos estáticos. apply(t) deve posicionar a cena no tempo t.
 */
export function validateMotion(apply, {from = 0, to, step = 0.1, parts, obstacles}) {
  const issues = new Map();
  for (let t = from; t <= to + 1e-6; t += step) {
    apply(t);
    for (const [pname, part] of parts) {
      worldBox(part, A).expandByScalar(-TOL);
      for (const ob of obstacles) {
        if (A.intersectsBox(worldBox(ob, C))) {
          const k = `${pname} atravessa ${ob.userData.prop ?? ob.name}`;
          const depth = Math.min(A.max.y, C.max.y) - Math.max(A.min.y, C.min.y) + TOL;
          const prev = issues.get(k);
          issues.set(k, {t: prev?.t ?? t, depth: Math.max(prev?.depth ?? 0, depth)});
        }
      }
    }
  }
  return [...issues].map(([k, r]) => `${k} (a partir de ${r.t.toFixed(2)}s, até ${(r.depth * 100).toFixed(1)} cm)`);
}
