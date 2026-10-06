// MOVIMENTO — os efeitos da marca: o traço que se desenha com uma "ponta de caneta",
// o mini-traço dentro dos botões e a comemoração depois de salvar.
// Tudo respeita "reduzir movimento" do sistema.

import { logo, LOGO_PATH } from './marca.js';
import { esc } from './ui.js';

export const movimentoReduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const espera = ms => new Promise(r => setTimeout(r, ms));

/**
 * Desenha o caminho do logo com uma bolinha (a ponta da caneta) correndo na frente.
 * `svg` precisa ter um <path> e um <circle class="caneta">.
 */
export function desenharComCaneta(svg, duracao = 1400) {
  const path = svg.querySelector('path');
  const caneta = svg.querySelector('.caneta');
  const total = path.getTotalLength();
  path.style.strokeDasharray = total;
  path.style.strokeDashoffset = total;
  if (movimentoReduzido()) { path.style.strokeDashoffset = 0; caneta?.remove(); return Promise.resolve(); }

  return new Promise(resolve => {
    const t0 = performance.now();
    const suave = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-in-out
    function quadro(agora) {
      const t = Math.min(1, (agora - t0) / duracao);
      const feito = suave(t) * total;
      path.style.strokeDashoffset = total - feito;
      if (caneta) {
        const p = path.getPointAtLength(feito);
        caneta.setAttribute('cx', p.x);
        caneta.setAttribute('cy', p.y);
      }
      if (t < 1) requestAnimationFrame(quadro);
      else { caneta?.classList.add('caneta--some'); resolve(); }
    }
    requestAnimationFrame(quadro);
  });
}

/** SVG do logo pronto para `desenharComCaneta`. */
export function logoComCaneta({ tamanho = 132, cor = 'var(--primary)', espessura = 5 } = {}) {
  return `
  <svg class="logo logo-caneta" width="${tamanho}" height="${tamanho}" viewBox="22 24 76 76" fill="none" aria-hidden="true">
    <path d="${LOGO_PATH}" stroke="${cor}" stroke-width="${espessura}" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="caneta" r="${espessura * 0.9}" fill="${cor}" cx="84" cy="64"/>
  </svg>`;
}

/**
 * Efeito no botão: o conteúdo some, um mini-logo se desenha dentro dele e só então
 * a ação continua. Rápido (≈ 0,45 s) para não virar espera.
 */
export async function tracar(botao) {
  if (!botao || movimentoReduzido()) return;
  botao.classList.add('btn--tracando');
  botao.disabled = true;
  const mini = document.createElement('span');
  mini.className = 'btn-traco';
  mini.innerHTML = logo({ tamanho: 30, cor: 'currentColor', espessura: 8 });
  botao.appendChild(mini);
  await espera(460);
}

/** Popup central de comemoração: o logo se desenha e aparece a mensagem. */
export function celebrar(titulo, sub = '') {
  const el = document.createElement('div');
  el.className = 'celebra';
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <div class="celebra-cartao">
      ${logoComCaneta({ tamanho: 84, espessura: 6 })}
      <b>${esc(titulo)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}
    </div>`;
  document.getElementById('camada').appendChild(el);
  requestAnimationFrame(() => el.classList.add('celebra--in'));
  desenharComCaneta(el.querySelector('svg'), 750);
  return new Promise(resolve => setTimeout(() => {
    el.classList.remove('celebra--in');
    setTimeout(() => { el.remove(); resolve(); }, 300);
  }, movimentoReduzido() ? 900 : 1500));
}
