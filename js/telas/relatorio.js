// RELATÓRIO — o que a família leva para a equipe. Um resumo só, igual para todos
// os profissionais: é assim que a fono fica sabendo do que a TO e a escola viram.
// Saídas: texto pronto para o WhatsApp e PDF (pela impressão do navegador).

import { store, nomePessoa, ehEu } from '../store.js';
import { seletorPessoas, ligarSeletor } from '../pessoas.js';
import { TIPOS, AREAS, RELACOES, AVISO_RELATORIO, APP } from '../config.js';
import { logo } from '../marca.js';
import { icone } from '../icones.js';
import { esc, toast, curva } from '../ui.js';
import { diaISO, curta, hojeISO } from '../datas.js';
import { selo, doPeriodo, pontosCurva, mediaHumor, tendencia, contarMarcadores, tituloRegistro, contarCampo } from '../analise.js';

const PERIODOS = [
  { dias: 7, rotulo: '7 dias', fatia: 1 },
  { dias: 30, rotulo: '30 dias', fatia: 3 },
  { dias: 90, rotulo: '3 meses', fatia: 7 },
];
let periodo = PERIODOS[1];

export function render(el, ctx) {
  const perfil = store.perfil;
  const pessoa = nomePessoa();
  const eu = ehEu();
  const regs = doPeriodo(store.registros, periodo.dias);
  const pontos = pontosCurva(regs, periodo.dias, periodo.fatia);
  const media = mediaHumor(regs);
  const tend = tendencia(pontos);
  const relacao = RELACOES.find(r => r.id === perfil.quem.relacao);
  const inicio = diaISO(periodo.dias - 1);

  const porTipo = Object.keys(TIPOS).map(t => [t, regs.filter(r => r.tipo === t)]).filter(([, l]) => l.length);
  const sessoes = regs.filter(r => r.tipo === 'sessao').length;
  const diasComRegistro = new Set(regs.map(r => r.data)).size;
  const gatilhos = contarCampo(regs, 'gatilhos').filter(([m]) => m !== 'Outro').slice(0, 5);
  const ajudou = contarCampo(regs, 'ajudou').filter(([m]) => m !== 'Outro').slice(0, 5);

  el.innerHTML = `
  <div>
    <header class="topo">
      <h2>Relatório</h2>
      <span class="suave pequeno">para a equipe</span>
    </header>

    ${seletorPessoas()}
    <div class="chips rel-controles" role="radiogroup" aria-label="Período">
      ${PERIODOS.map(p => `<button class="chip" data-dias="${p.dias}" aria-pressed="${p === periodo}">${p.rotulo}</button>`).join('')}
    </div>

    ${!regs.length ? `
      <div class="vazio">
        ${logo({ tamanho: 64, cor: 'var(--ink-faint)', espessura: 5 })}
        <h2>Ainda não tem o que resumir aqui.</h2>
        <p class="suave">Registre alguns dias e o relatório se monta sozinho.</p>
      </div>` : `
    <article class="folha-relatorio" id="folha">
      <div class="rel-cabeca">
        <div>
          <p class="suave pequeno">Resumo de acompanhamento</p>
          <h2>${esc(pessoa)}${store.pessoaAtiva?.idade ? `, ${esc(store.pessoaAtiva.idade)} anos` : ''}</h2>
          <p class="suave pequeno">${curta(inicio)} a ${curta(hojeISO())} · registrado por ${esc(perfil.quem.nome)} (${relacao?.noRelatorio || ''})</p>
        </div>
        ${logo({ tamanho: 36, espessura: 7 })}
      </div>

      <div class="rel-numeros">
        <div class="rel-numero"><b>${diasComRegistro}</b><span>dias com registro</span></div>
        <div class="rel-numero"><b>${sessoes}</b><span>sessões de terapia</span></div>
        <div class="rel-numero"><b>${media ? media.toFixed(1).replace('.', ',') : '–'}</b><span>média de “como foi” (1 a 5)</span></div>
      </div>

      ${pontos.length >= 2 ? `
      <div class="rel-bloco">
        <div class="rel-bloco-topo"><h3 style="flex:1">${eu ? 'Como percebi meus dias' : 'Como a família percebeu os dias'}</h3>
          <span class="chip-mini">${tend > .25 ? 'melhorando' : tend < -.25 ? 'mais pesado' : 'estável'}</span></div>
        ${curva(pontos, { largura: 340, altura: 120, eixo: true, id: 'rel' })}
      </div>` : ''}

      ${porTipo.filter(([t]) => t !== 'documento').map(([t, lista]) => blocoTipo(t, lista)).join('')}

      ${gatilhos.length || ajudou.length ? blocoDiario(gatilhos, ajudou) : ''}

      ${porTipo.find(([t]) => t === 'documento') ? blocoDocumentos(regs.filter(r => r.tipo === 'documento')) : ''}

      <p class="rel-aviso">${eu ? AVISO_RELATORIO.replace('pela família', 'pela própria pessoa') : AVISO_RELATORIO} Gerado no ${APP.nome}.</p>
    </article>

    <div class="rel-acoes">
      <button class="btn btn-primario btn-bloco" data-whats>${icone('enviar', 20)} Mandar no WhatsApp</button>
      <div class="rel-acoes-linha">
        <button class="btn btn-secundario" data-pdf>${icone('baixar', 20)} Salvar PDF</button>
        <button class="btn btn-secundario" data-copiar>${icone('copiar', 20)} Copiar</button>
      </div>
    </div>`}
  </div>`;

  ligarSeletor(el, () => render(el, ctx));
  el.querySelectorAll('[data-dias]').forEach(b => b.onclick = () => {
    periodo = PERIODOS.find(p => p.dias === Number(b.dataset.dias));
    render(el, ctx);
  });

  const texto = () => textoWhatsApp({ perfil, pessoa, relacao, porTipo, inicio, media, tend, eu, gatilhos, ajudou });
  el.querySelector('[data-whats]')?.addEventListener('click', () => {
    window.open('https://wa.me/?text=' + encodeURIComponent(texto()), '_blank');
  });
  el.querySelector('[data-copiar]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(texto()); toast('Texto copiado'); }
    catch { toast('Não consegui copiar', 'x'); }
  });
  el.querySelector('[data-pdf]')?.addEventListener('click', () => window.print());
}

// Agrupa por área (fono, TO...) quando o tipo tem área; senão, junta tudo.
function blocoTipo(tipo, lista) {
  const t = TIPOS[tipo];
  const grupos = t.areas
    ? [...new Set(lista.map(r => r.area || '_'))].map(a => [a, lista.filter(r => (r.area || '_') === a)])
    : [['_', lista]];

  return grupos.map(([area, itens]) => {
    const titulo = area !== '_' && AREAS[area] ? (tipo === 'sessao' ? AREAS[area].nome : `Consulta · ${AREAS[area].curto}`) : t.rotulo;
    const marc = contarMarcadores(itens).slice(0, 5);
    const notas = itens.filter(r => r.nota).slice(0, 3);
    const media = mediaHumor(itens);
    const unidade = tipo === 'sessao' ? (itens.length === 1 ? 'sessão' : 'sessões') : (itens.length === 1 ? 'registro' : 'registros');
    return `
    <section class="rel-bloco">
      <div class="rel-bloco-topo">${selo(tipo, 18)}
        <div><h3>${esc(titulo)}</h3>
        <span class="suave pequeno">${itens.length} ${unidade}${media ? ` · média ${media.toFixed(1).replace('.', ',')} de 5` : ''}</span></div></div>
      ${marc.length ? `<div class="chips">${marc.map(([m, n]) => `<span class="chip-mini">${esc(m)}${n > 1 ? ` ×${n}` : ''}</span>`).join('')}</div>` : ''}
      ${notas.length ? `<ul class="rel-lista">${notas.map(r => `<li><time>${curta(r.data)}</time><span>${esc(r.nota)}</span></li>`).join('')}</ul>` : ''}
    </section>`;
  }).join('');
}

// Só aparece se a família respondeu o Diário em algum dia do período.
function blocoDiario(gatilhos, ajudou) {
  const chips = lista => lista.map(([m, n]) => `<span class="chip-mini">${esc(m)}${n > 1 ? ` ×${n}` : ''}</span>`).join('');
  return `
  <section class="rel-bloco">
    <div class="rel-bloco-topo">${selo('casa', 18)}<div><h3>Diário do dia a dia</h3>
      <span class="suave pequeno">o que a família notou em casa</span></div></div>
    ${gatilhos.length ? `<p class="suave pequeno" style="margin:0 0 6px">O que desencadeou</p><div class="chips" style="margin-bottom:10px">${chips(gatilhos)}</div>` : ''}
    ${ajudou.length ? `<p class="suave pequeno" style="margin:0 0 6px">O que ajudou</p><div class="chips">${chips(ajudou)}</div>` : ''}
  </section>`;
}

function blocoDocumentos(docs) {
  return `
  <section class="rel-bloco">
    <div class="rel-bloco-topo">${selo('documento', 18)}<div><h3>Documentos anexados</h3><span class="suave pequeno">${docs.length} ${docs.length === 1 ? 'documento' : 'documentos'}</span></div></div>
    <div class="rel-docs">
      ${docs.map(d => `<figure>${d.foto ? `<img src="${d.foto}" alt="${esc(tituloRegistro(d))}">` : ''}
        <figcaption>${esc(tituloRegistro(d))} · ${curta(d.data)}</figcaption></figure>`).join('')}
    </div>
  </section>`;
}

// Texto do WhatsApp: *negrito* e _itálico_ são a formatação do próprio WhatsApp.
function textoWhatsApp({ perfil, pessoa, relacao, porTipo, inicio, media, tend, eu, gatilhos = [], ajudou = [] }) {
  const linhas = [
    `*Resumo de acompanhamento: ${pessoa}*`,
    `${curta(inicio)} a ${curta(hojeISO())} · por ${perfil.quem.nome} (${relacao?.noRelatorio || ''})`,
    '',
  ];
  if (media) linhas.push(`Como foram os dias: média ${media.toFixed(1).replace('.', ',')} de 5 (${tend > .25 ? 'melhorando' : tend < -.25 ? 'mais pesado' : 'estável'})`, '');

  porTipo.forEach(([tipo, lista]) => {
    const t = TIPOS[tipo];
    const grupos = t.areas ? [...new Set(lista.map(r => r.area || '_'))].map(a => [a, lista.filter(r => (r.area || '_') === a)]) : [['_', lista]];
    grupos.forEach(([area, itens]) => {
      const titulo = area !== '_' && AREAS[area] ? AREAS[area].nome : t.rotulo;
      linhas.push(`*${titulo}* (${itens.length})`);
      const marc = contarMarcadores(itens).slice(0, 4).map(([m, n]) => n > 1 ? `${m} ×${n}` : m);
      if (marc.length) linhas.push('• ' + marc.join(', '));
      itens.filter(r => r.nota).slice(0, 2).forEach(r => linhas.push(`• ${curta(r.data)}: ${r.nota}`));
      linhas.push('');
    });
  });

  const fmt = l => l.map(([m, n]) => n > 1 ? `${m} ×${n}` : m).join(', ');
  if (gatilhos.length || ajudou.length) {
    linhas.push('*Diário do dia a dia*');
    if (gatilhos.length) linhas.push('• Desencadeou: ' + fmt(gatilhos));
    if (ajudou.length) linhas.push('• Ajudou: ' + fmt(ajudou));
    linhas.push('');
  }

  linhas.push(`_${eu ? AVISO_RELATORIO.replace('pela família', 'pela própria pessoa') : AVISO_RELATORIO}_`);
  return linhas.join('\n');
}
