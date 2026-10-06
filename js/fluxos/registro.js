// FLUXO DE REGISTRO — em popups, uma pergunta grande por vez.
//   o que aconteceu → (foto do documento) → com quem → como foi → o que rolou → algo mais?
// No "Dia a dia" entra o Diário: depois de "o que rolou?", mais duas perguntas opcionais
// ("algo desencadeou?" e "o que ajudou?"). Todas podem ser puladas.
// Escolha única avança sozinha (menos toques). Escolha múltipla tem "Continuar".
//
// Com mais de uma pessoa na conta, o primeiro passo é "Para quem?" (registro de saúde na criança errada
// é pior que um toque a mais). Editar um registro existente não pergunta: ele já tem dono.
//
// abrirRegistro({ tipo, humor, registro, pessoaId, aoSalvar })
//   tipo/humor: já vêm escolhidos (pula esses passos)
//   registro:   edita um registro existente em vez de criar outro
//   intro:      selinho de confirmação no primeiro passo (ex.: "Dia bom registrado")

import { store } from '../store.js';
import { TIPOS, AREAS, HUMOR, APP } from '../config.js';
import { rosto } from '../marca.js';
import { icone } from '../icones.js';
import { esc, toast, comprimirFoto } from '../ui.js';
import { hojeISO, diaISO } from '../datas.js';
import { selo } from '../analise.js';
import { abrirPalco } from '../palco.js';
import { tracar, celebrar } from '../movimento.js';

const Fala = window.SpeechRecognition || window.webkitSpeechRecognition;

export function abrirRegistro({ tipo = null, humor = null, registro = null, pessoaId = null, intro = '', aoSalvar } = {}) {
  const s = {
    pessoaId: registro?.pessoaId || pessoaId || store.pessoaAtiva.id,
    tipo: registro?.tipo || tipo,
    area: registro?.area || null,
    humor: registro?.humor || humor,
    marcadores: new Set(registro?.marcadores || []),
    gatilhos: new Set(registro?.gatilhos || []),
    ajudou: new Set(registro?.ajudou || []),
    nota: registro?.nota || '',
    foto: registro?.foto || null,
    data: registro?.data || hojeISO(),
    abrirFrase: !!registro?.nota,
  };
  const pess = () => store.pessoa(s.pessoaId) || store.pessoaAtiva;
  const pulaQuem = !!registro || !!pessoaId || store.pessoas.length < 2;
  const pulaTipo = !!s.tipo;
  const pulaHumor = !!s.humor;
  let i = 0;
  let reconhecimento = null;

  const palco = abrirPalco({ aoFechar: () => reconhecimento?.stop() });

  function sequencia() {
    const l = pulaQuem ? [] : ['quem'];
    if (!pulaTipo) l.push('tipo');
    const t = TIPOS[s.tipo];
    if (!t) return [...l, '…', '…', '…'];
    if (t.fotoPrincipal) l.push('foto');
    if (t.areas) l.push('area');
    if (!t.fotoPrincipal && !pulaHumor) l.push('humor');
    l.push('marcadores');
    if (t.gatilhos) l.push('gatilhos', 'ajudou');
    l.push('extra');
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

  // ---------- o que cada passo mostra ----------
  const PASSOS = {
    quem: () => `
      <h2 class="palco-pergunta">Para quem é o registro?</h2>
      <div class="opcoes">
        ${store.pessoas.map(p => `
          <button class="opcao" data-quem="${p.id}" aria-pressed="${s.pessoaId === p.id}">
            <span class="opcao-marca">${s.pessoaId === p.id ? icone('check', 14) : ''}</span>
            <span><b>${esc(p.nome)}</b>${p.eu ? '<small>você</small>' : p.idade ? `<small>${esc(p.idade)} anos</small>` : ''}</span>
          </button>`).join('')}
      </div>`,

    tipo: () => `
      <h2 class="palco-pergunta">O que aconteceu?</h2>
      <div class="tiles tiles--grandes">
        ${Object.entries(TIPOS).map(([id, tp]) => `
          <button class="tile" data-tipo="${id}" style="--cor:var(--t-${id})" aria-pressed="${s.tipo === id}">
            ${selo(id, 28)}<span>${tp.rotulo}</span>
          </button>`).join('')}
      </div>`,

    foto: () => `
      <h2 class="palco-pergunta">Fotografe o documento</h2>
      <p class="palco-sub">Laudo, receita, relatório, boletim. A foto fica guardada só aqui.</p>
      ${s.foto ? `
        <div class="foto-previa"><img src="${s.foto}" alt="Foto do documento">
          <button class="btn-icone" data-tirar-foto aria-label="Tirar foto">${icone('x', 20)}</button></div>
        <div class="palco-pe"><button class="btn btn-primario btn-bloco" data-continuar>Continuar</button></div>` : `
        <label class="foto-grande">
          <span class="selo" style="--cor:var(--primary)">${icone('camera', 34)}</span>
          <b>Tirar foto</b><span class="suave">ou escolher da galeria</span>
          <input type="file" accept="image/*" id="foto" hidden>
        </label>
        <div class="palco-pe"><button class="btn btn-fantasma btn-bloco" data-continuar>Sem foto por enquanto</button></div>`}`,

    area: () => {
      const t = TIPOS[s.tipo];
      const daRede = t.areas.filter(a => pess().equipe?.includes(a));
      const resto = t.areas.filter(a => !daRede.includes(a));
      const lista = daRede.length ? daRede : t.areas;
      return `
      <h2 class="palco-pergunta">${t.perguntaArea}</h2>
      <div class="opcoes">
        ${lista.map(a => opcaoArea(a)).join('')}
      </div>
      ${daRede.length && resto.length ? `
        <details class="mais-opcoes"><summary>Outros profissionais</summary>
          <div class="opcoes">${resto.map(a => opcaoArea(a)).join('')}</div>
        </details>` : ''}`;
    },

    humor: () => `
      <h2 class="palco-pergunta">${perguntaHumor()}</h2>
      <div class="rostos rostos--grandes">
        ${[1, 2, 3, 4, 5].map(n => `
          <button class="rosto-btn" data-humor="${n}" aria-pressed="${s.humor === n}" aria-label="${HUMOR[n]}">
            ${rosto(n, 44)}<span>${HUMOR[n]}</span>
          </button>`).join('')}
      </div>`,

    marcadores: () => {
      const t = TIPOS[s.tipo];
      return `
      ${intro && i === 0 ? `<p class="palco-selo">${icone('check', 16)} ${esc(intro)}</p>` : ''}
      <h2 class="palco-pergunta">${t.fotoPrincipal ? 'Que documento é?' : 'O que rolou?'}</h2>
      <p class="palco-sub">Toque em quantos quiser.</p>
      <div class="chips chips--grandes">
        ${t.marcadores.map(m => `<button class="chip" data-marc="${esc(m)}" aria-pressed="${s.marcadores.has(m)}">${esc(m)}</button>`).join('')}
      </div>
      <div class="palco-pe"><button class="btn btn-primario btn-bloco" data-continuar>${s.marcadores.size ? 'Continuar' : 'Pular'}</button></div>`;
    },

    gatilhos: () => passoChips({
      pergunta: 'Algo desencadeou?', sub: 'Se notou o que estava por trás, toque. Se não, pule.',
      lista: TIPOS[s.tipo].gatilhos, escolhidos: s.gatilhos, atr: 'gat' }),

    ajudou: () => passoChips({
      pergunta: 'O que ajudou?', sub: 'O que fez o dia (ou o momento difícil) ficar mais leve.',
      lista: TIPOS[s.tipo].ajudou, escolhidos: s.ajudou, atr: 'aju' }),

    extra: () => {
      const t = TIPOS[s.tipo];
      const outroDia = s.data !== hojeISO() && s.data !== diaISO(1);
      return `
      <h2 class="palco-pergunta">Quer guardar mais alguma coisa?</h2>
      <p class="palco-sub">Tudo opcional. Dá para salvar assim mesmo.</p>
      <div class="extras">
        ${t.fotoPrincipal ? '' : s.foto ? `
          <div class="foto-previa"><img src="${s.foto}" alt="Foto anexada">
            <button class="btn-icone" data-tirar-foto aria-label="Tirar foto">${icone('x', 20)}</button></div>` : `
          <label class="extra">
            <span class="selo" style="--cor:var(--primary)">${icone('camera', 24)}</span>
            <span><b>Uma foto</b><small>recado, receita, atividade…</small></span>
            <input type="file" accept="image/*" id="foto" hidden>
          </label>`}
        ${s.abrirFrase ? `
          <div class="campo-com-botao">
            <input class="campo" id="nota" maxlength="${APP.limiteNota}" placeholder="Ex.: ${esc(t.exemplo)}" value="${esc(s.nota)}">
            ${Fala ? `<button class="btn-icone" data-falar aria-label="Falar em vez de digitar">${icone('mic', 20)}</button>` : ''}
          </div>
          <div class="campo-contador"><span id="cont">${s.nota.length}</span>/${APP.limiteNota}</div>` : `
          <button class="extra" data-abrir-frase>
            <span class="selo" style="--cor:var(--accent)">${icone(Fala ? 'mic' : 'sessao', 24)}</span>
            <span><b>Uma frase</b><small>${Fala ? 'fale ou digite, até 140 letras' : 'até 140 letras'}</small></span>
          </button>`}
      </div>

      <div class="quando">
        <span class="suave pequeno">Quando foi?</span>
        <div class="chips">
          <button class="chip" data-dia="${hojeISO()}" aria-pressed="${s.data === hojeISO()}">Hoje</button>
          <button class="chip" data-dia="${diaISO(1)}" aria-pressed="${s.data === diaISO(1)}">Ontem</button>
          <label class="chip" aria-pressed="${outroDia}" style="position:relative">
            ${icone('calendario', 18)} ${outroDia ? s.data.split('-').reverse().slice(0, 2).join('/') : 'Outro dia'}
            <input type="date" id="outroDia" max="${hojeISO()}" value="${s.data}" style="position:absolute;inset:0;opacity:0">
          </label>
        </div>
      </div>

      <div class="palco-pe"><button class="btn btn-primario btn-bloco" data-salvar>${icone('check', 22)} ${registro ? 'Salvar' : 'Registrar'}</button></div>`;
    },
  };

  const passoChips = ({ pergunta, sub, lista, escolhidos, atr }) => `
      <h2 class="palco-pergunta">${pergunta}</h2>
      <p class="palco-sub">${sub}</p>
      <div class="chips chips--grandes">
        ${lista.map(m => `<button class="chip" data-${atr}="${esc(m)}" aria-pressed="${escolhidos.has(m)}">${esc(m)}</button>`).join('')}
      </div>
      <div class="palco-pe"><button class="btn btn-primario btn-bloco" data-continuar>${escolhidos.size ? 'Continuar' : 'Pular'}</button></div>`;

  const ligarChips = (el, escolhidos, atr) => {
    const cont = el.querySelector('[data-continuar]');
    el.querySelectorAll(`[data-${atr}]`).forEach(b => b.onclick = () => {
      const m = b.dataset[atr];
      escolhidos.has(m) ? escolhidos.delete(m) : escolhidos.add(m);
      b.setAttribute('aria-pressed', escolhidos.has(m));
      cont.textContent = escolhidos.size ? 'Continuar' : 'Pular';
    });
    cont.onclick = proximo;
  };

  const opcaoArea = a => `
    <button class="opcao" data-area="${a}" aria-pressed="${s.area === a}">
      <span class="opcao-marca">${s.area === a ? icone('check', 14) : ''}</span>
      <span><b>${AREAS[a].nome}</b></span>
    </button>`;

  const perguntaHumor = () => {
    const t = TIPOS[s.tipo];
    if (s.tipo === 'casa') return pess().eu ? 'Como foi seu dia?' : `Como foi o dia de ${esc(pess().nome)}?`;
    if (s.tipo === 'escola') return 'Como foi na escola?';
    if (s.tipo === 'remedio') return 'Como está com a medicação?';
    if (s.area) return `Como foi ${s.tipo === 'sessao' ? 'a sessão de' : 'a consulta com'} ${AREAS[s.area].curto}?`;
    return `Como foi ${t.rotulo.toLowerCase()}?`;
  };

  // ---------- o que cada toque faz ----------
  const LIGAR = {
    quem: el => el.querySelectorAll('[data-quem]').forEach(b => b.onclick = () => {
      if (s.pessoaId !== b.dataset.quem) { s.pessoaId = b.dataset.quem; s.area = null; }
      el.querySelectorAll('[data-quem]').forEach(x => x.setAttribute('aria-pressed', x === b));
      setTimeout(proximo, 180);
    }),

    tipo: el => el.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => {
      if (s.tipo !== b.dataset.tipo) { s.tipo = b.dataset.tipo; s.area = null; s.marcadores.clear(); s.gatilhos.clear(); s.ajudou.clear(); }
      b.setAttribute('aria-pressed', 'true');
      setTimeout(proximo, 160);
    }),

    foto: el => ligarFoto(el, () => ir(i, 0)),

    area: el => el.querySelectorAll('[data-area]').forEach(b => b.onclick = () => {
      s.area = b.dataset.area;
      el.querySelectorAll('[data-area]').forEach(x => x.setAttribute('aria-pressed', x === b));
      setTimeout(proximo, 180);
    }),

    humor: el => el.querySelectorAll('[data-humor]').forEach(b => b.onclick = () => {
      s.humor = Number(b.dataset.humor);
      el.querySelectorAll('[data-humor]').forEach(x => x.setAttribute('aria-pressed', x === b));
      setTimeout(proximo, 280);
    }),

    marcadores: el => {
      const cont = el.querySelector('[data-continuar]');
      el.querySelectorAll('[data-marc]').forEach(b => b.onclick = () => {
        const m = b.dataset.marc;
        s.marcadores.has(m) ? s.marcadores.delete(m) : s.marcadores.add(m);
        b.setAttribute('aria-pressed', s.marcadores.has(m));
        cont.textContent = s.marcadores.size ? 'Continuar' : 'Pular';
      });
      cont.onclick = proximo;
    },

    gatilhos: el => ligarChips(el, s.gatilhos, 'gat'),
    ajudou: el => ligarChips(el, s.ajudou, 'aju'),

    extra: el => {
      const redesenhar = () => ir(i, 0);
      ligarFoto(el, redesenhar);
      el.querySelector('[data-abrir-frase]')?.addEventListener('click', () => {
        s.abrirFrase = true; redesenhar();
        setTimeout(() => palco.el.querySelector('.palco-passo:not(.sai) #nota')?.focus(), 320);
      });
      const nota = el.querySelector('#nota');
      nota?.addEventListener('input', () => { s.nota = nota.value; el.querySelector('#cont').textContent = nota.value.length; });
      el.querySelector('[data-falar]')?.addEventListener('click', e => ditar(e.currentTarget, nota));
      el.querySelectorAll('[data-dia]').forEach(b => b.onclick = () => { s.data = b.dataset.dia; redesenhar(); });
      el.querySelector('#outroDia')?.addEventListener('change', e => { if (e.target.value) { s.data = e.target.value; redesenhar(); } });
      el.querySelector('[data-salvar]').onclick = e => salvar(e.currentTarget);
    },
  };

  function ligarFoto(el, depois) {
    el.querySelector('#foto')?.addEventListener('change', async e => {
      const arq = e.target.files?.[0];
      if (!arq) return;
      try { s.foto = await comprimirFoto(arq); depois(); }
      catch { toast('Não consegui abrir essa imagem', 'x'); }
    });
    el.querySelector('[data-tirar-foto]')?.addEventListener('click', () => { s.foto = null; depois(); });
    el.querySelector('[data-continuar]')?.addEventListener('click', proximo);
  }

  function ditar(botao, campo) {
    if (reconhecimento) { reconhecimento.stop(); return; }
    reconhecimento = new Fala();
    reconhecimento.lang = 'pt-BR';
    reconhecimento.interimResults = true;
    const antes = campo.value ? campo.value.trim() + ' ' : '';
    botao.classList.add('gravando');
    reconhecimento.onresult = ev => {
      campo.value = (antes + [...ev.results].map(r => r[0].transcript).join('')).slice(0, APP.limiteNota);
      campo.dispatchEvent(new Event('input'));
    };
    reconhecimento.onerror = () => toast('Não consegui ouvir. Tenta de novo?', 'mic');
    reconhecimento.onend = () => { botao.classList.remove('gravando'); reconhecimento = null; };
    reconhecimento.start();
  }

  async function salvar(botao) {
    const dados = {
      tipo: s.tipo,
      area: s.area || undefined,
      humor: s.humor || undefined,
      marcadores: [...s.marcadores],
      ...(TIPOS[s.tipo].gatilhos ? { gatilhos: [...s.gatilhos], ajudou: [...s.ajudou] } : {}),
      nota: s.nota.trim() || undefined,
      foto: s.foto || undefined,
      data: s.data,
      pessoaId: s.pessoaId,
    };
    let r;
    if (registro) { store.atualizar(registro.id, dados); r = { ...registro, ...dados }; }
    else r = store.adicionar(dados);
    if (!r) { toast('Sem espaço no aparelho para salvar a foto', 'x'); return; }

    await tracar(botao);
    palco.fechar();
    if (!registro) store.definirPessoaAtiva(s.pessoaId);
    await celebrar(registro ? 'Atualizado' : 'Registrado!', pess().eu ? 'Mais um passo no seu caminho.' : `Mais um capítulo de ${pess().nome}.`);
    aoSalvar?.(r);
  }

  ir(0);
}
