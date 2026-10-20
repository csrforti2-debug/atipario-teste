// APP — ponto de partida. Liga tema, mostra a abertura e troca de tela conforme o
// endereço (#/inicio, #/historico, ...). Cada tela mora em js/telas/.
// Registrar não é tela: é um fluxo de popups (js/fluxos/registro.js) aberto pelo "+".

import { store } from './store.js';
import { icone } from './icones.js';
import { APP } from './config.js';
import { aplicarTema } from './tema.js';
import { logoComCaneta, desenharComCaneta, movimentoReduzido } from './movimento.js';
import { abrirRegistro } from './fluxos/registro.js';

import * as boasVindas from './telas/boas-vindas.js';
import * as inicio from './telas/inicio.js';
import * as historico from './telas/historico.js';
import * as relatorio from './telas/relatorio.js';
import * as perfil from './telas/perfil.js';
import * as lembretes from './telas/lembretes.js';
import * as contaTela from './telas/conta.js';
import * as quem from './telas/quem.js';
import { precisaEscolher } from './pessoas.js';
import * as remedios from './telas/remedios.js';
import { conta } from './conta.js';
import { iniciarAvisos } from './lembretes.js';
import { toast } from './ui.js';

// rota → { tela, mostra a barra de navegação? }
const ROTAS = {
  'boas-vindas': { tela: boasVindas, nav: false },
  'quem':        { tela: quem,       nav: false },  // com 2+ pessoas: de quem é a vez (abre o app)
  'inicio':      { tela: inicio,     nav: true },
  'historico':   { tela: historico,  nav: true },
  'relatorio':   { tela: relatorio,  nav: true },
  'perfil':      { tela: perfil,     nav: true },
  'lembretes':   { tela: lembretes,  nav: true },   // chega pelo sino do Início e pelo Perfil
  'conta':       { tela: contaTela,  nav: false },  // entrar, criar conta, cuidar da conta (opcional)
  'remedios':    { tela: remedios,   nav: true },   // consulta a uma base de informações sobre remédios
};

const url = new URLSearchParams(location.search);

// ---------- navegação ----------
function ir(rota) {
  location.hash = '#/' + rota;
}

function lerRota() {
  const [nome, busca = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { nome: nome || 'inicio', params: Object.fromEntries(new URLSearchParams(busca)) };
}

let limparAnterior = null;
let primeira = true;
// Volta de um link de e-mail (confirmar conta, senha nova): o endereço traz o código de acesso
// depois do "#". Espera a conta ler esse código antes de usar o "#" para trocar de tela.
let esperandoEmail = /access_token=|error_description=/.test(location.hash);

function render() {
  if (esperandoEmail) return;
  const { nome, params } = lerRota();
  // Conta é opcional: sem perfil, começa pelas boas-vindas.
  if (!store.perfil && nome !== 'boas-vindas' && nome !== 'conta') { ir('boas-vindas'); return; }
  if (!ROTAS[nome]) { ir('inicio'); return; }
  if (nome === 'inicio' && precisaEscolher()) { ir('quem'); return; }

  const el = document.getElementById('tela');
  // Transição: a tela atual some rápido (120 ms) e a nova entra subindo de leve.
  if (!primeira && !movimentoReduzido() && el.firstElementChild) {
    el.classList.add('tela-saindo');
    setTimeout(() => { el.classList.remove('tela-saindo'); montar(nome, params); }, 120);
  } else montar(nome, params);
  primeira = false;
}

function montar(nome, params) {
  const { tela, nav } = ROTAS[nome];
  const el = document.getElementById('tela');
  limparAnterior?.();
  el.className = nav ? '' : 'sem-nav';
  el.innerHTML = '';
  window.scrollTo(0, 0);
  limparAnterior = tela.render(el, { params, ir }) || null;
  el.firstElementChild?.classList.add('tela-entra');
  // Assinatura da marca: o logo do topo se redesenha a cada troca de tela.
  el.querySelector('.topo .logo')?.classList.add('logo--retraco');
  desenharNav(nav ? (['lembretes', 'remedios'].includes(nome) ? 'perfil' : nome) : null);
}

function desenharNav(ativa) {
  const nav = document.getElementById('nav');
  nav.hidden = !ativa;
  if (!ativa) return;
  const item = (rota, ic, rotulo) =>
    `<a class="nav-item" href="#/${rota}" ${ativa === rota ? 'aria-current="page"' : ''}>${icone(ic, 24)}<span>${rotulo}</span></a>`;
  nav.innerHTML = `
    <div class="nav-barra">
      ${item('inicio', 'casa', 'Início')}
      ${item('historico', 'linha', 'Histórico')}
      <button class="nav-mais-item" aria-label="Novo registro"><span class="nav-mais">${icone('mais', 30)}</span><span aria-hidden="true">Registrar</span></button>
      ${item('relatorio', 'relatorio', 'Relatório')}
      ${item('perfil', 'perfil', 'Perfil')}
    </div>`;
  // Depois de salvar, fica na mesma tela (a comemoração já confirma), só redesenha.
  nav.querySelector('.nav-mais-item').onclick = () => abrirRegistro({ aoSalvar: () => montar(lerRota().nome, {}) });
}

// ---------- abertura: o traço se desenha com a ponta da caneta ----------
async function abertura() {
  if (url.get('splash') === '0') return;
  const el = document.createElement('div');
  el.className = 'splash';
  el.innerHTML = `
    ${logoComCaneta({ tamanho: 140, espessura: 5 })}
    <div class="palavra-marca splash-palavra">${[...APP.nome].map((l, k) => `<span style="--k:${k}">${l}</span>`).join('')}</div>
    <div class="splash-convite">${APP.convite}</div>`;
  document.body.appendChild(el);
  const sair = () => { el.classList.add('splash--sai'); setTimeout(() => el.remove(), 600); };
  el.addEventListener('click', sair, { once: true });

  await desenharComCaneta(el.querySelector('svg'), 1500);
  el.classList.add('splash--desenhado'); // dispara o "pulinho" do logo e as letras
  setTimeout(sair, movimentoReduzido() ? 400 : 1300);
}

// ---------- partida ----------
if (url.get('demo') === '1' && !store.perfil) store.carregarExemplo();
aplicarTema();
window.addEventListener('hashchange', render);
abertura();
render();
// Pergunta se há conta aberta; se trouxer dados de outro aparelho, redesenha a tela.
conta.carregar().then(() => {
  const vinhaDoEmail = esperandoEmail;
  esperandoEmail = false;
  const destino = conta.recuperando ? 'conta' : (vinhaDoEmail || (store.perfil && lerRota().nome === 'boas-vindas')) ? (store.perfil ? 'inicio' : 'boas-vindas') : null;
  if (destino && lerRota().nome !== destino) ir(destino);
  else if (destino || lerRota().nome === 'inicio') render();
});
// Abriu pelo link de senha nova depois de o app já estar aberto.
conta.aoMudar(() => { if (conta.recuperando && !esperandoEmail && lerRota().nome !== 'conta') ir('conta'); });
// Avisos de lembrete enquanto o app está aberto (com o app fechado, só o calendário do celular toca).
iniciarAvisos(texto => { if (store.perfil) toast(texto, 'sino'); });
