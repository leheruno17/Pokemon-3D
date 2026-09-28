import garchompCard from '../Garchomp EX da Cíntia.jpg';
import dragapultCard from '../Dragapult Ex.avif';
import incineroarCard from '../Incineroar EX.jpg';

export const pokemon = {
  garchomp: {
    id: 'garchomp', name: 'Garchomp', fullName: 'Garchomp ex da Cíntia', owner: 'DA CÍNTIA', number: '0445', hp: 330,
    card: garchompCard, model: './models/garchomp.glb',
    accent: '#e3b16c', rgb: '227, 177, 108', types: ['Dragão', 'Terrestre'], cardType: 'Luta',
    species: 'Pokémon Mach', description: 'Uma força da natureza. Velocidade implacável e o vínculo com Cíntia em sua forma mais poderosa.',
    set: 'Rivais Predestinados', rarity: 'Ilustração especial', cardNumber: '232 / 182', environment: 'ARENA ANCESTRAL', environmentTitle: 'O despertar de uma lenda.',
    environmentDescription: 'Sob o sol dourado, a própria terra reconhece sua força.', badge: 'TEMPESTADE DE AREIA',
    galleryDescription: 'O poder que faz a terra tremer.', galleryEnvironment: 'Arena árida', icon: 'mountain',
    attacks: [
      { name: 'Mergulho Parafuso', damage: '100', energy: ['fighting'], description: 'Você pode comprar cartas até ter 6 cartas na sua mão.' },
      { name: 'Aniquilação Dracônica', damage: '260', energy: ['fighting', 'fighting'], description: 'Descarte todas as Energias deste Pokémon.' },
    ],
    ability: { title: 'Laço com Cíntia', text: 'Um encontro entre a determinação de uma Campeã e a força de um dragão.', icon: 'sparkles' },
    background: '#17110d', light: '#ffb962', secondary: '#ffd69b', fog: '#20160f',
  },
  dragapult: {
    id: 'dragapult', name: 'Dragapult', fullName: 'Dragapult ex', owner: 'TERACRISTAL', number: '0887', hp: 320,
    card: dragapultCard, model: './models/dragapult.glb',
    accent: '#b4a0ff', rgb: '180, 160, 255', types: ['Dragão', 'Fantasma', 'Tera'], cardType: 'Dragão',
    species: 'Pokémon Furtivo', description: 'Silencioso como um espectro. Extraordinário como um cristal. Descubra a energia que existe além do visível.',
    set: 'Evoluções Prismáticas', rarity: 'Ilustração especial', cardNumber: '165 / 131', environment: 'DIMENSÃO ESPECTRAL', environmentTitle: 'O outro lado do visível.',
    environmentDescription: 'Entre névoa e energia, uma presença extraordinária.', badge: 'TERACRISTAL',
    galleryDescription: 'Nem tudo precisa ser visto para existir.', galleryEnvironment: 'Dimensão espectral', icon: 'ghost',
    attacks: [
      { name: 'Cabeçada a Jato', damage: '70', energy: ['neutral'], description: '' },
      { name: 'Mergulho Fantasma', damage: '200', energy: ['fire', 'psychic'], description: 'Coloque 6 contadores de dano nos Pokémon no Banco do seu oponente como desejar.' },
    ],
    ability: { title: 'O brilho da Teracristalização', text: 'Enquanto estiver no Banco, previna todo o dano causado a este Pokémon por ataques.', icon: 'diamond' },
    background: '#12101e', light: '#a281ff', secondary: '#5af0ed', fog: '#181427',
  },
  incineroar: {
    id: 'incineroar', name: 'Incineroar', fullName: 'Incineroar ex', owner: 'INTENSIDADE MÁXIMA', number: '0727', hp: 320,
    card: incineroarCard, model: './models/incineroar.glb',
    accent: '#ff8a6b', rgb: '255, 138, 107', types: ['Fogo', 'Lutador'], cardType: 'Fogo',
    species: 'Pokémon Vilão', description: 'O ringue é seu território. Uma presença explosiva que transforma cada batalha em um espetáculo.',
    set: 'Forças Temporais', rarity: 'Ultra rara', cardNumber: '187 / 162', environment: 'RINGUE INFERNAL', environmentTitle: 'Nascido para incendiar.',
    environmentDescription: 'Sob os holofotes, a chama de um verdadeiro campeão.', badge: 'CHAMAS VIVAS',
    galleryDescription: 'O espetáculo começa com uma faísca.', galleryEnvironment: 'Ringue de fogo', icon: 'flame',
    attacks: [
      { name: 'Incêndio Explosivo', damage: '240', energy: ['fire', 'neutral', 'neutral', 'neutral', 'neutral'], description: 'O Pokémon Ativo do seu oponente agora está Queimado.' },
    ],
    ability: { title: 'Habilidade · Cair pra Dentro', text: 'Os ataques usados por este Pokémon custam 1 Energia incolor a menos para cada Pokémon no Banco do seu oponente.', icon: 'flame' },
    background: '#1b100f', light: '#ff613d', secondary: '#ffc36a', fog: '#24100e',
  },
};

export const pokemonOrder = ['garchomp', 'dragapult', 'incineroar'];
