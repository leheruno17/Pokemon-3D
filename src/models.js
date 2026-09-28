import * as THREE from 'three';
import { createDragapult as buildDragapult } from './dragapult.js';

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.12, flatShading: true, ...extra });
}

function mesh(parent, geometry, surface, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const part = new THREE.Mesh(geometry, surface);
  part.position.set(...position);
  part.scale.set(...scale);
  part.rotation.set(...rotation);
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}

function oval(parent, surface, position, scale, detail = 2) {
  return mesh(parent, new THREE.IcosahedronGeometry(1, detail), surface, position, scale);
}

function segment(parent, surface, start, end, startRadius, endRadius = startRadius, sides = 8) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const part = mesh(parent, new THREE.CylinderGeometry(endRadius, startRadius, from.distanceTo(to), sides), surface);
  part.position.copy(from.clone().add(to).multiplyScalar(0.5));
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
  return part;
}

function plate(parent, surface, points, depth, position = [0, 0, 0]) {
  const shape = new THREE.Shape();
  points.forEach(([horizontal, vertical], index) => index ? shape.lineTo(horizontal, vertical) : shape.moveTo(horizontal, vertical));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 1 });
  return mesh(parent, geometry, surface, position);
}

function curvedBody(parent, surface, points, radii) {
  const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const segments = 56;
  const sides = 10;
  const frames = path.computeFrenetFrames(segments, false);
  const positions = [];
  const indices = [];
  for (let ring = 0; ring <= segments; ring++) {
    const progress = ring / segments;
    const point = path.getPointAt(progress);
    const radiusIndex = progress * (radii.length - 1);
    const lower = Math.floor(radiusIndex);
    const radius = THREE.MathUtils.lerp(radii[lower], radii[Math.min(lower + 1, radii.length - 1)], radiusIndex - lower);
    for (let side = 0; side < sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const offset = frames.normals[ring].clone().multiplyScalar(Math.cos(angle) * radius).addScaledVector(frames.binormals[ring], Math.sin(angle) * radius);
      positions.push(point.x + offset.x, point.y + offset.y, point.z + offset.z);
      if (ring < segments) {
        const current = ring * sides + side;
        const next = ring * sides + (side + 1) % sides;
        indices.push(current, next, current + sides, next, next + sides, current + sides);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(parent, geometry, surface);
}


function buildGarchomp() {
  const group = new THREE.Group();
  const blue = material('#425a8f');
  const darkBlue = material('#263450');
  const red = material('#d86b4e');
  const yellow = material('#ecca72');
  const white = material('#e3e5e3');
  const black = material('#182237');
  oval(group, blue, [0, 2.02, 0], [.66, .9, .43]);
  oval(group, red, [0, 2.14, .36], [.48, .74, .16]);
  plate(group, yellow, [[-.25, 1.77], [.25, 1.77], [.21, 1.44], [0, 1.32], [-.21, 1.44]], .09, [0, 0, .44]);
  segment(group, blue, [0, 2.65, 0], [0, 3.14, .09], .38, .3);
  oval(group, blue, [0, 3.3, .05], [.56, .37, .52]);
  oval(group, blue, [0, 3.19, .49], [.33, .2, .48], 1);
  oval(group, red, [0, 3.02, .44], [.26, .11, .36], 1);
  plate(group, yellow, [[-.17, 3.57], [.17, 3.57], [0, 3.29]], .06, [0, 0, .5]);
  plate(group, darkBlue, [[0, 2.32], [0, 3.08], [.62, 2.72]], .13, [-.07, 0, -.62]).rotation.y = Math.PI / 2;
  curvedBody(group, blue, [[0, 1.58, -.32], [0, 1.19, -.9], [.45, .75, -1.2], [1.3, .65, -1.55], [1.6, .85, -1.7]], [.3, .3, .2, .13, .005]);
  for (const side of [-1, 1]) {
    segment(group, blue, [side * .36, 1.61, 0], [side * .65, .81, .03], .34, .26);
    segment(group, blue, [side * .65, .81, .03], [side * .72, .29, .18], .24, .2);
    oval(group, darkBlue, [side * .75, .22, .38], [.31, .2, .42], 1);
    for (let claw = 0; claw < 3; claw++) segment(group, white, [side * .75 + (claw - 1) * .15, .18, .58], [side * .75 + (claw - 1) * .17, .12, .9], .075, .002, 5);
    segment(group, blue, [side * .43, 2.48, 0], [side * 1.03, 2.1, .02], .28, .2);
    segment(group, blue, [side * 1.03, 2.1, .02], [side * 1.43, 1.65, .32], .23, .13);
    plate(group, blue, [[side * .98, 2.2], [side * 1.62, 2.63], [side * 1.46, 1.8], [side * 1.25, 1.65]], .14, [0, 0, -.08]);
    segment(group, white, [side * 1.43, 1.65, .32], [side * 1.72, 1.38, .52], .12, .006, 5);
    segment(group, blue, [side * .39, 3.47, .01], [side * .83, 3.56, -.04], .2, .23);
    oval(group, blue, [side * .86, 3.57, -.04], [.22, .24, .37], 1);
    plate(group, yellow, [[side * .17, 3.36], [side * .44, 3.42], [side * .39, 3.22], [side * .21, 3.25]], .025, [0, 0, .45]);
    oval(group, black, [side * .3, 3.31, .503], [.026, .072, .018], 1);
    segment(group, white, [side * .19, 3.08, .62], [side * .18, 2.98, .65], .05, 0, 4);
  }
  group.rotation.y = -.18;
  return group;
}

function buildIncineroar() {
  const group = new THREE.Group();
  const red = material('#d64c42');
  const black = material('#292830');
  const grey = material('#7d7d83');
  const white = material('#e5e4d4');
  const yellow = material('#ffbc48', { emissive: '#ff6f17', emissiveIntensity: .65 });
  const green = material('#88d494');
  oval(group, black, [0, 2.27, 0], [.78, .91, .43]);
  for (const side of [-1, 1]) {
    oval(group, grey, [side * .31, 2.68, .3], [.34, .34, .17]);
    oval(group, grey, [side * .22, 2.2, .38], [.22, .3, .1]);
    oval(group, red, [side * .82, 2.7, 0], [.42, .41, .4]);
    segment(group, black, [side * .88, 2.64, 0], [side * 1.2, 2.18, .06], .3, .27);
    segment(group, red, [side * 1.18, 2.18, .06], [side * 1.37, 1.8, .23], .27, .23);
    segment(group, black, [side * 1.35, 1.91, .18], [side * 1.41, 1.72, .26], .25, .24);
    oval(group, red, [side * 1.44, 1.59, .3], [.31, .24, .25], 1);
    for (let finger = 0; finger < 3; finger++) {
      const horizontal = side * 1.44 + (finger - 1) * .17;
      segment(group, red, [horizontal, 1.59, .39], [horizontal, 1.34, .45], .095, .07);
      segment(group, white, [horizontal, 1.36, .45], [horizontal, 1.28, .53], .045, .002, 5);
    }
    segment(group, red, [side * .38, 1.55, 0], [side * .55, .89, .03], .32, .25);
    segment(group, black, [side * .47, 1.2, .01], [side * .55, .99, .04], .29, .26);
    segment(group, black, [side * .55, .91, .03], [side * .69, .34, .2], .22, .19);
    segment(group, red, [side * .59, .73, .08], [side * .65, .47, .16], .225, .205);
    oval(group, red, [side * .7, .2, .32], [.29, .19, .4], 1);
    for (let claw = 0; claw < 3; claw++) segment(group, white, [side * .7 + (claw - 1) * .14, .19, .57], [side * .7 + (claw - 1) * .15, .12, .69], .055, .002, 5);
    plate(group, red, [[side * .12, 3.65], [side * .55, 4.12], [side * .58, 3.48]], .19, [0, 0, -.07]);
    plate(group, black, [[side * .27, 3.68], [side * .5, 3.98], [side * .49, 3.57]], .025, [0, 0, .14]);
    plate(group, red, [[side * .25, 3.37], [side * .78, 3.61], [side * .59, 3.28], [side * .83, 3.16], [side * .39, 3.04]], .14, [0, 0, .05]);
  }
  oval(group, black, [0, 3.45, .03], [.49, .43, .37]);
  plate(group, red, [[-.4, 3.71], [-.12, 3.62], [0, 3.45], [.12, 3.62], [.4, 3.71], [.32, 3.43], [0, 3.31], [-.32, 3.43]], .06, [0, 0, .35]);
  for (const side of [-1, 1]) {
    plate(group, green, [[side * .08, 3.51], [side * .32, 3.57], [side * .27, 3.4], [side * .11, 3.41]], .02, [0, 0, .43]);
    oval(group, black, [side * .18, 3.48, .47], [.02, .07, .01], 1);
    oval(group, grey, [side * .17, 3.25, .34], [.21, .16, .2], 1);
    segment(group, white, [side * .17, 3.2, .48], [side * .15, 3.03, .49], .058, .002, 4);
  }
  oval(group, black, [0, 3.3, .54], [.1, .065, .06], 1);
  mesh(group, new THREE.TorusGeometry(.48, .14, 6, 16), red, [0, 1.58, 0], [1.15, 1, .78], [Math.PI / 2, 0, 0]);
  plate(group, yellow, [[-.52, 1.47], [-.43, 1.85], [-.24, 1.63], [0, 1.89], [.24, 1.63], [.43, 1.85], [.52, 1.47], [.25, 1.52], [0, 1.38], [-.25, 1.52]], .08, [0, 0, .44]);
  oval(group, red, [0, 1.59, .54], [.15, .15, .06], 1);
  curvedBody(group, black, [[0, 1.53, -.3], [.52, 1.37, -.62], [1.05, 1.39, -.63], [1.46, 1.1, -.49], [1.6, .92, -.43]], [.15, .18, .2, .19, .03]);
  oval(group, red, [1.49, 1.06, -.46], [.23, .26, .22], 1);
  group.rotation.y = -.2;
  return group;
}

export function createPokemon(id) {
  return { garchomp: buildGarchomp, dragapult: buildDragapult, incineroar: buildIncineroar }[id]();
}
