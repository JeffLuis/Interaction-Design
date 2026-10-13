const PAGINAS = [
  { nome: 'Apresentação',    link: 'index.html' },
  { nome: 'Editor de Menus', link: 'editor.html' },
  { nome: 'Prova on-line',   link: 'prova.html' },
  { nome: 'Trabalho 04',     link: null }
];

const SVG_BIORRISCO = `
  <svg class="brand__mark" viewBox="0 0 100 100" role="img" aria-label="Símbolo de biorrisco">
    <g fill="currentColor">
      <circle cx="50" cy="50" r="10"/>
      <path d="M50 50 L50 10 A20 20 0 0 1 68 22 Z"/>
      <path d="M50 50 L83 32 A20 20 0 0 1 78 56 Z"/>
      <path d="M50 50 L68 78 A20 20 0 0 1 44 88 Z"/>
      <path d="M50 50 L17 68 A20 20 0 0 1 22 44 Z"/>
      <path d="M50 50 L32 17 A20 20 0 0 1 56 22 Z"/>
      <path d="M50 50 L2 50 A20 20 0 0 1 12 32 Z"/>
    </g>
  </svg>`;

function paginaAtual() {
  let arquivo = window.location.pathname.split('/').pop();
  if (arquivo == '') {
    arquivo = 'index.html';
  }
  return arquivo;
}


/* ---------- <site-nav>: o menu de navegação -------------------------------- */

class SiteNav extends HTMLElement {

  // connectedCallback roda quando a tag entra na página
  connectedCallback() {
    const atual = paginaAtual();

    // monta um <li> para cada página da lista
    let itens = '';
    for (let i = 0; i < PAGINAS.length; i++) {
      const pagina = PAGINAS[i];

      if (pagina.link == null) {        
        itens += `
          <li>
            <a class="site-nav__link" href="#" aria-disabled="true" title="Ainda não publicado">
              ${pagina.nome} <span class="visually-hidden">(em breve)</span>
            </a>
          </li>`;
      } else {
        // marca o link da página em que o usuário está
        let marca = '';
        if (pagina.link == atual) {
          marca = ' aria-current="page"';
        }
        itens += `
          <li>
            <a class="site-nav__link" href="${pagina.link}"${marca}>${pagina.nome}</a>
          </li>`;
      }
    }

    this.innerHTML = `
      <nav class="site-nav" aria-label="Navegação principal">
        <ul class="site-nav__list">${itens}</ul>
      </nav>`;

    // links "em breve" não levam a lugar nenhum
    const linksDesativados = this.querySelectorAll('a[aria-disabled="true"]');
    for (let link of linksDesativados) {
      link.addEventListener('click', (evento) => {
        evento.preventDefault();
      });
    }
  }
}

/* ---------- <site-header>: o cabeçalho (logo + menu) ---------------------- */

class SiteHeader extends HTMLElement {

  connectedCallback() {
    this.innerHTML = `
      <header class="site-header">
        <div class="wrap site-header__bar">
          <div class="brand">
            ${SVG_BIORRISCO}
            <span class="brand__text">
              <span class="brand__title">Arquivo de Contenção</span>
              <span class="brand__subtitle">Trabalhos — Interação Web</span>
            </span>
          </div>
          <site-nav></site-nav>
        </div>
      </header>`;
  }
}

/* ---------- <site-footer>: o rodapé --------------------------------------- */

class SiteFooter extends HTMLElement {

  connectedCallback() {
    // descobre qual é a posição da página atual entre as páginas publicadas
    const atual = paginaAtual();
    let publicadas = 0;
    let posicao = 0;
    for (let i = 0; i < PAGINAS.length; i++) {
      if (PAGINAS[i].link != null) {
        publicadas++;
        if (PAGINAS[i].link == atual) {
          posicao = publicadas;
        }
      }
    }

    let status = 'Status do arquivo: em construção';
    if (posicao > 0) {
      status = `Status do arquivo: seção ${posicao} de ${publicadas} disponíveis`;
    }

    this.innerHTML = `
      <footer class="site-footer">
        <div class="wrap status-bar">
          <div class="status-bar__ampoules" aria-hidden="true">
            <span class="ampoule ampoule--safe"></span>
            <span class="ampoule ampoule--caution"></span>
            <span class="ampoule ampoule--danger"></span>
          </div>
          <p class="status-bar__text">${status}</p>
          <p class="site-footer__credit">Trabalho acadêmico — Disciplina de Interação Web</p>
        </div>
      </footer>`;
  }
}

customElements.define('site-nav', SiteNav);
customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);
