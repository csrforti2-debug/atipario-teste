// TEMA — aplica a paleta no <html>. As cores em si estão em css/tokens.css.
import { store } from './store.js';

// ?tema=lavanda na URL tem prioridade e NÃO é salvo (usado pelo laboratório).
const doEndereco = new URLSearchParams(location.search).get('tema');

export function aplicarTema(id = doEndereco || store.prefs.tema) {
  document.documentElement.dataset.tema = id;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

export const temaAtual = () => document.documentElement.dataset.tema;
