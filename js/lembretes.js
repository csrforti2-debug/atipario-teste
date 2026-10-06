// LEMBRETES — a lógica: o que vale hoje, o que já foi feito, avisos enquanto o app está
// aberto e o arquivo de calendário (.ics) para o alarme tocar com o app fechado.
//
// Limite honesto: o app não tem servidor, então ele não consegue acordar o celular sozinho.
//   • Com o app aberto: aviso na tela + notificação (se a pessoa permitiu).
//   • Com o app fechado: só o calendário do celular toca. Por isso o botão "Pôr no calendário".
// O app só lembra do que a família combinou com a equipe de saúde. Não sugere dose,
// horário nem data de retorno (ver memoria/base-legal.md, sobre a RDC 657/2022).

import { store, nomeDe } from './store.js';
import { TIPOS_LEMBRETE, AREAS } from './config.js';
import { hojeISO, deISO, diaISO, paraISO } from './datas.js';

export const NOMES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const SIGLAS_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const diaDaSemana = iso => deISO(iso).getDay();

/** Esse lembrete vale nesse dia? (retorno = só na data; os outros = nos dias marcados, ou todos) */
export function vale(l, iso) {
  if (l.tipo === 'retorno') return l.data === iso;
  return !l.dias?.length || l.dias.includes(diaDaSemana(iso));
}

/** Já foi feito nesse dia? O check-in conta como feito se a pessoa registrou o dia. */
export function feito(l, iso = hojeISO()) {
  if (l.tipo === 'checkin') return store.todosRegistros.some(r => r.pessoaId === l.pessoaId && r.data === iso && r.tipo === 'casa' && r.humor);
  return !!l.feitos?.[iso];
}

/** Lembretes ativos de um dia, por horário. */
export function doDia(iso = hojeISO()) {
  return store.lembretes
    .filter(l => l.ativo && vale(l, iso))
    .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
}

/** Retornos que vêm aí, nos próximos `dias` dias (sem contar hoje). */
export function retornosProximos(dias = 7) {
  const hoje = hojeISO();
  const limite = diaISO(-dias);
  return store.lembretes
    .filter(l => l.ativo && l.tipo === 'retorno' && l.data > hoje && l.data <= limite && !feito(l, l.data))
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** Quantos dias faltam para uma data ISO. */
export function diasAte(iso) {
  return Math.round((deISO(iso) - deISO(hojeISO())) / 86400000);
}

export function resumoQuando(l) {
  const hora = l.hora || '';
  if (l.tipo === 'retorno') return `${l.data.split('-').reverse().join('/')}${hora ? ' às ' + hora : ''}`;
  const dias = !l.dias?.length || l.dias.length === 7 ? 'todos os dias' : l.dias.map(d => NOMES_DIAS[d]).join(', ');
  return `${hora} · ${dias}`;
}

export function tituloLembrete(l) {
  if (l.tipo === 'checkin') return 'Check-in do dia';
  return l.titulo;
}

/** Marca como feito. Remédio também vira registro ("Tomou certinho"), que entra no relatório. */
export function concluir(l, iso = hojeISO()) {
  let regId = null;
  if (l.tipo === 'remedio') {
    const r = store.adicionar({ pessoaId: l.pessoaId, tipo: 'remedio', marcadores: ['Tomou certinho'], nota: (l.titulo || '').slice(0, 140) || undefined, data: iso });
    regId = r?.id || null;
  }
  store.marcarFeito(l.id, iso, regId);
}

export function desfazer(l, iso = hojeISO()) {
  const regId = store.desfazerFeito(l.id, iso);
  if (regId) store.remover(regId);
}

// ---------- sugestões do app (a partir do que a família já registrou) ----------

/**
 * Consulta registrada com "Retorno marcado" e nenhum lembrete de retorno depois dela:
 * o app sugere guardar a data. Não decide quando o retorno deve ser: quem decide é a equipe.
 */
export function sugestoesDeRetorno() {
  const dispensados = store.prefs.dispensados || [];
  const desde = diaISO(30);
  return store.todosRegistros.filter(r =>
    r.tipo === 'consulta' && r.data >= desde && r.marcadores?.includes('Retorno marcado')
    && !dispensados.includes(r.id)
    && !store.lembretes.some(l => l.tipo === 'retorno' && l.pessoaId === r.pessoaId && l.area === r.area && l.data > r.data)
  ).slice(0, 2);
}

export function dispensarSugestao(id) {
  store.definirPref('dispensados', [...(store.prefs.dispensados || []), id]);
}

// ---------- avisos enquanto o app está aberto ----------

export const suportaNotificacao = () => 'Notification' in window;
export const permissaoNotificacao = () => (suportaNotificacao() ? Notification.permission : 'indisponivel');

export async function pedirPermissao() {
  if (!suportaNotificacao()) return 'indisponivel';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

function textoDoAviso(l) {
  const quem = nomeDe(l.pessoaId);
  const de = quem ? ` de ${quem}` : '';
  if (l.tipo === 'remedio') return `Hora do remédio${de}: ${l.titulo}`;
  if (l.tipo === 'atividade') return `Hora da atividade: ${l.titulo}`;
  if (l.tipo === 'retorno') return `Hoje tem retorno${l.area && AREAS[l.area] ? ' · ' + AREAS[l.area].curto : ''}${l.hora ? ' às ' + l.hora : ''}`;
  return `Como foi o dia${de}? Um toque registra.`;
}

const JANELA_MIN = 10; // só avisa se a hora marcada passou há até 10 min (abrir o app à noite não dispara o dia todo)
const jaAvisados = new Set();

function chavesAvisadas() {
  try { return new Set(JSON.parse(sessionStorage.getItem('atipario:avisados') || '[]')); } catch { return jaAvisados; }
}
function guardarAvisada(chave) {
  jaAvisados.add(chave);
  try { sessionStorage.setItem('atipario:avisados', JSON.stringify([...chavesAvisadas(), chave])); } catch { /* sem armazenamento: vale só a memória */ }
}

/** Liga o relógio que confere, a cada 30 s, se algum lembrete chegou na hora. */
export function iniciarAvisos(aoAvisar) {
  const checar = () => {
    const agora = new Date();
    const hoje = paraISO(agora);
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const ja = chavesAvisadas();
    doDia(hoje).forEach(l => {
      if (!l.hora || feito(l, hoje)) return;
      const [h, m] = l.hora.split(':').map(Number);
      const passou = minutosAgora - (h * 60 + m);
      const chave = `${l.id}:${hoje}`;
      if (passou < 0 || passou > JANELA_MIN || ja.has(chave) || jaAvisados.has(chave)) return;
      guardarAvisada(chave);
      const texto = textoDoAviso(l);
      if (permissaoNotificacao() === 'granted') {
        try { new Notification('atipario', { body: texto, tag: chave }); } catch { /* alguns celulares exigem service worker; o aviso na tela cobre */ }
      }
      aoAvisar?.(texto, l);
    });
  };
  checar();
  return setInterval(checar, 30000);
}

// ---------- calendário do celular (.ics) ----------

const escICS = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

function primeiroDia(l) {
  if (l.tipo === 'retorno') return l.data;
  for (let k = 0; k < 7; k++) {
    const iso = diaISO(-k);
    if (vale(l, iso)) return iso;
  }
  return hojeISO();
}

function eventoICS(l) {
  const [h, m] = (l.hora || '08:00').split(':');
  const inicio = primeiroDia(l).replace(/-/g, '') + `T${h}${m}00`;
  const carimbo = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const rotulo = TIPOS_LEMBRETE[l.tipo]?.rotulo || 'Lembrete';
  const de = store.pessoas.length > 1 && nomeDe(l.pessoaId) ? ` (${nomeDe(l.pessoaId)})` : '';
  const resumo = (l.tipo === 'checkin' ? 'Check-in do dia (atipario)' : l.tipo === 'retorno' ? l.titulo : `${rotulo}: ${l.titulo}`) + de;
  let regra = '';
  if (l.tipo !== 'retorno') {
    regra = l.dias?.length && l.dias.length < 7
      ? `RRULE:FREQ=WEEKLY;BYDAY=${l.dias.map(d => SIGLAS_ICS[d]).join(',')}`
      : 'RRULE:FREQ=DAILY';
  }
  const alarme = (gatilho, texto) => [
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escICS(texto)}`, `TRIGGER:${gatilho}`, 'END:VALARM',
  ];
  return [
    'BEGIN:VEVENT',
    `UID:${l.id}@atipario`,
    `DTSTAMP:${carimbo}`,
    `DTSTART:${inicio}`,
    'DURATION:PT15M',
    regra,
    `SUMMARY:${escICS(resumo)}`,
    ...alarme('PT0M', resumo),
    ...(l.tipo === 'retorno' ? alarme('-P1D', `Amanhã: ${resumo}`) : []),
    'END:VEVENT',
  ].filter(Boolean);
}

export function gerarICS(lista) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//atipario//lembretes//PT', 'CALSCALE:GREGORIAN',
    ...lista.flatMap(eventoICS),
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}

export function baixarICS(lista, nome = 'atipario-lembretes') {
  const blob = new Blob([gerarICS(lista)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${nome}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
