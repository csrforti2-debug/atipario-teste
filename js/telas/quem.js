// QUEM VAMOS REGISTRAR? — com 2 ou mais pessoas, o app abre aqui (estilo "quem está assistindo").
// Um toque escolhe e leva ao Início daquela pessoa. Aparece uma vez por visita; o avatar do
// Início traz de volta para trocar.

import { store } from '../store.js';
import { abrirPessoa, avatarPessoa, marcarEscolha } from '../pessoas.js';
import { logo } from '../marca.js';
import { icone } from '../icones.js';
import { esc } from '../ui.js';
import { hojeISO } from '../datas.js';
import { movimentoReduzido } from '../movimento.js';

export function render(el, ctx) {
  const hoje = hojeISO();
  const ativa = store.pessoaAtiva?.id;
  const temHoje = id => store.todosRegistros.some(r => r.pessoaId === id && r.data === hoje);

  el.innerHTML = `
  <div class="quem">
    <div class="quem-topo">${logo({ tamanho: 34, espessura: 7 })}</div>
    <h1>Quem vamos registrar?</h1>
    <div class="quem-grade">
      ${store.pessoas.map((p, k) => `
        <button class="quem-cartao" data-pessoa="${p.id}" style="--k:${k}" aria-current="${p.id === ativa}">
          ${avatarPessoa(p, 96)}
          <b>${esc(p.eu ? 'Eu' : p.nome)}</b>
          <span class="quem-status ${temHoje(p.id) ? 'feito' : ''}">${temHoje(p.id) ? `${icone('check', 14)} hoje` : 'falta hoje'}</span>
        </button>`).join('')}
      <button class="quem-cartao quem-novo" data-nova style="--k:${store.pessoas.length}">
        <span class="quem-mais">${icone('mais', 34)}</span>
        <b>Adicionar</b><span class="quem-status">&nbsp;</span>
      </button>
    </div>
  </div>`;

  el.querySelectorAll('[data-pessoa]').forEach(b => b.onclick = () => {
    store.definirPessoaAtiva(b.dataset.pessoa);
    marcarEscolha();
    b.classList.add('escolhido');
    setTimeout(() => ctx.ir('inicio'), movimentoReduzido() ? 0 : 180);
  });
  el.querySelector('[data-nova]').onclick = () => abrirPessoa({ aoSalvar: () => render(el, ctx) });
}
