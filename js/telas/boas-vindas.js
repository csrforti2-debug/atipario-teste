// BOAS-VINDAS — primeira vez no app. 4 passos curtos, quase tudo por toque.
// capa → quem é você → seu nome → quem você acompanha (pula se for "eu") → equipe → mais alguém?
// Dá para acompanhar mais de uma pessoa: depois de cada uma, pergunta se tem mais alguém.

import { store } from '../store.js';
import { APP, RELACOES, AREAS } from '../config.js';
import { logo } from '../marca.js';
import { icone } from '../icones.js';
import { esc } from '../ui.js';
import { tracar } from '../movimento.js';
import { conta } from '../conta.js';

export function render(el, { ir }) {
  const novaPessoa = () => ({ nome: '', idade: '', equipe: new Set() });
  const f = { passo: 0, relacao: null, nome: '', pessoas: [], atual: novaPessoa() };
  // Quem usa é "eu" só na primeira pessoa: ela mesma. Depois dela, as outras são sempre "outra pessoa".
  const ehEuAgora = () => f.relacao === 'eu' && f.pessoas.length === 0;
  const passos = () => ['capa', 'relacao', 'nome', ...(ehEuAgora() ? ['equipe'] : ['pessoa', 'equipe']), 'mais'];

  function desenhar() {
    const lista = passos();
    const atual = lista[f.passo];
    const progresso = lista.slice(1).map((_, i) => `<i class="${i < f.passo ? 'feito' : ''}"></i>`).join('');
    window.scrollTo(0, 0);
    el.innerHTML = `<div class="bv">${atual === 'capa' ? '' : `<div class="bv-progresso">${progresso}</div>`}${PASSOS[atual]()}</div>`;
    el.firstElementChild.classList.add('tela-entra');
    ligar(atual);
  }

  const avancar = () => { f.passo++; desenhar(); };
  const voltar = () => {
    // Voltar do primeiro passo de uma pessoa adicional devolve a anterior para edição.
    if (passos()[f.passo] === 'pessoa' && f.pessoas.length > 0) { f.atual = f.pessoas.pop(); f.passo = passos().indexOf('mais'); desenhar(); return; }
    f.passo--; desenhar();
  };
  const rodape = (pode, texto = 'Continuar') => `
    <div class="pe-fixo">
      <button class="btn btn-primario btn-bloco" data-av ${pode ? '' : 'disabled'}>${texto}</button>
      <button class="btn btn-fantasma btn-bloco" data-volta>Voltar</button>
    </div>`;

  const PASSOS = {
    capa: () => `
      <div class="bv-capa">
        ${logo({ tamanho: 92, animado: true, espessura: 5.5 })}
        <div class="palavra-marca">${APP.nome}</div>
        <h1>Tudo o que acontece, num lugar só.</h1>
        <p class="bv-sub">Terapias, escola, remédios e o dia a dia, registrados em poucos toques.
          Quando precisar, vira um resumo pronto para mandar à equipe.</p>
      </div>
      <div class="pe-fixo">
        <button class="btn btn-primario btn-bloco" data-av>${APP.convite}</button>
        <button class="btn btn-fantasma btn-bloco" data-exemplo>Ver com dados de exemplo</button>
        ${conta.situacao.disponivel === true ? '<button class="btn btn-fantasma btn-bloco" data-conta>Já tenho conta</button>' : ''}
        ${conta.situacao.disponivel === false ? '<p class="suave pequeno" style="text-align:center;margin-top:6px">Versão de teste. Seus registros ficam só neste aparelho. Se preferir, use nomes de mentira.</p>' : ''}
      </div>`,

    relacao: () => `
      <h1>Oi! Quem está chegando?</h1>
      <p class="bv-sub">Assim a gente fala do jeito certo com você.</p>
      <div class="opcoes">
        ${RELACOES.map(r => `
          <button class="opcao" data-rel="${r.id}" aria-pressed="${f.relacao === r.id}">
            <span class="opcao-marca">${f.relacao === r.id ? icone('check', 14) : ''}</span>
            <span><b>${r.rotulo}</b>${r.dica ? `<small>${r.dica}</small>` : ''}</span>
          </button>`).join('')}
      </div>
      ${rodape(!!f.relacao)}`,

    nome: () => `
      <h1>Como podemos te chamar?</h1>
      <p class="bv-sub">Só o primeiro nome ou apelido já basta.</p>
      <input class="campo" id="nome" autocomplete="given-name" placeholder="Seu nome" value="${esc(f.nome)}" maxlength="30">
      ${rodape(f.nome.trim().length > 0)}`,

    pessoa: () => `
      <h1>E quem você acompanha?</h1>
      <p class="bv-sub">É sobre essa pessoa que os registros vão contar a história.</p>
      <input class="campo" id="pessoa" placeholder="Nome ou apelido" value="${esc(f.atual.nome)}" maxlength="30">
      <div class="pergunta">Idade <small>opcional</small></div>
      <div class="chips chips-rolagem">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13+'].map(i =>
          `<button class="chip" data-idade="${i}" aria-pressed="${f.atual.idade === i}">${i}</button>`).join('')}
      </div>
      ${rodape(f.atual.nome.trim().length > 0)}`,

    equipe: () => `
      <h1>${ehEuAgora() ? 'Quem faz parte da sua rede?' : `Quem cuida de ${esc(f.atual.nome)} junto com você?`}</h1>
      <p class="bv-sub">Toque em cada profissional ou lugar. Dá para mudar depois.</p>
      <div class="chips">
        ${Object.entries(AREAS).map(([id, a]) =>
          `<button class="chip" data-area="${id}" aria-pressed="${f.atual.equipe.has(id)}">${a.nome}</button>`).join('')}
      </div>
      ${rodape(true)}`,

    mais: () => `
      <h1>Você acompanha mais alguém?</h1>
      <p class="bv-sub">Uma conta pode ter mais de uma pessoa: filhos, irmãos, quem for.
        Os registros de cada um ficam separados, e o relatório nunca mistura.</p>
      <div class="opcoes">
        ${f.pessoas.concat(f.atual).map(p => `<div class="opcao" aria-pressed="true"><span class="opcao-marca">${icone('check', 14)}</span><span><b>${esc(p.nome || f.nome)}</b></span></div>`).join('')}
      </div>
      <div class="pe-fixo">
        <button class="btn btn-secundario btn-bloco" data-outra>${icone('mais', 18)} Adicionar outra pessoa</button>
        <button class="btn btn-primario btn-bloco" data-fim>Pronto, vamos lá</button>
        <button class="btn btn-fantasma btn-bloco" data-volta>Voltar</button>
      </div>`,
  };

  function ligar(atual) {
    // Nos botões de começo e fim, o mini-traço do logo antes de seguir.
    el.querySelector('[data-av]')?.addEventListener('click', async e => {
      if (atual === 'capa') await tracar(e.currentTarget);
      avancar();
    });
    el.querySelector('[data-outra]')?.addEventListener('click', () => {
      f.pessoas.push(f.atual); f.atual = novaPessoa();
      f.passo = passos().indexOf('pessoa'); desenhar();
    });
    el.querySelector('[data-fim]')?.addEventListener('click', async e => {
      await tracar(e.currentTarget);
      f.pessoas.push(f.atual); f.atual = novaPessoa(); concluir();
    });
    el.querySelector('[data-volta]')?.addEventListener('click', voltar);
    el.querySelector('[data-conta]')?.addEventListener('click', () => ir('conta?modo=entrar'));
    el.querySelector('[data-exemplo]')?.addEventListener('click', () => { store.carregarExemplo(); ir('inicio'); });

    el.querySelectorAll('[data-rel]').forEach(b => b.onclick = () => {
      f.relacao = b.dataset.rel;
      desenhar();
      setTimeout(avancar, 260); // escolheu, já anda: menos um toque
    });

    const campo = el.querySelector('#nome, #pessoa');
    if (campo) {
      const botao = el.querySelector('[data-av]');
      campo.addEventListener('input', () => {
        if (campo.id === 'nome') f.nome = campo.value; else f.atual.nome = campo.value;
        botao.disabled = !campo.value.trim();
      });
      campo.addEventListener('keydown', e => { if (e.key === 'Enter' && campo.value.trim()) avancar(); });
      setTimeout(() => campo.focus(), 300);
    }

    el.querySelectorAll('[data-idade]').forEach(b => b.onclick = () => {
      f.atual.idade = f.atual.idade === b.dataset.idade ? '' : b.dataset.idade;
      el.querySelectorAll('[data-idade]').forEach(x => x.setAttribute('aria-pressed', x.dataset.idade === f.atual.idade));
    });

    el.querySelectorAll('[data-area]').forEach(b => b.onclick = () => {
      const id = b.dataset.area;
      f.atual.equipe.has(id) ? f.atual.equipe.delete(id) : f.atual.equipe.add(id);
      b.setAttribute('aria-pressed', f.atual.equipe.has(id));
    });
  }

  function concluir() {
    const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const pessoas = f.pessoas.map((p, k) => k === 0 && f.relacao === 'eu'
      ? { id: novoId(), nome: f.nome.trim(), idade: null, eu: true, equipe: [...p.equipe] }
      : { id: novoId(), nome: p.nome.trim(), idade: p.idade || null, eu: false, equipe: [...p.equipe] });
    store.salvarPerfil({ quem: { nome: f.nome.trim(), relacao: f.relacao }, pessoas });
    ir('inicio');
  }

  desenhar();
  // A capa aparece antes de o servidor responder: quando responder, redesenha (mostra "Já tenho conta" ou o aviso de versão de teste).
  const parar = conta.aoMudar(() => { if (passos()[f.passo] === 'capa') desenhar(); });
  return parar;
}
