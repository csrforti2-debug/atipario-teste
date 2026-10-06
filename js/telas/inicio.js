// INÍCIO — limpa de propósito. Três coisas só:
// 1) como foi hoje (1 toque registra)  2) a semana em 7 bolinhas  3) mandar resumo.
// O cartão "Para hoje" só aparece quando a família criou lembretes (ver telas/lembretes.js).
// O histórico completo mora na aba Histórico.

import { store, nomePessoa, nomeDe, ehEu } from '../store.js';
import { seletorPessoas, ligarSeletor } from '../pessoas.js';
import { HUMOR, APP } from '../config.js';
import { logo, rosto } from '../marca.js';
import { icone } from '../icones.js';
import { esc } from '../ui.js';
import { hojeISO, diaISO, deISO } from '../datas.js';
import { pontosCurva, tendencia } from '../analise.js';
import { abrirRegistro } from '../fluxos/registro.js';
import { abrirDetalhe } from './historico.js';
import { doDia, feito, concluir, desfazer, retornosProximos, diasAte, tituloLembrete } from '../lembretes.js';
import { TIPOS_LEMBRETE } from '../config.js';
import { conta } from '../conta.js';

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function render(el, ctx) {
  const perfil = store.perfil;
  const eu = ehEu();
  const pessoa = nomePessoa();
  const todos = store.registros;
  const hoje = hojeISO();
  const diaDeHoje = todos.find(r => r.data === hoje && r.tipo === 'casa' && r.humor);
  const redesenhar = () => render(el, ctx);

  // Lembretes de hoje (o check-in já tem o cartão de cima, então não entra na lista).
  const paraHoje = doDia(hoje).filter(l => l.tipo !== 'checkin');
  const pendentes = paraHoje.filter(l => !feito(l, hoje)).length;
  const proximos = retornosProximos(7);

  // semana: últimos 7 dias, do mais antigo para hoje
  const semana = Array.from({ length: 7 }, (_, k) => {
    const iso = diaISO(6 - k);
    return { iso, letra: LETRAS[deISO(iso).getDay()], tem: todos.some(r => r.data === iso), hoje: iso === hoje };
  });
  const diasNaSemana = semana.filter(d => d.tem).length;
  const tend = tendencia(pontosCurva(todos, 28, 4));
  const fraseTend = tend > .25 ? 'As últimas semanas vêm melhorando.' : tend < -.25 ? 'As últimas semanas andaram mais pesadas.' : 'As últimas semanas estão estáveis.';

  el.innerHTML = `
  <div>
    <header class="topo">
      <div class="topo-marca">${logo({ tamanho: 30, espessura: 7 })}<span class="palavra-marca">${APP.nome}</span></div>
      <div class="topo-acoes">
        <button class="btn-icone sino" data-sino aria-label="Lembretes${pendentes ? `, ${pendentes} para hoje` : ''}">${icone('sino', 22)}${pendentes ? '<i class="sino-ponto"></i>' : ''}</button>
        <button class="avatar" data-perfil aria-label="Perfil e ajustes">${esc(perfil.quem.nome[0] || '?').toUpperCase()}</button>
      </div>
    </header>

    <div class="ola">
      <h1>Oi, ${esc(perfil.quem.nome)}.</h1>
      <p>${eu ? 'Seu caminho, um registro de cada vez.' : `Acompanhando ${esc(pessoa)}${store.pessoaAtiva?.idade ? `, ${esc(store.pessoaAtiva.idade)} anos` : ''}.`}</p>
    </div>

    ${seletorPessoas()}

    ${diaDeHoje ? `
    <button class="cartao hoje-feito" data-hoje>
      <span class="rosto-btn" aria-pressed="true">${rosto(diaDeHoje.humor, 34)}</span>
      <span><b>Hoje foi ${HUMOR[diaDeHoje.humor].toLowerCase()}</b>
        <span class="suave pequeno">${diaDeHoje.marcadores.length ? esc(diaDeHoje.marcadores.join(' · ')) : 'Toque para marcar o que rolou'}</span></span>
      ${icone('seta', 20, 'fraco')}
    </button>` : `
    <section class="cartao checkin" aria-label="Registro rápido do dia">
      <h2>${eu ? 'Como foi seu dia?' : `Como foi o dia de ${esc(pessoa)}?`}</h2>
      <div class="rostos">
        ${[1, 2, 3, 4, 5].map(n => `<button class="rosto-btn" data-humor="${n}" aria-label="${HUMOR[n]}">${rosto(n, 34)}</button>`).join('')}
      </div>
      <div class="rosto-legenda">Um toque e já fica registrado.</div>
    </section>`}

    ${paraHoje.length || proximos.length ? `
    <section class="cartao para-hoje" aria-label="Lembretes de hoje">
      <div class="semana-topo"><b>${icone('sino', 18)} Para hoje</b><a class="suave pequeno" href="#/lembretes">ver todos</a></div>
      ${paraHoje.map(l => `
        <button class="para-hoje-item ${feito(l, hoje) ? 'feito' : ''}" data-lem="${l.id}" aria-pressed="${feito(l, hoje)}">
          <span class="para-hoje-marca">${feito(l, hoje) ? icone('check', 16) : ''}</span>
          <span class="para-hoje-texto"><b>${esc(tituloLembrete(l))}</b><span class="suave pequeno">${esc(l.hora || '')}${l.tipo === 'remedio' ? '' : ' · ' + TIPOS_LEMBRETE[l.tipo].rotulo.toLowerCase()}${store.pessoas.length > 1 ? ' · ' + esc(nomeDe(l.pessoaId)) : ''}</span></span>
        </button>`).join('')}
      ${proximos.map(l => `
        <a class="para-hoje-item aviso" href="#/lembretes">
          <span class="selo" style="--cor:${TIPOS_LEMBRETE.retorno.cor};width:28px;height:28px;border-radius:9px">${icone('consulta', 16)}</span>
          <span class="para-hoje-texto"><b>${esc(tituloLembrete(l))}</b><span class="suave pequeno">${diasAte(l.data) === 1 ? 'amanhã' : `em ${diasAte(l.data)} dias`}</span></span>
        </a>`).join('')}
    </section>` : ''}

    <a class="cartao semana" href="#/historico">
      <div class="semana-topo"><b>Esta semana</b><span class="suave pequeno">${diasNaSemana} de 7 dias</span></div>
      <div class="semana-dias">
        ${semana.map(d => `<span class="semana-dia ${d.tem ? 'tem' : ''} ${d.hoje ? 'hoje' : ''}"><i></i>${d.letra}</span>`).join('')}
      </div>
      <p class="suave pequeno">${todos.length >= 6 ? fraseTend : 'Com alguns dias registrados, aparece aqui como a semana vem indo.'}</p>
    </a>

    ${conta.situacao.disponivel && !conta.situacao.logado && !store.prefs.contaDispensada && todos.length >= 3 ? `
    <div class="cartao convite-conta">
      <span class="selo" style="--cor:var(--accent)">${icone('cadeado', 22)}</span>
      <span style="flex:1"><b>Guardar numa conta?</b><span class="suave pequeno" style="display:block">Opcional. Leva seus registros para outro aparelho.</span>
        <span class="sugestao-acoes"><a class="btn btn-secundario" href="#/conta?modo=criar">Ver como funciona</a><button class="btn btn-fantasma" data-dispensar-conta>Agora não</button></span></span>
    </div>` : ''}

    <a class="cartao chamada" href="#/relatorio">
      <span class="selo" style="--cor:var(--f-relatorio)">${icone('enviar', 24)}</span>
      <span><b>Mandar resumo para a equipe</b><span class="suave pequeno">Pronto para o WhatsApp ou PDF</span></span>
      ${icone('seta', 20, 'fraco')}
    </a>
  </div>`;

  ligarSeletor(el, redesenhar);
  el.querySelector('[data-dispensar-conta]')?.addEventListener('click', () => { store.definirPref('contaDispensada', true); redesenhar(); });
  el.querySelector('[data-perfil]').onclick = () => ctx.ir('perfil');
  el.querySelector('[data-sino]').onclick = () => ctx.ir('lembretes');
  el.querySelectorAll('[data-lem]').forEach(b => b.onclick = () => {
    const l = store.lembretes.find(x => x.id === b.dataset.lem);
    if (!l) return;
    feito(l, hoje) ? desfazer(l, hoje) : concluir(l, hoje);
    redesenhar();
  });
  el.querySelector('[data-hoje]')?.addEventListener('click', () => abrirDetalhe(diaDeHoje, redesenhar));

  // Um toque = registro salvo. O popup que abre em seguida é só para quem quiser marcar mais.
  el.querySelectorAll('[data-humor]').forEach(b => b.onclick = () => {
    el.querySelectorAll('[data-humor]').forEach(x => x.setAttribute('aria-pressed', x === b));
    const humor = Number(b.dataset.humor);
    const r = store.adicionar({ tipo: 'casa', humor, data: hoje });
    setTimeout(() => abrirRegistro({ registro: r, intro: `Dia ${HUMOR[humor].toLowerCase()} registrado`, aoSalvar: redesenhar }), 260);
    setTimeout(redesenhar, 600);
  });
}
