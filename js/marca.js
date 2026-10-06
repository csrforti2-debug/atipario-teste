// MARCA — logo de traço único (o infinito que vira sorriso) e os rostinhos de humor.
// Tudo é SVG desenhado com "stroke" (linha), nunca preenchimento: é isso que dá
// a sensação de desenho feito à mão com um traço só.

// O caminho do logo. Lê-se assim: começa na ponta direita do sorriso, desenha o
// sorriso, sobe pela bochecha esquerda, dá a volta no infinito inteiro (os olhos)
// e termina de volta perto de onde entrou. Um traço só, do começo ao fim.
export const LOGO_PATH =
  'M84 64 C77 85 43 85 36 64 ' +   // sorriso (da direita para a esquerda)
  'C34 58 32 52 33 47 ' +          // bochecha subindo até o olho esquerdo
  'C35 37 52 37 60 46 ' +          // topo do olho esquerdo até o cruzamento
  'C68 55 85 55 87 46 ' +          // base do olho direito
  'C88 37 68 37 60 46 ' +          // topo do olho direito de volta ao cruzamento
  'C53 54 40 55 36 51';            // base do olho esquerdo, fechando o laço

/**
 * Logo em SVG.
 * @param {object} o
 * @param {number} o.tamanho   largura/altura em px
 * @param {boolean} o.animado  desenha o traço na tela (tela de carregamento)
 * @param {string} o.cor       cor do traço (padrão: cor primária do tema)
 * @param {number} o.espessura espessura do traço
 */
export function logo({ tamanho = 40, animado = false, cor = 'var(--primary)', espessura = 6 } = {}) {
  return `
  <svg class="logo ${animado ? 'logo--animado' : ''}" width="${tamanho}" height="${tamanho}"
       viewBox="22 24 76 76" fill="none" role="img" aria-label="atipario">
    <path d="${LOGO_PATH}" pathLength="1" stroke="${cor}" stroke-width="${espessura}"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// Rostinhos 1–5 para "Como foi?". Mesmo estilo de linha do logo.
// Sem vermelho para dia difícil: o app não julga, só registra.
const OLHOS_ABERTOS = '<circle cx="11" cy="13" r="1.7" fill="currentColor" stroke="none"/><circle cx="21" cy="13" r="1.7" fill="currentColor" stroke="none"/>';
const OLHOS_FELIZES = '<path d="M8.5 14 q2.5 -3.2 5 0"/><path d="M18.5 14 q2.5 -3.2 5 0"/>';
const OLHOS_CANSADOS = '<path d="M8.8 13.5 h4.4"/><path d="M18.8 13.5 h4.4"/>';

const BOCAS = {
  1: '<path d="M10.5 23.5 q5.5 -5.5 11 0"/>',
  2: '<path d="M11 22.5 q5 -2.6 10 0"/>',
  3: '<path d="M11.5 21.5 h9"/>',
  4: '<path d="M10.5 19.5 q5.5 5 11 0"/>',
  5: '<path d="M9 18.5 q7 8.5 14 0"/>',
};

export function rosto(n, tamanho = 32) {
  const olhos = n === 5 ? OLHOS_FELIZES : n === 1 ? OLHOS_CANSADOS : OLHOS_ABERTOS;
  return `
  <svg class="rosto" width="${tamanho}" height="${tamanho}" viewBox="0 0 32 32" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    ${olhos}${BOCAS[n] || BOCAS[3]}
  </svg>`;
}
