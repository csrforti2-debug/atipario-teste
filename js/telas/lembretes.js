// LEMBRETES — a lista do que a família combinou (remédio, atividades, retornos), os avisos
// e a ponte com o calendário do celular. Tudo é sugestão: nada aqui é alarme obrigatório.

import { store, nomeDe } from '../store.js';
import { seletorPessoas, ligarSeletor } from '../pessoas.js';
import { TIPOS_LEMBRETE, AREAS, AVISO_LEMBRETES } from '../config.js';
import { icone } from '../icones.js';
import { esc, toast, abrirFolha, confirmar } from '../ui.js';
import { curta } from '../datas.js';
import { abrirLembrete } from '../fluxos/lembrete.js';
import {
  permissaoNotificacao, pedirPermissao, resumoQuando, tituloLembrete, baixarICS,
  sugestoesDeRetorno, dispensarSugestao, diasAte,
} from '../lembretes.js';

export function render(el, ctx) {
  const redesenhar = () => render(el, ctx);
  const lista = store.lembretes;
  const ativa = store.pessoaAtiva;
  const varias = store.pessoas.length > 1;
  const checkin = lista.find(l => l.tipo === 'checkin' && l.pessoaId === ativa.id);
  const normais = lista.filter(l => l.tipo !== 'checkin')
    .sort((a, b) => (a.tipo === 'retorno') - (b.tipo === 'retorno') || (a.hora || '').localeCompare(b.hora || ''));
  const sugestoes = sugestoesDeRetorno();
  const perm = permissaoNotificacao();

  el.innerHTML = `
  <div>
    <header class="topo">
      <div style="display:flex;align-items:center;gap:6px">
        <button class="btn-icone" data-voltar aria-label="Voltar">${icone('voltar', 22)}</button>
        <h2>Lembretes</h2>
      </div>
      <button class="btn btn-secundario" data-novo>${icone('mais', 18)} Novo</button>
    </header>

    ${sugestoes.map(r => `
    <div class="cartao sugestao" data-sug="${r.id}">
      <span class="selo" style="--cor:var(--t-consulta)">${icone('consulta', 22)}</span>
      <div>
        <b>Guardar a data do retorno?</b>
        <p class="suave pequeno">${varias ? esc(nomeDe(r.pessoaId)) + ': na' : 'Na'} consulta de ${curta(r.data)}${r.area && AREAS[r.area] ? ' (' + AREAS[r.area].curto + ')' : ''} você marcou “Retorno marcado”. Se já tem a data, eu lembro você.</p>
        <div class="sugestao-acoes">
          <button class="btn btn-primario" data-sug-sim="${r.id}">Guardar data</button>
          <button class="btn btn-fantasma" data-sug-nao="${r.id}">Agora não</button>
        </div>
      </div>
    </div>`).join('')}

    ${normais.length ? `
    <section class="secao" style="margin-top:14px">
      <div class="lembretes-lista">
        ${normais.map(l => cartaoLembrete(l, varias)).join('')}
      </div>
    </section>` : `
    <div class="vazio">
      <span class="selo" style="--cor:var(--primary);width:64px;height:64px;border-radius:20px">${icone('sino', 32)}</span>
      <h2>Nenhum lembrete ainda.</h2>
      <p class="suave">Remédio, uma atividade da terapia ou um retorno marcado: você escolhe o que quer lembrar.</p>
      <button class="btn btn-primario" data-novo>${icone('mais', 20)} Criar o primeiro</button>
    </div>`}

    <section class="secao">
      <div class="secao-titulo">Check-in do dia${varias ? ' · ' + esc(ativa.nome) : ''}</div>
      ${seletorPessoas()}
      <div class="cartao linha-lembrete">
        <span class="selo" style="--cor:var(--t-casa)">${icone('casa', 22)}</span>
        <div style="flex:1"><b>Um lembrete para registrar o dia</b>
          <p class="suave pequeno">${checkin ? `Todo dia às ${checkin.hora}, só se você ainda não tiver registrado${varias ? ' o dia de ' + esc(ativa.nome) : ''}.` : 'Desligado. Se ligar, avisa só nos dias em que faltou o registro.'}</p></div>
        <button class="interruptor" data-checkin role="switch" aria-checked="${!!checkin?.ativo}" aria-label="Lembrete do check-in"><i></i></button>
      </div>
    </section>

    <section class="secao">
      <div class="secao-titulo">Como os avisos funcionam</div>
      <div class="cartao">
        <p class="pequeno"><b>Com o atipario aberto</b>, o aviso aparece na tela
          ${perm === 'granted' ? 'e como notificação neste aparelho.' : 'e, se você permitir, como notificação.'}</p>
        ${perm === 'default' ? `<button class="btn btn-secundario" style="margin-top:10px" data-permitir>${icone('sino', 18)} Permitir notificações</button>` : ''}
        ${perm === 'denied' ? `<p class="suave pequeno" style="margin-top:8px">As notificações estão bloqueadas neste navegador. Dá para liberar nas configurações do site.</p>` : ''}
        <p class="pequeno" style="margin-top:12px"><b>Com o app fechado</b>, quem toca é o calendário do celular.
          Toque num lembrete e escolha <i>Pôr no calendário</i>.</p>
        ${normais.length ? `<button class="btn btn-secundario" style="margin-top:10px" data-todos>${icone('calendario', 18)} Levar todos para o calendário</button>` : ''}
        <p class="suave pequeno" style="margin-top:12px">${esc(AVISO_LEMBRETES)} O evento vai para o calendário do seu celular, que pode sincronizar com a sua conta.</p>
      </div>
    </section>

    <section class="secao">
      <div class="secao-titulo">Bom saber · autismo</div>
      <div class="cartao informe">
        <p class="suave pequeno" style="margin-bottom:8px">Vale para quem tem diagnóstico de autismo (TEA). Atípico é mais amplo do que isso, e o app não pede diagnóstico.</p>
        <p class="pequeno"><b>Atendimento multiprofissional é diretriz da política nacional de proteção da pessoa com autismo.</b>
          A Lei 12.764/2012 (art. 2º, III) fala em “atenção integral às necessidades de saúde da pessoa com transtorno do espectro autista”,
          com “diagnóstico precoce, atendimento multiprofissional e acesso a medicamentos e nutrientes”.</p>
        <p class="pequeno" style="margin-top:10px"><b>Pessoa com TEA é considerada pessoa com deficiência, para todos os efeitos legais</b> (art. 1º, §2º).</p>
        <a class="suave pequeno" style="display:inline-block;margin-top:10px" href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12764.htm" target="_blank" rel="noopener">Ler a lei no site do Planalto</a>
      </div>
    </section>
  </div>`;

  ligarSeletor(el, redesenhar);
  el.querySelector('[data-voltar]').onclick = () => ctx.ir('perfil');
  el.querySelectorAll('[data-novo]').forEach(b => b.onclick = () => abrirLembrete({ aoSalvar: redesenhar }));
  el.querySelectorAll('[data-lem]').forEach(b => b.onclick = () => abrirOpcoes(lista.find(l => l.id === b.dataset.lem), redesenhar));
  el.querySelectorAll('[data-sug-sim]').forEach(b => b.onclick = () => {
    const r = sugestoesDeRetorno().find(x => x.id === b.dataset.sugSim);
    abrirLembrete({ tipo: 'retorno', area: r?.area || null, pessoaId: r?.pessoaId, aoSalvar: redesenhar });
  });
  el.querySelectorAll('[data-sug-nao]').forEach(b => b.onclick = () => { dispensarSugestao(b.dataset.sugNao); redesenhar(); });

  el.querySelector('[data-checkin]').onclick = () => {
    if (checkin) store.atualizarLembrete(checkin.id, { ativo: !checkin.ativo });
    else store.adicionarLembrete({ pessoaId: ativa.id, tipo: 'checkin', titulo: 'Check-in do dia', hora: '20:00' });
    redesenhar();
  };
  el.querySelector('[data-permitir]')?.addEventListener('click', async () => {
    const r = await pedirPermissao();
    toast(r === 'granted' ? 'Notificações liberadas' : 'Sem notificações; os avisos continuam na tela', r === 'granted' ? 'check' : 'sino');
    redesenhar();
  });
  el.querySelector('[data-todos]')?.addEventListener('click', () => {
    baixarICS(store.lembretes.filter(l => l.ativo));
    toast('Arquivo de calendário baixado. Abra para adicionar.', 'baixar');
  });
}

function cartaoLembrete(l, varias) {
  const t = TIPOS_LEMBRETE[l.tipo];
  const falta = l.tipo === 'retorno' ? diasAte(l.data) : null;
  const sub = l.tipo === 'retorno'
    ? (falta > 1 ? `em ${falta} dias · ` : falta === 1 ? 'amanhã · ' : falta === 0 ? 'hoje · ' : 'já passou · ') + resumoQuando(l)
    : resumoQuando(l);
  const de = varias ? ` · ${nomeDe(l.pessoaId)}` : '';
  return `
  <button class="cartao linha-lembrete ${l.ativo ? '' : 'pausado'}" data-lem="${l.id}">
    <span class="selo" style="--cor:${t.cor}">${icone(t.icone, 22)}</span>
    <span style="flex:1;text-align:left"><b>${esc(tituloLembrete(l))}</b>
      <span class="suave pequeno" style="display:block">${esc(sub)}${esc(de)}${l.ativo ? '' : ' · pausado'}</span></span>
    ${icone('seta', 20, 'fraco')}
  </button>`;
}

function abrirOpcoes(l, depois) {
  if (!l) return;
  abrirFolha(`
    <h3 class="folha-titulo">${esc(tituloLembrete(l))}</h3>
    <p class="folha-texto">${esc(resumoQuando(l))}</p>
    <div class="folha-lista">
      <button class="btn btn-secundario btn-bloco" data-ics>${icone('calendario', 20)} Pôr no calendário do celular</button>
      <button class="btn btn-secundario btn-bloco" data-pausa>${l.ativo ? 'Pausar' : 'Reativar'}</button>
      <button class="btn btn-fantasma btn-bloco" data-apagar style="color:#B8483A">${icone('lixo', 18)} Apagar</button>
    </div>`, (el, fechar) => {
    el.querySelector('[data-ics]').onclick = () => {
      baixarICS([l], 'atipario-lembrete');
      toast('Arquivo de calendário baixado. Abra para adicionar.', 'baixar');
      fechar();
    };
    el.querySelector('[data-pausa]').onclick = () => { store.atualizarLembrete(l.id, { ativo: !l.ativo }); fechar(); depois(); };
    el.querySelector('[data-apagar]').onclick = async () => {
      fechar();
      if (await confirmar({ titulo: 'Apagar este lembrete?', texto: 'Os registros já feitos continuam no histórico.', ok: 'Apagar', perigo: true })) {
        store.removerLembrete(l.id);
        toast('Lembrete apagado', 'lixo');
        depois();
      }
    };
  });
}
