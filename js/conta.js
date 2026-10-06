// CONTA — o lado do app para cadastro, login e cópia dos dados no servidor (api.py).
// O app funciona sem conta; com conta, os dados (sem fotos) são copiados para o servidor
// logo depois de cada mudança e juntados ao entrar em outro aparelho. Sem servidor
// disponível (ex.: página aberta como arquivo), tudo segue só no aparelho.

import { store } from './store.js';

const CABECALHOS = { 'Content-Type': 'application/json', 'X-Atipario': '1' };

let situacao = { disponivel: null, logado: false, email: null, pesquisa: false };
let sync = { pronto: false, pendente: false, ultimo: null, erro: false };
let temporizador = null;
const ouvintes = new Set();
const avisar = () => ouvintes.forEach(fn => fn());

async function chamar(metodo, caminho, corpo) {
  try {
    const r = await fetch(caminho, {
      method: metodo, headers: CABECALHOS, credentials: 'same-origin',
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const dados = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, dados };
  } catch {
    return { ok: false, status: 0, dados: { erro: 'Sem conexão com o servidor do atipario.' } };
  }
}

export const conta = {
  get situacao() { return situacao; },
  get sync() { return sync; },
  aoMudar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },

  /** Pergunta ao servidor se há sessão aberta. Chamado ao abrir o app. */
  async carregar() {
    const r = await chamar('GET', '/api/eu');
    situacao = r.ok && typeof r.dados.logado === 'boolean'
      ? { disponivel: true, ...r.dados }
      : { disponivel: false, logado: false, email: null, pesquisa: false };
    if (situacao.logado) await puxar();
    avisar();
  },

  async cadastrar({ email, senha, termo, responsavel, pesquisa, versaoTermo }) {
    const r = await chamar('POST', '/api/cadastro', { email, senha, termo, responsavel, pesquisa, versaoTermo });
    return depoisDeEntrar(r);
  },

  async entrar({ email, senha }) {
    return depoisDeEntrar(await chamar('POST', '/api/entrar', { email, senha }));
  },

  async sair() {
    await chamar('POST', '/api/sair', {});
    situacao = { disponivel: true, logado: false, email: null, pesquisa: false };
    sync = { pronto: false, pendente: false, ultimo: null, erro: false };
    avisar();
  },

  /** Exclui a conta e a cópia no servidor. Os dados deste aparelho continuam aqui. */
  async excluir(senha) {
    const r = await chamar('POST', '/api/excluir', { senha });
    if (r.ok) {
      situacao = { disponivel: true, logado: false, email: null, pesquisa: false };
      sync = { pronto: false, pendente: false, ultimo: null, erro: false };
      avisar();
    }
    return r;
  },

  async definirPesquisa(aceito) {
    const r = await chamar('POST', '/api/pesquisa', { aceito });
    if (r.ok) { situacao = { ...situacao, pesquisa: !!r.dados.pesquisa }; avisar(); }
    return r;
  },

  /** Baixa tudo que o servidor tem da pessoa (direito de acesso e portabilidade). */
  async baixarMeusDados() {
    const r = await chamar('GET', '/api/exportar');
    if (!r.ok) return r;
    const blob = new Blob([JSON.stringify(r.dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'atipario-meus-dados.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return r;
  },

  empurrarJa: () => empurrar(),
};

async function depoisDeEntrar(r) {
  if (!r.ok) return r;
  situacao = { disponivel: true, ...r.dados };
  await puxar();
  avisar();
  return r;
}

/** Traz o que está na conta e junta com o que há no aparelho (nada local é apagado). */
async function puxar() {
  const r = await chamar('GET', '/api/dados');
  if (r.ok) {
    store.mesclarEstado(r.dados.estado);
    sync.pronto = true;
    await empurrar();
  } else sync.erro = true;
}

async function empurrar() {
  if (!situacao.logado || !sync.pronto || !store.perfil) return;
  const r = await chamar('PUT', '/api/dados', { estado: store.exportarEstado() });
  sync.erro = !r.ok;
  sync.pendente = !r.ok;
  if (r.ok) sync.ultimo = new Date();
  avisar();
}

// A cada mudança nos dados, copia para a conta (esperando 1,5 s para juntar toques seguidos).
store.aoMudar(() => {
  if (!situacao.logado || !sync.pronto) return;
  clearTimeout(temporizador);
  temporizador = setTimeout(empurrar, 1500);
});
window.addEventListener('online', () => { if (sync.pendente) empurrar(); });
