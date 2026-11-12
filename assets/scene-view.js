/* Static visual-novel scenes: full image, knee-up character, centered dialogue. */
(() => {
  'use strict';
  const CAMERA = window.TIME_CAMERA;
  const DATA = window.TIME_SCENE_OBJECTS;
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
  let cfg = null;
  let camera = null;
  let layout = null;
  let root = null;
  let world = null;
  let observer = null;
  let detachPointerEnd = null;
  let mode = 'talk';
  let selected = null;
  let listOpen = false;
  let hints = false;
  let suppressClickUntil = 0;
  let resizeFrame = null;
  const $ = (selector) => root?.querySelector(selector);
  const $$ = (selector) => (root ? [...root.querySelectorAll(selector)] : []);
  const objects = () => {
    const base = DATA?.[cfg?.era.id]?.objects || [];
    return base.map((item) => ({
      ...item,
      ...layout?.objects?.find((shape) => shape.id === item.id),
    }));
  };
  function sceneLayout(width = window.innerWidth, height = window.innerHeight) {
    const mobile = height > width ? DATA[cfg.era.id]?.mobile : null;
    return mobile
      ? { ...mobile, variant: 'portrait' }
      : {
          image: cfg.era.image,
          width: 1672,
          height: 941,
          variant: 'landscape',
          objects: [],
        };
  }
  const pad = (n) => String(n).padStart(2, '0');
  const found = (id) => (cfg?.seen || []).includes(id);
  const foundCount = () => objects().filter((item) => found(item.id)).length;
  const optionalSearch = () =>
    cfg?.optionalSearch === true &&
    cfg.dialogueAnswered &&
    cfg.complete &&
    cfg.era.task.type !== 'explore';
  const skipSearchLabel = () =>
    cfg.era.id === 'future' ? 'Создать будущее' : 'Перейти в следующую эпоху';

  function reset() {
    camera = null;
    layout = null;
    mode = 'talk';
    selected = null;
    listOpen = false;
    hints = false;
    suppressClickUntil = 0;
  }
  function points(item) {
    return item.polygon
      .map(
        ([x, y]) =>
          `${((x * layout.width) / 100).toFixed(2)},${((y * layout.height) / 100).toFixed(2)}`,
      )
      .join(' ');
  }
  function markup(input) {
    if (cfg?.era.id !== input.era.id) reset();
    cfg = {
      ...input,
      dialogueAnswered: input.dialogueAnswered === true,
      taskStarted: input.taskStarted === true,
      optionalSearch: input.optionalSearch === true,
    };
    if (!cfg.dialogueAnswered && mode === 'task') mode = 'talk';
    layout = sceneLayout();
    const {
      era,
      index,
      shortName,
      asset,
      icon,
      dialogueHTML,
      taskDialogueHTML,
      taskHTML,
      taskInstruction,
    } = cfg;
    const panelContext = `<div class="sheet-context"><span class="sheet-era-index">${pad(index + 1)} / 07 · ${esc(era.date)}</span><span class="sheet-era-name">${esc(shortName)}</span></div>`;
    return `<section class="scene-page immersive-scene" data-era="${era.id}" data-panel="${mode}" data-optional-search="${optionalSearch()}" data-scene-variant="${layout.variant}" aria-label="${esc(era.date)} — ${esc(era.title)}">
      <div class="scene-world" id="scene-world" tabindex="0" aria-label="Локация целиком. Нажмите на предмет или золотую метку, чтобы прочитать описание.">
        <svg id="scene-canvas" class="scene-canvas" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" preserveAspectRatio="none" aria-hidden="true">
          <defs><filter id="object-glow" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="6"/></filter></defs>
          <image class="scene-background" href="${esc(asset(layout.image))}" x="0" y="0" width="${layout.width}" height="${layout.height}" preserveAspectRatio="none"/>
          ${objects()
            .map(
              (o) =>
                `<g class="scene-hotspot ${found(o.id) ? 'found' : ''} ${selected === o.id ? 'selected' : ''}" data-action="inspect" data-id="${o.id}"><title>${esc(o.name)}</title><polygon class="hotspot-halo" points="${points(o)}" filter="url(#object-glow)"/><polygon class="hotspot-shape" points="${points(o)}" vector-effect="non-scaling-stroke"/></g>`,
            )
            .join('')}
        </svg>
        <div class="scene-vignette" aria-hidden="true"></div>
        <div id="scene-markers" class="scene-markers"${cfg.taskStarted ? '' : ' hidden'}>${objects()
          .map(
            (o, i) =>
              `<button class="hotspot-marker ${found(o.id) ? 'found' : ''}" data-action="inspect" data-id="${o.id}" aria-label="Исследовать: ${esc(o.name)}" aria-pressed="${selected === o.id}" title="${esc(o.name)}"><span class="marker-core" aria-hidden="true">${found(o.id) ? '✓' : pad(i + 1)}</span><span class="marker-label">${esc(o.name)}</span></button>`,
          )
          .join('')}</div>
      </div>
      <figure class="scene-actor" id="scene-actor" aria-hidden="true"><img class="scene-character-image" src="${esc(asset(era.character.sprite))}" alt="" draggable="false" decoding="async"></figure>
      <div class="scene-location"><span class="eyebrow">${pad(index + 1)} / 07 · ${esc(era.date)}</span><h1>${esc(era.title)}</h1><p>${esc(shortName)}</p><div class="image-note">${era.id === 'future' ? 'Художественное будущее' : 'Художественная реконструкция'}</div></div>
      <div class="scene-tools"><button class="scene-pill" data-action="scene-list" aria-expanded="false">${icon('pin')}<span><span id="scene-items-label">${optionalSearch() ? 'Артефакты' : 'Предметы'}</span> <b id="scene-found-count">${foundCount()}/${objects().length}</b></span></button><button class="scene-icon-control" data-action="fact" data-id="${era.id}" aria-label="История эпохи и источники" title="История эпохи и источники">${icon('info')}</button></div>

      <section id="dialogue-panel" class="scene-sheet dialogue-sheet" aria-label="Разговор с персонажем"><div class="sheet-controls">${panelContext}<button class="sheet-close icon-button" data-action="look" aria-label="Свернуть диалог и осмотреться">${icon('close')}</button></div><div class="scene-conversation sheet-body" id="conversation">${dialogueHTML}</div></section>
      <section id="task-panel" class="scene-sheet task-sheet" aria-labelledby="task-title" hidden><div class="sheet-controls">${panelContext}<button class="sheet-close icon-button" data-action="look" aria-label="Свернуть задание и осмотреться">${icon('close')}</button></div><div class="task-section sheet-body" id="task-section" tabindex="-1"><div id="task-dialogue" class="task-dialogue" role="group" aria-labelledby="task-speaker" aria-describedby="task-npc-response" tabindex="-1" ${taskDialogueHTML ? '' : 'hidden'}>${taskDialogueHTML || ''}</div><div class="task-heading"><span class="eyebrow">${cfg.complete ? 'СЛЕД ПАМЯТИ СОХРАНЁН' : 'ВАШЕ ЗАДАНИЕ'}</span><h2 id="task-title">${esc(era.task.title)}</h2><p>${esc(taskInstruction)}</p><p class="fine-print">${esc(era.task.note)}</p></div><div class="task-body" id="task-body">${taskHTML}</div></div></section>
      <section id="object-panel" class="scene-sheet object-sheet" aria-labelledby="object-title" hidden><button class="sheet-close icon-button" data-action="look" aria-label="Закрыть описание предмета">${icon('close')}</button><div id="object-content"></div></section>
      <div id="scene-object-tray" class="scene-object-tray" hidden><div class="tray-heading"><span>Найдите предмет в локации</span><button class="text-button" data-action="scene-hints" aria-pressed="false">Показать контуры</button></div><div class="scene-object-links">${objects()
        .map(
          (o, i) =>
            `<button class="scene-object-link ${found(o.id) ? 'found' : ''}" data-action="inspect" data-id="${o.id}" data-focus="true"><span class="object-link-number"${cfg.taskStarted ? '' : ' style="visibility:hidden" aria-hidden="true"'}>${pad(i + 1)}</span><span>${esc(o.name)}</span><span class="object-link-check" aria-hidden="true">${found(o.id) ? '✓' : '↗'}</span></button>`,
        )
        .join(
          '',
        )}</div><div id="optional-search-footer" class="optional-search-footer"${optionalSearch() ? '' : ' hidden'}><p id="optional-search-progress" role="status" aria-live="polite">Повторный поиск · Найдено ${foundCount()} из ${objects().length}</p><button class="button secondary small" data-action="era-artifacts-skip">${skipSearchLabel()} ${icon('arrow')}</button></div></div>
      <div class="scene-look-hint" id="scene-look-hint"><span>Нажмите на предмет или золотую метку</span><small>Вся локация перед вами</small></div>
      <nav class="scene-dock" aria-label="Режим игры"><button class="scene-dock-button" data-action="look" aria-pressed="false">${icon('pin')}<span>Осмотреться</span></button><button class="scene-dock-button" data-action="talk" aria-pressed="true">${icon('book')}<span>Диалог</span></button><button class="scene-dock-button" data-action="task" aria-pressed="false">${icon(cfg.complete ? 'check' : 'blueprint')}<span>${cfg.complete ? 'Артефакт' : 'Задание'}</span></button></nav>
    </section>`;
  }
  function objectDescription() {
    const item = objects().find((o) => o.id === selected);
    if (!item) return '';
    const { era, icon } = cfg;
    const all = objects().every((o) => found(o.id));
    if (optionalSearch()) {
      return `<div class="object-detail-heading"><span class="object-detail-icon">${icon(item.icon || 'info')}</span><div><span class="eyebrow">АРТЕФАКТ ЭПОХИ НАЙДЕН</span><h2 id="object-title">${esc(item.name)}</h2></div></div><p class="object-description">${esc(item.description)}</p><div class="object-detail-footer"><span class="fine-print">Повторный поиск · Найдено ${foundCount()} из ${objects().length}</span><button class="text-button" data-action="scene-list">Другие предметы ${icon('arrow')}</button></div><div class="object-search-actions"><button class="button gold small object-next" data-action="${all ? 'era-artifacts' : 'look'}">${all ? 'Все находки' : 'Продолжить поиск'} ${icon('arrow')}</button><button class="button secondary small" data-action="era-artifacts-skip">${skipSearchLabel()} ${icon('arrow')}</button></div>`;
    }
    const nextAction = !cfg.dialogueAnswered
      ? 'talk'
      : cfg.complete
        ? 'next'
        : era.task.type === 'explore' && all
          ? 'check'
          : 'task';
    const nextLabel = !cfg.dialogueAnswered
      ? 'Ответить персонажу'
      : cfg.complete
        ? era.id === 'future'
          ? 'Создать будущее'
          : 'Следующая эпоха'
        : era.task.type === 'explore' && all
          ? 'Все находки'
          : 'К заданию эпохи';
    return `<div class="object-detail-heading"><span class="object-detail-icon">${icon(item.icon || 'info')}</span><div><span class="eyebrow">НАБЛЮДЕНИЕ СОХРАНЕНО</span><h2 id="object-title">${esc(item.name)}</h2></div></div><p class="object-description">${esc(item.description)}</p><div class="object-detail-footer"><span class="fine-print">Исследовано ${foundCount()} из ${objects().length}</span><button class="text-button" data-action="scene-list">Другие предметы ${icon('arrow')}</button></div>${cfg.dialogueAnswered && era.task.type === 'explore' && !all && !cfg.complete ? '<p class="object-next-note">Найдите остальные предметы прямо в локации.</p>' : `<button class="button gold small object-next" data-action="${nextAction}">${nextLabel} ${icon('arrow')}</button>`}`;
  }
  function keepObjectPanelClear(panel) {
    const archive = document.getElementById('archive-button');
    if (!archive) return;
    const box = panel.getBoundingClientRect();
    const chest = archive.getBoundingClientRect();
    if (!box.width || !box.height || !chest.width || !chest.height) return;
    const gap = 16;
    const intersects =
      box.left < chest.right + gap &&
      box.right > chest.left - gap &&
      box.top < chest.bottom + gap &&
      box.bottom > chest.top - gap;
    if (!intersects) return;

    const measuredRoot = root.getBoundingClientRect();
    const scene = measuredRoot.width ? measuredRoot : world.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportLeft = viewport?.offsetLeft || 0;
    const viewportTop = viewport?.offsetTop || 0;
    const bounds = {
      left: Math.max(scene.left, viewportLeft) + 12,
      top: Math.max(scene.top, viewportTop) + 12,
      right: Math.min(scene.right, viewportLeft + (viewport?.width || window.innerWidth)) - 12,
      bottom: Math.min(scene.bottom, viewportTop + (viewport?.height || window.innerHeight)) - 12,
    };
    const header = document.querySelector('.site-header')?.getBoundingClientRect();
    if (header?.width && header.height && header.bottom > bounds.top)
      bounds.top = Math.max(bounds.top, header.bottom + 12);
    const dock = $('.scene-dock')?.getBoundingClientRect();
    // In portrait object mode the dock is a vertical strip on the right.
    if (dock?.width && dock.height > dock.width && dock.left > (scene.left + scene.right) / 2)
      bounds.right = Math.min(bounds.right, dock.left - gap);
    const previousMax = parseFloat(getComputedStyle(panel).maxHeight);
    const capHeight = (available) =>
      Math.max(1, Math.min(available, previousMax > 0 ? previousMax : box.height));
    const rightLeft = Math.max(bounds.left, chest.right + gap);
    const rightWidth = bounds.right - rightLeft;
    const aboveBottom = Math.min(bounds.bottom, chest.top - gap);
    const aboveHeight = aboveBottom - bounds.top;
    panel.style.right = 'auto';
    if (rightWidth >= Math.min(220, box.width) || (aboveHeight < 88 && rightWidth > 0)) {
      panel.style.left = `${rightLeft - scene.left}px`;
      panel.style.width = `${Math.min(box.width, rightWidth)}px`;
      panel.style.maxHeight = `${capHeight(bounds.bottom - bounds.top)}px`;
      // Narrower text can make the panel taller. Read the new border box before clamping.
      const resized = panel.getBoundingClientRect();
      const top = Math.max(bounds.top, Math.min(resized.top, bounds.bottom - resized.height));
      panel.style.top = `${top - scene.top}px`;
      panel.style.bottom = 'auto';
      root.dataset.objectClearance = 'right';
    } else {
      // A narrow phone may not have a readable column beside the chest.
      const width = Math.max(1, Math.min(box.width, bounds.right - bounds.left));
      const left = Math.max(bounds.left, Math.min(box.left, bounds.right - width));
      panel.style.left = `${left - scene.left}px`;
      panel.style.width = `${width}px`;
      panel.style.maxHeight = `${capHeight(aboveHeight)}px`;
      panel.style.top = 'auto';
      panel.style.bottom = `${scene.bottom - aboveBottom}px`;
      root.dataset.objectClearance = 'above';
    }
  }
  function positionObjectPanel() {
    if (!root || !camera || !selected) return;
    const item = objects().find((o) => o.id === selected);
    if (!item) return;
    const panel = $('#object-panel');
    // Every calculation starts from the responsive CSS placement, never the last correction.
    for (const property of ['left', 'right', 'top', 'bottom', 'width', 'max-height'])
      panel.style.removeProperty(property);
    delete root.dataset.objectClearance;
    if (panel.hidden || mode !== 'object') return;
    const [x, y] = CAMERA.screen(camera, item.anchor);
    const placement =
      camera.width <= 760 && camera.height >= camera.width
        ? y > camera.height * 0.54
          ? 'top'
          : 'bottom'
        : x > camera.width * 0.5
          ? 'left'
          : 'right';
    root.dataset.objectPlacement = placement;
    if (placement === 'top' || placement === 'bottom') {
      // Keep the selected point clear even when a translated title makes the card taller.
      const inset =
        parseFloat(getComputedStyle(panel)[placement]) || (placement === 'top' ? 82 : 24);
      const available = placement === 'top' ? y - inset - 30 : camera.height - inset - y - 30;
      panel.style.maxHeight = `${Math.max(88, Math.min(camera.height * 0.49, available))}px`;
    }
    keepObjectPanelClear(panel);
  }
  function updatePanels() {
    if (!root) return;
    root.dataset.panel = mode;
    const searching = optionalSearch();
    const searchProgress = `Повторный поиск · Найдено ${foundCount()} из ${objects().length}`;
    root.dataset.optionalSearch = String(searching);
    $('#scene-items-label').textContent = searching ? 'Артефакты' : 'Предметы';
    $('#scene-found-count').textContent = `${foundCount()}/${objects().length}`;
    $('#optional-search-footer').hidden = !searching;
    $('#optional-search-progress').textContent = searchProgress;
    // Keep the complete marker layer hidden until this era's task has opened.
    // Camera measurements may still position individual buttons while it is hidden.
    const taskStarted = cfg.taskStarted === true;
    $('#scene-markers').hidden = !taskStarted;
    $$('.object-link-number').forEach((number) => {
      number.style.visibility = taskStarted ? '' : 'hidden';
      if (taskStarted) number.removeAttribute('aria-hidden');
      else number.setAttribute('aria-hidden', 'true');
    });
    $('#scene-world').setAttribute(
      'aria-label',
      taskStarted
        ? 'Локация целиком. Нажмите на предмет или золотую метку, чтобы прочитать описание.'
        : 'Локация целиком. Нажмите на предмет, чтобы прочитать описание.',
    );
    $('#scene-look-hint span').textContent = searching
      ? foundCount() === objects().length
        ? 'Все артефакты найдены'
        : 'Найдите три артефакта эпохи'
      : taskStarted
        ? 'Нажмите на предмет или золотую метку'
        : 'Нажмите на предмет';
    $('#scene-look-hint small').textContent = searching ? searchProgress : 'Вся локация перед вами';
    $('#dialogue-panel').hidden = mode !== 'talk';
    $('#scene-actor').hidden = !['talk', 'task'].includes(mode);
    $('#task-panel').hidden = mode !== 'task';
    $('#object-panel').hidden = mode !== 'object' || !selected;
    $('#scene-object-tray').hidden = !listOpen;
    $('#scene-look-hint').hidden = mode !== 'look' || listOpen;
    $$('.scene-dock-button').forEach((b) => {
      const active = b.dataset.action === (mode === 'object' ? 'look' : mode);
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
      if (b.dataset.action === 'task') {
        b.title = cfg.dialogueAnswered
          ? 'Открыть задание эпохи'
          : 'Сначала выберите ответ персонажу';
        b.setAttribute('aria-label', b.title);
      }
    });
    const list = $('[data-action="scene-list"]');
    list?.setAttribute('aria-expanded', String(listOpen));
    root.classList.toggle('show-hotspots', hints);
    const hintsButton = $('[data-action="scene-hints"]');
    if (hintsButton) {
      hintsButton.textContent = hints ? 'Скрыть контуры' : 'Показать контуры';
      hintsButton.setAttribute('aria-pressed', String(hints));
    }
    positionObjectPanel();
    // Each mode can change the header, tools, actor and lower-control layout.
    requestMeasure();
  }
  function setMode(next, { focus = false } = {}) {
    if (!['look', 'talk', 'task', 'object'].includes(next)) return;
    if (next === 'task' && !cfg?.dialogueAnswered) next = 'talk';
    if (next === 'task' && cfg) cfg.taskStarted = true;
    const enteringPanel = mode !== next && ['talk', 'task'].includes(next);
    mode = next;
    listOpen = false;
    updatePanels();
    if (enteringPanel) {
      const panel = $(next === 'talk' ? '#dialogue-panel' : '#task-panel');
      const body = $(next === 'talk' ? '#conversation' : '#task-section');
      if (panel) panel.scrollTop = 0;
      if (body) body.scrollTop = 0;
    }
    if (focus) {
      const target =
        next === 'task'
          ? $('#task-dialogue:not([hidden])') || $('#task-section')
          : next === 'talk'
            ? $('#dialogue-response')
            : world;
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  }
  function sync(data = {}) {
    if (!root || !cfg) return;
    if (data.seen) cfg.seen = data.seen;
    if (typeof data.dialogueAnswered === 'boolean') cfg.dialogueAnswered = data.dialogueAnswered;
    if (typeof data.complete === 'boolean') cfg.complete = data.complete;
    if (typeof data.taskStarted === 'boolean') cfg.taskStarted = data.taskStarted;
    if (typeof data.optionalSearch === 'boolean') cfg.optionalSearch = data.optionalSearch;
    if (!cfg.dialogueAnswered && mode === 'task') mode = 'talk';
    $$('.scene-hotspot').forEach((g) => {
      g.classList.toggle('selected', g.dataset.id === selected);
      g.classList.toggle('found', found(g.dataset.id));
    });
    $$('.hotspot-marker').forEach((b) => {
      const i = objects().findIndex((o) => o.id === b.dataset.id);
      b.classList.toggle('selected', b.dataset.id === selected);
      b.classList.toggle('found', found(b.dataset.id));
      b.setAttribute('aria-pressed', String(b.dataset.id === selected));
      b.querySelector('.marker-core').textContent = found(b.dataset.id) ? '✓' : pad(i + 1);
    });
    $$('.scene-object-link').forEach((b) => {
      b.classList.toggle('found', found(b.dataset.id));
      b.querySelector('.object-link-check').textContent = found(b.dataset.id) ? '✓' : '↗';
    });
    if (selected) $('#object-content').innerHTML = objectDescription();
    updatePanels();
  }
  function inspect(id, { seen } = {}) {
    const item = objects().find((o) => o.id === id);
    if (!item) return;
    selected = id;
    mode = 'object';
    listOpen = false;
    sync({ seen });
    const heading = $('#object-title');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }
  function toggleList() {
    listOpen = !listOpen;
    if (listOpen) mode = 'look';
    updatePanels();
    const target = listOpen
      ? $('.scene-object-link')
      : $('.scene-tools [data-action="scene-list"]');
    target?.focus({ preventScroll: true });
  }
  function toggleHints() {
    hints = !hints;
    root?.classList.toggle('show-hotspots', hints);
    const b = $('[data-action="scene-hints"]');
    if (b) {
      b.textContent = hints ? 'Скрыть контуры' : 'Показать контуры';
      b.setAttribute('aria-pressed', String(hints));
    }
  }
  function updateCamera() {
    if (!root || !camera) return;
    const canvas = $('#scene-canvas');
    canvas.setAttribute('viewBox', CAMERA.viewBox(camera));
    canvas.setAttribute('preserveAspectRatio', 'none');
    const background = $('.scene-background');
    background.setAttribute('href', cfg.asset(layout.image));
    background.setAttribute('width', layout.width);
    background.setAttribute('height', layout.height);
    root.dataset.sceneVariant = layout.variant;
    $$('.scene-hotspot').forEach((group) => {
      const item = objects().find((o) => o.id === group.dataset.id);
      group
        .querySelectorAll('polygon')
        .forEach((shape) => shape.setAttribute('points', points(item)));
    });
    $$('.hotspot-marker').forEach((button) => {
      const item = objects().find((o) => o.id === button.dataset.id);
      const [x, anchorY] = CAMERA.marker(camera, item.anchor);
      let y = anchorY;
      const compact = camera.width <= 760 || (camera.height <= 560 && camera.width > camera.height);
      if (compact && cfg.era.id === 'shore' && item.id === 'shore-field') {
        const scene = world.getBoundingClientRect();
        const half = Math.max(24, button.getBoundingClientRect().height / 2);
        let safeTop = parseFloat(root.style.getPropertyValue('--scene-safe-top')) || 0;
        const title = $('.scene-location')?.getBoundingClientRect();
        if (
          title?.width &&
          title.height &&
          scene.left + x + half > title.left &&
          scene.left + x - half < title.right
        )
          safeTop = Math.max(safeTop, title.bottom - scene.top + 12);
        // Move only the numbered button. The object contour and hit target stay on the field.
        y = Math.min(camera.height - half - 12, Math.max(anchorY, safeTop + half));
      }
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      button.hidden = false;
    });
    positionObjectPanel();
  }
  function measure() {
    if (!world?.isConnected) return;
    const rect = world.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1024;
    const height = rect.height || window.innerHeight || 768;
    const header = document.querySelector('.site-header')?.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop || 0;
    const visibleBottom = Math.min(
      height,
      viewportTop + (viewport?.height || window.innerHeight || height) - rect.top,
    );
    const compact = width <= 760 || (height <= 560 && width > height);
    const headerFallback = compact ? (width > height && width > 520 ? 62 : 100) : 76;
    const headerBottom = header?.width && header.height ? header.bottom : rect.top + headerFallback;
    const safeTop = Math.max(rect.top, viewportTop, headerBottom) - rect.top + 12;
    root.style.setProperty('--scene-safe-top', `${safeTop}px`);
    root.style.setProperty('--scene-visible-bottom', `${Math.max(0, visibleBottom)}px`);
    root.style.setProperty(
      '--scene-viewport-bottom-inset',
      `${Math.max(0, height - visibleBottom)}px`,
    );
    // Clearance is measured from the visible bottom. CSS adds the viewport inset
    // once, so browser bars or a raised visual viewport cannot double the gap.
    const fallbackClearance = width > height ? 73 : 80;
    let bottomClearance = fallbackClearance;
    if (compact && ['talk', 'task'].includes(mode)) {
      const dock = $('.scene-dock')?.getBoundingClientRect();
      const archive = document.getElementById('archive-button')?.getBoundingClientRect();
      const coins = document.getElementById('archive-coins')?.getBoundingClientRect();
      const obstacles = [archive, coins];
      if (dock?.width >= dock?.height) obstacles.push(dock);
      for (const box of obstacles) {
        if (
          !box?.width ||
          !box.height ||
          box.bottom <= Math.max(rect.top, viewportTop) ||
          box.top >= rect.top + visibleBottom ||
          box.right <= rect.left ||
          box.left >= rect.left + width
        )
          continue;
        bottomClearance = Math.max(bottomClearance, visibleBottom - (box.top - rect.top) + 12);
      }
    }
    root.style.setProperty('--scene-bottom-clearance', `${bottomClearance}px`);
    root.style.setProperty(
      '--scene-panel-max-height',
      `${Math.max(0, visibleBottom - safeTop - bottomClearance)}px`,
    );
    layout = sceneLayout(width, height);
    camera = CAMERA.create(width, height, layout.width, layout.height);
    updateCamera();
    const dialogue = $('#dialogue-panel').getBoundingClientRect();
    const dialogueHeight = dialogue.height || Math.min(330, height * 0.41);
    root.style.setProperty('--dialogue-space', `${dialogueHeight}px`);
    const dialogueTop =
      dialogue.width && dialogue.height
        ? dialogue.top - rect.top
        : visibleBottom - bottomClearance - dialogueHeight;
    const actorHeight = Math.max(0, dialogueTop - safeTop - 8);
    root.style.setProperty('--scene-actor-available-height', `${actorHeight}px`);
    root.dataset.actorSpace = actorHeight < 72 ? 'small' : 'available';
  }
  function requestMeasure() {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      measure();
    });
  }
  function unmount() {
    detachPointerEnd?.();
    detachPointerEnd = null;
    observer?.disconnect();
    observer = null;
    window.removeEventListener('resize', requestMeasure);
    window.visualViewport?.removeEventListener('resize', requestMeasure);
    window.visualViewport?.removeEventListener('scroll', requestMeasure);
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
    root = null;
    world = null;
  }
  function mount() {
    unmount();
    root = document.querySelector('.immersive-scene');
    world = $('#scene-world');
    if (!root || !world) return;
    measure();
    sync();
    updatePanels();
    window.addEventListener('resize', requestMeasure);
    window.visualViewport?.addEventListener('resize', requestMeasure);
    window.visualViewport?.addEventListener('scroll', requestMeasure);
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(requestMeasure);
      observer.observe(world);
      observer.observe($('#dialogue-panel'));
      const header = document.querySelector('.site-header');
      if (header) observer.observe(header);
      const title = $('.scene-location');
      if (title) observer.observe(title);
      const archive = document.getElementById('archive-button');
      if (archive) observer.observe(archive);
      const coins = document.getElementById('archive-coins');
      if (coins) observer.observe(coins);
      const dock = $('.scene-dock');
      if (dock) observer.observe(dock);
    }
    let drag = null;
    world.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.isPrimary === false || event.target.closest('button')) return;
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
      };
    });
    world.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        end(event);
        return;
      }
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 7) {
        drag.moved = true;
        // A swipe never moves the scenery or accidentally discovers an object.
      }
      if (drag.moved) event.preventDefault();
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    });
    const end = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.moved) suppressClickUntil = Date.now() + 350;
      drag = null;
    };
    // Release outside the scene must end an unfinished press as well as a captured drag.
    const cancel = () => {
      if (drag) end({ pointerId: drag.id });
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('blur', cancel);
    detachPointerEnd = () => {
      cancel();
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      window.removeEventListener('blur', cancel);
    };
    world.addEventListener(
      'click',
      (event) => {
        if (Date.now() < suppressClickUntil) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  }
  document.addEventListener('keydown', (event) => {
    if (!root?.isConnected || document.querySelector('#modal')?.open) return;
    if (event.key === 'Escape') {
      if (listOpen) {
        toggleList();
      } else if (mode !== 'look') setMode('look', { focus: true });
      return;
    }
  });
  window.TIME_SCENE = Object.freeze({
    markup,
    mount,
    unmount,
    reset,
    setMode,
    inspect,
    sync,
    toggleList,
    toggleHints,
    refresh: requestMeasure,
  });
})();
