// CONSULTAR UM REMÉDIO — a mãe escolhe o remédio (e, se quiser, outro para combinar) e lê o que
// uma fonte oficial diz. É consulta a uma base, iniciada por ela. O app NÃO cruza sozinho os
// remédios cadastrados nos lembretes, não dá alerta, não calcula dose e não recomenda nada:
// isso seria apoio à decisão clínica (RDC 657/2022, perguntas 45, 66 e 68; ver memoria/base-legal.md).

import { MEDICAMENTOS, REVISAO, consultar } from '../base-medicamentos.js';
import { icone } from '../icones.js';
import { esc } from '../ui.js';

let escolhaA = null;
let escolhaB = null;

export function render(el, ctx) {
  const redesenhar = () => render(el, ctx);
  const { A, B, proprios, combinacoes, semInfo } = escolhaA ? consultar(escolhaA, escolhaB) : { A: null };

  el.innerHTML = `
  <div>
    <header class="topo">
      <div style="display:flex;align-items:center;gap:6px">
        <button class="btn-icone" data-voltar aria-label="Voltar">${icone('voltar', 22)}</button>
        <h2>Consultar um remédio</h2>
      </div>
    </header>

    <p class="suave">Informações de fonte oficial, para você conversar com o médico ou o farmacêutico. Aqui não tem dose, horário nem indicação de trocar ou parar remédio.</p>

    <section class="secao" style="margin-top:20px">
      <div class="secao-titulo">Qual remédio?</div>
      <div class="chips">
        ${MEDICAMENTOS.map(m => `<button class="chip" data-a="${m.id}" aria-pressed="${escolhaA === m.id}">${esc(m.nome)}</button>`).join('')}
      </div>
    </section>

    ${A ? `
    <section class="secao">
      <div class="secao-titulo">Combinar com outro? <span style="text-transform:none;letter-spacing:0;font-weight:500">(opcional)</span></div>
      <div class="chips">
        ${MEDICAMENTOS.filter(m => m.id !== A.id).map(m => `<button class="chip" data-b="${m.id}" aria-pressed="${escolhaB === m.id}">${esc(m.nome)}</button>`).join('')}
      </div>
    </section>

    <section class="secao">
      <div class="secao-titulo">${B ? `${esc(A.nome)} com ${esc(B.nome)}` : esc(A.nome)}</div>
      ${semInfo ? `
        <div class="cartao"><p><b>A base não tem informação sobre ${B ? 'essa combinação' : 'este remédio'}.</b></p>
          <p class="suave" style="margin-top:6px">Isso <b>não</b> significa que não exista interação ou cuidado. A base é pequena. Pergunte ao farmacêutico ou ao médico.</p></div>` : `
        <div class="lembretes-lista">
          ${(B ? [...combinacoes, ...proprios] : [...proprios, ...combinacoes]).map(cartaoItem).join('')}
        </div>`}
    </section>` : ''}

    <section class="secao">
      <div class="cartao informe">
        <p class="pequeno"><b>Leia antes de usar esta consulta</b></p>
        <ul class="pequeno" style="padding-left:18px;margin-top:6px;display:grid;gap:6px">
          <li>É informação para consulta, não orientação. Nunca mude dose, horário ou pare um remédio sem falar com quem receitou.</li>
          <li>A base tem poucos remédios. Não aparecer aqui <b>não</b> quer dizer que seja seguro.</li>
          <li>Outros remédios, vitaminas, chás e alimentos também podem interagir. Conte tudo ao farmacêutico.</li>
          <li>${REVISAO.revisadoPor ? 'Conteúdo revisado por ' + esc(REVISAO.revisadoPor) + '.' : 'Este conteúdo ainda não foi revisado por farmacêutico.'}</li>
        </ul>
      </div>
    </section>
  </div>`;

  el.querySelector('[data-voltar]').onclick = () => ctx.ir('perfil');
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    escolhaA = escolhaA === b.dataset.a ? null : b.dataset.a;
    if (escolhaB === escolhaA) escolhaB = null;
    redesenhar();
  });
  el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { escolhaB = escolhaB === b.dataset.b ? null : b.dataset.b; redesenhar(); });
}

function cartaoItem(i) {
  const f = i.fonte;
  return `
  <article class="cartao">
    <h3 style="font-size:17px">${esc(i.titulo)}</h3>
    ${i.entre ? `<p class="suave pequeno">Entre ${esc(i.entre[0])} e ${esc(i.entre[1])}</p>` : ''}
    <p style="margin-top:8px">${esc(i.texto)}</p>
    <details class="termo" style="margin-top:6px"><summary>De onde vem</summary>
      <div class="termo-corpo">
        <p><b>${esc(f.orgao)}</b></p>
        <p>${esc(f.referencia)}</p>
        <p>Consultado em ${esc(f.consulta.split('-').reverse().join('/'))}. ${esc(f.situacao)}</p>
        <p><a href="${esc(f.link)}" target="_blank" rel="noopener" style="color:var(--primary-strong)">Abrir a fonte</a></p>
      </div>
    </details>
  </article>`;
}
