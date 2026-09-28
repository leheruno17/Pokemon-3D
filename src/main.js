import './style.css';
import { pokemon, pokemonOrder } from './data.js';
import { icon, hydrateIcons } from './icons.js';
import { PokemonScene } from './scene.js';

const element = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const storageKey = 'poke-dimension-favorites';
let selected = 'dragapult';
let favorites = new Set();
let scene;
let toastTimeout;
let rotationEnabled = !reducedMotion;
let paused = reducedMotion;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) favorites = new Set(saved.filter(id => Object.hasOwn(pokemon, id)));
} catch {
  favorites = new Set();
}

function toast(message) {
  clearTimeout(toastTimeout);
  element('toast').textContent = message;
  element('toast').classList.add('visible');
  toastTimeout = setTimeout(() => element('toast').classList.remove('visible'), 2800);
}

function renderGallery() {
  element('card-gallery').innerHTML = pokemonOrder.map(id => {
    const data = pokemon[id];
    return `<button class="pokemon-card ${id === selected ? 'active' : ''}" data-pokemon="${id}" style="--card-accent:${data.accent};--card-rgb:${data.rgb}" aria-pressed="${id === selected}" aria-label="Explorar ${data.fullName}, ${data.galleryEnvironment}">
      <span class="card-image-wrap"><img src="${data.card}" alt="Carta ${data.fullName}, ${data.hp} PS" width="100" height="140" draggable="false" /><span class="holo-overlay"></span><span class="holo-glare"></span></span>
      <span class="card-content"><span class="card-kicker"><span></span>${data.owner}</span><span class="card-title">${data.name} <em>ex</em></span><span class="card-description block">${data.galleryDescription}</span><span class="card-environment">${icon(data.icon)}${data.galleryEnvironment}</span></span>
      <span class="card-selection">${icon('check')}</span><span class="selected-label">EXPLORANDO AGORA</span>
    </button>`;
  }).join('');
  document.querySelectorAll('.pokemon-card').forEach(card => {
    card.addEventListener('click', () => {
      selectPokemon(card.dataset.pokemon);
      if (innerWidth <= 760) element('scene-shell').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    });
    const artwork = card.querySelector('.card-image-wrap');
    card.addEventListener('pointermove', event => {
      if (reducedMotion || event.pointerType === 'touch') return;
      const bounds = card.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width;
      const vertical = (event.clientY - bounds.top) / bounds.height;
      artwork.style.transform = `perspective(650px) rotateX(${(vertical - .5) * -22}deg) rotateY(${(horizontal - .5) * 30}deg) rotateZ(-4deg) translateY(-3px)`;
      artwork.style.setProperty('--holo-x', `${horizontal * 100}%`);
      artwork.style.setProperty('--holo-y', `${vertical * 100}%`);
    });
    card.addEventListener('pointerleave', () => { artwork.style.transform = ''; });
  });
}

const typeStyles = {
  'Dragão': ['dragon', 'dragon'], 'Fantasma': ['ghost', 'ghost'], 'Tera': ['tera', 'diamond'],
  'Terrestre': ['ground', 'mountain'], 'Fogo': ['fire', 'flame'], 'Lutador': ['fighting', 'swords'],
};
const energySymbols = { fire: '♨', psychic: '◉', fighting: '✊', neutral: '✦' };

function renderInfo(data) {
  document.documentElement.style.setProperty('--accent', data.accent);
  document.documentElement.style.setProperty('--accent-rgb', data.rgb);
  element('pokemon-number').innerHTML = `Nº ${data.number} <i>·</i> ESTÁGIO 2`;
  element('pokemon-name').textContent = data.name;
  element('pokemon-hp').textContent = data.hp;
  element('pokemon-species').textContent = data.species;
  element('pokemon-description').textContent = data.description;
  element('card-set').textContent = data.set;
  element('card-set').title = `${data.cardNumber} · Tipo da carta: ${data.cardType}`;
  document.querySelector('.rarity').innerHTML = `<span>✦ ✦</span> ${data.rarity}`;
  element('environment-label').textContent = data.environment;
  element('environment-title').textContent = data.environmentTitle;
  element('environment-description').textContent = data.environmentDescription;
  element('scene-type').textContent = data.badge;
  element('scene-word').textContent = data.name.toUpperCase();
  element('dex-watermark').textContent = `Nº ${data.number}`;
  element('scene-canvas').setAttribute('aria-label', `Modelo 3D de ${data.name}. Arraste para girar, role para ampliar. Use as setas do teclado para girar.`);
  element('type-list').innerHTML = data.types.map(type => {
    const [className, iconName] = typeStyles[type];
    return `<span class="type-chip ${className}">${icon(iconName)}${type}</span>`;
  }).join('');
  element('attacks').innerHTML = data.attacks.map(attack => `<div class="attack"><div class="attack-top"><span class="energy-list" aria-label="Custo: ${attack.energy.join(', ')}">${attack.energy.map(energy => `<span class="energy ${energy}" aria-hidden="true">${energySymbols[energy]}</span>`).join('')}</span><span class="attack-name">${attack.name}</span><span class="attack-damage">${attack.damage}</span></div>${attack.description ? `<p class="attack-description">${attack.description}</p>` : ''}</div>`).join('');
  element('ability').innerHTML = `<div class="ability-title">${icon(data.ability.icon)}${data.ability.title}</div><p>${data.ability.text}</p>`;
  updateFavorite();
}

function selectPokemon(id, announce = true) {
  if (!Object.hasOwn(pokemon, id)) return;
  const changed = selected !== id;
  selected = id;
  renderInfo(pokemon[id]);
  document.querySelectorAll('.pokemon-card').forEach(card => {
    const active = card.dataset.pokemon === id;
    card.classList.toggle('active', active);
    card.setAttribute('aria-pressed', active);
  });
  if (scene && changed) scene.select(id);
  const url = new URL(location.href);
  url.searchParams.set('pokemon', id);
  history.replaceState(null, '', url);
  if (announce && changed) toast(`${pokemon[id].fullName} · ${pokemon[id].galleryEnvironment}`);
}

function updateFavorite() {
  const saved = favorites.has(selected);
  element('favorite-button').setAttribute('aria-pressed', saved);
  element('favorite-button').setAttribute('aria-label', `${saved ? 'Remover' : 'Favoritar'} ${pokemon[selected].name}${saved ? ' da coleção' : ''}`);
  element('favorite-button').title = saved ? 'Remover dos favoritos' : 'Salvar nos favoritos';
  element('favorite-count').textContent = favorites.size;
}

function renderCollection() {
  element('collection-content').innerHTML = favorites.size ? [...favorites].map(id => `<button class="collection-item" data-collection-id="${id}"><img src="${pokemon[id].card}" alt="Carta ${pokemon[id].fullName}" /><span><strong>${pokemon[id].fullName}</strong><small>${pokemon[id].galleryEnvironment}</small></span>${icon('arrow-up-right')}</button>`).join('') : `<div class="collection-empty">${icon('bookmark')}Sua próxima descoberta pode ficar aqui.<br />Use o marcador no painel para guardar seus favoritos.</div>`;
  element('collection-content').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    element('collection-dialog').close();
    selectPokemon(button.dataset.collectionId);
    element('scene-canvas').focus({ preventScroll: true });
    element('explorar').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' });
  }));
}

function togglePanel(open) {
  document.querySelector('.experience').classList.toggle('panel-collapsed', !open);
  element('show-panel').setAttribute('aria-expanded', open);
  element('info-panel').inert = !open;
  (open ? element('hide-panel') : element('show-panel')).focus({ preventScroll: true });
}

function updateMotionControls() {
  element('rotate-button').classList.toggle('selected', rotationEnabled);
  element('rotate-button').setAttribute('aria-pressed', rotationEnabled);
  element('motion-button').setAttribute('aria-pressed', paused);
  element('motion-button').setAttribute('aria-label', paused ? 'Retomar animações' : 'Pausar animações');
  element('motion-button').title = paused ? 'Retomar animações' : 'Pausar animações';
  element('motion-button').innerHTML = `${icon(paused ? 'play' : 'pause')}<span class="motion-label">${paused ? 'Retomar' : 'Pausar'}</span>`;
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (element('scene-shell').requestFullscreen) await element('scene-shell').requestFullscreen();
    else toast('O navegador não oferece tela cheia. Recolha o painel para ampliar a cena.');
  } catch {
    toast('Não foi possível abrir a tela cheia neste navegador.');
  }
}

function modelStatus(status, id) {
  if (status === 'context-lost') {
    element('scene-error').hidden = false;
    toast('A conexão gráfica foi interrompida. Recarregue a página para tentar novamente.');
    return;
  }
  if (status === 'context-restored') {
    scene?.dispose();
    initializeScene();
    return;
  }
  if (selected !== id) return;
  element('model-note').innerHTML = status === 'original'
    ? '<span class="status-dot"></span> MODELO ORIGINAL · GLB'
    : '<span class="status-dot"></span> MODELO ESTILIZADO <span class="note-info" title="Prévia procedural em 3D. Adicione o arquivo GLB para exibir o modelo original.">i</span>';
}

function initializeScene() {
  try {
    scene = new PokemonScene(element('scene-canvas'), modelStatus);
    if (selected !== 'dragapult') scene.select(selected);
    scene.setRotation(rotationEnabled);
    scene.setPaused(paused);
    element('scene-error').hidden = true;
    if (import.meta.env.DEV) window.__POKE_DEV__ = { scene, selectPokemon };
  } catch (error) {
    element('scene-error').hidden = false;
    element('model-note').hidden = true;
    for (const id of ['rotate-button', 'zoom-out', 'zoom-in', 'reset-camera', 'motion-button']) element(id).disabled = true;
    console.warn('Visualizador 3D indisponível:', error.message);
  } finally {
    element('scene-loading').classList.add('loaded');
  }
}

hydrateIcons();
renderGallery();
const initial = new URL(location.href).searchParams.get('pokemon');
selectPokemon(Object.hasOwn(pokemon, initial) ? initial : 'dragapult', false);
initializeScene();
updateMotionControls();

element('favorite-button').addEventListener('click', () => {
  const wasSaved = favorites.has(selected);
  if (wasSaved) favorites.delete(selected);
  else favorites.add(selected);
  let persistent = true;
  try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch { persistent = false; }
  updateFavorite();
  toast(`${pokemon[selected].name} ${wasSaved ? 'removido da' : 'adicionado à'} coleção.${persistent ? '' : ' Salvo apenas nesta sessão.'}`);
});
element('collection-button').addEventListener('click', () => { renderCollection(); element('collection-dialog').showModal(); });
element('help-button').addEventListener('click', () => element('help-dialog').showModal());
element('hide-panel').addEventListener('click', () => togglePanel(false));
element('show-panel').addEventListener('click', () => togglePanel(true));
element('rotate-button').addEventListener('click', () => {
  rotationEnabled = !rotationEnabled;
  scene?.setRotation(rotationEnabled);
  if (rotationEnabled && paused) {
    paused = false;
    scene?.setPaused(false);
  }
  updateMotionControls();
});
element('motion-button').addEventListener('click', () => { paused = !paused; scene?.setPaused(paused); updateMotionControls(); });
element('zoom-in').addEventListener('click', () => scene?.zoom(1));
element('zoom-out').addEventListener('click', () => scene?.zoom(-1));
element('reset-camera').addEventListener('click', () => { scene?.resetCamera(); toast('Câmera restaurada. Um novo olhar.'); });
element('fullscreen-button').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => { element('fullscreen-button').setAttribute('aria-label', document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia'); });
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
}));
document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  const key = event.key.toLowerCase();
  if (['1', '2', '3'].includes(key)) selectPokemon(pokemonOrder[Number(key) - 1]);
  if (key === 'r') element('rotate-button').click();
  if (key === 'f') toggleFullscreen();
  if (key === '0') element('reset-camera').click();
  if (['+', '=', '-', '_'].includes(key)) { event.preventDefault(); scene?.zoom(key === '+' || key === '=' ? 1 : -1); }
  if (event.target === element('scene-canvas') && key.startsWith('arrow')) {
    event.preventDefault();
    const directions = { arrowleft: [-.12, 0], arrowright: [.12, 0], arrowup: [0, -.08], arrowdown: [0, .08] };
    scene?.orbit(...directions[key]);
  }
});
window.addEventListener('pagehide', event => { if (!event.persisted) scene?.dispose(); });
