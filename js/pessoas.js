// PESSOAS — quando a família acompanha mais de uma pessoa (filhos, irmãos, a própria pessoa),
// tudo no app é "de alguém". Aqui moram o seletor que aparece no topo das telas e o editor
// de pessoa (nome, idade, rede de cuidado). Atípico não é só autismo: o app não pergunta
// nem guarda diagnóstico.

import { store } from './store.js';
import { AREAS } from './config.js';
import { icone } from './icones.js';
import { esc, abrirFolha, confirmar, toast } from './ui.js';

const IDADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13+'];

/** Fileira de nomes para trocar de pessoa. Só aparece com 2 ou mais. */
export function seletorPessoas() {
  const ps = store.pessoas;
  if (ps.length < 2) return '';
  const ativa = store.pessoaAtiva?.id;
  return `
  <div class="pessoas-chips" role="radiogroup" aria-label="Quem você está acompanhando">
    ${ps.map(p => `<button class="chip" role="radio" data-pessoa="${p.id}" aria-pressed="${p.id === ativa}" aria-checked="${p.id === ativa}">${esc(p.nome)}</button>`).join('')}
  </div>`;
}

export function ligarSeletor(el, aoTrocar) {
  el.querySelectorAll('[data-pessoa]').forEach(b => b.onclick = () => {
    store.definirPessoaAtiva(b.dataset.pessoa);
    aoTrocar();
  });
}

export const rotuloPessoa = p => (p.eu ? `${p.nome} (você)` : p.nome) + (p.idade ? ` · ${p.idade} anos` : '');

/**
 * Cria ou edita uma pessoa. `pessoa` nulo = nova.
 * aoSalvar(pessoa) roda depois de gravar; aoApagar() depois de apagar.
 */
export function abrirPessoa({ pessoa = null, aoSalvar, aoApagar } = {}) {
  const f = {
    nome: pessoa?.nome || '',
    idade: pessoa?.idade || '',
    equipe: new Set(pessoa?.equipe || []),
  };
  const podeApagar = pessoa && store.pessoas.length > 1;

  abrirFolha(`
    <h3 class="folha-titulo">${pessoa ? 'Editar pessoa' : 'Quem mais você acompanha?'}</h3>
    <label class="pergunta" for="p-nome">Nome ou apelido</label>
    <input class="campo" id="p-nome" maxlength="30" value="${esc(f.nome)}" placeholder="Nome ou apelido" autocomplete="off">
    ${pessoa?.eu ? '' : `
    <div class="pergunta">Idade <small>opcional</small></div>
    <div class="chips chips-rolagem">
      ${IDADES.map(i => `<button class="chip" data-idade="${i}" aria-pressed="${f.idade === i}">${i}</button>`).join('')}
    </div>`}
    <div class="pergunta">Quem cuida junto</div>
    <div class="chips">
      ${Object.entries(AREAS).map(([id, a]) => `<button class="chip" data-area="${id}" aria-pressed="${f.equipe.has(id)}">${a.nome}</button>`).join('')}
    </div>
    <div class="folha-acoes">
      ${podeApagar ? `<button class="btn btn-fantasma" data-apagar style="color:#B8483A">${icone('lixo', 18)} Apagar pessoa</button>` : '<span></span>'}
      <button class="btn btn-primario" data-salvar disabled>${pessoa ? 'Salvar' : 'Adicionar'}</button>
    </div>`, (el, fechar) => {
    const nome = el.querySelector('#p-nome');
    const salvar = el.querySelector('[data-salvar]');
    const confere = () => { salvar.disabled = !nome.value.trim(); };
    confere();
    nome.addEventListener('input', () => { f.nome = nome.value; confere(); });
    el.querySelectorAll('[data-idade]').forEach(b => b.onclick = () => {
      f.idade = f.idade === b.dataset.idade ? '' : b.dataset.idade;
      el.querySelectorAll('[data-idade]').forEach(x => x.setAttribute('aria-pressed', x.dataset.idade === f.idade));
    });
    el.querySelectorAll('[data-area]').forEach(b => b.onclick = () => {
      const id = b.dataset.area;
      f.equipe.has(id) ? f.equipe.delete(id) : f.equipe.add(id);
      b.setAttribute('aria-pressed', f.equipe.has(id));
    });
    salvar.onclick = () => {
      const dados = { nome: f.nome.trim(), idade: pessoa?.eu ? null : (f.idade || null), equipe: [...f.equipe] };
      const p = pessoa ? (store.atualizarPessoa(pessoa.id, dados), { ...pessoa, ...dados }) : store.adicionarPessoa(dados);
      if (!pessoa) store.definirPessoaAtiva(p.id);
      fechar();
      toast(pessoa ? 'Salvo' : `${p.nome} adicionado(a)`);
      aoSalvar?.(p);
    };
    el.querySelector('[data-apagar]')?.addEventListener('click', async () => {
      fechar();
      const ok = await confirmar({
        titulo: `Apagar ${pessoa.nome}?`,
        texto: 'Todos os registros e lembretes dessa pessoa saem deste aparelho. Não dá para desfazer.',
        ok: 'Apagar', perigo: true,
      });
      if (ok) { store.removerPessoa(pessoa.id); toast('Pessoa apagada', 'lixo'); aoApagar?.(); }
    });
  });
}
