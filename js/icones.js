// ÍCONES — todos no mesmo estilo de linha do logo (traço 1.8, pontas redondas).
// Para adicionar um ícone: acrescente uma entrada no objeto abaixo (viewBox 24x24).

const P = {
  sessao: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16h0A1.5 1.5 0 0 1 4 14.5z"/><path d="M12 12.6s-3-1.7-3-3.6a1.5 1.5 0 0 1 3-.5 1.5 1.5 0 0 1 3 .5c0 1.9-3 3.6-3 3.6z"/>',
  consulta: '<path d="M6 3.5v5a4 4 0 0 0 8 0v-5"/><path d="M10 12.5v2.5a4.5 4.5 0 0 0 9 0v-2"/><circle cx="19" cy="11" r="2"/>',
  remedio: '<rect x="3.2" y="8.6" width="17.6" height="6.8" rx="3.4" transform="rotate(-35 12 12)"/><path d="M10.1 9.3l3.8 5.4"/>',
  escola: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
  casa: '<path d="M4 10.5L12 4l8 6.5"/><path d="M6 9v10h12V9"/><path d="M10 19v-5h4v5"/>',
  documento: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z" transform="translate(-1 0)"/><path d="M13 3.5V8h4"/><path d="M9 12h6M9 15.5h4"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v2.5"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  seta: '<path d="M9 5l7 7-7 7"/>',
  linha: '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8"/><path d="M11 6h8M11 18h8M11 12h5"/><circle cx="6" cy="12" r=".6"/>',
  relatorio: '<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z"/><path d="M14 3.5V8h4"/><path d="M9 17l2-3 2 1.5 2.5-4"/>',
  perfil: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5"/>',
  enviar: '<path d="M20 4L10.5 13.5"/><path d="M20 4l-6 16-3.5-6.5L4 10z"/>',
  baixar: '<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
  copiar: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 15.5V5.5A1.5 1.5 0 0 1 6.5 4H15"/>',
  lixo: '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/>',
  calendario: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  brilho: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  cadeado: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  sino: '<path d="M6 17.5V11a6 6 0 0 1 12 0v6.5"/><path d="M4.5 17.5h15"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  paleta: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.7 0-.9.7-1.6 1.7-1.6h2.1a4 4 0 0 0 4-4c0-3.9-3.8-7-8.5-7z"/><circle cx="7.8" cy="11" r="1"/><circle cx="10.5" cy="7.3" r="1"/><circle cx="15" cy="7.5" r="1"/>',
};

export function icone(nome, tamanho = 22, extra = '') {
  return `<svg class="icone ${extra}" width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[nome] || ''}</svg>`;
}
