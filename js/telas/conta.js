// CONTA — entrar, criar conta e cuidar da conta. Opcional: o app funciona sem isso.
// Criar conta exige consentimento específico (dado de saúde e de criança) e, separado,
// o convite opcional para a pesquisa. Texto do termo: TERMO em js/config.js.

import { store } from '../store.js';
import { TERMO, APP } from '../config.js';
import { conta } from '../conta.js';
import { icone } from '../icones.js';
import { logo } from '../marca.js';
import { esc, toast, abrirFolha } from '../ui.js';

export function render(el, ctx) {
  const redesenhar = () => render(el, { ...ctx, params: { ...ctx.params } });
  const s = conta.situacao;
  const voltar = () => ctx.ir(store.perfil ? 'perfil' : 'boas-vindas');

  const topo = `
    <header class="topo">
      <div style="display:flex;align-items:center;gap:6px">
        <button class="btn-icone" data-voltar aria-label="Voltar">${icone('voltar', 22)}</button>
        <h2>Conta</h2>
      </div>
    </header>`;

  // 1) servidor indisponível
  if (s.disponivel === false) {
    el.innerHTML = `<div>${topo}
      <div class="vazio">${logo({ tamanho: 64, cor: 'var(--ink-faint)', espessura: 5 })}
        <h2>A conta não está disponível agora.</h2>
        <p class="suave">Ela precisa do servidor do ${APP.nome}. Seus registros continuam salvos neste aparelho e tudo funciona normalmente.</p></div></div>`;
    el.querySelector('[data-voltar]').onclick = voltar;
    return;
  }
  // 2) ainda perguntando ao servidor
  if (s.disponivel === null) {
    el.innerHTML = `<div>${topo}<p class="suave" style="margin-top:24px">Conferindo a conta…</p></div>`;
    el.querySelector('[data-voltar]').onclick = voltar;
    const parar = conta.aoMudar(() => { parar(); redesenhar(); });
    return parar;
  }
  // 3) com conta aberta
  if (s.logado) return renderConta(el, ctx, topo, voltar, redesenhar);
  // 4) sem conta: entrar ou criar
  return renderEntrada(el, ctx, topo, voltar, redesenhar);
}

// ---------------------------------------------------------------- entrar / criar
function renderEntrada(el, ctx, topo, voltar) {
  let modo = ctx.params.modo === 'criar' ? 'criar' : 'entrar';
  let mostrar = false;

  function desenhar(erro = '') {
    const criar = modo === 'criar';
    el.innerHTML = `
    <div>${topo}
      <div class="chips conta-abas" role="tablist">
        <button class="chip" role="tab" data-modo="entrar" aria-pressed="${!criar}">Entrar</button>
        <button class="chip" role="tab" data-modo="criar" aria-pressed="${criar}">Criar conta</button>
      </div>

      <p class="suave" style="margin:14px 0 18px">${criar
        ? 'Com uma conta, seus registros ficam guardados e você acessa de outro aparelho. É opcional.'
        : 'Entre para trazer seus registros guardados na conta.'}</p>

      <form id="form" class="conta-form" novalidate>
        <label class="pergunta" for="email">E-mail</label>
        <input class="campo" id="email" type="email" inputmode="email" autocomplete="username" required maxlength="254">
        <label class="pergunta" for="senha">Senha ${criar ? '<small>pelo menos 8 caracteres</small>' : ''}</label>
        <div class="campo-com-botao">
          <input class="campo" id="senha" type="${mostrar ? 'text' : 'password'}" autocomplete="${criar ? 'new-password' : 'current-password'}" required maxlength="128">
          <button type="button" class="btn-icone" data-mostrar aria-label="${mostrar ? 'Esconder' : 'Mostrar'} a senha">${icone(mostrar ? 'x' : 'cadeado', 18)}</button>
        </div>

        ${criar ? `
        <div class="consentimento">
          <label class="caixa"><input type="checkbox" id="c-termo"><span>Li o termo abaixo e concordo em guardar na conta os dados de saúde que eu registrar.</span></label>
          <label class="caixa"><input type="checkbox" id="c-resp"><span>Sou a pessoa responsável legal por quem eu acompanho, ou os dados são meus.</span></label>
          <label class="caixa caixa--opcional"><input type="checkbox" id="c-pesq"><span><b>Opcional:</b> quero ajudar a pesquisa do atipario com uma cópia reduzida e sem identificação (veja “Pesquisa” no termo). Posso desligar quando quiser.</span></label>
          <details class="termo"><summary>Ler o termo</summary>${termoHtml()}</details>
        </div>` : ''}

        <p class="conta-erro" role="alert" ${erro ? '' : 'hidden'}>${esc(erro)}</p>
        <button class="btn btn-primario btn-bloco" type="submit" id="enviar" ${criar ? 'disabled' : ''}>${criar ? 'Criar conta' : 'Entrar'}</button>
      </form>
    </div>`;

    el.querySelector('[data-voltar]').onclick = voltar;
    el.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => { modo = b.dataset.modo; desenhar(); });
    el.querySelector('[data-mostrar]').onclick = () => {
      const guardado = el.querySelector('#senha').value; mostrar = !mostrar; desenhar(); el.querySelector('#senha').value = guardado;
    };
    const botao = el.querySelector('#enviar');
    if (criar) {
      const confere = () => { botao.disabled = !(el.querySelector('#c-termo').checked && el.querySelector('#c-resp').checked); };
      el.querySelectorAll('#c-termo, #c-resp').forEach(c => c.addEventListener('change', confere));
    }
    el.querySelector('#form').addEventListener('submit', async e => {
      e.preventDefault();
      const email = el.querySelector('#email').value.trim();
      const senha = el.querySelector('#senha').value;
      if (!email || !senha) return desenhar('Preencha o e-mail e a senha.');
      botao.disabled = true; botao.textContent = 'Um instante…';
      const r = criar
        ? await conta.cadastrar({ email, senha, termo: true, responsavel: true, pesquisa: el.querySelector('#c-pesq').checked, versaoTermo: TERMO.versao })
        : await conta.entrar({ email, senha });
      if (!r.ok) {
        desenhar(r.dados.erro || 'Não deu certo. Tente de novo.');
        el.querySelector('#email').value = email;
        return;
      }
      toast(criar ? 'Conta criada' : 'Bem-vindo de volta');
      ctx.ir(store.perfil ? 'inicio' : 'boas-vindas');
    });
    el.querySelector('#email').focus();
  }
  desenhar();
}

const termoHtml = () => `
  <div class="termo-corpo">
    ${TERMO.secoes.map(sec => `<h4>${esc(sec.t)}</h4>${sec.p.map(t => `<p>${esc(t)}</p>`).join('')}`).join('')}
    <h4>Contato</h4><p>${TERMO.contato ? esc(TERMO.contato) : 'Ainda não definido: este é um protótipo em teste, e o contato do responsável será informado aqui antes do uso por outras famílias.'}</p>
    <p class="suave pequeno">Versão ${esc(TERMO.versao)}</p>
  </div>`;

// ---------------------------------------------------------------- conta aberta
function renderConta(el, ctx, topo, voltar, redesenhar) {
  const s = conta.situacao;
  const sy = conta.sync;
  const estado = sy.erro ? 'Sem conexão agora. Tento de novo quando voltar.'
    : sy.ultimo ? `Copiado às ${sy.ultimo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Conferindo…';

  el.innerHTML = `
  <div>${topo}
    <div class="cartao" style="margin-top:6px">
      <p class="suave pequeno">Conectado como</p>
      <h3 style="word-break:break-all">${esc(s.email)}</h3>
      <p class="suave pequeno" style="margin-top:6px">${esc(estado)} Fotos de documentos ficam só neste aparelho.</p>
    </div>

    <section class="secao">
      <div class="secao-titulo">Pesquisa</div>
      <div class="cartao linha-lembrete">
        <span style="flex:1"><b>Ajudar a pesquisa do atipario</b>
          <span class="suave pequeno" style="display:block">Uma cópia reduzida e sem identificação: data, tipo de registro, profissional, rostinho e marcações. Sem nome, frases, remédios ou fotos. Ao desligar, a cópia é apagada.</span></span>
        <button class="interruptor" data-pesquisa role="switch" aria-checked="${s.pesquisa}" aria-label="Ajudar a pesquisa"><i></i></button>
      </div>
    </section>

    <section class="secao">
      <div class="secao-titulo">Seus dados</div>
      <div class="cartao" style="padding:4px 18px">
        <div class="linha-config"><span>Baixar tudo que está na conta</span><button class="btn btn-secundario" data-baixar>${icone('baixar', 18)} Baixar</button></div>
        <div class="linha-config"><span>Sair desta conta</span><button class="btn btn-secundario" data-sair>Sair</button></div>
        <div class="linha-config"><span>Excluir a conta e tudo da conta</span><button class="btn btn-fantasma" data-excluir style="color:#B8483A">Excluir</button></div>
      </div>
      <details class="termo" style="margin-top:14px"><summary>Ler o termo</summary>${termoHtml()}</details>
    </section>
  </div>`;

  el.querySelector('[data-voltar]').onclick = voltar;
  const parar = conta.aoMudar(() => { parar(); redesenhar(); });

  el.querySelector('[data-pesquisa]').onclick = async e => {
    const quer = e.currentTarget.getAttribute('aria-checked') !== 'true';
    const r = await conta.definirPesquisa(quer);
    toast(r.ok ? (quer ? 'Obrigado por ajudar' : 'Pesquisa desligada. A cópia foi apagada.') : (r.dados.erro || 'Não consegui mudar'), r.ok ? 'check' : 'x');
  };
  el.querySelector('[data-baixar]').onclick = async () => {
    const r = await conta.baixarMeusDados();
    toast(r.ok ? 'Arquivo baixado' : (r.dados.erro || 'Não consegui baixar'), r.ok ? 'baixar' : 'x');
  };
  el.querySelector('[data-sair]').onclick = async () => { await conta.sair(); toast('Você saiu da conta'); ctx.ir('perfil'); };
  el.querySelector('[data-excluir]').onclick = () => abrirFolha(`
    <h3 class="folha-titulo">Excluir a conta?</h3>
    <p class="folha-texto">Apagamos do servidor seu e-mail, registros, lembretes, consentimentos e a cópia de pesquisa. Os dados deste aparelho continuam aqui. Não dá para desfazer.</p>
    <label class="pergunta" for="x-senha">Digite sua senha para confirmar</label>
    <input class="campo" id="x-senha" type="password" autocomplete="current-password" maxlength="128">
    <p class="conta-erro" role="alert" hidden></p>
    <div class="folha-acoes">
      <button class="btn btn-fantasma" data-n>Cancelar</button>
      <button class="btn btn-perigo" data-s>Excluir conta</button>
    </div>`, (f, fechar) => {
    f.querySelector('[data-n]').onclick = fechar;
    f.querySelector('[data-s]').onclick = async () => {
      const r = await conta.excluir(f.querySelector('#x-senha').value);
      if (r.ok) { fechar(); toast('Conta excluída', 'lixo'); ctx.ir('perfil'); }
      else { const p = f.querySelector('.conta-erro'); p.textContent = r.dados.erro || 'Não consegui excluir.'; p.hidden = false; }
    };
  });
  return parar;
}
