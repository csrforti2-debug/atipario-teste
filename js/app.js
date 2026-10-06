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
import * as remedios from './telas/remedios.js';
import { conta } from './conta.js';
import { iniciarAvisos } from './lembretes.js';
import { toast } from './ui.js';

// rota → { tela, mostra a barra de navegação? }
const ROTAS = {
  'boas-vindas': { tela: boasVindas, nav: false },
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

function render() {
  const { nome, params } = lerRota();
  if (!store.perfil && nome !== 'boas-vindas' && nome !== 'conta') { ir('boas-vindas'); return; }
  if (!ROTAS[nome]) { ir('inicio'); return; }

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
      <button class="nav-mais" aria-label="Novo registro">${icone('mais', 30)}</button>
      ${item('relatorio', 'relatorio', 'Relatório')}
      ${item('perfil', 'perfil', 'Perfil')}
    </div>`;
  // Depois de salvar, fica na mesma tela (a comemoração já confirma), só redesenha.
  nav.querySelector('.nav-mais').onclick = () => abrirRegistro({ aoSalvar: () => montar(lerRota().nome, {}) });
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
// Pergunta ao servidor se há conta aberta; se trouxer dados novos de outro aparelho, redesenha a tela.
conta.carregar().then(() => { if (store.perfil && lerRota().nome === 'boas-vindas') ir('inicio'); else if (lerRota().nome === 'inicio') render(); });
// Avisos de lembrete enquanto o app está aberto (com o app fechado, só o calendário do celular toca).
iniciarAvisos(texto => { if (store.perfil) toast(texto, 'sino'); });
