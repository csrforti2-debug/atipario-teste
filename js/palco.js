// PALCO — popup em sequência: uma pergunta grande por vez. Cada passo entra
// deslizando por cima da tela atual. Usado no registro e no check-in do dia.
//
// const p = abrirPalco();
// p.passo({ html, ligar: el => {...}, progresso: [1, 4], voltar: () => {...} });
// p.fechar();

import { icone } from './icones.js';

export function abrirPalco({ aoFechar } = {}) {
  const fundo = document.createElement('div');
  fundo.className = 'palco-fundo';
  fundo.innerHTML = `
    <div class="palco" role="dialog" aria-modal="true">
      <header class="palco-topo">
        <button class="btn-icone palco-voltar" aria-label="Voltar">${icone('voltar', 22)}</button>
        <div class="palco-pontos" aria-hidden="true"></div>
        <button class="btn-icone palco-fechar" aria-label="Fechar">${icone('x', 22)}</button>
      </header>
      <div class="palco-trilho"></div>
    </div>`;
  document.getElementById('camada').appendChild(fundo);
  document.body.classList.add('travado');
  requestAnimationFrame(() => fundo.classList.add('palco-fundo--in'));

  const trilho = fundo.querySelector('.palco-trilho');
  const pontos = fundo.querySelector('.palco-pontos');
  const btnVoltar = fundo.querySelector('.palco-voltar');
  let voltarAtual = null;
  let fechado = false;

  function fechar() {
    if (fechado) return;
    fechado = true;
    fundo.classList.remove('palco-fundo--in');
    document.body.classList.remove('travado');
    document.removeEventListener('keydown', teclas);
    setTimeout(() => fundo.remove(), 340);
    aoFechar?.();
  }
  const teclas = e => { if (e.key === 'Escape') fechar(); };
  document.addEventListener('keydown', teclas);
  fundo.querySelector('.palco-fechar').onclick = fechar;
  fundo.addEventListener('click', e => { if (e.target === fundo) fechar(); });
  btnVoltar.onclick = () => voltarAtual?.();

  /** Troca o conteúdo. `direcao` 1 = avançando (entra pela direita), -1 = voltando. */
  function passo({ html, ligar, progresso, voltar = null, direcao = 1 }) {
    voltarAtual = voltar;
    btnVoltar.style.visibility = voltar ? 'visible' : 'hidden';
    pontos.innerHTML = progresso
      ? Array.from({ length: progresso[1] }, (_, i) => `<i class="${i < progresso[0] ? 'feito' : ''}"></i>`).join('')
      : '';

    const antigo = trilho.querySelector('.palco-passo:not(.sai)');
    const novo = document.createElement('div');
    novo.className = `palco-passo entra ${direcao < 0 ? 'de-tras' : ''}`;
    novo.innerHTML = html;
    trilho.appendChild(novo);
    if (antigo) {
      antigo.classList.add('sai');
      if (direcao < 0) antigo.classList.add('para-frente');
      setTimeout(() => antigo.remove(), 300);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => novo.classList.remove('entra', 'de-tras')));
    ligar?.(novo);
  }

  return { passo, fechar, el: fundo };
}
