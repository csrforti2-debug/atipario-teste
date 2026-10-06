// ANÁLISE — contas feitas em cima dos registros: títulos, cores, curva e contagens.
// Nenhuma conta aqui é "diagnóstico": só agrupa o que a família marcou.

import { TIPOS, AREAS } from './config.js';
import { icone } from './icones.js';
import { diaISO, diasEntre } from './datas.js';

export const corTipo = tipo => `var(--t-${tipo})`;

export const selo = (tipo, tam = 22) =>
  `<span class="selo" style="--cor:${corTipo(tipo)}">${icone(TIPOS[tipo]?.icone || 'brilho', tam)}</span>`;

export function tituloRegistro(r) {
  const t = TIPOS[r.tipo];
  if (r.area && AREAS[r.area]) return r.tipo === 'sessao' ? AREAS[r.area].nome : `Consulta · ${AREAS[r.area].curto}`;
  if (r.tipo === 'documento' && r.marcadores?.[0]) return r.marcadores[0];
  return t?.rotulo || 'Registro';
}

/** Registros dos últimos `dias` dias (inclui hoje). */
export function doPeriodo(registros, dias) {
  const desde = diaISO(dias - 1);
  return registros.filter(r => r.data >= desde);
}

/**
 * Pontos da curva: média do "Como foi?" por fatia de tempo.
 * `fatia` = quantos dias cada ponto junta (1 = diário, 7 = semanal).
 */
export function pontosCurva(registros, dias, fatia) {
  const desde = diaISO(dias - 1);
  const baldes = new Map();
  registros.forEach(r => {
    if (!r.humor || r.data < desde) return;
    const i = Math.floor(diasEntre(desde, r.data) / fatia);
    const b = baldes.get(i) || { soma: 0, n: 0 };
    b.soma += r.humor; b.n++;
    baldes.set(i, b);
  });
  const total = Math.ceil(dias / fatia);
  const pontos = [...baldes.entries()].sort((a, b) => a[0] - b[0])
    .map(([i, b]) => ({ x: total > 1 ? i / (total - 1) : 0, y: b.soma / b.n }));
  return pontos;
}

export function mediaHumor(registros) {
  const com = registros.filter(r => r.humor);
  return com.length ? com.reduce((s, r) => s + r.humor, 0) / com.length : null;
}

/** Tendência simples: média da 2ª metade menos a da 1ª. */
export function tendencia(pontos) {
  if (pontos.length < 4) return 0;
  const meio = Math.floor(pontos.length / 2);
  const m = arr => arr.reduce((s, p) => s + p.y, 0) / arr.length;
  return m(pontos.slice(meio)) - m(pontos.slice(0, meio));
}

/** Marcadores mais frequentes: [['Dormiu mal', 3], ...] */
export function contarMarcadores(registros) {
  const c = new Map();
  registros.forEach(r => (r.marcadores || []).forEach(m => c.set(m, (c.get(m) || 0) + 1)));
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
}

/** Conta um campo-lista dos registros (ex.: 'gatilhos', 'ajudou'): [['Cansaço', 4], ...] */
export function contarCampo(registros, campo) {
  const c = new Map();
  registros.forEach(r => (r[campo] || []).forEach(m => c.set(m, (c.get(m) || 0) + 1)));
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
}
