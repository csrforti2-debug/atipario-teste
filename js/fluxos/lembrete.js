// FLUXO DE LEMBRETE — popups em sequência, igual ao de registro.
//   Remédio / Atividade:  tipo → o quê → que horas → quais dias
//   Retorno:              tipo → com quem → quando
//
// abrirLembrete({ tipo, area, aoSalvar })
//   tipo/area já vêm escolhidos quando o app sugere (ex.: consulta com "Retorno marcado").

import { store } from '../store.js';
import { TIPOS_LEMBRETE, AREAS, AVISO_LEMBRETES } from '../config.js';
import { icone } from '../icones.js';
import { esc, toast } from '../ui.js';
import { hojeISO, diaISO, paraISO } from '../datas.js';
import { abrirPalco } from '../palco.js';
import { tracar } from '../movimento.js';
import { NOMES_DIAS } from '../lembretes.js';

const TIPOS_NOVOS = ['remedio', 'atividade', 'retorno']; // o check-in é um interruptor na tela de lembretes
const AREAS_RETORNO = Object.keys(AREAS).filter(a => a !== 'escola');
const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function abrirLembrete({ tipo = null, area = null, pessoaId = null, aoSalvar } = {}) {
  const s = { pessoaId: pessoaId || store.pessoaAtiva.id, tipo, titulo: '', hora: '08:00', dias: new Set(), area, data: '' };
  const pulaQuem = !!pessoaId || store.pessoas.length < 2;
  const pulaTipo = !!tipo;
  let i = 0;

  const palco = abrirPalco();

  function sequencia() {
    const l = pulaQuem ? [] : ['quem'];
    if (!pulaTipo) l.push('tipo');
    if (s.tipo === 'retorno') { if (!area) l.push('area'); l.push('quando'); }
    else if (s.tipo) l.push('titulo', 'hora', 'dias');
    else l.push('…', '…');
    return l;
  }

  function ir(novo, direcao = 1) {
    const seq = sequencia();
    i = Math.max(0, Math.min(novo, seq.length - 1));
    const nome = seq[i];
    palco.passo({
      html: PASSOS[nome](),
      ligar: el => LIGAR[nome]?.(el),
      progresso: [i + 1, seq.length],
      voltar: i > 0 ? () => ir(i - 1, -1) : null,
      direcao,
    });
  }
  const proximo = () => ir(i + 1);

  const PASSOS = {
    quem: () => `
      <h2 class="palco-pergunta">Lembrete para quem?</h2>
      <div class="opcoes">
        ${store.pessoas.map(p => `
          <button class="opcao" data-quem="${p.id}" aria-pressed="${s.pessoaId === p.id}">
            <span class="opcao-marca">${s.pessoaId === p.id ? icone('check', 14) : ''}</span><span><b>${esc(p.nome)}</b></span>
          </button>`).join('')}
      </div>`,

    tipo: () => `
      <h2 class="palco-pergunta">Lembrar de quê?</h2>
      <p class="palco-sub">Só do que você já combinou com a equipe de saúde.</p>
      <div class="tiles tiles--grandes">
        ${TIPOS_NOVOS.map(id => `
          <button class="tile" data-tipo="${id}" style="--cor:${TIPOS_LEMBRETE[id].cor}" aria-pressed="${s.tipo === id}">
            <span class="selo" style="--cor:${TIPOS_LEMBRETE[id].cor}">${icone(TIPOS_LEMBRETE[id].icone, 28)}</span><span>${TIPOS_LEMBRETE[id].rotulo}</span>
          </button>`).join('')}
      </div>`,

    titulo: () => `
      <h2 class="palco-pergunta">${TIPOS_LEMBRETE[s.tipo].pergunta}</h2>
      ${s.tipo === 'remedio' ? `<p class="palco-sub">${esc(AVISO_LEMBRETES)}</p>` : ''}
      <input class="campo" id="titulo" maxlength="60" placeholder="${esc(TIPOS_LEMBRETE[s.tipo].exemplo)}" value="${esc(s.titulo)}" autocomplete="off">
      <div class="palco-pe"><button class="btn btn-primario btn-bloco" data-continuar ${s.titulo.trim() ? '' : 'disabled'}>Continuar</button></div>`,

    hora: () => `
      <h2 class="palco-pergunta">Que horas?</h2>
      <input class="campo campo-hora" id="hora" type="time" value="${s.hora}">
      <div class="chips" style="margin-top:14px">
        ${[['Manhã', '08:00'], ['Meio-dia', '12:00'], ['Tarde', '15:00'], ['Noite', '20:00']].map(([r, h]) =>
          `<button class="chip" data-hora="${h}" aria-pressed="${s.hora === h}">${r} · ${h}</button>`).join('')}
      </div>
      <div class="palco-pe"><button class="btn btn-primario btn-bloco" data-continuar>Continuar</button></div>`,

    dias: () => `
      <h2 class="palco-pergunta">Quais dias?</h2>
      <p class="palco-sub">Sem marcar nenhum, vale todos os dias.</p>
      <div class="dias-semana">
        ${LETRAS.map((l, d) => `<button class="dia-btn" data-d="${d}" aria-pressed="${s.dias.has(d)}" aria-label="${NOMES_DIAS[d]}">${l}</button>`).join('')}
      </div>
      <div class="palco-pe"><button class="btn btn-primario btn-bloco" data-salvar>${icone('check', 22)} Guardar lembrete</button></div>`,

    area: () => `
      <h2 class="palco-pergunta">${TIPOS_LEMBRETE.retorno.pergunta}</h2>
      <div class="opcoes">
        ${AREAS_RETORNO.map(a => `
          <button class="opcao" data-area="${a}" aria-pressed="${s.area === a}">
            <span class="opcao-marca">${s.area === a ? icone('check', 14) : ''}</span><span><b>${AREAS[a].nome}</b></span>
          </button>`).join('')}
      </div>`,

    quando: () => `
      <h2 class="palco-pergunta">Quando é o retorno?</h2>
      <p class="palco-sub">Use a data que a equipe passou. ${esc(AVISO_LEMBRETES.split('. ')[1] || '')}</p>
      <input class="campo" id="data" type="date" min="${hojeISO()}" value="${s.data}">
      <div class="chips" style="margin-top:14px">
        ${[['Em 1 mês', 1], ['Em 3 meses', 3], ['Em 6 meses', 6]].map(([r, m]) =>
          `<button class="chip" data-meses="${m}">${r}</button>`).join('')}
      </div>
      <p class="suave pequeno" style="margin-top:14px">Vou avisar no dia e também um dia antes (se você levar para o calendário do celular).</p>
      <div class="palco-pe"><button class="btn btn-primario btn-bloco" data-salvar ${s.data ? '' : 'disabled'}>${icone('check', 22)} Guardar retorno</button></div>`,
  };

  const LIGAR = {
    quem: el => el.querySelectorAll('[data-quem]').forEach(b => b.onclick = () => {
      s.pessoaId = b.dataset.quem; s.area = null;
      el.querySelectorAll('[data-quem]').forEach(x => x.setAttribute('aria-pressed', x === b));
      setTimeout(proximo, 180);
    }),

    tipo: el => el.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => {
      s.tipo = b.dataset.tipo;
      b.setAttribute('aria-pressed', 'true');
      setTimeout(proximo, 160);
    }),

    titulo: el => {
      const campo = el.querySelector('#titulo');
      const botao = el.querySelector('[data-continuar]');
      campo.addEventListener('input', () => { s.titulo = campo.value; botao.disabled = !campo.value.trim(); });
      botao.onclick = proximo;
      setTimeout(() => campo.focus(), 320);
    },

    hora: el => {
      const campo = el.querySelector('#hora');
      campo.addEventListener('input', () => { if (campo.value) s.hora = campo.value; el.querySelectorAll('[data-hora]').forEach(x => x.setAttribute('aria-pressed', x.dataset.hora === s.hora)); });
      el.querySelectorAll('[data-hora]').forEach(b => b.onclick = () => {
        s.hora = b.dataset.hora; campo.value = s.hora;
        el.querySelectorAll('[data-hora]').forEach(x => x.setAttribute('aria-pressed', x === b));
      });
      el.querySelector('[data-continuar]').onclick = proximo;
    },

    dias: el => {
      el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
        const d = Number(b.dataset.d);
        s.dias.has(d) ? s.dias.delete(d) : s.dias.add(d);
        b.setAttribute('aria-pressed', s.dias.has(d));
      });
      el.querySelector('[data-salvar]').onclick = e => salvar(e.currentTarget);
    },

    area: el => el.querySelectorAll('[data-area]').forEach(b => b.onclick = () => {
      s.area = b.dataset.area;
      el.querySelectorAll('[data-area]').forEach(x => x.setAttribute('aria-pressed', x === b));
      setTimeout(proximo, 180);
    }),

    quando: el => {
      const campo = el.querySelector('#data');
      const botao = el.querySelector('[data-salvar]');
      campo.addEventListener('input', () => { s.data = campo.value; botao.disabled = !campo.value; });
      el.querySelectorAll('[data-meses]').forEach(b => b.onclick = () => {
        const d = new Date(); d.setMonth(d.getMonth() + Number(b.dataset.meses));
        s.data = paraISO(d); campo.value = s.data; botao.disabled = false;
      });
      botao.onclick = e => salvar(e.currentTarget);
    },
  };

  async function salvar(botao) {
    const base = s.tipo === 'retorno'
      ? { tipo: 'retorno', titulo: `Retorno · ${AREAS[s.area].curto}`, area: s.area, data: s.data, hora: '09:00' }
      : { tipo: s.tipo, titulo: s.titulo.trim(), hora: s.hora, dias: [...s.dias].sort() };
    store.adicionarLembrete({ ...base, pessoaId: s.pessoaId });
    await tracar(botao);
    palco.fechar();
    toast('Lembrete guardado', 'sino');
    aoSalvar?.();
  }

  ir(0);
}
