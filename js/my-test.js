/* ==========================================================================
   my-test.js
   Web component <my-test>: prova on-line de múltipla escolha.

   Como funciona:
   1. O HTML e o CSS da prova ficam em um <template> (logo abaixo).
   2. A classe MyTest cria um Shadow DOM e coloca nele um clone do template.
      Por isso o CSS da prova não afeta o resto da página (e vice-versa).
   3. As questões vêm do objeto literal "prova" (arquivo quiz-data.js).
   4. O título e a introdução da prova são slots: a página pode preencher com
      <span slot="titulo"> e <span slot="introducao">. Se não preencher, vale
      o texto padrão que está dentro do <slot>.

   Uso na página (quiz-data.js deve ser carregado antes deste arquivo):
     <my-test>
       <span slot="titulo">Minha prova</span>
       <span slot="introducao">Responda todas as questões.</span>
     </my-test>
   ========================================================================== */


/* ---------- 1. Template (HTML + CSS do componente) -------------------------
   O template não aparece na tela: só os clones dele. */

const templateProva = document.createElement('template');

templateProva.innerHTML = `
  <style>
    :host { display: block; }
    *, *::before, *::after { box-sizing: border-box; }

    .prova {
      background: var(--color-panel, #17190f);
      border: 1px solid var(--color-line, #3a3c2f);
      border-left: 4px solid var(--color-blood, #8c0f0f);
      color: var(--color-ink, #d9d3bc);
      font-family: var(--font-body, sans-serif);
      padding: clamp(1rem, 4vw, 2rem);
    }

    /* ----- cabeçalho da prova (título e introdução vêm dos slots) ----- */
    .prova__cabecalho { margin-bottom: 1.5rem; }
    .prova__titulo {
      font-family: var(--font-display, sans-serif);
      font-size: clamp(1.4rem, 5vw, 2rem);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-paper, #e9e3cd);
      line-height: 1.1;
      margin: 0;
    }
    .prova__intro {
      margin: 0.6rem 0 0;
      color: var(--color-ink-dim, #9b9782);
      font-size: 0.95rem;
      max-width: 60ch;
    }

    /* ----- barra de progresso ----- */
    .progresso { margin: 0 0 1.5rem; }
    .progresso__texto {
      font-family: var(--font-type, monospace);
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      color: var(--color-ink-dim, #9b9782);
      margin: 0 0 0.4rem;
    }
    .progresso__trilha {
      height: 6px;
      background: var(--color-void, #0c0d0a);
      border: 1px solid var(--color-line, #3a3c2f);
    }
    .progresso__barra {
      height: 100%;
      width: 0;
      background: var(--color-blood-bright, #c31d1d);
      transition: width 250ms ease-out;
    }

    /* ----- questões e alternativas ----- */
    .questao { border: 0; margin: 0 0 1.5rem; padding: 0; min-width: 0; }
    .questao__enunciado {
      display: block;
      width: 100%;
      padding: 0;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: var(--color-paper, #e9e3cd);
      line-height: 1.35;
    }
    .questao__numero {
      display: block;
      font-family: var(--font-type, monospace);
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-blood-bright, #c31d1d);
      margin-bottom: 0.2rem;
    }

    .alternativa {
      display: flex;
      align-items: flex-start;
      gap: 0.7rem;
      padding: 0.75rem 0.9rem;
      margin-bottom: 0.5rem;
      background: var(--color-void, #0c0d0a);
      border: 1px solid var(--color-line, #3a3c2f);
      cursor: pointer;
      overflow-wrap: anywhere;
      transition: border-color 150ms ease-out, background 150ms ease-out;
    }
    .alternativa:hover { border-color: var(--color-line-strong, #565a44); }
    .alternativa:has(input:checked) {
      border-color: var(--color-blood-bright, #c31d1d);
      background: var(--color-panel-raised, #1f2216);
    }
    .alternativa:has(input:focus-visible) {
      outline: 2px solid var(--color-focus, #e2c14c);
      outline-offset: 2px;
    }
    .alternativa input {
      margin-top: 0.2rem;
      accent-color: var(--color-blood-bright, #c31d1d);
      flex-shrink: 0;
    }
    .alternativa__texto { flex: 1; min-width: 0; }

    /* ----- botões ----- */
    .acoes { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-top: 1rem; }
    .botao {
      font-family: var(--font-type, monospace);
      font-size: 0.85rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.65rem 1.4rem;
      border: 1px solid var(--color-blood, #8c0f0f);
      background: var(--color-blood-deep, #520a0a);
      color: var(--color-paper, #e9e3cd);
      cursor: pointer;
      transition: background 150ms ease-out, border-color 150ms ease-out;
    }
    .botao:hover:not(:disabled) {
      background: var(--color-blood, #8c0f0f);
      border-color: var(--color-blood-bright, #c31d1d);
    }
    .botao:focus-visible { outline: 2px solid var(--color-focus, #e2c14c); outline-offset: 2px; }
    .botao:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: var(--color-panel-raised, #1f2216);
      border-color: var(--color-line, #3a3c2f);
    }
    .dica { font-size: 0.8rem; color: var(--color-ink-dim, #9b9782); margin: 0; }

    /* ----- resultado: nota ----- */
    .nota {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
      padding: 1.25rem;
      margin-bottom: 1.75rem;
      background: var(--color-void, #0c0d0a);
      border: 1px solid var(--color-line-strong, #565a44);
    }
    .nota__valor {
      font-family: var(--font-display, sans-serif);
      font-size: clamp(2.6rem, 12vw, 4rem);
      line-height: 1;
      color: var(--color-paper, #e9e3cd);
    }
    .nota__valor small { font-size: 0.4em; color: var(--color-ink-dim, #9b9782); }
    .nota__texto { margin: 0; }
    .nota__texto strong { color: var(--color-paper, #e9e3cd); }
    .nota__situacao {
      font-family: var(--font-type, monospace);
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0.3rem 0 0;
    }
    .nota--aprovado .nota__situacao { color: #7fb487; }
    .nota--reprovado .nota__situacao { color: var(--color-blood-bright, #c31d1d); }

    /* ----- resultado: revisão de cada questão ----- */
    .revisao {
      margin: 0 0 1.25rem;
      padding: 1rem;
      border: 1px solid var(--color-line, #3a3c2f);
      border-left-width: 4px;
      background: var(--color-void, #0c0d0a);
    }
    .revisao--certa { border-left-color: var(--color-status-safe, #3f6b44); }
    .revisao--errada { border-left-color: var(--color-status-danger, #8c0f0f); }
    .revisao__pergunta { margin: 0 0 0.6rem; font-weight: 600; color: var(--color-paper, #e9e3cd); }
    .revisao__linha { margin: 0.2rem 0; font-size: 0.92rem; overflow-wrap: anywhere; }
    .revisao__rotulo {
      display: inline-block;
      min-width: 8.5em;
      font-family: var(--font-type, monospace);
      font-size: 0.72rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-ink-dim, #9b9782);
    }
    .revisao__status {
      font-family: var(--font-type, monospace);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .revisao--certa .revisao__status { color: #7fb487; }
    .revisao--errada .revisao__status { color: var(--color-blood-bright, #c31d1d); }

    .vazio { margin: 0; color: var(--color-ink-dim, #9b9782); }

    /* ----- celular ----- */
    @media (max-width: 30rem) {
      .revisao__rotulo { display: block; }
      .acoes .botao { width: 100%; }
    }
  </style>

  <section class="prova" aria-labelledby="titulo-prova">
    <header class="prova__cabecalho">
      <h2 class="prova__titulo" id="titulo-prova">
        <slot name="titulo">Prova on-line</slot>
      </h2>
      <p class="prova__intro">
        <slot name="introducao">Escolha uma alternativa em cada questão.</slot>
      </p>
    </header>

    <div id="conteudo"></div>
  </section>
`;


/* ---------- 2. Classe do componente --------------------------------------- */

class MyTest extends HTMLElement {

  constructor() {
    super();

    // cria o Shadow DOM e coloca dentro dele um clone do template
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(templateProva.content.cloneNode(true));

    // respostas[i] guarda a alternativa marcada na questão i (null = sem resposta)
    this.respostas = [];
  }

  // roda quando a tag <my-test> entra na página
  connectedCallback() {
    this.mostrarProva();
  }


  mostrarProva() {
    const conteudo = this.shadowRoot.querySelector('#conteudo');
    const questoes = prova.questoes;

    // começa sem nenhuma resposta
    this.respostas = [];
    for (let i = 0; i < questoes.length; i++) {
      this.respostas.push(null);
    }

    if (questoes.length == 0) {
      conteudo.innerHTML = '<p class="vazio">Nenhuma questão disponível no momento.</p>';
      return;
    }

    // monta o HTML de cada questão, com suas alternativas
    let htmlQuestoes = '';
    for (let i = 0; i < questoes.length; i++) {

      let htmlAlternativas = '';
      for (let j = 0; j < questoes[i].alternativas.length; j++) {
        htmlAlternativas += `
          <label class="alternativa" for="q${i}-a${j}">
            <input type="radio" id="q${i}-a${j}" name="questao${i}" value="${j}" data-questao="${i}">
            <span class="alternativa__texto">${questoes[i].alternativas[j]}</span>
          </label>`;
      }

      htmlQuestoes += `
        <fieldset class="questao">
          <legend class="questao__enunciado">
            <span class="questao__numero">Questão ${i + 1} de ${questoes.length}</span>
            ${questoes[i].pergunta}
          </legend>
          ${htmlAlternativas}
        </fieldset>`;
    }

    conteudo.innerHTML = `
      <div class="progresso">
        <p class="progresso__texto" id="progresso-texto" aria-live="polite"></p>
        <div class="progresso__trilha"><div class="progresso__barra" id="progresso-barra"></div></div>
      </div>

      <form id="formulario" novalidate>
        ${htmlQuestoes}
        <div class="acoes">
          <button type="submit" class="botao" id="botao-corrigir" disabled>Corrigir prova</button>
          <p class="dica" id="dica"></p>
        </div>
      </form>`;

    const radios = this.shadowRoot.querySelectorAll('input[type="radio"]');
    for (let radio of radios) {
      radio.addEventListener('change', () => {
        const numeroQuestao = Number(radio.dataset.questao);
        this.respostas[numeroQuestao] = Number(radio.value);
        this.atualizarProgresso();
      });
    }

    // ao enviar o formulário, corrige a prova
    this.shadowRoot.querySelector('#formulario').addEventListener('submit', (evento) => {
      evento.preventDefault();
      this.corrigirProva();
    });

    this.atualizarProgresso();
  }


  atualizarProgresso() {
    const total = this.respostas.length;

    let respondidas = 0;
    for (let i = 0; i < total; i++) {
      if (this.respostas[i] !== null) {
        respondidas++;
      }
    }

    const raiz = this.shadowRoot;
    raiz.querySelector('#progresso-texto').textContent = `${respondidas} de ${total} questões respondidas`;
    raiz.querySelector('#progresso-barra').style.width = (respondidas / total * 100) + '%';

    const botao = raiz.querySelector('#botao-corrigir');
    const dica = raiz.querySelector('#dica');
    if (respondidas < total) {
      botao.disabled = true;
      dica.textContent = 'Responda todas as questões para corrigir.';
    } else {
      botao.disabled = false;
      dica.textContent = 'Tudo respondido. Pode corrigir!';
    }
  }


  /* ----- Correção: calcula a nota e mostra o resultado ----- */

  corrigirProva() {
    const conteudo = this.shadowRoot.querySelector('#conteudo');
    const questoes = prova.questoes;
    const total = questoes.length;

    // proteção extra: nunca corrige se ficou alguma questão em branco
    if (this.respostas.includes(null)) {
      return;
    }

    let acertos = 0;
    let htmlRevisao = '';

    for (let i = 0; i < total; i++) {
      const questao = questoes[i];
      const acertou = (this.respostas[i] == questao.correta);

      let classeRevisao = 'revisao--errada';
      let situacao = 'incorreta';
      if (acertou) {
        acertos++;
        classeRevisao = 'revisao--certa';
        situacao = 'correta';
      }

      htmlRevisao += `
        <article class="revisao ${classeRevisao}">
          <p class="revisao__pergunta">${i + 1}. ${questao.pergunta}</p>
          <p class="revisao__linha">
            <span class="revisao__rotulo">Sua resposta:</span>
            ${questao.alternativas[this.respostas[i]]}
            <span class="revisao__status">— ${situacao}</span>
          </p>
          <p class="revisao__linha">
            <span class="revisao__rotulo">Resposta correta:</span>
            ${questao.alternativas[questao.correta]}
          </p>
        </article>`;
    }

    const nota = (acertos / total * 10).toFixed(1).replace('.', ',');

    // aprovado com 60% ou mais de acertos
    let classeNota = 'nota--reprovado';
    let textoSituacao = 'Reprovado — tente novamente';
    if (acertos / total >= 0.6) {
      classeNota = 'nota--aprovado';
      textoSituacao = 'Aprovado — infecção sob controle';
    }

    let palavraQuestao = 'questões';
    if (total == 1) {
      palavraQuestao = 'questão';
    }

    conteudo.innerHTML = `
      <div class="nota ${classeNota}" role="status" tabindex="-1">
        <div class="nota__valor">${nota}<small> / 10</small></div>
        <div>
          <p class="nota__texto">Você acertou <strong>${acertos} de ${total}</strong> ${palavraQuestao}.</p>
          <p class="nota__situacao">${textoSituacao}</p>
        </div>
      </div>

      ${htmlRevisao}

      <div class="acoes">
        <button type="button" class="botao" id="botao-refazer">Refazer a prova</button>
      </div>`;
    
    this.shadowRoot.querySelector('#botao-refazer').addEventListener('click', () => {
      this.mostrarProva();
      this.shadowRoot.querySelector('input[type="radio"]').focus();
    });
    
    this.shadowRoot.querySelector('.nota').focus();
  }
}

customElements.define('my-test', MyTest);
