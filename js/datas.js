// DATAS — tudo em data local no formato 'AAAA-MM-DD' (sem fuso para atrapalhar).

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function paraISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function deISO(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Dia de hoje menos `offset` dias, em ISO. */
export function diaISO(offset = 0, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() - offset);
  return paraISO(d);
}

export const hojeISO = () => diaISO(0);

/** 'Hoje', 'Ontem' ou 'qua, 23 set'. */
export function rotuloDia(iso) {
  if (iso === diaISO(0)) return 'Hoje';
  if (iso === diaISO(1)) return 'Ontem';
  const d = deISO(iso);
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** '23/09' */
export function curta(iso) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** '23 de setembro' */
export function longa(iso) {
  const d = deISO(iso);
  const nomes = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${d.getDate()} de ${nomes[d.getMonth()]}`;
}

/** Diferença em dias entre duas datas ISO (b - a). */
export function diasEntre(a, b) {
  return Math.round((deISO(b) - deISO(a)) / 86400000);
}
