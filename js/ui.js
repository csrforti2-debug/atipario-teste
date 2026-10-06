// UI — peças reaproveitadas por todas as telas: aviso rápido (toast), folha que sobe
// de baixo (sheet), confirmação, compressão de foto e o gráfico de curva.

import { icone } from './icones.js';

/** Escapa texto antes de pôr dentro do HTML (evita quebrar a tela com < ou "). */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const camada = () => document.getElementById('camada');

export function toast(msg, ic = 'check') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `${icone(ic, 20)}<span>${esc(msg)}</span>`;
  camada().appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--in'));
  setTimeout(() => { el.classList.remove('toast--in'); setTimeout(() => el.remove(), 400); }, 2400);
}

/**
 * Abre uma folha que sobe de baixo. `montar(el, fechar)` recebe o conteúdo já no DOM.
 * Retorna a função `fechar`.
 */
export function abrirFolha(html, montar) {
  const fundo = document.createElement('div');
  fundo.className = 'folha-fundo';
  fundo.innerHTML = `<div class="folha" role="dialog" aria-modal="true"><div class="folha-alca"></div>${html}</div>`;
  camada().appendChild(fundo);
  const folha = fundo.querySelector('.folha');
  requestAnimationFrame(() => fundo.classList.add('folha-fundo--in'));

  const fechar = () => {
    fundo.classList.remove('folha-fundo--in');
    document.removeEventListener('keydown', aoTeclar);
    setTimeout(() => fundo.remove(), 320);
  };
  const aoTeclar = e => { if (e.key === 'Escape') fechar(); };
  document.addEventListener('keydown', aoTeclar);
  fundo.addEventListener('click', e => { if (e.target === fundo) fechar(); });
  montar?.(folha, fechar);
  return fechar;
}

export function confirmar({ titulo, texto, ok = 'Confirmar', perigo = false }) {
  return new Promise(resolve => {
    abrirFolha(`
      <h3 class="folha-titulo">${esc(titulo)}</h3>
      ${texto ? `<p class="folha-texto">${esc(texto)}</p>` : ''}
      <div class="folha-acoes">
        <button class="btn btn-fantasma" data-r="0">Cancelar</button>
        <button class="btn ${perigo ? 'btn-perigo' : 'btn-primario'}" data-r="1">${esc(ok)}</button>
      </div>`, (el, fechar) => {
      el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { fechar(); resolve(b.dataset.r === '1'); });
    });
  });
}

/** Reduz a foto (celular tira fotos de 4 MB) para caber no aparelho sem pesar. */
export function comprimirFoto(arquivo, max = 1100, qualidade = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Curva suave de pontos {x: 0..1, y: 1..5}. Devolve SVG pronto.
 * Usada no início (mini) e no relatório (grande).
 */
export function curva(pontos, { largura = 320, altura = 96, eixo = false, id = 'c' } = {}) {
  if (pontos.length < 2) return '';
  const pad = { t: 10, b: eixo ? 22 : 10, l: eixo ? 30 : 8, r: 8 };
  const W = largura - pad.l - pad.r, H = altura - pad.t - pad.b;
  const px = p => [pad.l + p.x * W, pad.t + (1 - (p.y - 1) / 4) * H];
  const xy = pontos.map(px);

  // Catmull-Rom → Bézier: passa por todos os pontos com curva macia.
  let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const [p0, p1, p2, p3] = [xy[i - 1] || xy[i], xy[i], xy[i + 1], xy[i + 2] || xy[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const fim = xy[xy.length - 1], ini = xy[0];
  const area = `${d} L${fim[0].toFixed(1)},${pad.t + H} L${ini[0].toFixed(1)},${pad.t + H} Z`;

  const guias = eixo ? [1, 3, 5].map(v => {
    const y = pad.t + (1 - (v - 1) / 4) * H;
    return `<line x1="${pad.l}" x2="${pad.l + W}" y1="${y}" y2="${y}" class="curva-guia"/>
            <text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" class="curva-rotulo">${v}</text>`;
  }).join('') : '';

  return `
  <svg class="curva" viewBox="0 0 ${largura} ${altura}" role="img"
       aria-label="Curva de como os dias foram percebidos">
    <defs><linearGradient id="g-${id}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="var(--primary)" stop-opacity=".22"/>
      <stop offset="1" stop-color="var(--primary)" stop-opacity="0"/>
    </linearGradient></defs>
    ${guias}
    <path d="${area}" fill="url(#g-${id})"/>
    <path d="${d}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="${fim[0]}" cy="${fim[1]}" r="4" fill="var(--surface)" stroke="var(--primary)" stroke-width="2.5"/>
  </svg>`;
}
