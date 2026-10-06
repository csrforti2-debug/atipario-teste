// STORE — onde os dados moram. Sempre primeiro no próprio aparelho (localStorage); se a
// pessoa criar uma conta, js/conta.js manda uma cópia para o servidor. O app funciona igual
// sem conta. Dado de saúde é dado sensível (LGPD, art. 11): ver memoria/base-legal.md.
//
// Uma conta acompanha uma ou mais PESSOAS (filhos, irmãos, a própria pessoa...). Cada registro
// e cada lembrete pertence a uma pessoa (pessoaId). `store.registros` devolve só os da pessoa
// ativa; o relatório nunca mistura duas pessoas.

import { gerarExemplo } from './dados-exemplo.js';

const CHAVE = 'atipario:v1';
const CHAVE_ANTIGA = 'atipicando:v1'; // nome anterior do app: quem já tinha dados não perde nada
const VERSAO = 2;

const vazio = () => ({
  versao: VERSAO,
  perfil: null,     // { quem: {nome, relacao}, pessoas: [{ id, nome, idade, eu, equipe: [areaId] }] }
  registros: [],    // { id, pessoaId, data:'AAAA-MM-DD', criadoEm, tipo, area?, humor?, marcadores[], gatilhos[]?, ajudou[]?, nota?, foto? }
  lembretes: [],    // { id, pessoaId, tipo:'remedio'|'atividade'|'retorno'|'checkin', titulo, hora:'HH:MM', dias:[0-6] (vazio = todos), data? (retorno), area?, ativo, feitos:{'AAAA-MM-DD':true|registroId} }
  prefs: { tema: 'caderno' },
});

export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Versão 1 tinha uma pessoa só (perfil.pessoa e perfil.equipe). Passa para a lista de pessoas. */
function migrar(e) {
  if (e.perfil && !e.perfil.pessoas) {
    const p = e.perfil;
    const eu = p.quem?.relacao === 'eu' || !p.pessoa;
    const pessoa = {
      id: 'p1',
      nome: eu ? p.quem?.nome || '' : p.pessoa.nome,
      idade: eu ? null : p.pessoa.idade || null,
      eu,
      equipe: p.equipe || [],
    };
    e.perfil = { quem: p.quem, pessoas: [pessoa] };
    e.prefs = { ...e.prefs, pessoaAtiva: 'p1' };
  }
  const primeira = e.perfil?.pessoas?.[0]?.id;
  if (primeira) {
    e.registros.forEach(r => { r.pessoaId ||= primeira; });
    e.lembretes.forEach(l => { l.pessoaId ||= primeira; });
  }
  e.versao = VERSAO;
  return e;
}

let estado = ler();
const ouvintes = new Set();

function ler() {
  try {
    const texto = localStorage.getItem(CHAVE) ?? localStorage.getItem(CHAVE_ANTIGA);
    return migrar(texto ? { ...vazio(), ...JSON.parse(texto) } : vazio());
  } catch {
    return vazio();
  }
}

function gravar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    ouvintes.forEach(fn => fn(estado));
    return true;
  } catch (erro) {
    console.warn('Não consegui salvar (espaço cheio?)', erro);
    return false;
  }
}

const ativaId = () => {
  const ps = estado.perfil?.pessoas || [];
  return ps.find(p => p.id === estado.prefs.pessoaAtiva)?.id || ps[0]?.id || null;
};

export const store = {
  get perfil() { return estado.perfil; },
  get prefs() { return estado.prefs; },

  // ---------- pessoas ----------
  get pessoas() { return estado.perfil?.pessoas || []; },
  get pessoaAtiva() { return this.pessoas.find(p => p.id === ativaId()) || null; },
  pessoa(id) { return this.pessoas.find(p => p.id === id) || null; },

  definirPessoaAtiva(id) {
    if (!this.pessoa(id)) return false;
    estado.prefs = { ...estado.prefs, pessoaAtiva: id };
    return gravar();
  },

  adicionarPessoa({ nome, idade = null, equipe = [], eu = false }) {
    const p = { id: novoId(), nome, idade, eu, equipe };
    estado.perfil = { ...estado.perfil, pessoas: [...this.pessoas, p] };
    gravar();
    return p;
  },

  atualizarPessoa(id, mudancas) {
    const p = this.pessoa(id);
    if (!p) return false;
    Object.assign(p, mudancas);
    return gravar();
  },

  /** Apaga a pessoa E tudo dela (registros e lembretes). Não deixa apagar a última. */
  removerPessoa(id) {
    if (this.pessoas.length < 2 || !this.pessoa(id)) return false;
    estado.perfil = { ...estado.perfil, pessoas: this.pessoas.filter(p => p.id !== id) };
    estado.registros = estado.registros.filter(r => r.pessoaId !== id);
    estado.lembretes = estado.lembretes.filter(l => l.pessoaId !== id);
    if (estado.prefs.pessoaAtiva === id) estado.prefs = { ...estado.prefs, pessoaAtiva: estado.perfil.pessoas[0].id };
    return gravar();
  },

  salvarPerfil(perfil) {
    estado.perfil = perfil;
    estado.prefs = { ...estado.prefs, pessoaAtiva: perfil.pessoas?.[0]?.id };
    return gravar();
  },

  // ---------- registros ----------
  /** Registros da pessoa ativa, do mais novo para o mais antigo. */
  get registros() {
    const id = ativaId();
    return this.todosRegistros.filter(r => r.pessoaId === id);
  },

  /** Registros de todas as pessoas (para lembretes e sincronização). */
  get todosRegistros() {
    return [...estado.registros].sort((a, b) =>
      b.data.localeCompare(a.data) || (b.criadoEm || '').localeCompare(a.criadoEm || ''));
  },

  adicionar(registro) {
    const r = { id: novoId(), criadoEm: new Date().toISOString(), marcadores: [], pessoaId: ativaId(), ...registro };
    estado.registros.push(r);
    if (!gravar()) {
      estado.registros.pop();
      return null;
    }
    return r;
  },

  atualizar(id, mudancas) {
    const r = estado.registros.find(x => x.id === id);
    if (!r) return false;
    Object.assign(r, mudancas);
    return gravar();
  },

  remover(id) {
    estado.registros = estado.registros.filter(r => r.id !== id);
    return gravar();
  },

  // ---------- lembretes (só o que a família combinou; o app não sugere dose nem horário) ----------
  get lembretes() { return estado.lembretes; },

  adicionarLembrete(l) {
    const novo = { id: novoId(), pessoaId: ativaId(), ativo: true, dias: [], feitos: {}, ...l };
    estado.lembretes.push(novo);
    gravar();
    return novo;
  },

  atualizarLembrete(id, mudancas) {
    const l = estado.lembretes.find(x => x.id === id);
    if (!l) return false;
    Object.assign(l, mudancas);
    return gravar();
  },

  removerLembrete(id) {
    estado.lembretes = estado.lembretes.filter(l => l.id !== id);
    return gravar();
  },

  /** Marca um lembrete como feito num dia. `registroId` liga ao registro criado (remédio), para poder desfazer. */
  marcarFeito(id, dia, registroId = null) {
    const l = estado.lembretes.find(x => x.id === id);
    if (!l) return false;
    l.feitos = { ...l.feitos, [dia]: registroId || true };
    return gravar();
  },

  /** Desfaz o "feito" e devolve o id do registro que tinha sido criado (ou null). */
  desfazerFeito(id, dia) {
    const l = estado.lembretes.find(x => x.id === id);
    if (!l) return null;
    const v = l.feitos?.[dia];
    const { [dia]: _, ...resto } = l.feitos || {};
    l.feitos = resto;
    gravar();
    return typeof v === 'string' ? v : null;
  },

  definirPref(chave, valor) {
    estado.prefs = { ...estado.prefs, [chave]: valor };
    return gravar();
  },

  carregarExemplo() {
    const { perfil, registros, lembretes } = gerarExemplo(new Date());
    estado = { ...vazio(), prefs: { ...estado.prefs, pessoaAtiva: perfil.pessoas[0].id }, perfil, registros, lembretes: lembretes || [] };
    return gravar();
  },

  apagarTudo() {
    estado = { ...vazio(), prefs: { tema: estado.prefs.tema } };
    return gravar();
  },

  // ---------- conta: cópia no servidor (js/conta.js) ----------
  /** O que vai para o servidor: tudo, menos as fotos (a foto de documento é o dado mais sensível e fica no aparelho). */
  exportarEstado() {
    const { perfil, registros, lembretes } = estado;
    return {
      versao: VERSAO,
      perfil,
      registros: registros.map(({ foto, ...r }) => r),
      lembretes,
    };
  },

  /** Junta o que veio da conta com o que já existe no aparelho, sem apagar nada local. Devolve true se mudou algo. */
  mesclarEstado(remoto) {
    if (!remoto) return false;
    const r = migrar({ ...vazio(), ...remoto, prefs: {} });
    let mudou = false;
    if (!estado.perfil && r.perfil) { estado.perfil = r.perfil; mudou = true; }
    else if (estado.perfil && r.perfil) {
      const ids = new Set(estado.perfil.pessoas.map(p => p.id));
      const novas = r.perfil.pessoas.filter(p => !ids.has(p.id));
      if (novas.length) { estado.perfil = { ...estado.perfil, pessoas: [...estado.perfil.pessoas, ...novas] }; mudou = true; }
    }
    const juntar = (local, remota) => {
      const ids = new Set(local.map(x => x.id));
      const novos = remota.filter(x => !ids.has(x.id));
      if (novos.length) mudou = true;
      return [...local, ...novos];
    };
    estado.registros = juntar(estado.registros, r.registros);
    estado.lembretes = juntar(estado.lembretes, r.lembretes);
    if (mudou) { estado.prefs = { ...estado.prefs, pessoaAtiva: ativaId() }; gravar(); }
    return mudou;
  },

  aoMudar(fn) {
    ouvintes.add(fn);
    return () => ouvintes.delete(fn);
  },
};

// Nome de quem está sendo acompanhado agora, e o jeito de falar dele/dela na interface.
export const nomePessoa = () => store.pessoaAtiva?.nome || '';
export const nomeDe = id => store.pessoa(id)?.nome || '';
export const ehEu = () => !!store.pessoaAtiva?.eu;
