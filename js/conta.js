// CONTA — cadastro, login e cópia dos dados na nuvem (Lovable Cloud).
// O app funciona sem conta; com conta, os dados (sem fotos) são copiados logo depois de
// cada mudança e juntados ao entrar em outro aparelho.

import { store } from './store.js';
import { CONTA_LIGADA } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const URL_NUVEM = ''; // conta desligada neste link de teste
const CHAVE_PUBLICA = '';

let sb = null;
if (CONTA_LIGADA) try { sb = createClient(URL_NUVEM, CHAVE_PUBLICA, { auth: { persistSession: true, storageKey: 'atipario-sessao' } }); } catch { sb = null; }

let situacao = { disponivel: null, logado: false, email: null, pesquisa: false };
let recuperando = false; // aberto pelo link de "esqueci minha senha"
sb?.auth.onAuthStateChange(evento => {
  if (evento === 'PASSWORD_RECOVERY') { recuperando = true; avisar(); }
});
let sync = { pronto: false, pendente: false, ultimo: null, erro: false };
let temporizador = null;
const ouvintes = new Set();
const avisar = () => ouvintes.forEach(fn => fn());

const falha = erro => ({ ok: false, status: 400, dados: { erro } });
const sucesso = (dados = {}) => ({ ok: true, status: 200, dados });

function traduzir(msg = '') {
  if (/invalid login/i.test(msg)) return 'E-mail ou senha não conferem.';
  if (/already registered|already exists/i.test(msg)) return 'Já existe uma conta com esse e-mail.';
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/password/i.test(msg)) return 'A senha precisa ter pelo menos 8 caracteres.';
  return msg || 'Não deu certo. Tente de novo.';
}

async function lerConta(user) {
  const { data } = await sb.from('contas').select('pesquisa').eq('user_id', user.id).maybeSingle();
  situacao = { disponivel: true, logado: true, email: user.email, pesquisa: !!data?.pesquisa };
}

export const conta = {
  get situacao() { return situacao; },
  get sync() { return sync; },
  get recuperando() { return recuperando; },
  aoMudar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },

  async carregar() {
    if (!sb) { situacao = { disponivel: false, logado: false, email: null, pesquisa: false }; return avisar(); }
    const { data } = await sb.auth.getUser();
    if (data?.user) { await garantirConta(data.user); await lerConta(data.user); await puxar(); }
    else situacao = { disponivel: true, logado: false, email: null, pesquisa: false };
    avisar();
  },

  async cadastrar({ email, senha, responsavel, pesquisa, versaoTermo }) {
    if (senha.length < 8) return falha('A senha precisa ter pelo menos 8 caracteres.');
    localStorage.setItem('atipario-consentimento', JSON.stringify({ versaoTermo, responsavel, pesquisa }));
    const { data, error } = await sb.auth.signUp({
      email, password: senha,
      options: { emailRedirectTo: location.origin + '/atipario/index.html' },
    });
    if (error) return falha(traduzir(error.message));
    if (!data.session) return falha('Conta criada! Enviamos um link para seu e-mail. Confirme e depois entre aqui.');
    return depoisDeEntrar(data.user);
  },

  async entrar({ email, senha }) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) return falha(traduzir(error.message));
    return depoisDeEntrar(data.user);
  },

  /** Manda o e-mail de senha nova. A resposta é a mesma exista ou não a conta. */
  async recuperarSenha(email) {
    await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/atipario/index.html' }).catch(() => null);
    return sucesso();
  },

  async definirSenhaNova(senha) {
    if (senha.length < 8) return falha('A senha precisa ter pelo menos 8 caracteres.');
    const { error } = await sb.auth.updateUser({ password: senha });
    if (error) return falha(traduzir(error.message));
    recuperando = false;
    avisar();
    return sucesso();
  },

  async sair() {
    await empurrar(); // guarda o que faltava antes de sair
    await sb.auth.signOut();
    store.apagarTudo(); // a memória fica na conta, não no aparelho de outra pessoa
    localStorage.removeItem('atipario-usuario');
    situacao = { disponivel: true, logado: false, email: null, pesquisa: false };
    sync = { pronto: false, pendente: false, ultimo: null, erro: false };
    avisar();
  },

  async excluir(senha) {
    const { error } = await sb.auth.signInWithPassword({ email: situacao.email, password: senha });
    if (error) return falha('Senha incorreta.');
    const { data: s } = await sb.auth.getSession();
    const r = await fetch('/api/excluir-conta', { method: 'POST', headers: { Authorization: `Bearer ${s.session.access_token}` } })
      .catch(() => null);
    if (!r?.ok) return falha('Não consegui excluir agora. Tente de novo.');
    await sb.auth.signOut();
    situacao = { disponivel: true, logado: false, email: null, pesquisa: false };
    sync = { pronto: false, pendente: false, ultimo: null, erro: false };
    avisar();
    return sucesso();
  },

  async definirPesquisa(aceito) {
    const { error } = await sb.from('contas').update({ pesquisa: aceito }).eq('user_id', (await sb.auth.getUser()).data.user.id);
    if (error) return falha('Não consegui mudar.');
    situacao = { ...situacao, pesquisa: aceito };
    if (aceito) await empurrar();
    else await sb.from('pesquisa').delete().eq('user_id', (await sb.auth.getUser()).data.user.id); // só a do próprio usuário
    avisar();
    return sucesso({ pesquisa: aceito });
  },

  async baixarMeusDados() {
    const [c, d, p] = await Promise.all([
      sb.from('contas').select('*').maybeSingle(),
      sb.from('dados').select('*').maybeSingle(),
      sb.from('pesquisa').select('*').maybeSingle(),
    ]);
    const tudo = { email: situacao.email, consentimento: c.data, dados: d.data, pesquisa: p.data };
    const blob = new Blob([JSON.stringify(tudo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'atipario-meus-dados.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return sucesso();
  },

  empurrarJa: () => empurrar(),

  /** Endereço do calendário que se atualiza sozinho no celular (só com conta). */
  async linkCalendario() {
    if (!situacao.logado) return null;
    const { data } = await sb.from('contas').select('calendario_token').maybeSingle();
    if (!data?.calendario_token) return null;
    return `${location.host}/api/public/calendario/${data.calendario_token}.ics`;
  },
};

/** Grava o consentimento dado no cadastro (no primeiro acesso depois de confirmar o e-mail). */
async function garantirConta(user) {
  const { data } = await sb.from('contas').select('user_id').eq('user_id', user.id).maybeSingle();
  if (data) return;
  const c = JSON.parse(localStorage.getItem('atipario-consentimento') || 'null');
  if (!c) return;
  await sb.from('contas').insert({ user_id: user.id, termo_versao: c.versaoTermo, responsavel: !!c.responsavel, pesquisa: !!c.pesquisa });
  localStorage.removeItem('atipario-consentimento');
}

async function depoisDeEntrar(user) {
  localStorage.removeItem('atipario-sem-conta');
  if (store.prefs.exemplo) store.apagarTudo(); // não mistura os fictícios com os dados da conta
  await garantirConta(user);
  await lerConta(user);
  await puxar();
  avisar();
  return sucesso(situacao);
}

async function puxar() {
  const { data, error } = await sb.from('dados').select('estado').maybeSingle();
  if (error) { sync.erro = true; return; }
  if (data?.estado) store.mesclarEstado(data.estado);
  sync.pronto = true;
  await empurrar();
}

async function empurrar() {
  if (!situacao.logado || !sync.pronto || !store.perfil || store.prefs.exemplo) return; // dado de exemplo não sobe
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return;
  const estado = store.exportarEstado();
  const { error } = await sb.from('dados').upsert({ user_id: u.user.id, estado, atualizado_em: new Date().toISOString() });
  if (!error && situacao.pesquisa) {
    // Cópia reduzida: sem nome, frases, remédios ou fotos.
    const registros = estado.registros
      .filter(r => r.tipo !== 'remedio' && r.tipo !== 'documento')
      .map(r => ({ data: r.data, tipo: r.tipo, area: r.area || null, humor: r.humor || null, marcadores: r.marcadores || [] }));
    await sb.from('pesquisa').upsert({ user_id: u.user.id, registros, atualizado_em: new Date().toISOString() });
  }
  sync.erro = !!error;
  sync.pendente = !!error;
  if (!error) sync.ultimo = new Date();
  avisar();
}

store.aoMudar(() => {
  if (!situacao.logado || !sync.pronto) return;
  clearTimeout(temporizador);
  temporizador = setTimeout(empurrar, 1500);
});
window.addEventListener('online', () => { if (sync.pendente) empurrar(); });
