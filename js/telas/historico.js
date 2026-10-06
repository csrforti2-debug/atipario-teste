// HISTÓRICO — a linha do tempo completa, agrupada por dia, com filtro por tipo.
// Tocar num registro abre os detalhes num popup, com opções de editar e apagar.

import { store } from '../store.js';
import { seletorPessoas, ligarSeletor } from '../pessoas.js';
import { TIPOS, HUMOR } from '../config.js';
import { logo, rosto } from '../marca.js';
import { icone } from '../icones.js';
import { esc, abrirFolha, confirmar, toast } from '../ui.js';
import { rotuloDia, longa } from '../datas.js';
import { selo, tituloRegistro } from '../analise.js';
import { abrirRegistro } from '../fluxos/registro.js';

let filtro = 'tudo'; // lembra o filtro enquanto o app está aberto

export function render(el, ctx) {
  const todos = store.registros;
  const tiposUsados = Object.keys(TIPOS).filter(t => todos.some(r => r.tipo === t));
  if (filtro !== 'tudo' && !tiposUsados.includes(filtro)) filtro = 'tudo';
  const visiveis = filtro === 'tudo' ? todos : todos.filter(r => r.tipo === filtro);
  const redesenhar = () => render(el, { ...ctx, params: {} });

  el.innerHTML = `
  <div>
    <header class="topo">
      <h2>Histórico</h2>
      <span class="suave pequeno">${visiveis.length} ${visiveis.length === 1 ? 'registro' : 'registros'}</span>
    </header>
    ${seletorPessoas()}
    ${tiposUsados.length > 1 ? `
    <div class="chips chips-rolagem" role="toolbar" aria-label="Filtrar">
      <button class="chip" data-filtro="tudo" aria-pressed="${filtro === 'tudo'}">Tudo</button>
      ${tiposUsados.map(t => `<button class="chip" data-filtro="${t}" aria-pressed="${filtro === t}">${TIPOS[t].rotulo}</button>`).join('')}
    </div>` : ''}
    <div class="linha-tempo">${linhaDoTempo(visiveis, ctx.params.novo)}</div>
  </div>`;

  ligarSeletor(el, redesenhar);
  el.querySelectorAll('[data-filtro]').forEach(b => b.onclick = () => { filtro = b.dataset.filtro; redesenhar(); });
  el.querySelectorAll('[data-reg]').forEach(b => b.onclick = () => abrirDetalhe(todos.find(r => r.id === b.dataset.reg), redesenhar));
  el.querySelector('[data-comecar]')?.addEventListener('click', () => abrirRegistro({ aoSalvar: redesenhar }));
}

function linhaDoTempo(registros, idNovo) {
  if (!registros.length) return `
    <div class="vazio">
      ${logo({ tamanho: 72, cor: 'var(--ink-faint)', espessura: 5 })}
      <h2>A história começa no primeiro registro.</h2>
      <p class="suave">Leva uns 10 segundos.</p>
      <button class="btn btn-primario" data-comecar>${icone('mais', 20)} Registrar agora</button>
    </div>`;

  const dias = new Map();
  registros.forEach(r => { if (!dias.has(r.data)) dias.set(r.data, []); dias.get(r.data).push(r); });

  return [...dias.entries()].map(([data, lista]) => `
    <div class="dia">
      <div class="dia-rotulo">${rotuloDia(data)}</div>
      ${lista.map(r => cartaoRegistro(r, r.id === idNovo)).join('')}
    </div>`).join('');
}

function cartaoRegistro(r, novo) {
  const marc = (r.marcadores || []).filter(m => !(r.tipo === 'documento' && m === r.marcadores[0]));
  return `
  <button class="registro ${novo ? 'registro--novo' : ''}" data-reg="${r.id}">
    ${selo(r.tipo)}
    <span>
      <span class="registro-titulo">${esc(tituloRegistro(r))}</span>
      ${r.nota ? `<span class="registro-nota">“${esc(r.nota)}”</span>` : ''}
      ${marc.length ? `<span class="chips">${marc.map(m => `<span class="chip-mini">${esc(m)}</span>`).join('')}</span>` : ''}
    </span>
    <span class="registro-lado">
      ${r.humor ? rosto(r.humor, 26) : ''}
      ${r.foto ? `<img class="registro-foto" src="${r.foto}" alt="">` : ''}
    </span>
  </button>`;
}

export function abrirDetalhe(r, depois) {
  if (!r) return;
  abrirFolha(`
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
      ${selo(r.tipo, 24)}
      <div><h3>${esc(tituloRegistro(r))}</h3><p class="suave pequeno">${longa(r.data)}</p></div>
    </div>
    ${r.foto ? `<img src="${r.foto}" alt="Foto do registro" style="border-radius:var(--r-md);margin-bottom:14px;width:100%">` : ''}
    ${r.humor ? `<p style="display:flex;align-items:center;gap:8px;margin-bottom:10px">${rosto(r.humor, 28)} <b>${HUMOR[r.humor]}</b></p>` : ''}
    ${r.marcadores?.length ? `<div class="chips" style="margin-bottom:12px">${r.marcadores.map(m => `<span class="chip-mini">${esc(m)}</span>`).join('')}</div>` : ''}
    ${r.gatilhos?.length ? `<p class="suave pequeno" style="margin:0 0 6px">Desencadeou</p><div class="chips" style="margin-bottom:12px">${r.gatilhos.map(m => `<span class="chip-mini">${esc(m)}</span>`).join('')}</div>` : ''}
    ${r.ajudou?.length ? `<p class="suave pequeno" style="margin:0 0 6px">Ajudou</p><div class="chips" style="margin-bottom:12px">${r.ajudou.map(m => `<span class="chip-mini">${esc(m)}</span>`).join('')}</div>` : ''}
    ${r.nota ? `<p style="font-style:italic" class="suave">“${esc(r.nota)}”</p>` : ''}
    <div class="folha-acoes">
      <button class="btn btn-fantasma" data-apagar>${icone('lixo', 18)} Apagar</button>
      <button class="btn btn-secundario" data-editar>Editar</button>
    </div>`, (el, fechar) => {
    el.querySelector('[data-editar]').onclick = () => { fechar(); abrirRegistro({ registro: r, aoSalvar: depois }); };
    el.querySelector('[data-apagar]').onclick = async () => {
      fechar();
      if (await confirmar({ titulo: 'Apagar este registro?', texto: 'Ele sai do histórico e do relatório.', ok: 'Apagar', perigo: true })) {
        store.remover(r.id);
        toast('Registro apagado', 'lixo');
        depois();
      }
    };
  });
}
