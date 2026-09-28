import * as THREE from 'three';

function surface(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: 0, ...options });
}

function part(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.scale.set(...scale);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function ellipsoid(parent, material, position, scale) {
  return part(parent, new THREE.SphereGeometry(1, 24, 16), material, position, scale);
}

function limb(parent, material, start, end, radius, tipRadius) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const object = part(parent, new THREE.CylinderGeometry(tipRadius, radius, from.distanceTo(to), 16), material);
  object.position.copy(from.clone().add(to).multiplyScalar(.5));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
  return object;
}

function silhouette(parent, material, outline, depth, position, bevel = .025) {
  const shape = new THREE.Shape(outline.map(point => new THREE.Vector2(...point)));
  shape.closePath();
  return part(parent, new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 3, steps: 1,
  }), material, position);
}

function wing(parent, pink, edge, side) {
  const upper = [[side * .48, 3.57, .23], [side * 2.12, 3.88, -.34], [side * .9, 3.96, -.57]];
  const thickness = [.1, .012, .07];
  const vertices = [...upper, ...upper.map(([horizontal, vertical, depth], index) => [horizontal, vertical - thickness[index], depth])];
  const faces = [[0, 1, 2], [5, 4, 3], [0, 3, 1], [1, 3, 4], [1, 4, 2], [2, 4, 5], [2, 5, 0], [0, 5, 3]];
  const center = vertices.reduce((sum, vertex) => sum.add(new THREE.Vector3(...vertex)), new THREE.Vector3()).divideScalar(vertices.length);
  const positions = [];
  for (const face of faces) {
    const points = face.map(index => new THREE.Vector3(...vertices[index]));
    const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
    const midpoint = points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(3);
    if (normal.dot(midpoint.sub(center)) < 0) points.reverse();
    points.forEach(point => positions.push(...point.toArray()));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.addGroup(0, 6, 0);
  geometry.addGroup(6, positions.length / 3 - 6, 1);
  geometry.computeVertexNormals();
  return part(parent, geometry, [pink, edge]);
}

function body(parent) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.49, -.03), new THREE.Vector3(0, 2.94, -.01),
    new THREE.Vector3(0, 2.26, 0), new THREE.Vector3(-.14, 1.66, .02),
    new THREE.Vector3(-.73, 1.2, .06), new THREE.Vector3(-1.43, 1.35, .11),
    new THREE.Vector3(-1.79, 1.94, .17), new THREE.Vector3(-1.67, 2.52, .2),
  ]);
  const radii = [.245, .28, .38, .44, .37, .25, .16, .085, .008];
  const rings = 128;
  const sides = 32;
  const frames = curve.computeFrenetFrames(rings, false);
  const positions = [];
  const colors = [];
  const indices = [];
  const dark = new THREE.Color('#245354');
  const teal = new THREE.Color('#3da997');
  const pale = new THREE.Color('#b1e9ce');
  const gold = new THREE.Color('#e4d394');
  for (let ring = 0; ring <= rings; ring++) {
    const progress = ring / rings;
    const center = curve.getPointAt(progress);
    const radiusPosition = progress * (radii.length - 1);
    const radiusIndex = Math.min(Math.floor(radiusPosition), radii.length - 2);
    const blend = THREE.MathUtils.smoothstep(radiusPosition - radiusIndex, 0, 1);
    const radius = THREE.MathUtils.lerp(radii[radiusIndex], radii[radiusIndex + 1], blend);
    for (let side = 0; side < sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const offset = frames.normals[ring].clone().multiplyScalar(Math.cos(angle) * radius)
        .addScaledVector(frames.binormals[ring], Math.sin(angle) * radius);
      offset.z *= .72;
      const vertex = center.clone().add(offset);
      positions.push(...vertex.toArray());
      const color = dark.clone().lerp(teal, THREE.MathUtils.smoothstep(progress, .1, .35));
      const underside = THREE.MathUtils.smoothstep(offset.z / radius, .02, .65);
      color.lerp(pale, Math.max(THREE.MathUtils.smoothstep(progress, .65, 1), underside * .8 * THREE.MathUtils.smoothstep(progress, .25, .55)));
      if (center.y > 2.72 && center.y < 3.22 && progress < .3 && offset.z / radius > .49) color.copy(gold);
      colors.push(...color.toArray());
      if (ring < rings) {
        const current = ring * sides + side;
        const next = ring * sides + (side + 1) % sides;
        indices.push(current, next, current + sides, next, next + sides, current + sides);
      }
    }
  }
  for (const ring of [0, rings]) {
    const centerIndex = positions.length / 3;
    positions.push(...curve.getPointAt(ring / rings).toArray());
    colors.push(...(ring === 0 ? dark : pale).toArray());
    for (let side = 0; side < sides; side++) {
      const current = ring * sides + side;
      const next = ring * sides + (side + 1) % sides;
      indices.push(...(ring === 0 ? [centerIndex, next, current] : [centerIndex, current, next]));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const object = part(parent, geometry, surface('#ffffff', { vertexColors: true }));
  object.name = 'dragapult-body-tail';
}

function dreepy(parent, palette, side) {
  const group = new THREE.Group();
  group.name = side < 0 ? 'dreepy-left' : 'dreepy-right';
  group.position.set(side * 1.03, 3.94, -.17);
  group.rotation.z = -side * .25;
  ellipsoid(group, palette.teal, [0, .035, 0], [.115, .16, .11]);
  silhouette(group, palette.dark, [[-.3, .18], [-.2, .3], [0, .23], [.2, .3], [.3, .18], [.12, .025], [-.12, .025]], .16, [0, 0, .005], .007);
  for (const direction of [-1, 1]) {
    silhouette(group, palette.pink, [[direction * .14, .2], [direction * .32, .37], [direction * .3, .12]], .04, [0, 0, -.045], .006);
    ellipsoid(group, palette.yellow, [direction * .1, .12, .184], [.063, .025, .008]);
    ellipsoid(group, palette.pupil, [direction * .097, .123, .193], [.009, .023, .005]);
  }
  parent.add(group);
}

export function createDragapult() {
  const group = new THREE.Group();
  group.name = 'dragapult-refined';
  const palette = {
    dark: surface('#303e4a'), teal: surface('#47ad9c'), pale: surface('#b7e6d4'),
    pink: surface('#d95780'), edge: surface('#843a58'), pupil: surface('#202b30'),
    yellow: surface('#eee28b', { emissive: '#968641', emissiveIntensity: .08 }),
  };
  body(group);
  const head = silhouette(group, palette.dark, [
    [-.65, .13], [-.54, .59], [-.32, .29], [.32, .29], [.54, .59], [.65, .13], [.49, -.27], [0, -.36], [-.49, -.27],
  ], .59, [0, 3.56, -.25], .04);
  head.name = 'dragapult-head';
  const headPositions = head.geometry.attributes.position;
  for (let index = 0; index < headPositions.count; index++) {
    const depth = THREE.MathUtils.clamp((headPositions.getZ(index) + .04) / .67, 0, 1);
    headPositions.setX(index, headPositions.getX(index) * THREE.MathUtils.lerp(1, .88, depth));
    headPositions.setY(index, headPositions.getY(index) * THREE.MathUtils.lerp(1, .62, depth) - .08 * depth);
  }
  head.geometry.computeVertexNormals();
  for (const side of [-1, 1]) {
    const fin = wing(group, palette.pink, palette.edge, side);
    fin.name = side < 0 ? 'head-wing-left' : 'head-wing-right';
    const socket = ellipsoid(group, palette.dark, [side * 1.03, 3.87, -.15], [.24, .075, .21]);
    socket.rotation.z = side * .15;
    dreepy(group, palette, side);
    const eyeOutline = [[side * .12, -.12], [side * .48, -.035], [side * .45, -.12], [side * .16, -.17]]
      .map(([horizontal, vertical]) => [horizontal * .88, vertical * .62 - .08]);
    const eye = silhouette(group, palette.yellow, eyeOutline, .01, [0, 3.56, .395], 0);
    eye.castShadow = false;
    eye.receiveShadow = false;
    const pupil = ellipsoid(group, palette.pupil, [side * .2112, 3.41, .412], [.012, .024, .007]);
    pupil.castShadow = false;
    pupil.receiveShadow = false;
    limb(group, palette.dark, [side * .22, 2.97, 0], [side * .42, 2.65, .09], .095, .075);
    ellipsoid(group, palette.teal, [side * .43, 2.63, .1], [.087, .105, .095]);
    limb(group, palette.teal, [side * .43, 2.62, .1], [side * .48, 2.4, .23], .075, .052);
    for (let finger = 0; finger < 3; finger++) {
      limb(group, palette.pale, [side * (.43 + finger * .045), 2.4, .23], [side * (.47 + finger * .06), 2.28 - finger * .018, .33], .025, .004);
    }
    const thigh = ellipsoid(group, palette.teal, [side * .34, 2.19, .035], [.2, .26, .23]);
    thigh.rotation.z = side * .35;
    limb(group, palette.teal, [side * .43, 2.07, .12], [side * .5, 1.94, .25], .09, .055);
    for (let toe = 0; toe < 3; toe++) {
      limb(group, palette.pale, [side * .5 + (toe - 1) * .045, 1.95, .25], [side * .53 + (toe - 1) * .062, 1.92, .41], .028, .003);
    }
  }
  const mouth = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.185, 3.306, .395), new THREE.Vector3(0, 3.29, .395), new THREE.Vector3(.185, 3.306, .395),
  ]), new THREE.LineBasicMaterial({ color: '#172930' }));
  group.add(mouth);
  group.rotation.y = -.18;
  group.userData.float = true;
  return group;
}
