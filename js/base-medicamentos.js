// BASE DE MEDICAMENTOS — pequena, de propósito, e toda com fonte.
//
// Regra do projeto (regras/regra-fontes.md): nada entra aqui de memória. Cada item carrega
// órgão, referência exata, link, data da consulta e situação. Item sem os cinco não entra.
// Para acrescentar um remédio: leia a fonte, copie o que ela diz em linguagem simples, preencha `fonte`.
//
// Limites que a tela repete para a família: é consulta, não orientação; não traz dose nem
// horário; estar fora da base NÃO significa que não exista interação. Por que não alerta
// automático nem cálculo: memoria/base-legal.md (RDC 657/2022, perguntas 45, 65, 66 e 68).

export const REVISAO = {
  revisadoPor: null, // ex.: 'Nome, CRF-PE 0000, em 2026-10-10'. Enquanto for null, a tela avisa que falta revisão.
};

const PCDT_7_2022 = {
  orgao: 'Ministério da Saúde (SAES e SCTIE)',
  referencia: 'Portaria Conjunta nº 7, de 12/04/2022: Protocolo Clínico e Diretrizes Terapêuticas do Comportamento Agressivo no Transtorno do Espectro do Autismo, seção 6.2 (tratamento medicamentoso), esquemas de administração',
  link: 'https://www.gov.br/conitec/pt-br/midias/protocolos/20220419_portal-portaria_conjunta_7_comportamento_agressivo_tea.pdf/@@display-file/file',
  consulta: '2026-10-06',
  situacao: 'Publicado em 12/04/2022. Sem notícia de revogação na busca de 06/10/2026; vigência não confirmada no Diário Oficial.',
};

// Cada item:  tipo 'alimento' | 'classe' | 'medicamento'  (medicamento = vale para `com`: ids de outros remédios)
export const MEDICAMENTOS = [
  {
    id: 'risperidona', nome: 'Risperidona',
    itens: [
      { tipo: 'alimento', titulo: 'Com ou sem comida',
        texto: 'O protocolo diz que tomar a risperidona junto com alimentos não interfere na biodisponibilidade, isto é, não muda quanto do remédio o corpo absorve.',
        fonte: PCDT_7_2022 },
      { tipo: 'classe', titulo: 'Remédios que pedem cuidado junto com ela',
        texto: 'O protocolo pede cuidado ao usar a risperidona com remédios que também atuam no sistema nervoso central, com levodopa e agonistas dopaminérgicos, com remédios que baixam a pressão e com remédios que prolongam o intervalo QT do coração (cita claritromicina, domperidona, ondansetrona, voriconazol e outros antipsicóticos). Diz que essas combinações não necessariamente impedem o uso junto, mas exigem maior cautela e monitoramento.',
        fonte: PCDT_7_2022 },
      { tipo: 'medicamento', com: ['levodopa', 'claritromicina', 'domperidona', 'ondansetrona', 'voriconazol'],
        titulo: 'Combinação que pede maior cautela',
        texto: 'O protocolo coloca esta combinação entre as que exigem maior cautela e monitoramento. Ele não diz que ela impede o uso junto.',
        fonte: PCDT_7_2022 },
      { tipo: 'medicamento', com: ['carbamazepina', 'fenitoina', 'fenobarbital', 'rifampicina'],
        titulo: 'Pode diminuir o efeito da risperidona',
        texto: 'O protocolo diz que usar a risperidona junto com indutores enzimáticos potentes (cita estes como exemplos) pode reduzir o nível dela no sangue, e que isso pode exigir ajuste de dose pela equipe de saúde.',
        fonte: PCDT_7_2022 },
      { tipo: 'medicamento', com: ['paroxetina', 'itraconazol'],
        titulo: 'Pode aumentar o efeito da risperidona',
        texto: 'O protocolo diz que usar a risperidona junto com inibidores potentes (cita estes como exemplos) pode aumentar a concentração da parte ativa dela, e que isso pode exigir ajuste de dose pela equipe de saúde.',
        fonte: PCDT_7_2022 },
    ],
  },
  // Remédios que a fonte cita ao falar da risperidona. Ainda sem informação própria nesta base.
  ...[['levodopa', 'Levodopa'], ['claritromicina', 'Claritromicina'], ['domperidona', 'Domperidona'], ['ondansetrona', 'Ondansetrona'],
      ['voriconazol', 'Voriconazol'], ['carbamazepina', 'Carbamazepina'], ['fenitoina', 'Fenitoína'], ['fenobarbital', 'Fenobarbital'],
      ['rifampicina', 'Rifampicina'], ['paroxetina', 'Paroxetina'], ['itraconazol', 'Itraconazol']]
    .map(([id, nome]) => ({ id, nome, itens: [] })),
];

export const medicamento = id => MEDICAMENTOS.find(m => m.id === id) || null;

/**
 * O que a base diz sobre um remédio (`a`) e, opcionalmente, sobre ele combinado com outro (`b`).
 * Devolve { proprios, combinacoes, semInfo }:
 *  - proprios: itens do próprio remédio (alimento, classe)
 *  - combinacoes: itens de qualquer um dos dois que citam o outro
 */
export function consultar(a, b = null) {
  const A = medicamento(a);
  const B = b ? medicamento(b) : null;
  const doutro = (dono, alvo) => dono.itens
    .filter(i => i.tipo === 'medicamento' && i.com.includes(alvo))
    .map(i => ({ ...i, entre: [dono.nome, medicamento(alvo).nome] }));
  const proprios = A ? A.itens.filter(i => i.tipo !== 'medicamento') : [];
  let combinacoes = [];
  if (A && B) combinacoes = [...doutro(A, B.id), ...doutro(B, A.id)];
  else if (A) combinacoes = MEDICAMENTOS.filter(m => m.id !== A.id).flatMap(m => doutro(m, A.id));
  return { A, B, proprios, combinacoes, semInfo: !proprios.length && !combinacoes.length };
}
