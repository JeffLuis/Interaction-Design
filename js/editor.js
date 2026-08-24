/* ==========================================================================
   editor.js
   Lógica do Editor de Menus: mantém um pequeno estado em memória e
   re-renderiza tanto o formulário quanto a pré-visualização sempre que
   algo muda. Nenhum dado é enviado a um servidor — tudo acontece no
   navegador do usuário, e nada precisa ser exportado.
   ========================================================================== */

(function () {
  'use strict';

  var MIN_ITEMS = 2;
  var MAX_ITEMS = 8;
  var MAX_TEXT_LENGTH = 18;
  var MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
  var nextId = 1;

  /** Estado único da aplicação. */
  var state = {
    items: [
      { id: nextId++, text: 'Início' },
      { id: nextId++, text: 'Personagens' },
      { id: nextId++, text: 'Contato' }
    ],
    image: null,
    imagePosition: 'top',
    imageSize: 140,
    menuBg: '#17190f',
    itemBg: '#8c0f0f',
    textColor: '#e9e3cd',
    borderColor: '#c31d1d',
    borderWidth: 1,
    borderRadius: 2,
    fontSize: 14,
    paddingY: 12,
    paddingX: 18,
    gap: 4,
    distribution: 'flex-start'
  };

  /* ---------- Referências de elementos ---------------------------------- */

  var itemListEl = document.getElementById('item-list');
  var itemCountEl = document.getElementById('item-count');
  var addItemBtn = document.getElementById('add-item-btn');
  var previewEl = document.getElementById('menu-preview');
  var previewStatusEl = document.getElementById('preview-status');

  var imageInput = document.getElementById('menu-image');
  var imageError = document.getElementById('image-error');
  var removeImageBtn = document.getElementById('remove-image-btn');

  var rangeIds = ['border-width', 'border-radius', 'font-size', 'padding-y', 'padding-x', 'item-gap'];

  /* ---------- Utilidades --------------------------------------------------- */

  function flashSynced() {
    previewStatusEl.textContent = 'sincronizado';
    previewStatusEl.style.color = '';
  }

  function px(n) { return n + 'px'; }

  /* ---------- Renderização do formulário de itens --------------------------- */

  function renderItemRows() {
    itemListEl.innerHTML = '';

    state.items.forEach(function (item, index) {
      var row = document.createElement('div');
      row.className = 'item-row';

      var field = document.createElement('div');
      field.className = 'field';

      var label = document.createElement('label');
      var inputId = 'item-text-' + item.id;
      label.setAttribute('for', inputId);
      label.textContent = 'Item ' + (index + 1);

      var input = document.createElement('input');
      input.type = 'text';
      input.id = inputId;
      input.value = item.text;
      input.maxLength = MAX_TEXT_LENGTH;
      input.setAttribute('aria-describedby', inputId + '-hint');
      input.addEventListener('input', function () {
        // impede que o campo fique só com espaços, mas permite digitar livremente
        item.text = input.value;
        renderPreview();
      });

      var hint = document.createElement('span');
      hint.className = 'field__hint';
      hint.id = inputId + '-hint';
      hint.textContent = 'até ' + MAX_TEXT_LENGTH + ' caracteres';

      field.appendChild(label);
      field.appendChild(input);
      field.appendChild(hint);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'item-row__remove';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', 'Remover item ' + (index + 1));
      removeBtn.disabled = state.items.length <= MIN_ITEMS;
      removeBtn.addEventListener('click', function () {
        if (state.items.length <= MIN_ITEMS) { return; }
        state.items = state.items.filter(function (i) { return i.id !== item.id; });
        renderItemRows();
        renderPreview();
      });

      row.appendChild(field);
      row.appendChild(removeBtn);
      itemListEl.appendChild(row);
    });

    itemCountEl.textContent = state.items.length + ' de ' + MAX_ITEMS + ' itens';
    addItemBtn.disabled = state.items.length >= MAX_ITEMS;
  }

  addItemBtn.addEventListener('click', function () {
    if (state.items.length >= MAX_ITEMS) { return; }
    state.items.push({ id: nextId++, text: 'Item ' + (state.items.length + 1) });
    renderItemRows();
    renderPreview();
  });

  /* ---------- Imagem do menu ------------------------------------------------ */

  imageInput.addEventListener('change', function () {
    imageError.textContent = '';
    var file = imageInput.files && imageInput.files[0];
    if (!file) { return; }

    if (file.type.indexOf('image/') !== 0) {
      imageError.textContent = 'Escolha um arquivo de imagem válido (PNG, JPG ou SVG).';
      imageInput.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      imageError.textContent = 'A imagem deve ter no máximo 2 MB.';
      imageInput.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      state.image = e.target.result;
      removeImageBtn.disabled = false;
      renderPreview();
    };
    reader.onerror = function () {
      imageError.textContent = 'Não foi possível ler esta imagem. Tente outro arquivo.';
    };
    reader.readAsDataURL(file);
  });

  removeImageBtn.addEventListener('click', function () {
    state.image = null;
    imageInput.value = '';
    imageError.textContent = '';
    removeImageBtn.disabled = true;
    renderPreview();
  });

  document.querySelectorAll('input[name="image-position"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) {
        state.imagePosition = radio.value;
        renderPreview();
      }
    });
  });

  /* ---------- Cores ---------------------------------------------------------- */

  document.getElementById('menu-bg').addEventListener('input', function (e) {
    state.menuBg = e.target.value; renderPreview();
  });
  document.getElementById('item-bg').addEventListener('input', function (e) {
    state.itemBg = e.target.value; renderPreview();
  });
  document.getElementById('item-text-color').addEventListener('input', function (e) {
    state.textColor = e.target.value; renderPreview();
  });
  document.getElementById('border-color').addEventListener('input', function (e) {
    state.borderColor = e.target.value; renderPreview();
  });

  /* ---------- Faixas (ranges) ------------------------------------------------ */

  function bindRange(id, stateKey, unit, outId) {
    var el = document.getElementById(id);
    var out = document.getElementById(outId);
    el.addEventListener('input', function () {
      state[stateKey] = Number(el.value);
      out.textContent = el.value + unit;
      renderPreview();
    });
  }

  bindRange('border-width', 'borderWidth', 'px', 'border-width-out');
  bindRange('border-radius', 'borderRadius', 'px', 'border-radius-out');
  bindRange('font-size', 'fontSize', 'px', 'font-size-out');
  bindRange('padding-y', 'paddingY', 'px', 'padding-y-out');
  bindRange('padding-x', 'paddingX', 'px', 'padding-x-out');
  bindRange('item-gap', 'gap', 'px', 'item-gap-out');
  bindRange('image-size', 'imageSize', 'px', 'image-size-out');

  document.getElementById('distribution').addEventListener('change', function (e) {
    state.distribution = e.target.value;
    renderPreview();
  });

  /* ---------- Renderização da pré-visualização -------------------------------- */

  function renderPreview() {
    previewEl.innerHTML = '';
    previewEl.style.background = state.menuBg;
    previewEl.style.padding = '10px';
    previewEl.style.borderRadius = px(Math.max(state.borderRadius, 2));
    previewEl.style.gap = px(state.gap);
    previewEl.style.alignItems = 'center';
    previewEl.style.justifyContent = state.distribution;
    previewEl.style.flexDirection = state.imagePosition === 'side' ? 'row' : 'column';

    if (state.items.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'generated-menu--empty';
      empty.textContent = 'Adicione ao menos um item para ver o menu.';
      previewEl.appendChild(empty);
      flashSynced();
      return;
    }

    if (state.image) {
      var img = document.createElement('img');
      img.className = 'generated-menu__logo';
      img.src = state.image;
      img.alt = 'Imagem do menu';
      img.style.height = px(state.imageSize);
      img.style.width = 'auto';
      img.style.maxWidth = state.imagePosition === 'side' ? '45%' : '90%';
      if (state.imagePosition !== 'side') {
        img.style.marginInline = 'auto';
      }
      previewEl.appendChild(img);
    }

    var itemsWrap = document.createElement('div');
    itemsWrap.style.display = 'flex';
    itemsWrap.style.flexWrap = 'wrap';
    itemsWrap.style.gap = px(state.gap);
    itemsWrap.style.justifyContent = state.distribution;
    itemsWrap.style.width = '100%';

    state.items.forEach(function (item) {
      var el = document.createElement('span');
      el.className = 'generated-menu__item';
      el.textContent = item.text.trim() === '' ? '(sem título)' : item.text;
      el.style.background = state.itemBg;
      el.style.color = state.textColor;
      el.style.border = state.borderWidth + 'px solid ' + state.borderColor;
      el.style.borderRadius = px(state.borderRadius);
      el.style.fontSize = px(state.fontSize);
      el.style.padding = px(state.paddingY) + ' ' + px(state.paddingX);
      el.style.maxWidth = '12rem';
      itemsWrap.appendChild(el);
    });

    previewEl.appendChild(itemsWrap);
    flashSynced();
  }

  /* ---------- Inicialização --------------------------------------------------- */

  renderItemRows();
  renderPreview();
})();
