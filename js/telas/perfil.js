// PERFIL — quem usa, quem é acompanhado, rede de cuidado, aparência e dados.

import { store } from '../store.js';
import { RELACOES, AREAS, TEMAS } from '../config.js';
import { abrirPessoa, rotuloPessoa } from '../pessoas.js';
import { conta } from '../conta.js';
import { icone } from '../icones.js';
import { esc, toast, confirmar } from '../ui.js';
import { aplicarTema, temaAtual } from '../tema.js';

export function render(el, ctx) {
  const perfil = store.perfil;
  const relacao = RELACOES.find(r => r.id === perfil.quem.relacao);
  const pessoas = store.pessoas;

  el.innerHTML = `
  <div>
    <header class="topo">
      <h2>Perfil</h2>
    </header>

    <div class="ola" style="display:flex;gap:14px;align-items:center">
      <span class="avatar" style="width:60px;height:60px;font-size:24px">${esc(perfil.quem.nome[0] || '?').toUpperCase()}</span>
      <div><h2>${esc(perfil.quem.nome)}</h2>
      <p class="suave">${esc(relacao?.rotulo || '')}${pessoas.some(p => !p.eu) ? ` · acompanha ${esc(pessoas.filter(p => !p.eu).map(p => p.nome).join(', '))}` : ''}</p></div>
    </div>

    <section class="secao">
      <div class="secao-titulo">Pessoas que você acompanha</div>
      <div class="lembretes-lista">
        ${pessoas.map(p => `
          <button class="cartao linha-lembrete" data-pessoa-editar="${p.id}">
            <span class="avatar" style="width:40px;height:40px;font-size:16px">${esc((p.nome[0] || '?').toUpperCase())}</span>
            <span style="flex:1;text-align:left"><b>${esc(rotuloPessoa(p))}</b>
              <span class="suave pequeno" style="display:block">${p.equipe?.length ? esc(p.equipe.map(a => AREAS[a]?.curto).filter(Boolean).join(', ')) : 'rede de cuidado: toque para escolher'}</span></span>
            ${icone('seta', 20, 'fraco')}
          </button>`).join('')}
      </div>
      <button class="btn btn-secundario btn-bloco" style="margin-top:12px" data-pessoa-nova>${icone('mais', 18)} Adicionar outra pessoa</button>
    </section>

    ${conta.situacao.disponivel ? `
    <section class="secao">
      <div class="secao-titulo">Conta</div>
      <a class="cartao chamada" href="#/conta${conta.situacao.logado ? '' : '?modo=criar'}" style="margin-top:0">
        <span class="selo" style="--cor:var(--accent)">${icone('cadeado', 22)}</span>
        <span><b>${conta.situacao.logado ? 'Sua conta' : 'Criar conta ou entrar'}</b>
          <span class="suave pequeno">${conta.situacao.logado ? esc(conta.situacao.email) : 'Opcional. Guarda uma cópia e leva seus registros para outro aparelho.'}</span></span>
        ${icone('seta', 20, 'fraco')}
      </a>
    </section>` : ''}

    <section class="secao">
      <div class="secao-titulo">Lembretes e consulta</div>
      <a class="cartao chamada" href="#/lembretes" style="margin-top:0">
        <span class="selo" style="--cor:var(--primary)">${icone('sino', 22)}</span>
        <span><b>Lembretes e avisos</b><span class="suave pequeno">Remédio, atividades e retornos que você combinou</span></span>
        ${icone('seta', 20, 'fraco')}
      </a>
      <a class="cartao chamada" href="#/remedios">
        <span class="selo" style="--cor:var(--t-remedio)">${icone('remedio', 22)}</span>
        <span><b>Consultar um remédio</b><span class="suave pequeno">Informações de fonte oficial, para conversar com a equipe</span></span>
        ${icone('seta', 20, 'fraco')}
      </a>
    </section>

    <section class="secao">
      <div class="secao-titulo">Aparência</div>
      <div class="temas">
        ${TEMAS.map(t => `
          <button class="tema" data-tema="${t.id}" aria-pressed="${temaAtual() === t.id}">
            <span class="tema-cores">${t.cores.map(c => `<i style="background:${c}"></i>`).join('')}</span>${t.nome}
          </button>`).join('')}
      </div>
    </section>

    <section class="secao">
      <div class="secao-titulo">Seus dados</div>
      <p class="nota-privacidade">${icone('cadeado', 20)}
        <span>${conta.situacao.logado
          ? 'Seus registros ficam neste aparelho e uma cópia, sem as fotos, fica na sua conta. Nada mais sai daqui, a não ser o relatório que você escolher mandar.'
          : 'Tudo o que você registra fica só neste aparelho. Nada vai para a internet, a não ser o relatório que você mesma(o) escolher mandar.'}</span></p>
      <div class="cartao" style="margin-top:12px;padding:4px 18px">
        <div class="linha-config"><span>Carregar dados de exemplo</span><button class="btn btn-secundario" data-exemplo>Carregar</button></div>
        <div class="linha-config"><span>Recomeçar do zero</span><button class="btn btn-fantasma" data-zerar style="color:#B8483A">Apagar tudo</button></div>
      </div>
    </section>
  </div>`;

  const redesenhar = () => render(el, ctx);
  el.querySelectorAll('[data-pessoa-editar]').forEach(b => b.onclick = () =>
    abrirPessoa({ pessoa: store.pessoa(b.dataset.pessoaEditar), aoSalvar: redesenhar, aoApagar: redesenhar }));
  el.querySelector('[data-pessoa-nova]').onclick = () => abrirPessoa({ aoSalvar: redesenhar });

  el.querySelectorAll('[data-tema]').forEach(b => b.onclick = () => {
    store.definirPref('tema', b.dataset.tema);
    aplicarTema(b.dataset.tema);
    el.querySelectorAll('[data-tema]').forEach(x => x.setAttribute('aria-pressed', x === b));
  });

  el.querySelector('[data-exemplo]').onclick = async () => {
    if (await confirmar({ titulo: 'Trocar pelos dados de exemplo?', texto: 'Os seus registros atuais serão substituídos por 6 semanas fictícias (Ana e Theo).', ok: 'Carregar' })) {
      store.carregarExemplo();
      toast('Exemplo carregado');
      ctx.ir('inicio');
    }
  };

  el.querySelector('[data-zerar]').onclick = async () => {
    if (await confirmar({ titulo: 'Apagar tudo?', texto: conta.situacao.logado ? 'Perfil e registros saem deste aparelho. A cópia na sua conta continua lá: para apagá-la, exclua a conta. Não dá para desfazer.' : 'Perfil e registros saem deste aparelho. Não dá para desfazer.', ok: 'Apagar tudo', perigo: true })) {
      store.apagarTudo();
      ctx.ir('boas-vindas');
    }
  };
}
