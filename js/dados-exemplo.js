// DADOS DE EXEMPLO — 6 semanas fictícias, para a tela nunca ficar vazia numa demo.
// Personagens inventados (Ana, e os filhos Theo e Luísa). Nenhum dado de entrevistada real entra aqui.
// Duas pessoas de propósito: a demo mostra como fica quando a mesma família acompanha mais de uma.

import { diaISO } from './datas.js';

// Gerador pseudoaleatório com semente fixa: a demo sai igual toda vez.
function sorteador(semente) {
  return () => {
    semente |= 0; semente = (semente + 0x6D2B79F5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// "Foto" de documento desenhada em SVG, só para a demo.
function fotoDocumento(titulo, cor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <rect width="300" height="400" fill="#E9E4DC"/>
    <rect x="30" y="24" width="240" height="352" rx="6" fill="#fff" transform="rotate(-2 150 200)"/>
    <g transform="rotate(-2 150 200)">
      <rect x="54" y="52" width="60" height="8" rx="4" fill="${cor}"/>
      <text x="54" y="96" font-family="Georgia" font-size="22" fill="#2F2A26">${titulo}</text>
      ${[130, 152, 174, 196, 218, 240, 262, 284].map((y, i) =>
        `<rect x="54" y="${y}" width="${i % 3 === 2 ? 120 : 190}" height="6" rx="3" fill="#D8D2CA"/>`).join('')}
      <path d="M170 330 q15 -18 30 0 t30 0" stroke="#6F8FB5" stroke-width="2.5" fill="none"/>
    </g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function gerarExemplo(hoje) {
  const rnd = sorteador(7);
  const escolher = (lista, n) => [...lista].sort(() => rnd() - .5).slice(0, n);
  const registros = [];
  const DIAS = 42;

  const add = (offset, r, hora = 12) => {
    const data = diaISO(offset, hoje);
    registros.push({
      id: `ex${registros.length}`,
      data,
      criadoEm: `${data}T${String(hora).padStart(2, '0')}:00:00`,
      marcadores: [],
      pessoaId: 'p1',
      ...r,
    });
  };

  // Humor com leve tendência de melhora ao longo das semanas + ruído.
  const humor = (offset) => {
    const progresso = 1 - offset / DIAS;
    const base = 2.5 + progresso * 1.5 + (rnd() - .5) * 2;
    return Math.max(1, Math.min(5, Math.round(base)));
  };

  for (let off = DIAS; off >= 0; off--) {
    const dia = new Date(hoje); dia.setDate(dia.getDate() - off);
    const semana = dia.getDay();
    const util = semana >= 1 && semana <= 5;

    if (semana === 2) add(off, { tipo: 'sessao', area: 'fono', humor: humor(off),
      marcadores: escolher(['Participou bem', 'Aprendeu algo novo', 'Levou tarefa pra casa', 'Resistiu'], 2),
      nota: off === 7 ? 'fono pediu para treinar os sons "p" e "b" em casa' : undefined }, 15);

    if (semana === 4) add(off, { tipo: 'sessao', area: 'to', humor: humor(off),
      marcadores: escolher(['Participou bem', 'Recebi orientação', 'Resistiu', 'Aprendeu algo novo'], 2),
      nota: off === 16 ? 'TO sugeriu escova macia antes de dormir' : undefined }, 16);

    if (semana === 3 && Math.floor(off / 7) % 2 === 0) add(off, { tipo: 'sessao', area: 'psico', humor: humor(off),
      marcadores: escolher(['Participou bem', 'Recebi orientação', 'Levou tarefa pra casa'], 1) }, 17);

    if (util && rnd() < .38) {
      const h = humor(off);
      add(off, { tipo: 'escola', humor: h,
        marcadores: h >= 4 ? escolher(['Dia tranquilo', 'Brincou com colegas'], 1) : escolher(['Teve crise', 'Mandou recado'], 1),
        nota: off === 5 ? 'professora elogiou a leitura em voz alta' : undefined }, 13);
    }

    if (rnd() < .72) {
      const h = humor(off);
      const marc = h >= 4
        ? escolher(['Dormiu bem', 'Comeu bem', 'Calmo', 'Conquista!'], 2)
        : escolher(['Dormiu mal', 'Agitado', 'Recusou comida', 'Teve crise'], 2);
      const conquistas = { 3: 'amarrou o tênis sozinho', 12: 'pediu água falando a frase inteira', 20: 'aceitou provar arroz' };
      if (conquistas[off]) marc.push('Conquista!');
      // Diário: nos dias mais difíceis, às vezes a mãe anotou o que desencadeou e o que ajudou.
      const diario = h <= 3 && rnd() < .7 ? {
        gatilhos: escolher(['Barulho alto', 'Mudança de rotina', 'Cansaço'], 1),
        ajudou: escolher(['Rotina visual', 'Fone abafador', 'Tempo sozinho', 'Atividade favorita'], 1),
      } : {};
      add(off, { tipo: 'casa', humor: h, marcadores: [...new Set(marc)], nota: conquistas[off], ...diario }, 21);
    }
  }

  // Marcos pontuais da história da demo.
  add(30, { tipo: 'consulta', area: 'neuro', humor: 3, marcadores: ['Mudou medicação', 'Retorno marcado'], nota: 'retorno em 3 meses' }, 10);
  add(30, { tipo: 'documento', marcadores: ['Laudo'], nota: 'laudo atualizado da neuro', foto: fotoDocumento('Laudo', '#6F8FB5') }, 11);
  add(29, { tipo: 'remedio', humor: 3, marcadores: ['Começou remédio novo'], nota: 'meia dose à noite, como a médica pediu' }, 20);
  add(24, { tipo: 'remedio', humor: 2, marcadores: ['Efeito colateral'], nota: 'mais sonolento de manhã' }, 8);
  add(17, { tipo: 'remedio', humor: 4, marcadores: ['Tomou certinho'] }, 20);
  add(10, { tipo: 'documento', marcadores: ['Relatório de terapia'], nota: 'relatório trimestral da fono', foto: fotoDocumento('Relatório', '#C96A4B') }, 18);
  add(9, { tipo: 'remedio', humor: 4, marcadores: ['Tomou certinho'] }, 20);
  add(2, { tipo: 'remedio', humor: 4, marcadores: ['Tomou certinho'] }, 20);

  // Luísa (p2): menos registros, outra rede de cuidado.
  const r2 = sorteador(11);
  for (let off = 28; off >= 0; off--) {
    const dia = new Date(hoje); dia.setDate(dia.getDate() - off);
    const semana = dia.getDay();
    if (semana === 1) add(off, { pessoaId: 'p2', tipo: 'sessao', area: 'psicoped', humor: 3 + Math.round(r2() * 2),
      marcadores: ['Participou bem', 'Levou tarefa pra casa'].slice(0, 1 + Math.round(r2())) }, 16);
    if (semana >= 1 && semana <= 5 && r2() < .3) add(off, { pessoaId: 'p2', tipo: 'escola', humor: 2 + Math.round(r2() * 3),
      marcadores: [r2() < .5 ? 'Dia tranquilo' : 'Mandou recado'] }, 13);
    if (r2() < .5) {
      const h = 2 + Math.round(r2() * 3);
      add(off, { pessoaId: 'p2', tipo: 'casa', humor: h, marcadores: h >= 4 ? ['Calmo'] : ['Dificuldade de atenção'],
        ...(h <= 3 ? { gatilhos: ['Cansaço'], ajudou: ['Atividade favorita'] } : {}) }, 21);
    }
  }
  add(12, { pessoaId: 'p2', tipo: 'consulta', area: 'psiq', humor: 4, marcadores: ['Retorno marcado'] }, 10);

  return {
    perfil: {
      quem: { nome: 'Ana', relacao: 'mae' },
      pessoas: [
        { id: 'p1', nome: 'Theo', idade: '6', eu: false, equipe: ['fono', 'to', 'psico', 'neuro', 'escola'] },
        { id: 'p2', nome: 'Luísa', idade: '9', eu: false, equipe: ['psicoped', 'psiq', 'escola'] },
      ],
    },
    registros,
    // Lembretes fictícios, para a demo mostrar o cartão "Para hoje".
    lembretes: [
      { id: 'lx0', pessoaId: 'p1', tipo: 'remedio', titulo: 'Remédio da noite', hora: '20:00', dias: [], ativo: true, feitos: {} },
      { id: 'lx1', pessoaId: 'p1', tipo: 'atividade', titulo: 'Exercícios da fono', hora: '17:00', dias: [1, 3, 5], ativo: true, feitos: {} },
      { id: 'lx2', pessoaId: 'p1', tipo: 'retorno', titulo: 'Retorno · Neuro', area: 'neuro', hora: '09:00', data: diaISO(-18, hoje), dias: [], ativo: true, feitos: {} },
      { id: 'lx3', pessoaId: 'p1', tipo: 'checkin', titulo: 'Check-in do dia', hora: '21:00', dias: [], ativo: true, feitos: {} },
      { id: 'lx4', pessoaId: 'p2', tipo: 'atividade', titulo: 'Leitura em voz alta', hora: '18:30', dias: [], ativo: true, feitos: {} },
    ],
  };
}
