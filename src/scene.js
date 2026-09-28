import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createPokemon } from './models.js';
import { pokemon } from './data.js';

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#ffffffff');
  gradient.addColorStop(.13, '#ffffffcc');
  gradient.addColorStop(.4, '#ffffff40');
  gradient.addColorStop(1, '#ffffff00');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export class PokemonScene {
  constructor(canvas, onStatus) {
    this.canvas = canvas;
    this.onStatus = onStatus;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.paused = this.reducedMotion;
    this.time = 0;
    this.active = 'dragapult';
    this.worlds = new Map();
    this.texture = glowTexture();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2('#181427', .035);
    this.camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    this.home = new THREE.Vector3(4.3, 3.35, 10.7);
    this.camera.position.copy(this.home);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 1.95, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .055;
    this.controls.enablePan = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI * .49;
    this.controls.minPolarAngle = .15;
    this.controls.autoRotate = false;
    this.autoRotate = !this.reducedMotion;
    this.controls.addEventListener('start', () => { this.cameraTransition = null; });
    this.ambient = new THREE.HemisphereLight('#e3d8ff', '#302039', 2.2);
    this.scene.add(this.ambient);
    this.keyLight = new THREE.DirectionalLight('#ac9aff', 4.3);
    this.keyLight.position.set(-4, 7, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    Object.assign(this.keyLight.shadow.camera, { left: -6, right: 6, top: 7, bottom: -4, near: .1, far: 25 });
    this.keyLight.shadow.bias = -.001;
    this.keyLight.shadow.normalBias = .025;
    this.scene.add(this.keyLight);
    this.rimLight = new THREE.DirectionalLight('#7cebea', 3);
    this.rimLight.position.set(4, 3, -4);
    this.scene.add(this.rimLight);
    this.frontLight = new THREE.DirectionalLight('#fff1db', 1.3);
    this.frontLight.position.set(0, 3, 7);
    this.scene.add(this.frontLight);
    this.floorLight = new THREE.PointLight('#9e70ff', 12, 9, 2);
    this.floorLight.position.set(0, .5, 2);
    this.scene.add(this.floorLight);
    for (const id of Object.keys(pokemon)) this.worlds.set(id, this.createWorld(id));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
    this.clock = new THREE.Clock();
    this.onContextLost = event => {
      event.preventDefault();
      this.renderer.setAnimationLoop(null);
      this.onStatus('context-lost', this.active);
    };
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.onContextRestored = () => this.onStatus('context-restored', this.active);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    this.renderer.setAnimationLoop(() => this.animate());
    this.select('dragapult');
  }

  createWorld(id) {
    const data = pokemon[id];
    const random = seededRandom(id.length * 872);
    const group = new THREE.Group();
    group.visible = false;
    this.scene.add(group);
    const modelHolder = new THREE.Group();
    const model = createPokemon(id);
    modelHolder.add(model);
    group.add(modelHolder);
    const world = { id, group, modelHolder, model, weight: 0, loaded: false, attempted: false, materials: new Map(), crystals: [], mists: [], debris: [], flames: [], random };
    const surface = new THREE.MeshStandardMaterial({ color: id === 'garchomp' ? '#65513c' : '#292533', roughness: .87, metalness: id === 'incineroar' ? .65 : .18, flatShading: true });
    const base = new THREE.Mesh(id === 'incineroar' ? new THREE.CylinderGeometry(2.65, 2.85, .27, 8) : new THREE.CylinderGeometry(2.55, 2.8, .27, 48), surface);
    base.position.y = -.18;
    base.receiveShadow = true;
    group.add(base);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(2.48, 2.48, .035, id === 'incineroar' ? 8 : 64), new THREE.MeshStandardMaterial({ color: id === 'garchomp' ? '#837050' : '#393344', roughness: .76, metalness: .3 }));
    top.position.y = -.022;
    top.receiveShadow = true;
    group.add(top);
    const glowMaterial = new THREE.MeshBasicMaterial({ color: data.light, transparent: true, opacity: .66, blending: THREE.AdditiveBlending, depthWrite: false });
    for (const radius of [2.49, 2.67, 3.05]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius === 2.49 ? .022 : .008, 6, 128), glowMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = radius === 2.67 ? -.19 : .008;
      group.add(ring);
    }
    const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: this.texture, color: data.light, opacity: .19, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = .025;
    group.add(floorGlow);
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texture, color: data.light, opacity: .115, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    aura.scale.set(8, 8, 1);
    aura.position.set(0, 2.6, -2);
    group.add(aura);
    if (id === 'dragapult') {
      for (let orbit = 0; orbit < 3; orbit++) {
        const points = [];
        const radius = 2.05 + orbit * .36;
        for (let step = 0; step <= 160; step++) {
          const angle = step / 160 * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius + 2.3, -1.6));
        }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineDashedMaterial({ color: orbit === 1 ? '#9e91ff' : '#686394', transparent: true, opacity: orbit === 1 ? .24 : .13, dashSize: orbit === 1 ? .06 : 2.8, gapSize: orbit === 1 ? .11 : .15 }));
        line.computeLineDistances();
        group.add(line);
      }
      const crystalColors = ['#bca3ff', '#6adbd9', '#7d91d7'];
      for (let index = 0; index < 9; index++) {
        const angle = index / 9 * Math.PI * 2;
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.13 + random() * .14), new THREE.MeshStandardMaterial({ color: crystalColors[index % 3], metalness: .65, roughness: .15, emissive: crystalColors[index % 3], emissiveIntensity: .22, flatShading: true }));
        const radius = 2.75 + random() * .15;
        crystal.position.set(Math.cos(angle) * radius, .6 + random() * 2.9, Math.sin(angle) * radius);
        crystal.scale.y = 1.6 + random();
        crystal.rotation.set(random(), random(), random());
        crystal.userData.home = crystal.position.y;
        group.add(crystal);
        world.crystals.push(crystal);
      }
    }
    if (id === 'garchomp') {
      for (let index = 0; index < 9; index++) {
        const fragment = new THREE.Mesh(new THREE.IcosahedronGeometry(.025 + random() * .035, 0), new THREE.MeshStandardMaterial({ color: '#d8aa6d', roughness: .9, emissive: '#b47a25', emissiveIntensity: .15 }));
        const angle = random() * Math.PI * 2;
        fragment.position.set(Math.cos(angle) * 2.35, random() * 1.7, Math.sin(angle) * 2.35);
        fragment.userData.speed = .1 + random() * .15;
        world.debris.push(fragment);
        group.add(fragment);
      }
      for (let index = 0; index < 34; index++) {
        const angle = random() * Math.PI * 2;
        const radius = 1.5 + random() * 1.25;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.1 + random() * .25, 0), new THREE.MeshStandardMaterial({ color: new THREE.Color('#80715a').multiplyScalar(.5 + random() * .8), roughness: 1, flatShading: true }));
        rock.position.set(Math.cos(angle) * radius, .03, Math.sin(angle) * radius);
        rock.scale.set(1.3, .6 + random() * 1.4, 1);
        rock.rotation.set(random(), random(), random());
        rock.castShadow = true;
        group.add(rock);
      }
    }
    if (id === 'incineroar') {
      for (let index = 0; index < 14; index++) {
        const angle = index / 14 * Math.PI * 2;
        const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texture, color: index % 2 ? '#ff5b25' : '#ffab3c', transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false }));
        flame.position.set(Math.cos(angle) * 2.4, .14 + random() * .22, Math.sin(angle) * 2.4);
        flame.scale.set(.16 + random() * .08, .42 + random() * .25, 1);
        flame.userData.height = flame.scale.y;
        group.add(flame);
        world.flames.push(flame);
      }
      const sootPositions = new Float32Array(60 * 3);
      for (let index = 0; index < 60; index++) {
        sootPositions[index * 3] = (random() - .5) * 5;
        sootPositions[index * 3 + 1] = random() * 4;
        sootPositions[index * 3 + 2] = (random() - .5) * 4;
      }
      const sootGeometry = new THREE.BufferGeometry();
      sootGeometry.setAttribute('position', new THREE.BufferAttribute(sootPositions, 3));
      world.soot = new THREE.Points(sootGeometry, new THREE.PointsMaterial({ color: '#807573', size: .034, transparent: true, opacity: .4, depthWrite: false }));
      group.add(world.soot);
      const postMaterial = new THREE.MeshStandardMaterial({ color: '#44404a', metalness: .85, roughness: .3 });
      for (const horizontal of [-1.85, 1.85]) {
        for (const depth of [-1.6, 1.6]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(.055, .09, .9, 8), postMaterial);
          post.position.set(horizontal, .42, depth);
          group.add(post);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 8), new THREE.MeshBasicMaterial({ color: '#ff6b4b' }));
          cap.position.set(horizontal, .9, depth);
          group.add(cap);
        }
      }
      for (const height of [.3, .6, .87]) {
        const ropes = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.85, height, 1.6), new THREE.Vector3(-1.85, height, -1.6), new THREE.Vector3(1.85, height, -1.6), new THREE.Vector3(1.85, height, 1.6)]), new THREE.LineBasicMaterial({ color: '#b65547', transparent: true, opacity: .55 }));
        group.add(ropes);
      }
    }
    for (let index = 0; index < 11; index++) {
      const mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texture, color: id === 'garchomp' ? '#d4ad72' : id === 'incineroar' ? '#b3a29f' : '#a69ad5', transparent: true, opacity: id === 'dragapult' ? .06 : .035, depthWrite: false }));
      const angle = random() * Math.PI * 2;
      mist.position.set(Math.cos(angle) * 2.3, .39 + random() * .1, Math.sin(angle) * 1.4);
      mist.scale.set(2 + random() * 2.4, .35 + random() * .35, 1);
      mist.userData.origin = mist.position.clone();
      group.add(mist);
      world.mists.push(mist);
    }
    const count = id === 'incineroar' ? 230 : 170;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    const firstColor = new THREE.Color(data.light);
    const secondColor = new THREE.Color(data.secondary);
    for (let index = 0; index < count; index++) {
      positions[index * 3] = (random() - .5) * 12;
      positions[index * 3 + 1] = random() * 7 - .1;
      positions[index * 3 + 2] = (random() - .5) * 8;
      firstColor.clone().lerp(secondColor, random()).toArray(colors, index * 3);
      velocities[index] = .05 + random() * (id === 'incineroar' ? .75 : .16);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ size: id === 'garchomp' ? .04 : .075, map: this.texture, vertexColors: true, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    particles.frustumCulled = false;
    group.add(particles);
    world.particles = particles;
    world.velocities = velocities;
    this.collectMaterials(world);
    return world;
  }

  collectMaterials(world) {
    world.materials.clear();
    world.group.traverse(object => {
      if (!object.material) return;
      const surfaces = Array.isArray(object.material) ? object.material : [object.material];
      for (const surface of surfaces) {
        if (!world.materials.has(surface)) world.materials.set(surface, { opacity: surface.opacity, transparent: surface.transparent });
      }
    });
  }

  async loadModel(world) {
    if (world.attempted) return;
    world.attempted = true;
    try {
      const url = new URL(pokemon[world.id].model, document.baseURI);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Modelo não encontrado');
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 12 || new DataView(buffer).getUint32(0, true) !== 0x46546c67) throw new Error('Arquivo GLB indisponível');
      const gltf = await new GLTFLoader().parseAsync(buffer, new URL('.', url).href);
      if (this.disposed) { this.disposeObject(gltf.scene); return; }
      const loaded = gltf.scene;
      loaded.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(loaded);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Modelo sem geometria válida');
      const scale = Math.min(3.8 / size.y, 4.9 / Math.max(size.x, size.z));
      loaded.scale.multiplyScalar(scale);
      loaded.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      loaded.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
      for (const [surface, original] of world.materials) { surface.opacity = original.opacity; surface.transparent = original.transparent; }
      world.modelHolder.remove(world.model);
      this.disposeObject(world.model);
      world.modelHolder.add(loaded);
      world.model = loaded;
      world.loaded = true;
      if (gltf.animations.length) {
        world.mixer = new THREE.AnimationMixer(loaded);
        const idle = gltf.animations.find(clip => /idle|standing/i.test(clip.name)) || gltf.animations[0];
        world.mixer.clipAction(idle).play();
      }
      this.collectMaterials(world);
      if (this.active === world.id) this.onStatus('original', world.id);
    } catch {
      if (!this.disposed && this.active === world.id) this.onStatus('stylized', world.id);
    }
  }

  select(id) {
    this.active = id;
    const world = this.worlds.get(id);
    this.onStatus(world.loaded ? 'original' : 'stylized', id);
    this.loadModel(world);
    this.resetCamera();
  }

  resize() {
    const { width, height } = this.canvas.parentElement.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = width < 500 ? 46 : 35;
    this.camera.updateProjectionMatrix();
  }

  resetCamera() {
    this.cameraTransition = { from: this.camera.position.clone(), targetFrom: this.controls.target.clone(), progress: 0 };
  }

  zoom(direction) {
    this.cameraTransition = null;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * (direction > 0 ? .84 : 1.19), this.controls.minDistance, this.controls.maxDistance));
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  orbit(horizontal, vertical) {
    this.cameraTransition = null;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += horizontal;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + vertical, this.controls.minPolarAngle, this.controls.maxPolarAngle);
    this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    this.controls.update();
  }

  setRotation(enabled) { this.autoRotate = enabled; }
  setPaused(paused) { this.paused = paused; }

  animate() {
    const delta = Math.min(this.clock.getDelta(), .05);
    if (document.hidden) return;
    const animationDelta = this.paused ? 0 : delta;
    this.time += animationDelta;
    const transitionStep = this.reducedMotion ? 1 : 1 - Math.exp(-delta * 4.2);
    const data = pokemon[this.active];
    this.keyLight.color.lerp(new THREE.Color(data.light), transitionStep);
    this.rimLight.color.lerp(new THREE.Color(data.secondary), transitionStep);
    this.floorLight.color.lerp(new THREE.Color(data.light), transitionStep);
    this.scene.fog.color.lerp(new THREE.Color(data.fog), transitionStep);
    if (this.cameraTransition) {
      const transition = this.cameraTransition;
      transition.progress = Math.min(1, transition.progress + delta * 1.15);
      const smooth = this.reducedMotion ? 1 : 1 - Math.pow(1 - transition.progress, 3);
      this.camera.position.lerpVectors(transition.from, this.home, smooth);
      this.controls.target.lerpVectors(transition.targetFrom, new THREE.Vector3(0, 1.95, 0), smooth);
      if (smooth >= 1) this.cameraTransition = null;
    }
    this.controls.update(delta);
    for (const world of this.worlds.values()) {
      const targetWeight = world.id === this.active ? 1 : 0;
      world.weight = THREE.MathUtils.lerp(world.weight, targetWeight, transitionStep);
      if (Math.abs(world.weight - targetWeight) < .005) world.weight = targetWeight;
      world.group.visible = world.weight > .005;
      if (!world.group.visible) continue;
      for (const [surface, original] of world.materials) {
        surface.opacity = original.opacity * world.weight;
        const transparent = original.transparent || world.weight < 1;
        if (surface.transparent !== transparent) { surface.transparent = transparent; surface.needsUpdate = true; }
      }
      world.modelHolder.position.y = world.id === 'dragapult' ? .1 + Math.sin(this.time * 1.25) * .105 : Math.sin(this.time * 1.4) * .017;
      world.modelHolder.rotation.z = world.id === 'dragapult' ? Math.sin(this.time * .6) * .025 : 0;
      if (this.autoRotate) world.modelHolder.rotation.y = (world.modelHolder.rotation.y + animationDelta * .12) % (Math.PI * 2);
      if (world.mixer) world.mixer.update(animationDelta);
      world.crystals.forEach((crystal, index) => { crystal.position.y = crystal.userData.home + Math.sin(this.time * .75 + index) * .15; crystal.rotation.y += animationDelta * .17; });
      world.mists.forEach((mist, index) => { mist.position.x = mist.userData.origin.x + Math.sin(this.time * .2 + index) * .45; });
      world.debris.forEach(fragment => {
        fragment.position.y += animationDelta * fragment.userData.speed;
        fragment.rotation.x += animationDelta * .3;
        if (fragment.position.y > 1.9) fragment.position.y = .05;
      });
      world.flames.forEach((flame, index) => { flame.scale.y = flame.userData.height * (.85 + Math.sin(this.time * 5 + index * 2) * .25); });
      if (world.soot && animationDelta) {
        const sootPositions = world.soot.geometry.attributes.position.array;
        for (let index = 0; index < sootPositions.length / 3; index++) {
          sootPositions[index * 3 + 1] += animationDelta * (.12 + index % 5 * .035);
          if (sootPositions[index * 3 + 1] > 4) sootPositions[index * 3 + 1] = 0;
        }
        world.soot.geometry.attributes.position.needsUpdate = true;
      }
      const positions = world.particles.geometry.attributes.position.array;
      for (let index = 0; index < world.velocities.length; index++) {
        positions[index * 3 + 1] += world.velocities[index] * animationDelta;
        positions[index * 3] += Math.sin(this.time * .25 + index) * animationDelta * (world.id === 'garchomp' ? .18 : .035);
        if (positions[index * 3 + 1] > 7) positions[index * 3 + 1] = -.1;
      }
      world.particles.geometry.attributes.position.needsUpdate = animationDelta > 0;
    }
    this.renderer.render(this.scene, this.camera);
  }

  disposeObject(object) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    object.traverse(child => {
      if (child.geometry) geometries.add(child.geometry);
      if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach(surface => {
        materials.add(surface);
        Object.values(surface).forEach(value => { if (value?.isTexture && value !== this.texture) textures.add(value); });
      });
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(surface => surface.dispose());
    textures.forEach(texture => texture.dispose());
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    for (const world of this.worlds.values()) {
      world.mixer?.stopAllAction();
      world.mixer?.uncacheRoot(world.model);
      this.disposeObject(world.group);
    }
    this.texture.dispose();
    this.renderer.dispose();
  }
}
