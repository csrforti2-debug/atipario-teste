// CONFIG — o "cardápio" do app: textos, tipos de registro, botões de marcação.
// É o arquivo que mais vai mudar conforme a coleta de campo avança.
// Mudar um texto ou acrescentar um botão de marcação = editar aqui, sem mexer em tela.

export const APP = {
  nome: 'atipario',
  convite: 'Vamos atipicar?',
  slogan: 'O caminho de quem é atípico, registrado com poucos toques.',
  limiteNota: 140, // de propósito: o app não quer que ninguém escreva textão
};

// Quem está usando. "eu" = a própria pessoa atípica se acompanhando.
export const RELACOES = [
  { id: 'mae', rotulo: 'Sou mãe', noRelatorio: 'mãe' },
  { id: 'pai', rotulo: 'Sou pai', noRelatorio: 'pai' },
  { id: 'familiar', rotulo: 'Sou da família', dica: 'avó, tia, irmão, padrinho…', noRelatorio: 'familiar' },
  { id: 'eu', rotulo: 'Sou eu', dica: 'sou uma pessoa atípica e quero me acompanhar', noRelatorio: 'a própria pessoa' },
  { id: 'outro', rotulo: 'Cuido de outro jeito', dica: 'responsável legal, cuidador(a)…', noRelatorio: 'cuidador(a)' },
];

// Profissionais e lugares que podem fazer parte da rede de cuidado.
export const AREAS = {
  fono:        { nome: 'Fonoaudiologia',     curto: 'Fono' },
  to:          { nome: 'Terapia ocupacional', curto: 'TO' },
  psico:       { nome: 'Psicologia',         curto: 'Psico' },
  psicoped:    { nome: 'Psicopedagogia',     curto: 'Psicopedagogia' },
  aba:         { nome: 'ABA',                curto: 'ABA' },
  fisio:       { nome: 'Fisioterapia',       curto: 'Fisio' },
  musico:      { nome: 'Musicoterapia',      curto: 'Musicoterapia' },
  neuro:       { nome: 'Neurologista',       curto: 'Neuro' },
  psiq:        { nome: 'Psiquiatra',         curto: 'Psiquiatra' },
  pediatra:    { nome: 'Pediatra',           curto: 'Pediatra' },
  outromedico: { nome: 'Outro médico',       curto: 'Outro médico' },
  escola:      { nome: 'Escola',             curto: 'Escola' },
};

// Tipos de registro. A ordem aqui é a ordem dos blocos na tela "Registrar".
export const TIPOS = {
  sessao: {
    rotulo: 'Terapia', icone: 'sessao',
    perguntaArea: 'Com quem foi?',
    areas: ['fono', 'to', 'psico', 'psicoped', 'aba', 'fisio', 'musico'],
    marcadores: ['Participou bem', 'Resistiu', 'Aprendeu algo novo', 'Levou tarefa pra casa', 'Recebi orientação', 'Faltou'],
    exemplo: 'pediu para treinar os sons em casa',
  },
  consulta: {
    rotulo: 'Consulta', icone: 'consulta',
    perguntaArea: 'Com quem foi?',
    areas: ['neuro', 'psiq', 'pediatra', 'outromedico'],
    marcadores: ['Mudou medicação', 'Pediu exame', 'Novo laudo', 'Retorno marcado', 'Encaminhou'],
    exemplo: 'retorno em 3 meses',
  },
  remedio: {
    rotulo: 'Medicação', icone: 'remedio',
    marcadores: ['Tomou certinho', 'Esqueceu uma dose', 'Efeito colateral', 'Mudou a dose', 'Começou remédio novo', 'Parou remédio'],
    exemplo: 'meia dose à noite, como a médica pediu',
  },
  escola: {
    rotulo: 'Escola', icone: 'escola',
    marcadores: ['Dia tranquilo', 'Teve crise', 'Mandou recado', 'Avaliação', 'Brincou com colegas', 'Reunião'],
    exemplo: 'professora elogiou a leitura',
  },
  casa: {
    rotulo: 'Dia a dia', icone: 'casa',
    marcadores: ['Dormiu bem', 'Dormiu mal', 'Comeu bem', 'Recusou comida', 'Teve crise', 'Conquista!', 'Agitado', 'Calmo',
      'Irritado', 'Repetições', 'Isolou-se', 'Dificuldade de atenção', 'Dificuldade de comunicação'],
    // Diário: duas perguntas a mais, só no "Dia a dia". Listas vindas da pesquisa de campo da equipe (2026-10-06).
    gatilhos: ['Barulho alto', 'Mudança de rotina', 'Cansaço', 'Outro'],
    ajudou: ['Rotina visual', 'Fone abafador', 'Tempo sozinho', 'Atividade favorita', 'Outro'],
    exemplo: 'pediu água falando a frase inteira',
  },
  documento: {
    rotulo: 'Documento', icone: 'documento',
    fotoPrincipal: true,
    marcadores: ['Laudo', 'Relatório de terapia', 'Receita', 'Exame', 'Boletim', 'Atestado'],
    exemplo: 'laudo da neuro de setembro',
  },
};

// "Como foi?" — a mesma régua em todo registro. É percepção de quem registra,
// NÃO avaliação clínica (ver aviso no relatório).
export const HUMOR = { 1: 'Difícil', 2: 'Pesado', 3: 'Ok', 4: 'Bom', 5: 'Ótimo' };

export const TEMAS = [
  { id: 'caderno', nome: 'Caderno', cores: ['#FBF7F2', '#C96A4B', '#7F9C7A'] },
  { id: 'lavanda', nome: 'Lavanda', cores: ['#F6F4FB', '#6F61D0', '#E8997A'] },
  { id: 'sol',     nome: 'Sol',     cores: ['#FFFDF5', '#F2B33D', '#5E9FD6'] },
];

export const AVISO_RELATORIO =
  'Registro feito pela família com base no que percebeu no dia a dia. ' +
  'Não é avaliação clínica e não substitui a opinião dos profissionais.';

// Lembretes. "retorno" e "checkin" têm regras próprias (data única / só avisa se ainda não registrou).
// O app só lembra do que a família combinou com a equipe de saúde: não indica dose, horário nem retorno.
export const TIPOS_LEMBRETE = {
  remedio:   { rotulo: 'Remédio',   icone: 'remedio',    pergunta: 'Qual remédio?',  exemplo: 'ex.: o que a médica receitou', cor: 'var(--t-remedio)' },
  atividade: { rotulo: 'Atividade', icone: 'brilho',     pergunta: 'Qual atividade?', exemplo: 'ex.: exercícios da fono', cor: 'var(--t-sessao)' },
  retorno:   { rotulo: 'Retorno',   icone: 'consulta',   pergunta: 'Retorno com quem?', cor: 'var(--t-consulta)' },
  checkin:   { rotulo: 'Check-in do dia', icone: 'casa', cor: 'var(--t-casa)' },
};

export const AVISO_LEMBRETES =
  'O atipario só lembra do que você combinou com a equipe de saúde. ' +
  'Ele não indica dose, horário nem data de retorno.';

// ---------- Conta e termo (texto-rascunho: precisa de revisão jurídica antes de uso por outras famílias) ----------
// Pede os itens do art. 9º da LGPD: finalidade, forma e duração, controlador e contato, uso
// compartilhado, direitos. Mudou o texto? Mude a versão: o servidor recusa cadastro com versão velha.
export const TERMO = {
  versao: '2026-10-06-v1',
  contato: '', // preencher antes de convidar outras famílias (e-mail do responsável pelos dados)
  secoes: [
    { t: 'Quem cuida dos dados', p: [
      'A equipe do projeto atipario (trabalho da disciplina de Empreendedorismo, UFPE). Este é um protótipo em teste.',
    ] },
    { t: 'O que guardamos e para quê', p: [
      'Seu e-mail e uma senha (guardada só de forma embaralhada), para você entrar.',
      'Os nomes das pessoas que você acompanha, os registros, as marcações e os lembretes, para você ver tudo em outro aparelho. As fotos de documentos NÃO sobem: ficam só no seu aparelho.',
      'A data e a versão deste termo em que você concordou, como prova do seu consentimento.',
    ] },
    { t: 'Dado de saúde e de criança', p: [
      'O que você registra é dado de saúde, que a lei trata como sensível. Só guardamos com o seu consentimento específico (LGPD, art. 11, I; para crianças, art. 14, §1º). Por isso pedimos que você confirme ser a pessoa responsável.',
    ] },
    { t: 'Pesquisa (opcional e separada)', p: [
      'Se você aceitar, guardamos uma cópia reduzida para entender como as famílias usam o app: data, tipo de registro, profissional, o rostinho 1 a 5 e as marcações. Sem nome, e-mail, frases, nomes de remédios nem fotos, e com um código aleatório no lugar de você.',
      'Você pode desligar quando quiser, na tela da conta. Ao desligar, apagamos essa cópia.',
    ] },
    { t: 'Com quem compartilhamos', p: [
      'Com ninguém. Não vendemos nem repassamos seus dados a clínicas, planos de saúde ou empresas. O relatório só sai se você mandar.',
    ] },
    { t: 'Por quanto tempo', p: [
      'Enquanto a conta existir. Ao excluir a conta, apagamos tudo: registros, lembretes, consentimentos e a cópia de pesquisa.',
    ] },
    { t: 'Seus direitos (LGPD, art. 18)', p: [
      'Acessar e baixar seus dados (botão na tela da conta), corrigir (editando no app), apagar (excluir a conta) e retirar o consentimento quando quiser.',
    ] },
  ],
};
