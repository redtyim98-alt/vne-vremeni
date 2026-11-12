/* ВНЕ ВРЕМЕНИ. Vanilla JavaScript, без сборки, API и сетевых зависимостей. */
(() => {
  'use strict';
  const STORY = window.TIME_STORY;
  const SCENE = window.TIME_SCENE;
  const SCENE_OBJECTS = window.TIME_SCENE_OBJECTS;
  const app = document.getElementById('app');
  if (!STORY || !Array.isArray(STORY.eras) || STORY.eras.length !== 7 || !SCENE || !SCENE_OBJECTS) {
    app.innerHTML =
      '<section class="error-page"><h1>Не удалось открыть историю</h1><p>Распакуйте архив целиком. Рядом с index.html должна находиться папка assets со всеми файлами игры.</p></section>';
    return;
  }
  const ERAS = STORY.eras;
  const REWARD_COINS = { shore: 5, wine: 5, factory: 10, war: 10, soviet: 5, tech: 10, future: 5 };
  const SPONSORS = STORY.sponsors;
  const SHOP = STORY.shop;
  const SHOP_ITEMS = [
    ...SHOP.upgrades.flatMap((skill) =>
      skill.steps.map((step, index) => ({
        ...step,
        kind: 'upgrade',
        skillId: skill.id,
        skillName: skill.name,
        level: index + 1,
        requires: index ? skill.steps[index - 1].id : null,
      })),
    ),
    ...SHOP.rewards,
  ];
  const shopItem = (id) => SHOP_ITEMS.find((item) => item.id === id);
  const SOURCES = window.TIME_SOURCES || [];
  const STORAGE_KEY = 'out-of-time.save.v1';
  const SOURCE_MAP = {
    shore: ['island'],
    wine: ['wine'],
    factory: ['factory'],
    war: ['siege'],
    soviet: ['name', 'relocation'],
    tech: ['tech'],
    future: [],
  };
  const SHORT_NAMES = [
    'Первый берег',
    'Винный городок',
    'Производство',
    'Военные годы',
    'Время перемен',
    'Новая жизнь',
    'Будущее',
  ];
  const SHORT_DATES = ['До завода', '1806', '1869', '1941–1945', 'XX век', '2024', '2126'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
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
  const asset = (path) => window.TIME_ASSETS?.[path] || path;
  const pad = (n) => String(n).padStart(2, '0');
  const glyphs = {
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="m12 8 3 4-3 4-3-4 3-4Z"/>',
    heart: '<path d="M12 21S2 15 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 7-10 13-10 13Z"/>',
    star: '<path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1 3-6Z"/>',
    lock: '<rect x="6" y="10" width="12" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    sound: '<path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute: '<path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 6 6m0-6-6 6"/>',
    book: '<path d="M12 5C8 2 3 3 2 4v15c3-2 7-1 10 1 3-2 7-3 10-1V4c-1-1-6-2-10 1Zm0 0v15"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-11v1"/>',
    reset: '<path d="M3 10a9 9 0 1 1 1 8M3 3v7h7"/>',
    pin: '<path d="M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
    drop: '<path d="M12 2C9 7 4 11 4 16a8 8 0 0 0 16 0c0-5-5-9-8-14Z"/><path d="M8 15c-1 3 1 5 3 5"/>',
    ledger:
      '<rect x="4" y="3" width="16" height="19" rx="1"/><path d="M8 3v19m3-14h6m-6 4h6m-6 4h4M2 7h4M2 12h4M2 17h4"/>',
    blueprint:
      '<path d="M3 5h18v16H3zM3 2v3m18-3v3M7 9h10v8H7zM12 9v8M7 13h5M1 21h22"/><path d="M9 7V5m6 2V5"/>',
    letter: '<path d="M3 6h18v15H3zM3 7l9 7 9-7M3 21l6-7m12 7-6-7M7 3h10"/>',
    brick: '<path d="M2 5h20v15H2zM2 10h20M2 15h20M8 5v5m8-5v5M5 10v5m9-5v5m-6 0v5m8-5v5"/>',
    memory:
      '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 0v20M3 7l9 5 9-5M3 17l9-5 9 5"/><circle cx="12" cy="12" r="2"/>',
    key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 10 10m-5-5 3-3m0 6 3-3"/><circle cx="8" cy="8" r="1"/>',
    net: '<path d="M3 4h18L19 20H5L3 4Zm1 4h16M4 12h16M5 16h14M7 4l1 16m4-16v16m5-16-1 16"/>',
    boat: '<path d="M2 14h20l-4 7H7l-5-7Zm10 0V3l7 9h-7M2 23h20"/>',
    field:
      '<path d="M2 20h20M3 16l18 3M3 12l18 3M3 8l18 3M9 3v6m0-4c-4 1-5-1-5-2 3-1 5 0 5 2Zm0 0c3-3 5-2 5-1-1 2-3 2-5 1Z"/>',
    mount: '<path d="m12 2 8 5v10l-8 5-8-5V7l8-5Z"/><circle cx="12" cy="12" r="4"/>',
    plate:
      '<rect x="2" y="5" width="20" height="14" rx="1"/><path d="M7 9h10M7 13h7M5 8v1m14 7v1"/>',
  };
  const icon = (name, cls = '') =>
    `<svg class="${esc(cls)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name] || glyphs.memory}</svg>`;
  const artifactIcon = (era) => `<div class="artifact-icon">${icon(era.artifact.icon)}</div>`;
  const picture = (path, cls, alt, extra = '') =>
    `<img class="${cls}" src="${esc(asset(path))}" alt="${esc(alt)}" ${extra}>`;
  const sponsorForEra = (id) => SPONSORS.find((sponsor) => sponsor.eraId === id);
  const sponsorLogo = (sponsor) =>
    sponsor.logo
      ? `<span class="sponsor-logo ${sponsor.logoTheme === 'dark' ? 'on-dark' : ''}" data-brand="${esc(sponsor.eraId)}">${picture(sponsor.logo, '', '', 'width="140" height="56" loading="lazy"')}</span>`
      : '';
  const emptyState = () => ({
    version: 1,
    started: false,
    completed: [],
    eraId: 'shore',
    lastPlayable: 'prologue',
    visits: {},
    dialogueChoices: {},
    taskStarted: {},
    attempts: {},
    coinAwards: {},
    purchases: [],
    tasks: {},
    inspected: {},
    artifactSearch: {},
    futureChoice: null,
    legacyChoice: null,
    finished: false,
    sound: false,
  });
  let storageOK = true;
  let corruptedSave = false;
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const saved = JSON.parse(raw);
      if (saved?.version !== 1 || !Array.isArray(saved.completed))
        throw new Error('Unsupported save');
      const s = emptyState();
      s.started = !!saved.started;
      // Сохраняем только непрерывную последовательность пройденных эпох.
      for (const era of ERAS) {
        if (saved.completed.includes(era.id)) s.completed.push(era.id);
        else break;
      }
      s.eraId = ERAS.some((e) => e.id === saved.eraId && ERAS.indexOf(e) <= s.completed.length)
        ? saved.eraId
        : ERAS[Math.min(s.completed.length, 6)].id;
      s.sound = !!saved.sound;
      s.futureChoice = STORY.futures.some((f) => f.id === saved.futureChoice)
        ? saved.futureChoice
        : null;
      s.legacyChoice = STORY.legacies.some((l) => l.id === saved.legacyChoice)
        ? saved.legacyChoice
        : null;
      s.finished =
        s.completed.length === 7 && !!s.futureChoice && !!s.legacyChoice && !!saved.finished;
      // Прежние промежуточные экраны теперь ведут к готовым посланиям.
      const savedPage = ['message', 'message-cloud'].includes(saved.lastPlayable)
        ? 'legacy'
        : saved.lastPlayable;
      s.lastPlayable = ['prologue', 'scene', 'future', 'legacy', 'ending', 'shop'].includes(
        savedPage,
      )
        ? savedPage
        : 'scene';
      if (s.completed.length < 7 && ['future', 'legacy', 'ending', 'shop'].includes(s.lastPlayable))
        s.lastPlayable = 'scene';
      if (!s.futureChoice && s.lastPlayable === 'legacy') s.lastPlayable = 'future';
      if (!s.finished && ['ending', 'shop'].includes(s.lastPlayable))
        s.lastPlayable = s.completed.length === 7 ? 'future' : 'scene';
      for (const era of ERAS) {
        const choice = saved.dialogueChoices?.[era.id];
        if (era.openingDialogue.choices.some((item) => item.id === choice))
          s.dialogueChoices[era.id] = choice;
        const unlocked = ERAS.indexOf(era) <= s.completed.length;
        if (
          unlocked &&
          (saved.taskStarted?.[era.id] === true ||
            s.completed.includes(era.id) ||
            s.dialogueChoices[era.id])
        )
          s.taskStarted[era.id] = true;
        const attempts = saved.attempts?.[era.id];
        if (unlocked && Number.isSafeInteger(attempts) && attempts >= 0)
          s.attempts[era.id] = Math.min(attempts, 1000000);
        // Старым завершённым главам не придумываем историю попыток и наград.
        if (
          s.completed.includes(era.id) &&
          Object.prototype.hasOwnProperty.call(saved.coinAwards || {}, era.id)
        )
          s.coinAwards[era.id] =
            saved.coinAwards[era.id] === REWARD_COINS[era.id] && s.attempts[era.id] === 1
              ? REWARD_COINS[era.id]
              : 0;
        const v = saved.visits?.[era.id];
        s.visits[era.id] = Array.isArray(v)
          ? v.filter((id) => era.dialogues.some((d) => d.id === id))
          : [];
        const t = saved.tasks?.[era.id];
        if (!t || typeof t !== 'object') continue;
        const clean = {};
        if (era.task.type === 'explore')
          clean.found = [
            ...new Set(
              Array.isArray(t.found)
                ? t.found.filter((id) => era.task.objects.some((o) => o.id === id))
                : [],
            ),
          ];
        if (era.task.type === 'quiz')
          clean.selected = era.task.options.some((o) => o.id === t.selected) ? t.selected : null;
        if (era.task.type === 'order')
          clean.order = [
            ...new Set(
              Array.isArray(t.order)
                ? t.order.filter((id) => era.task.fragments.some((f) => f.id === id))
                : [],
            ),
          ];
        if (era.task.type === 'match') {
          clean.answers = {};
          for (const p of era.task.pairs)
            if (era.task.pairs.some((q) => q.id === t.answers?.[p.id]))
              clean.answers[p.id] = t.answers[p.id];
          clean.verified = [...new Set(Array.isArray(t.verified) ? t.verified : [])].filter(
            (id) => era.task.pairs.some((p) => p.id === id) && clean.answers[id] === id,
          );
        }
        s.tasks[era.id] = clean;
      }
      // Older saves already know which objects were found in exploration tasks.
      // Merge that progress into scene observations without changing the save version.
      for (const era of ERAS) {
        const ids = SCENE_OBJECTS[era.id].objects.map((o) => o.id);
        const observations = Array.isArray(saved.inspected?.[era.id])
          ? saved.inspected[era.id]
          : [];
        s.inspected[era.id] = [
          ...new Set([...observations, ...(s.tasks[era.id]?.found || [])]),
        ].filter((id) => ids.includes(id));
        if (era.task.type === 'explore' && s.inspected[era.id].length) {
          s.tasks[era.id] ||= {};
          s.tasks[era.id].found = s.inspected[era.id].filter((id) =>
            era.task.objects.some((o) => o.id === id),
          );
        }
        const search = saved.artifactSearch?.[era.id];
        if (
          s.completed.includes(era.id) &&
          era.task.type !== 'explore' &&
          search?.started === true
        ) {
          s.artifactSearch[era.id] = {
            started: true,
            found: [...new Set(Array.isArray(search.found) ? search.found : [])].filter((id) =>
              ids.includes(id),
            ),
          };
        }
      }
      // Покупки остаются при выборе другого финала. Берём цены только из каталога.
      // Последовательно восстанавливаем допустимые покупки без дублей и перерасхода.
      if (s.completed.length === 7 && Array.isArray(saved.purchases)) {
        let remaining = ERAS.reduce((sum, era) => sum + (s.coinAwards[era.id] || 0), 0);
        for (const id of saved.purchases) {
          const item = shopItem(id);
          if (
            !item ||
            s.purchases.includes(id) ||
            item.cost > remaining ||
            (item.requires && !s.purchases.includes(item.requires))
          )
            continue;
          s.purchases.push(id);
          remaining -= item.cost;
        }
      }
      return s;
    } catch (e) {
      if (e instanceof SyntaxError || e.message === 'Unsupported save') corruptedSave = true;
      else storageOK = false;
      return emptyState();
    }
  }
  let state = loadState();
  let view = 'home';
  // Порядок текущего визита не зависит от сохранённого прогресса задания.
  let dialogueAnsweredThisVisit = false;
  let taskMessage = '';
  let taskMessageKind = '';
  let showHint = false;
  let selectedObject = null;
  let activeArtifactSearchEra = null;
  let toastTimer;
  let modalOpener = null;
  const audioCache = {};
  const currentEra = () => ERAS.find((e) => e.id === state.eraId) || ERAS[0];
  const isComplete = (id) => state.completed.includes(id);
  const isUnlocked = (era) => ERAS.indexOf(era) <= state.completed.length;
  const taskState = (era) => (state.tasks[era.id] ||= {});
  const allExploreObjectsFound = (era) =>
    era.task.type === 'explore' &&
    era.task.objects.length > 0 &&
    era.task.objects.every((item) => (state.tasks[era.id]?.found || []).includes(item.id));
  const optionalSearchActive = (era) =>
    activeArtifactSearchEra === era.id &&
    isComplete(era.id) &&
    era.task.type !== 'explore' &&
    state.artifactSearch[era.id]?.started === true;
  const allOptionalObjectsFound = (era) =>
    isComplete(era.id) &&
    era.task.type !== 'explore' &&
    state.artifactSearch[era.id]?.started === true &&
    SCENE_OBJECTS[era.id].objects.every((item) =>
      state.artifactSearch[era.id].found.includes(item.id),
    );
  const sceneObservations = (era) =>
    optionalSearchActive(era) ? state.artifactSearch[era.id].found : state.inspected[era.id] || [];
  const coinsEarned = () => ERAS.reduce((sum, era) => sum + (state.coinAwards[era.id] || 0), 0);
  const coinsSpent = () => state.purchases.reduce((sum, id) => sum + shopItem(id).cost, 0);
  const coinBalance = () => coinsEarned() - coinsSpent();
  const owns = (id) => state.purchases.includes(id);
  const skillLevel = (id) =>
    SHOP.upgrades.find((skill) => skill.id === id).steps.filter((step) => owns(step.id)).length;
  const playerLevel = () => 1 + SHOP.upgrades.reduce((sum, skill) => sum + skillLevel(skill.id), 0);
  const shopUnlocked = () => state.finished && state.completed.length === 7;
  const selectedDialogue = (era) =>
    era.openingDialogue.choices.find((choice) => choice.id === state.dialogueChoices[era.id]);
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageOK = true;
    } catch {
      storageOK = false;
    }
    $('#save-status').textContent = storageOK
      ? 'Прогресс сохраняется в этом браузере'
      : 'Сохранение недоступно · можно пройти игру в этой вкладке';
  }
  function announce(text) {
    $('#announcer').textContent = '';
    setTimeout(() => {
      $('#announcer').textContent = text;
    }, 30);
  }
  function toast(text) {
    clearTimeout(toastTimer);
    $('#toast').textContent = text;
    $('#toast').classList.add('visible');
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
  }
  function play(name) {
    if (!state.sound) return;
    try {
      const a = (audioCache[name] ||= new Audio(asset(`assets/sounds/${name}.wav`)));
      a.volume = name === 'portal' ? 0.18 : 0.14;
      a.currentTime = 0;
      const p = a.play();
      if (p) p.catch(() => {});
    } catch {
      /* Звук не влияет на прохождение. */
    }
  }
  function updateChrome() {
    $('#scene-header-note').textContent =
      view === 'scene' ? $('.scene-location .image-note', app)?.textContent || '' : '';
    $('#archive-count').innerHTML = `${state.completed.length}<span>/7</span>`;
    $('#archive-coins-count').textContent = coinBalance();
    const archive = $('#archive-button');
    archive.setAttribute(
      'aria-label',
      `Мой архив. Собрано ${state.completed.length} из 7 артефактов. Игровых монет в сундуке: ${coinBalance()}`,
    );
    archive.title = `Мой архив · ${state.completed.length}/7 артефактов · ${coinBalance()} монет`;
    $('#archive-chest-image').src = asset('assets/archive-chest.svg');
    $$('[data-nav]').forEach((el) => {
      const active =
        el.dataset.nav === view ||
        (el.dataset.nav === 'scene' &&
          ['prologue', 'future', 'legacy', 'ending', 'shop'].includes(view));
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    const sound = $('#sound-toggle');
    sound.innerHTML = icon(state.sound ? 'sound' : 'mute');
    sound.setAttribute('aria-pressed', String(state.sound));
    sound.setAttribute('aria-label', state.sound ? 'Выключить звук' : 'Включить звук');
    sound.title = state.sound ? 'Выключить звук' : 'Включить звук';
    $('#save-status').textContent = storageOK
      ? 'Прогресс сохраняется в этом браузере'
      : 'Сохранение недоступно · можно пройти игру в этой вкладке';
  }
  function timeline() {
    return `<nav class="timeline-strip" aria-label="Семь эпох">${ERAS.map((e, i) => `<button class="timeline-step ${isUnlocked(e) ? 'unlocked' : ''} ${isComplete(e.id) ? 'complete' : ''} ${view === 'scene' && state.eraId === e.id ? 'active' : ''}" data-action="era" data-id="${e.id}" ${!isUnlocked(e) ? 'disabled' : ''} aria-label="${esc(SHORT_DATES[i] + ' · ' + SHORT_NAMES[i] + (isComplete(e.id) ? ' · пройдено' : !isUnlocked(e) ? ' · пока недоступно' : ''))}"><small>${pad(i + 1)} ${isComplete(e.id) ? ' / СОХРАНЕНО' : ''}</small><strong>${SHORT_DATES[i]}</strong><span>${SHORT_NAMES[i]}</span></button>`).join('')}</nav>`;
  }
  function renderHome() {
    const hasProgress = state.started;
    return `<div class="page"><section class="landing">${picture('assets/era-factory.webp', 'landing-art', 'Художественная реконструкция кирпичного промышленного двора', 'fetchpriority="high"')}<div class="landing-content"><div class="landing-meta">САНКТ-ПЕТЕРБУРГ · УРАЛЬСКАЯ, 1</div><h1>Вне<br><em>времени</em></h1><p class="landing-subtitle">Одна точка. Семь жизней.</p><p class="landing-copy">У каждого места есть своя память.<br>Иногда ей нужно помочь заговорить.<br>Пройдите семь эпох и соберите её по частям.</p><div class="actions"><button class="button primary" data-action="${hasProgress ? 'continue' : 'start'}">${hasProgress ? 'Продолжить путешествие' : 'Начать путешествие'} ${icon('arrow')}</button>${hasProgress ? '<button class="text-button" data-action="restart">Начать заново</button>' : ''}</div><p class="fine-print">Исторический квест · 7 эпох · 15–25 минут<br>${hasProgress ? `Сохранено ${state.completed.length} из 7 артефактов` : 'Без спешки. Исследуйте в своём ритме.'}</p><div class="landing-coin" aria-hidden="true">${picture('assets/token.svg', '', '')}</div></div><span class="landing-side-label">ИНТЕРАКТИВНАЯ ИСТОРИЯ МЕСТА</span><div class="landing-caption"><strong>1869</strong><span>Начало путешествия</span><div class="image-note">Художественная реконструкция</div></div></section>${timeline()}</div>`;
  }
  function renderPrologue() {
    return `<section class="page prologue"><div class="prologue-visual"><div class="orbit"><span class="orbit-label">ОДНА ТОЧКА · СЕМЬ ЖИЗНЕЙ</span></div><button class="token-button" data-action="portal" aria-label="Коснуться жетона 1869 и открыть первую эпоху">${picture('assets/token.svg', '', 'Символический жетон с цифрами 1869')}</button></div><div><span class="eyebrow"><span class="tiny-line"></span>ПРОЛОГ</span><h1>У времени<br>есть точка входа.</h1>${STORY.intro.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}<div class="actions"><button class="button gold" data-action="portal">Коснуться жетона ${icon('arrow')}</button></div><p class="fine-print">${esc(STORY.intro.fictionNote)}</p></div></section>`;
  }
  function renderDialogue(era) {
    const opening = era.openingDialogue;
    const chosen = dialogueAnsweredThisVisit ? selectedDialogue(era) : null;
    return `<div class="dialogue-identity"><h2>${esc(era.character.name)}</h2><span class="role">${esc(era.character.role)}</span></div><div id="dialogue-response"><p class="dialogue-text" id="dialogue-question">${esc(opening.question)}</p></div><div class="dialogue-choices" data-count="${opening.choices.length}" role="group" aria-labelledby="dialogue-question">${opening.choices.map((choice) => `<button class="dialogue-choice ${chosen?.id === choice.id ? 'current' : ''}" data-action="dialogue" data-id="${choice.id}" aria-pressed="${chosen?.id === choice.id}"><span>${esc(choice.label)}</span><span class="choice-arrow" aria-hidden="true">${icon(chosen?.id === choice.id ? 'check' : 'arrow')}</span></button>`).join('')}</div>`;
  }
  function renderTaskDialogue(era) {
    if (!dialogueAnsweredThisVisit) return '';
    const chosen = selectedDialogue(era);
    if (!chosen) return '';
    return `<div class="dialogue-identity"><h3 id="task-speaker">${esc(era.character.name)}</h3><span class="role">${esc(era.character.role)}</span></div><p class="task-dialogue-text" id="task-npc-response">${esc(chosen.response)}</p>`;
  }
  function renderScene() {
    const era = currentEra();
    const index = ERAS.indexOf(era);
    return SCENE.markup({
      era,
      index,
      shortName: SHORT_NAMES[index],
      asset,
      icon,
      dialogueHTML: renderDialogue(era),
      taskDialogueHTML: renderTaskDialogue(era),
      dialogueAnswered: dialogueAnsweredThisVisit,
      taskStarted: !!state.taskStarted[era.id],
      taskHTML: renderTask(era),
      taskInstruction: taskInstruction(era),
      seen: sceneObservations(era),
      optionalSearch: optionalSearchActive(era),
      complete: isComplete(era.id),
    });
  }
  function taskInstruction(era) {
    if (era.task.type === 'match')
      return era.id === 'factory'
        ? 'Выберите подходящую функцию для каждого пространства, затем проверьте четыре пары.'
        : 'Для каждого элемента прошлого выберите современную смысловую пару, затем проверьте ответы.';
    if (era.task.type === 'explore')
      return 'Осмотрите все предметы в локации. Затем откроется итог находок: прочитайте описания и нажмите «Дальше», чтобы получить награду.';
    return era.task.instruction;
  }
  function objectIcon(id) {
    return id.includes('net')
      ? 'net'
      : id.includes('boat')
        ? 'boat'
        : id.includes('field')
          ? 'field'
          : id.includes('mount')
            ? 'mount'
            : id.includes('plate')
              ? 'plate'
              : 'brick';
  }
  function feedbackHTML() {
    return `<div id="task-feedback" class="task-status ${taskMessageKind}" role="status" aria-live="polite">${esc(taskMessage)}</div>${showHint ? `<div class="hint-box"><strong>Подсказка.</strong> ${esc(currentEra().task.hint)}</div>` : ''}`;
  }
  function renderTask(era) {
    if (isComplete(era.id))
      return `${era.task.type === 'order' ? `<div class="letter-preview completed-letter"><span class="eyebrow">ХУДОЖЕСТВЕННОЕ ПИСЬМО · НЕ АРХИВНЫЙ ДОКУМЕНТ</span>${esc(fullLetter())}</div>` : ''}<div class="completion-inline">${artifactIcon(era)}<div><span class="eyebrow">${pad(ERAS.indexOf(era) + 1)} / 07 · В ВАШЕМ АРХИВЕ</span><h3>${esc(era.artifact.name)}</h3><p>${esc(era.artifact.description)}</p><div class="actions">${era.task.type !== 'explore' ? `<button class="button secondary small" data-action="era-artifacts">Посмотреть артефакты эпохи ${icon('book')}</button>` : ''}<button class="button gold small" data-action="next">Награда и продолжение ${icon('arrow')}</button><button class="text-button" data-action="archive">Мой архив</button></div></div></div>`;
    const t = era.task,
      s = taskState(era);
    let html = '';
    if (t.type === 'explore') {
      const found = s.found || [];
      const foundCount = t.objects.filter((item) => found.includes(item.id)).length;
      html = `<p class="explore-scene-note">Предметы находятся в самой сцене. Нажмите «Осмотреться» или выберите название, чтобы найти предмет.</p><button class="button secondary small explore-scene-button" data-action="look">Осмотреться ${icon('pin')}</button><div class="explore-checklist">${t.objects.map((o) => `<button class="object-button ${found.includes(o.id) ? 'found' : ''}" data-action="explore" data-id="${o.id}" aria-pressed="${found.includes(o.id)}">${icon(objectIcon(o.id))}<span class="object-name">${esc(o.label)}</span><span class="object-state">${found.includes(o.id) ? '✓' : '↗'}</span></button>`).join('')}</div><div class="actions"><button class="button gold small" data-action="check" ${!allExploreObjectsFound(era) ? 'disabled' : ''}>Все находки ${icon('arrow')}</button><span class="fine-print">Исследовано ${foundCount} из ${t.objects.length}</span><button class="text-button" data-action="hint">Подсказка</button></div>`;
    }
    if (t.type === 'quiz') {
      html = `<div class="quiz-options" role="group" aria-label="Варианты ответа">${t.options.map((o, i) => `<button class="quiz-option ${s.selected === o.id ? 'selected' : ''}" data-action="quiz" data-id="${o.id}" aria-pressed="${s.selected === o.id}"><span class="option-letter">${String.fromCharCode(65 + i)}</span><span>${esc(o.label)}</span></button>`).join('')}</div><div class="actions"><button class="button gold small" data-action="check">Проверить ответ ${icon('arrow')}</button><button class="text-button" data-action="hint">Подсказка</button></div>`;
    }
    if (t.type === 'match') {
      const options = [...t.pairs.slice(2), ...t.pairs.slice(0, 2)];
      html = `<div class="match-table">${t.pairs.map((p, i) => `<div class="match-row ${s.answers?.[p.id] === p.id && s.verified?.includes(p.id) ? 'is-correct' : ''}"><label class="match-left" for="pair-${p.id}"><span class="row-number">${pad(i + 1)}</span><span>${esc(p.left)}</span></label><span class="match-arrow" aria-hidden="true">→</span><select id="pair-${p.id}" data-pair="${p.id}" aria-label="${esc(p.left)} — выбрать пару"><option value="">Выберите пару</option>${options.map((o) => `<option value="${o.id}" ${s.answers?.[p.id] === o.id ? 'selected' : ''}>${esc(o.right)}</option>`).join('')}</select></div>`).join('')}</div><div class="actions"><button class="button gold small" data-action="check">Проверить пары ${icon('arrow')}</button><button class="text-button" data-action="hint">Подсказка</button></div>`;
    }
    if (t.type === 'order') {
      const order = s.order || [];
      const text = order.map((id) => t.fragments.find((f) => f.id === id)?.text || '').join(' ');
      html = `<div class="letter-fragments" role="group" aria-label="Фрагменты письма">${t.fragments.map((f) => `<button class="letter-fragment ${order.includes(f.id) ? 'selected' : ''}" data-action="fragment" data-id="${f.id}" aria-pressed="${order.includes(f.id)}" aria-label="${esc(f.text)}${order.includes(f.id) ? '. Позиция ' + (order.indexOf(f.id) + 1) + '. Нажмите, чтобы убрать.' : ''}"><span class="fragment-number">${order.includes(f.id) ? order.indexOf(f.id) + 1 : '+'}</span><p>${esc(f.text)}</p></button>`).join('')}</div>${text ? `<div class="letter-preview"><span class="eyebrow">ВАШЕ ПИСЬМО · ${order.length} / 3 ФРАГМЕНТА</span>${esc(text)}</div>` : ''}<div class="actions"><button class="button gold small" data-action="check">Прочитать письмо ${icon('arrow')}</button><button class="text-button" data-action="clear-order">Собрать заново</button><button class="text-button" data-action="hint">Подсказка</button></div>`;
    }
    const bonusAvailable = !(state.attempts[era.id] > 0);
    const bonusNote = bonusAvailable
      ? `${REWARD_COINS[era.id]} монет за верное выполнение с первой попытки.`
      : 'Бонус за первую попытку уже недоступен. Артефакт можно сохранить после верного ответа.';
    return (
      html +
      feedbackHTML() +
      `<p class="task-reward-note ${bonusAvailable ? 'available' : ''}">${icon('coin')}<span>${bonusNote}</span></p>`
    );
  }
  function fullLetter() {
    const t = ERAS.find((e) => e.id === 'war').task;
    return t.correct.map((id) => t.fragments.find((f) => f.id === id).text).join(' ');
  }
  function renderMap() {
    return `<section class="page collection-page"><div class="collection-heading"><div><span class="eyebrow"><span class="tiny-line"></span>СЕМЬ СЛЕДОВ ПАМЯТИ</span><h1>Карта эпох</h1></div><p>У каждой эпохи свой голос.<br>Сохраняйте артефакты, чтобы открыть следующую. В пройденные главы можно вернуться.</p></div><div class="map-list">${ERAS.map((e, i) => `<article class="map-row ${!isUnlocked(e) ? 'locked' : ''}"><span class="map-number">${pad(i + 1)}</span>${picture(e.image, 'map-thumb', `${SHORT_NAMES[i]} — художественная реконструкция`, 'loading="lazy"')}<div><p class="map-date">${esc(e.date)}${e.main ? ' · ОСНОВНАЯ ГЛАВА' : ''}</p><h2>${esc(e.title)}</h2><p>${esc(e.subtitle)}</p></div>${isUnlocked(e) ? `<button class="button secondary small" data-action="era" data-id="${e.id}">${isComplete(e.id) ? 'Вернуться' : 'Исследовать'} ${icon('arrow')}</button>` : `<span class="map-status">${icon('lock')} После эпохи ${pad(i)}</span>`}</article>`).join('')}</div>${state.completed.length === 7 ? '<div class="actions" style="margin-top:25px"><button class="button gold" data-action="future">Создать будущее →</button></div>' : ''}</section>`;
  }
  function renderArchive() {
    const ledger = ERAS.map((era, i) => {
      const earned = state.coinAwards[era.id] || 0;
      const recorded = Object.prototype.hasOwnProperty.call(state.coinAwards, era.id);
      const status = !isComplete(era.id)
        ? `${REWARD_COINS[era.id]} монет за первую попытку`
        : earned
          ? `+${earned} монет · с первой попытки`
          : recorded
            ? '0 монет · без бонуса за первую попытку'
            : 'Пройдено до появления монет';
      return `<li class="${earned ? 'wallet-earned' : ''}"><span class="wallet-era">${pad(i + 1)} · ${esc(SHORT_NAMES[i])}</span><span>${status}</span></li>`;
    }).join('');
    return `<section class="page collection-page"><div class="collection-heading"><div><span class="eyebrow"><span class="tiny-line"></span>ЛИЧНАЯ КОЛЛЕКЦИЯ ПАМЯТИ</span><h1>Мой архив</h1></div><div class="archive-intro"><div class="archive-progress">${pad(state.completed.length)}<small> / 07</small></div><p>Это не просто предметы.<br>За каждым — люди и история,<br>которую вы помогли сохранить.</p></div></div>
      <section class="archive-wallet" aria-labelledby="wallet-title"><div class="wallet-summary"><div class="wallet-balance">${icon('coin')}<strong id="archive-wallet-balance">${coinBalance()}</strong><span>игровых монет<br>в сундуке</span></div><div><h2 id="wallet-title">Награда за внимательность</h2><p>Выполняйте задания верно с первой попытки и собирайте монеты. За семь эпох можно получить 50 монет. Подсказки и изменение ответа до проверки не расходуют попытку.</p><p class="wallet-spending">Заработано: ${coinsEarned()} · потрачено: ${coinsSpent()} · покупок: ${state.purchases.length}.</p>${shopUnlocked() ? `<button class="text-button" data-action="shop">Развитие персонажа и бонусы ${icon('arrow')}</button>` : '<p class="wallet-spending">Потратить монеты можно в мастерской после завершения путешествия.</p>'}</div></div><details class="wallet-details"><summary>Монеты по эпохам</summary><ul class="wallet-ledger">${ledger}</ul></details></section>
      <div class="archive-grid">${ERAS.map((e, i) => `<button class="artifact-card ${isComplete(e.id) ? 'collected' : 'locked'}" data-action="artifact" data-id="${e.id}" ${!isComplete(e.id) ? 'disabled' : ''}><span class="card-number">${pad(i + 1)} / 07</span>${artifactIcon(e)}<h2>${isComplete(e.id) ? esc(e.artifact.name) : 'Неизвестный артефакт'}</h2><p>${isComplete(e.id) ? esc(e.artifact.description) : 'Ждёт вас в эпохе «' + esc(SHORT_NAMES[i]) + '».'}</p><span class="artifact-tag">${isComplete(e.id) ? esc(e.date) + ' · ОТКРЫТЬ ↗' : 'ЕЩЁ НЕ НАЙДЕН'}</span></button>`).join('')}</div><p class="archive-note">Все артефакты придуманы для игры. Исторические справки и их источники доступны в каждой эпохе и в разделе «Об игре и источниках».</p><div class="archive-cta"><button class="button primary" data-action="continue">${state.started ? 'Продолжить путешествие' : 'Начать путешествие'} ${icon('arrow')}</button><button class="text-button" data-action="restart">${icon('reset')} Начать заново</button></div></section>`;
  }
  function futureArtwork(id) {
    const base =
      '<path d="M12 200h340M35 200v-90h48v90m10 0V65h74v135m28 0V85h80v115m17 0v-90h45v90"/><path d="M105 78h10m10 0h10m10 0h10M105 96h10m10 0h10m10 0h10M207 99h10m10 0h10m10 0h10"/>';
    const variants = {
      science:
        '<ellipse cx="185" cy="140" rx="69" ry="24" transform="rotate(-35 185 140)"/><ellipse cx="185" cy="140" rx="69" ry="24" transform="rotate(35 185 140)"/><ellipse cx="185" cy="140" rx="69" ry="24" transform="rotate(90 185 140)"/><circle cx="185" cy="140" r="5" fill="currentColor"/>',
      art: '<path d="m125 192 28-87 39 38 31-79 39 128Z"/><path d="m125 192 67-49 70 49m-109-87 39 38 31-79m-31 79v49"/><circle cx="230" cy="56" r="14"/>',
      green:
        '<path d="M62 200v-52m0 16-21-18m21 9 20-24M147 200v-50m0 17-21-18m21 8 20-22M251 200v-62m0 22-26-21m26 7 23-22"/><ellipse cx="60" cy="126" rx="29" ry="37"/><ellipse cx="147" cy="128" rx="32" ry="40"/><ellipse cx="251" cy="114" rx="38" ry="47"/><path d="M110 200c21-32 70-26 87-60"/>',
      public:
        '<path d="M115 171h75m-75 6h75m-68-6v24m61-24v24M215 144h61v48h-61zM245 144v48M227 154h10m16 0h10m-36 11h10m16 0h10"/><circle cx="80" cy="150" r="7"/><path d="M80 158v23m0-16-12 12m12-12 12 12m-12 4-8 18m8-18 8 18"/><circle cx="307" cy="148" r="7"/><path d="M307 155v25m0-15-12 13m12-13 12 13m-12 2-8 19m8-19 8 19"/>',
    };
    return `<svg viewBox="0 0 360 230" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g opacity=".26">${base}</g>${variants[id] || variants.public}</svg>`;
  }
  function futureImage(id) {
    return `assets/future-${id}.webp`;
  }
  function renderFuture() {
    const selected = STORY.futures.find((f) => f.id === state.futureChoice),
      f = selected || STORY.futures[0];
    return `<section class="page future-page"><div class="future-header"><div><span class="eyebrow"><span class="tiny-line"></span>2126 · ЭПОХА, КОТОРУЮ ВЫ СОЗДАЁТЕ</span><h1>Что будет здесь<br>после нас?</h1></div><p>Вы собрали семь следов памяти.<br>Теперь выберите, как место будет жить дальше. Здесь нет неправильного ответа.</p></div><div class="future-showcase" data-future="${f.id}">${picture(futureImage(f.id), 'future-image', 'Художественная концепция: ' + f.title)}<div class="future-showcase-content"><span class="eyebrow">${selected ? 'ВАША ВЕРСИЯ БУДУЩЕГО' : 'ПРЕДСТАВЬТЕ ОДИН ИЗ ВАРИАНТОВ'}</span><h2>${esc(f.title)}</h2><p>${esc(f.detail)}</p></div><div class="image-note">Художественная концепция · не реальный проект развития</div></div><div class="future-choices" role="group" aria-label="Выберите будущее">${STORY.futures.map((x, i) => `<button class="future-choice ${state.futureChoice === x.id ? 'selected' : ''}" data-action="select-future" data-id="${x.id}" aria-pressed="${state.futureChoice === x.id}"><span class="future-choice-number">${pad(i + 1)}</span><span>${esc(x.title)}</span></button>`).join('')}</div><div class="future-next"><p>Каждый выбор сохраняет исторические стены и добавляет новое назначение. Выберите близкую вам идею.</p><button class="button gold" data-action="legacy" ${!state.futureChoice ? 'disabled' : ''}><span>Выбрать послание для будущих поколений</span> ${icon('arrow')}</button></div></section>`;
  }
  function renderLegacy() {
    return `<section class="page legacy-panel"><span class="eyebrow"><span class="tiny-line"></span>ПОСЛЕДНЯЯ СТРАНИЦА ВАШЕГО АРХИВА</span><h1>Что вы оставите тем,<br>кто придёт после вас?</h1><p class="legacy-intro">Здания могут пережить человека. Слова тоже.<br>Выберите послание следующему поколению.</p><div class="quiz-options" role="group" aria-label="Послание будущему">${STORY.legacies.map((l, i) => `<button class="quiz-option ${state.legacyChoice === l.id ? 'selected' : ''}" data-action="select-legacy" data-id="${l.id}" aria-pressed="${state.legacyChoice === l.id}"><span class="option-letter">${pad(i + 1)}</span><span>${esc(l.text)}</span></button>`).join('')}</div><div class="actions"><button class="button gold" data-action="finish" ${!state.legacyChoice ? 'disabled' : ''}>Сохранить в памяти места ${icon('arrow')}</button><button class="text-button" data-action="future">${icon('back')} К выбору будущего</button></div></section>`;
  }
  function renderEnding() {
    const f = STORY.futures.find((x) => x.id === state.futureChoice) || STORY.futures[0],
      l = STORY.legacies.find((x) => x.id === state.legacyChoice) || STORY.legacies[2];
    return `<section class="page ending-page"><div class="ending-scene">${picture(futureImage(f.id), '', 'Художественное будущее: ' + f.title)}<div class="ending-content"><span class="eyebrow">ПУТЕШЕСТВИЕ ЗАВЕРШЕНО · 07 / 07</span><h1>Семь эпох.<br>Одна точка.</h1><p>Менялись стены, технологии и люди. Но история продолжается — пока кто-то помнит и создаёт новое.</p><div class="ending-artifacts" aria-label="Все семь артефактов собраны">${ERAS.map(artifactIcon).join('')}</div><div class="ending-message">«${esc(l.text)}»</div><div class="actions"><button class="button gold" data-action="shop">Потратить монеты ${icon('coin')}</button><button class="button secondary" data-action="archive">Открыть мой архив ${icon('book')}</button><button class="button secondary" data-action="map">Карта эпох ${icon('arrow')}</button></div></div></div><section class="ending-shop-teaser"><div>${icon('coin')}<strong>${coinBalance()}</strong><span>монет в сундуке</span></div><p>Развивайте своего путешественника и выбирайте скидки и бонусы сервисов в финальной мастерской.</p><button class="button gold" data-action="shop">Открыть мастерскую ${icon('arrow')}</button></section><div class="ending-bottom"><div><span class="eyebrow">ВАШЕ БУДУЩЕЕ · 2126</span><h2>${esc(f.title)}</h2><p>${esc(f.description)}</p><button class="text-button" data-action="future">Представить другой вариант ↗</button></div><div><span class="eyebrow">ИСТОРИЯ ПРОДОЛЖАЕТСЯ</span><h2>Память — это действие.</h2><p>${storageOK ? 'Ваше послание и семь артефактов сохранены в этом браузере. В любой момент можно вернуться к разговору или пройти путь заново.' : 'Ваше послание и семь артефактов доступны в открытой вкладке. Браузер запретил сохранение: после её закрытия прогресс может потеряться.'}</p><p class="ending-note">Визуализация будущего — художественная фантазия.</p><button class="text-button" data-action="restart">Начать заново</button></div></div></section>`;
  }
  function playerRank() {
    const level = playerLevel();
    return level >= 7
      ? 'Хранитель памяти'
      : level >= 4
        ? 'Знаток эпох'
        : level >= 2
          ? 'Исследователь'
          : 'Путешественник';
  }
  function playerAvatar() {
    const observation = skillLevel('observation');
    const knowledge = skillLevel('knowledge');
    const care = skillLevel('care');
    return `<svg class="player-avatar" viewBox="0 0 240 270" role="img" aria-label="Путешественник, уровень ${playerLevel()}. ${observation ? 'С компасом. ' : ''}${knowledge ? 'С книгой памяти. ' : ''}${care ? 'Со знаком заботы.' : ''}"><circle cx="120" cy="126" r="105" fill="#292d2c" stroke="#b99a6260"/><circle cx="120" cy="126" r="94" fill="none" stroke="#b99a6228" stroke-dasharray="2 9"/><path d="M37 256c3-62 15-102 51-113h64c36 11 48 51 51 113Z" fill="#435550" stroke="#bda57b" stroke-width="2"/><path d="m88 143 32 39 32-39 18 113H70Z" fill="#536660"/><path d="M83 145c-9-14-17-24-17-51 0-43 24-64 54-64s54 21 54 64c0 27-8 37-17 51l-37 22Z" fill="#374541" stroke="#c7ad7b" stroke-width="2"/><path d="M87 91c0-28 13-41 33-41s33 13 33 41v15c0 29-14 46-33 46s-33-17-33-46Z" fill="#d1ac8c"/><path d="M84 96c-1-31 8-50 35-50 28 0 39 21 36 48-14-6-18-19-24-26-8 16-26 22-47 28Z" fill="#5c483c"/><path d="M98 103h10m24 0h10m-24 5-3 14h8m-13 11c7 4 13 4 20 0" fill="none" stroke="#695046" stroke-width="2" stroke-linecap="round"/><path d="m85 144 35 38-27 18-22-39m84-17-35 38 27 18 22-39M120 182v74" fill="none" stroke="#c5ad82" stroke-width="2"/><path d="m55 181-8 65m138-65 8 65" stroke="#243e39" stroke-width="3"/>${observation ? `<g class="avatar-compass" data-level="${observation}"><path d="m120 167 17 35" stroke="#d8b76f" stroke-width="2"/><circle cx="139" cy="211" r="15" fill="#c9a65e" stroke="#ffe6a4" stroke-width="2"/>${observation >= 2 ? '<circle cx="139" cy="211" r="11" fill="none" stroke="#70532e"/>' : ''}<path d="m139 201 4 10-4 10-4-10Z" fill="#725036"/>${observation >= 3 ? '<path d="m139 191 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1Z" fill="#ffe6a4"/>' : ''}</g>` : ''}${knowledge ? `<g class="avatar-book" data-level="${knowledge}"><path d="m52 214 38-9 17 49-41 9Z" fill="#764c3e" stroke="#edcf96" stroke-width="2"/><path d="m61 215 13 44m-9-35 27-6m-25 13 27-6" stroke="#dabb86"/>${knowledge >= 2 ? '<path d="m79 208 4 15 4-5 5 3-4-15" fill="#ddbc77"/>' : ''}${knowledge >= 3 ? '<path d="m88 232 3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1Z" fill="#f8dfaa"/>' : ''}</g>` : ''}${care ? `<g class="avatar-care" data-level="${care}"><path d="M91 193s-13-8-13-16a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 8-13 16-13 16Z" fill="#d6c190" stroke="#fff0c8"/>${care >= 2 ? '<path d="M74 169c-11 14-5 27 13 31m21-31c11 14 5 27-13 31" fill="none" stroke="#98baa0" stroke-width="3"/>' : ''}${care >= 3 ? '<circle cx="91" cy="183" r="24" fill="none" stroke="#e6c77c"/>' : ''}</g>` : ''}${owns('badge-good-deeds') ? '<g class="avatar-good-deeds"><circle cx="175" cy="230" r="16" fill="#b2d5ad" stroke="#e5efd6"/><path d="m175 219 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="#3e6550"/></g>' : ''}</svg>`;
  }
  function renderUpgradeCard(skill) {
    const level = skillLevel(skill.id);
    const next = skill.steps[level];
    const current = skill.steps[level - 1];
    return `<article class="upgrade-card" data-skill="${skill.id}"><div class="upgrade-heading"><span class="upgrade-icon">${icon(skill.icon)}</span><div><h3>${esc(skill.name)}</h3><span class="skill-level" data-skill="${skill.id}" data-level="${level}">Уровень ${level} / 3</span></div><div class="skill-pips" aria-hidden="true">${[1, 2, 3].map((n) => `<i class="${n <= level ? 'filled' : ''}"></i>`).join('')}</div></div><p>${esc(skill.description)}</p><div class="upgrade-next"><span>${next ? 'СЛЕДУЮЩЕЕ УЛУЧШЕНИЕ' : 'НАВЫК РАЗВИТ'}</span><strong>${esc((next || current).title)}</strong><p>${esc((next || current).effect)}</p></div>${next ? `<button class="button gold" data-action="buy" data-id="${next.id}" ${coinBalance() < next.cost ? 'disabled' : ''}>Улучшить · ${next.cost} ${icon('coin')}</button>${coinBalance() < next.cost ? `<span class="shop-shortfall">Не хватает ${next.cost - coinBalance()} монет</span>` : ''}` : `<button class="button secondary" data-action="purchase" data-id="${current.id}">Открыть запись ${icon('book')}</button>`}</article>`;
  }
  function renderServiceReward(item) {
    const sponsor = sponsorForEra(item.eraId);
    const owned = owns(item.id);
    const demo = item.kind === 'demo-coupon';
    return `<article class="service-reward-card ${owned ? 'owned' : ''}" data-id="${item.id}"><div class="sponsor-brand">${sponsorLogo(sponsor)}<h3>${esc(sponsor.name)}</h3></div><div class="service-reward-value"><span>${demo ? 'ДЕМО-КУПОН' : 'НАГРАДА ПЕРСОНАЖА'}</span><strong>${esc(item.value)}</strong></div><h4>${esc(item.title)}</h4><p>${esc(item.description)}</p><p class="service-reward-notice">${esc(item.notice)}</p><div class="service-reward-bottom">${owned ? `<span class="shop-owned">${icon('check')} Получено</span><button class="button secondary" data-action="purchase" data-id="${item.id}">Посмотреть ${icon('arrow')}</button>` : `<button class="button gold" data-action="buy" data-id="${item.id}" ${coinBalance() < item.cost ? 'disabled' : ''}>${demo ? 'Обменять' : 'Получить знак'} · ${item.cost} ${icon('coin')}</button>${coinBalance() < item.cost ? `<span class="shop-shortfall">Не хватает ${item.cost - coinBalance()} монет</span>` : ''}`}</div></article>`;
  }
  function renderShop() {
    const memories = state.purchases.map(shopItem).filter((item) => item.kind === 'upgrade');
    const servicePurchases = SHOP.rewards.filter((item) => owns(item.id));
    return `<section class="page reward-shop"><header class="shop-header"><div><span class="eyebrow">СЕМЬ ЭПОХ ПОЗАДИ · ВАШ ПУТЬ ПРОДОЛЖАЕТСЯ</span><h1>${esc(SHOP.title)}</h1><p>Развивайте своего персонажа и выбирайте бонусы за заработанные монеты.</p></div><div class="shop-wallet" aria-label="Доступный баланс"><span>В ВАШЕМ СУНДУКЕ</span><div>${icon('coin')}<strong id="shop-balance">${coinBalance()}</strong></div><small>Заработано ${coinsEarned()} · потрачено ${coinsSpent()}</small></div></header><nav class="shop-section-links" aria-label="Разделы мастерской"><a href="#character-development">Развитие персонажа</a><a href="#service-rewards">Скидки и бонусы</a><button class="text-button" data-action="ending">${icon('back')} К финалу</button></nav><section id="character-development" class="character-development" aria-labelledby="development-title"><div class="shop-section-heading"><span class="eyebrow">01 · ВАШ ПЕРСОНАЖ</span><h2 id="development-title">Станьте хранителем памяти</h2><p>У каждого навыка три ступени за 5, 10 и 15 монет. Новая ступень меняет снаряжение персонажа и открывает запись в его личном дневнике.</p></div><div class="character-workshop"><aside class="player-profile" aria-label="Профиль путешественника">${playerAvatar()}<span class="eyebrow">${esc(playerRank())}</span><h3>Путешественник</h3><p class="player-level">Уровень <strong id="player-level">${playerLevel()}</strong></p><div class="player-equipment">${SHOP.upgrades
      .map((skill) => {
        const n = skillLevel(skill.id);
        return `<span class="${n ? 'equipped' : ''}">${icon(skill.icon)}${esc(n ? skill.steps[n - 1].title : skill.name)}</span>`;
      })
      .join(
        '',
      )}${owns('badge-good-deeds') ? `<span class="equipped good-deeds-badge">${icon('star')} Хранитель добрых дел</span>` : ''}</div><p class="profile-note">Улучшения развивают профиль и образ вашего героя. Уже собранные артефакты остаются в архиве.</p></aside><div class="upgrade-grid">${SHOP.upgrades.map(renderUpgradeCard).join('')}</div></div>${memories.length ? `<details class="player-memories"><summary>Личный дневник · открыто записей: ${memories.length}</summary><div>${memories.map((item) => `<button class="memory-entry" data-action="purchase" data-id="${item.id}"><span>${esc(item.skillName)} · ${item.level}</span><strong>${esc(item.title)}</strong>${icon('arrow')}</button>`).join('')}</div></details>` : ''}</section><section id="service-rewards" class="service-rewards" aria-labelledby="services-title"><div class="shop-section-heading"><span class="eyebrow">02 · СКИДКИ И БОНУСЫ СЕРВИСОВ</span><h2 id="services-title">Выберите свою награду</h2><p>Сохранённые купоны и знаки остаются в этой мастерской. Получено: ${servicePurchases.length} из ${SHOP.rewards.length}.</p></div><p class="shop-demo-notice">${icon('info')}<span>${esc(SHOP.notice)}</span></p><div class="service-reward-grid">${SHOP.rewards.map(renderServiceReward).join('')}</div></section><div class="shop-footer"><button class="button secondary" data-action="archive">Открыть сундук ${icon('book')}</button><button class="text-button" data-action="ending">Вернуться к финалу ${icon('arrow')}</button></div></section>`;
  }
  function canBuy(item) {
    return (
      !!item &&
      shopUnlocked() &&
      !owns(item.id) &&
      (!item.requires || owns(item.requires)) &&
      coinBalance() >= item.cost
    );
  }
  function confirmShopPurchase(id) {
    const item = shopItem(id);
    if (view !== 'shop' || !canBuy(item)) return;
    const note = item.kind === 'upgrade' ? item.effect : item.notice;
    openModal(
      `<div class="modal-inner shop-confirm" data-item-id="${item.id}"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button><span class="eyebrow">ОБМЕН ИГРОВЫХ МОНЕТ</span><h2 id="modal-title">${esc(item.title)}</h2><p>${esc(item.kind === 'upgrade' ? `${item.skillName}: уровень ${item.level}.` : item.description)}</p><p class="${item.kind === 'demo-coupon' ? 'shop-demo-notice' : 'purchase-effect'}">${esc(note)}</p><div class="purchase-cost"><span>Стоимость</span><strong>${item.cost} ${icon('coin')}</strong><span>Останется в сундуке</span><strong>${coinBalance() - item.cost}</strong></div><div class="actions"><button class="button gold" data-action="confirm-buy" data-id="${item.id}">Подтвердить · ${item.cost} ${icon('coin')}</button><button class="button secondary" data-action="close">Отмена</button></div></div>`,
    );
  }
  function purchaseReceipt(id) {
    const item = shopItem(id);
    if (!item || !owns(id) || !shopUnlocked()) return;
    const sponsor = item.eraId ? sponsorForEra(item.eraId) : null;
    openModal(
      `<div class="modal-inner purchase-receipt" data-item-id="${item.id}"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button><span class="eyebrow">${item.kind === 'upgrade' ? 'УЛУЧШЕНИЕ ОТКРЫТО' : item.kind === 'badge' ? 'ЗНАК ПОЛУЧЕН' : 'ДЕМО-КУПОН СОХРАНЁН'}</span><h2 id="modal-title">${esc(item.title)}</h2>${sponsor ? `<div class="sponsor-brand">${sponsorLogo(sponsor)}<h3>${esc(sponsor.name)}</h3></div>` : ''}${item.kind === 'upgrade' ? `<p>${esc(item.effect)}</p><div class="memory-note"><span class="eyebrow">ЛИЧНЫЙ ДНЕВНИК · ИГРОВОЙ ТЕКСТ</span><p>${esc(item.memory)}</p></div><p>Уровень персонажа: <strong>${playerLevel()}</strong>. ${esc(item.skillName)}: ${skillLevel(item.skillId)} / 3.</p>` : `<div class="receipt-value">${esc(item.value)}</div><p>${esc(item.description)}</p><p class="${item.kind === 'demo-coupon' ? 'shop-demo-notice' : 'purchase-effect'}">${esc(item.notice)}</p>`}<p class="purchase-balance">Потрачено на эту награду: ${item.cost} монет. В сундуке осталось: <strong>${coinBalance()}</strong>.</p><div class="actions"><button class="button gold" data-action="close">Продолжить выбор ${icon('arrow')}</button>${sponsor ? `<a class="text-button" href="${esc(sponsor.url)}" target="_blank" rel="noopener noreferrer">Сайт ${esc(sponsor.name)} ↗</a>` : ''}</div></div>`,
    );
  }
  function buyShopItem(id) {
    const item = shopItem(id);
    if (view !== 'shop' || !canBuy(item) || $('.shop-confirm', modal)?.dataset.itemId !== id)
      return;
    const scroll = window.scrollY;
    state.purchases.push(id);
    save();
    render(false);
    window.scrollTo({ top: scroll, behavior: 'instant' });
    modalOpener =
      $(`[data-action="purchase"][data-id="${id}"]`, app) ||
      $(`[data-skill="${item.skillId}"] .button`, app) ||
      $('h1', app);
    play('choice');
    purchaseReceipt(id);
    announce(`${item.title}. Потрачено ${item.cost} монет. Осталось ${coinBalance()}.`);
  }
  function render(focus = false) {
    const views = {
      home: renderHome,
      prologue: renderPrologue,
      scene: renderScene,
      map: renderMap,
      archive: renderArchive,
      future: renderFuture,
      legacy: renderLegacy,
      ending: renderEnding,
      shop: renderShop,
    };
    SCENE.unmount();
    app.innerHTML = (views[view] || renderHome)();
    document.body.dataset.view = view;
    updateChrome();
    if (view === 'scene') SCENE.mount();
    if (focus) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const title = $('h1', app);
      if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus({ preventScroll: true });
      }
    }
    preloadNext();
  }
  function preloadNext() {
    if (view !== 'scene') return;
    const next = ERAS[ERAS.indexOf(currentEra()) + 1];
    if (next) {
      const img = new Image();
      img.src = asset(next.image);
    }
  }
  function navigate(to) {
    if (['future', 'legacy', 'ending', 'shop'].includes(to) && state.completed.length < 7) {
      toast('Сначала соберите семь артефактов.');
      return;
    }
    if (to === 'shop' && !shopUnlocked()) {
      toast('Завершите путешествие и сохраните послание, чтобы открыть мастерскую.');
      return;
    }
    if (to === 'legacy' && !state.futureChoice) {
      to = 'future';
    }
    if (to === 'ending' && !state.finished) {
      to = 'future';
    }
    if (to === 'scene') {
      dialogueAnsweredThisVisit = false;
      SCENE.reset();
    }
    activeArtifactSearchEra = null;
    view = to;
    if (['prologue', 'scene', 'future', 'legacy', 'ending', 'shop'].includes(to))
      state.lastPlayable = to;
    save();
    render(true);
  }
  function start() {
    state.started = true;
    state.lastPlayable = 'prologue';
    navigate('prologue');
  }
  function continueGame() {
    if (!state.started) {
      start();
      return;
    }
    navigate(state.lastPlayable || 'scene');
  }
  function enterEra(id) {
    const era = ERAS.find((e) => e.id === id);
    if (!era || !isUnlocked(era)) return;
    state.started = true;
    state.eraId = id;
    taskMessage = '';
    taskMessageKind = '';
    showHint = false;
    selectedObject = null;
    navigate('scene');
  }
  function requireDialogue(focus = true) {
    if (view !== 'scene') return false;
    if (dialogueAnsweredThisVisit) return true;
    SCENE.setMode('talk', { focus });
    const message = 'Сначала выберите ответ персонажу — затем откроется задание.';
    toast(message);
    announce(message);
    return false;
  }
  function openTask(focus = true, { includeDialogueReply = false } = {}) {
    if (!requireDialogue(focus)) return;
    state.taskStarted[currentEra().id] = true;
    save();
    SCENE.sync({ dialogueAnswered: true, taskStarted: true });
    SCENE.setMode('task', { focus });
    if (allExploreObjectsFound(currentEra())) showExploreSummary({ includeDialogueReply });
  }
  function updateTask(focusSelector) {
    const y = window.scrollY;
    $('#task-body').innerHTML = renderTask(currentEra());
    if (focusSelector) {
      const el = $(focusSelector);
      el?.focus({ preventScroll: true });
    }
    // Кнопки не должны уводить пользователя к началу страницы.
    if (window.scrollY !== y) window.scrollTo({ top: y, behavior: 'instant' });
  }
  function inspectObject(id, focus = false) {
    if (view !== 'scene') return;
    const era = currentEra();
    const object = SCENE_OBJECTS[era.id].objects.find((o) => o.id === id);
    if (!object) return;
    const hadAllObjects = allExploreObjectsFound(era);
    const optionalSearch = optionalSearchActive(era) && dialogueAnsweredThisVisit;
    const hadAllOptionalObjects = allOptionalObjectsFound(era);
    state.inspected[era.id] ||= [];
    if (!state.inspected[era.id].includes(id)) state.inspected[era.id].push(id);
    if (era.task.type === 'explore' && era.task.objects.some((item) => item.id === id)) {
      const task = taskState(era);
      task.found ||= [];
      if (!task.found.includes(id)) task.found.push(id);
    }
    if (optionalSearch) {
      const search = state.artifactSearch[era.id];
      if (!search.found.includes(id)) search.found.push(id);
    }
    selectedObject = id;
    taskMessage = '';
    taskMessageKind = '';
    save();
    play('choice');
    updateTask();
    SCENE.inspect(id, { focus, seen: sceneObservations(era) });
    announce(`${object.name}. ${object.description}`);
    if (!hadAllObjects && allExploreObjectsFound(era)) showExploreSummary();
    if (optionalSearch && !hadAllOptionalObjects && allOptionalObjectsFound(era))
      showEraArtifacts();
  }
  function showExploreSummary({ includeDialogueReply = false } = {}) {
    const era = currentEra();
    if (
      view !== 'scene' ||
      !dialogueAnsweredThisVisit ||
      isComplete(era.id) ||
      !allExploreObjectsFound(era)
    )
      return false;
    if (modal.open && $('.explore-summary-modal', modal)?.dataset.eraId === era.id) return true;
    const objects = era.task.objects.map((item) =>
      SCENE_OBJECTS[era.id].objects.find((object) => object.id === item.id),
    );
    const reply = includeDialogueReply ? selectedDialogue(era) : null;
    const dialogueCopy = reply
      ? `<div class="explore-summary-response"><strong>${esc(era.character.name)}</strong><p>${esc(reply.response)}</p></div>`
      : '';
    const rewardNote =
      state.attempts[era.id] > 0
        ? 'Артефакт будет сохранён. Бонус за первую попытку уже недоступен.'
        : `За выполнение с первой попытки вы получите ${REWARD_COINS[era.id]} монет.`;
    openModal(
      `<div class="modal-inner explore-summary-modal" data-era-id="${era.id}"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть итог находок">${icon('close')}</button><span class="eyebrow">ВАШИ НАХОДКИ · ${objects.length} ИЗ ${objects.length}</span><h2 id="modal-title">Все предметы найдены</h2><p class="explore-summary-intro">Вы рассмотрели все предметы этой эпохи. Вот что они рассказывают о месте.</p><div class="explore-summary-list" tabindex="0" role="region" aria-label="Описания найденных предметов">${dialogueCopy}${objects.map((object) => `<article class="explore-summary-item" data-object-id="${object.id}"><span class="explore-summary-icon" aria-hidden="true">${icon(object.icon || 'info')}</span><div><h3>${esc(object.name)}</h3><p>${esc(object.description)}</p></div></article>`).join('')}</div><div class="explore-summary-footer"><p>${esc(rewardNote)}</p><button class="button gold" data-action="explore-summary-next">Дальше ${icon('arrow')}</button></div></div>`,
    );
    announce(
      'Все предметы найдены. Прочитайте итог находок и нажмите «Дальше», чтобы получить награду.',
    );
    return true;
  }
  function startArtifactSearch() {
    const era = currentEra();
    if (view !== 'scene' || !isComplete(era.id) || era.task.type === 'explore') return false;
    if (!requireDialogue()) return false;
    if (allOptionalObjectsFound(era)) return showEraArtifacts();
    state.artifactSearch[era.id] ||= { started: true, found: [] };
    activeArtifactSearchEra = era.id;
    selectedObject = null;
    save();
    closeModal();
    SCENE.reset();
    render(false);
    SCENE.setMode('look', { focus: true });
    const count = state.artifactSearch[era.id].found.length;
    toast(`Найдите артефакты эпохи. Найдено ${count} из 3.`);
    announce(
      `Поиск артефактов эпохи. Найдено ${count} из 3. Нажимайте на предметы в локации. После третьей находки откроется общий обзор.`,
    );
    return true;
  }
  function showEraArtifacts() {
    const era = currentEra();
    if (view !== 'scene' || !isComplete(era.id) || era.task.type === 'explore') return false;
    if (!requireDialogue()) return false;
    if (!allOptionalObjectsFound(era)) return false;
    if (modal.open && $('.era-artifacts-modal', modal)?.dataset.eraId === era.id) return true;
    const objects = SCENE_OBJECTS[era.id].objects;
    openModal(
      `<div class="modal-inner explore-summary-modal era-artifacts-modal" data-era-id="${era.id}"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть артефакты эпохи">${icon('close')}</button><span class="eyebrow">АРТЕФАКТЫ ЭПОХИ · ${pad(ERAS.indexOf(era) + 1)} / 07</span><h2 id="modal-title">Все артефакты найдены</h2><p class="explore-summary-intro">${esc(SHORT_NAMES[ERAS.indexOf(era)])}. Вы нашли все три предмета этой эпохи. Прочитайте, что они рассказывают о месте.</p><div class="explore-summary-list" tabindex="0" role="region" aria-label="Описания артефактов эпохи">${objects.map((object) => `<article class="explore-summary-item" data-object-id="${object.id}"><span class="explore-summary-icon" aria-hidden="true">${icon(object.icon || 'info')}</span><div><h3>${esc(object.name)}</h3><p>${esc(object.description)}</p></div></article>`).join('')}</div><div class="explore-summary-footer"><p>Награда за задание уже сохранена в сундуке.</p><button class="button gold" data-action="era-artifacts-next">${era.id === 'future' ? 'Создать будущее' : 'Дальше'} ${icon('arrow')}</button></div></div>`,
    );
    announce('Все три артефакта найдены. Прочитайте общий обзор и продолжите путешествие.');
    return true;
  }
  function setFeedback(message, kind = 'error') {
    taskMessage = message;
    taskMessageKind = kind;
    updateTask('[data-action="check"]');
    announce(message);
  }
  function checkTask({ fromExploreSummary = false } = {}) {
    if (!requireDialogue()) return;
    const era = currentEra(),
      t = era.task,
      s = taskState(era);
    if (isComplete(era.id)) return;
    let correct = true;
    let feedback = '';
    if (t.type === 'explore') {
      if (!allExploreObjectsFound(era)) {
        setFeedback('Осмотрите все предметы этой эпохи.');
        return;
      }
      if (!fromExploreSummary) {
        showExploreSummary();
        return;
      }
    }
    if (t.type === 'quiz') {
      if (!s.selected) {
        setFeedback('Сначала выберите один из ответов.');
        return;
      }
      if (s.selected !== t.correct) {
        correct = false;
        feedback = t.options.find((o) => o.id === s.selected)?.feedback || t.hint;
      }
    }
    if (t.type === 'match') {
      s.verified = t.pairs.filter((p) => s.answers?.[p.id] === p.id).map((p) => p.id);
      save();
      if (t.pairs.some((p) => !s.answers?.[p.id])) {
        setFeedback('Для каждого из четырёх элементов нужно выбрать пару.');
        return;
      }
      const right = t.pairs.filter((p) => s.answers[p.id] === p.id).length;
      if (right < t.pairs.length) {
        correct = false;
        feedback = `Совпало ${right} из ${t.pairs.length} пар. ${t.wrongHint} Верные пары подсвечены ярким зелёным цветом.`;
      }
    }
    if (t.type === 'order') {
      if ((s.order || []).length !== t.correct.length) {
        setFeedback('Выберите все три фрагмента письма.');
        return;
      }
      if (!t.correct.every((id, i) => s.order[i] === id)) {
        correct = false;
        feedback = `Письмо пока читается не по порядку. ${t.hint} Нажмите «Собрать заново» и попробуйте ещё раз.`;
      }
    }
    // Попытка — только проверка полностью заполненного задания.
    // Сохраняем ошибку сразу: перезагрузка не восстанавливает бонус.
    state.attempts[era.id] = Math.min((state.attempts[era.id] || 0) + 1, 1000000);
    if (!correct) {
      save();
      setFeedback(feedback);
      return;
    }
    completeEra(era);
  }
  function completeEra(era) {
    if (isComplete(era.id)) return;
    state.completed.push(era.id);
    state.completed.sort(
      (a, b) => ERAS.findIndex((e) => e.id === a) - ERAS.findIndex((e) => e.id === b),
    );
    state.taskStarted[era.id] = true;
    state.coinAwards[era.id] = state.attempts[era.id] === 1 ? REWARD_COINS[era.id] : 0;
    taskMessage = '';
    showHint = false;
    save();
    render(false);
    SCENE.setMode('task');
    play(era.id === 'war' ? 'page' : 'artifact');
    announce(
      `Получен артефакт «${era.artifact.name}». Собрано ${state.completed.length} из семи. ${state.coinAwards[era.id] ? `В сундук добавлено ${state.coinAwards[era.id]} монет.` : 'Бонус за первую попытку не начислен.'} Всего монет: ${coinBalance()}.`,
    );
    showEraReward(era);
  }
  function showEraReward(era = currentEra()) {
    if (!isComplete(era.id)) return;
    const sponsor = SPONSORS.find((item) => item.eraId === era.id);
    const earned = state.coinAwards[era.id] || 0;
    const recorded = Object.prototype.hasOwnProperty.call(state.coinAwards, era.id);
    const rewardTitle = earned ? `+${earned} монет в сундук` : 'Артефакт сохранён';
    const rewardCopy = earned
      ? 'Верно с первой попытки. Награда уже добавлена в ваш сундук.'
      : recorded
        ? 'Монеты не начислены. Бонус выдаётся за правильное выполнение с первой попытки.'
        : 'Эта эпоха пройдена до появления монет. Ваш артефакт сохранён.';
    openModal(
      `<div class="modal-inner reward-modal era-reward-modal" data-era-id="${era.id}"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button><span class="eyebrow">ЭПОХА ${pad(ERAS.indexOf(era) + 1)} / 07 · ЗАДАНИЕ ВЫПОЛНЕНО</span><div class="reward-artifact">${artifactIcon(era)}<div><h2 id="modal-title">${esc(era.artifact.name)}</h2><p>Артефакт добавлен в «Мой архив».</p></div></div><div class="coin-reward ${earned ? 'earned' : 'unearned'}" data-awarded="${earned}">${icon('coin')}<div><strong>${rewardTitle}</strong><p>${rewardCopy}</p><span class="reward-balance">В сундуке: <b>${coinBalance()}</b> игровых монет</span></div></div><section class="sponsor-card" aria-labelledby="sponsor-title"><div class="sponsor-meta"><span class="ad-label">Реклама</span><span>${esc(sponsor.category)}</span></div><div class="sponsor-brand">${sponsorLogo(sponsor)}<h3 id="sponsor-title">${esc(sponsor.name)}</h3></div><p>${esc(sponsor.description)}</p>${sponsor.emphasis ? `<div class="sponsor-emphasis"><strong>Помощь ветеранам Великой Отечественной войны</strong><p>${esc(sponsor.emphasis)}</p></div>` : ''}<a class="button secondary sponsor-link" href="${esc(sponsor.url)}" target="_blank" rel="noopener noreferrer">${esc(sponsor.cta)} ${icon('arrow')}</a></section><details class="reward-context"><summary>Сохранённая история эпохи</summary><p>${esc(era.artifact.description)}</p><p>${esc(era.fact.text)}</p><button class="text-button" data-action="fact" data-id="${era.id}">Историческая справка и источники ↗</button></details><div class="actions">${era.task.type !== 'explore' ? `<button class="button secondary" data-action="era-artifacts">Посмотреть артефакты эпохи ${icon('book')}</button>` : ''}<button class="button gold" data-action="next">${era.id === 'future' ? 'Создать будущее' : 'Перейти в следующую эпоху'} ${icon('arrow')}</button></div></div>`,
    );
  }
  function nextEra({ fromArtifacts = false, fromSearch = false } = {}) {
    if (!requireDialogue()) return;
    const i = ERAS.indexOf(currentEra());
    if (!isComplete(currentEra().id)) return;
    if (fromArtifacts && !allOptionalObjectsFound(currentEra())) return;
    if (fromSearch && !optionalSearchActive(currentEra())) return;
    // После закрытия окна его можно снова открыть из завершённого задания.
    const continuation = fromArtifacts
      ? $('.era-artifacts-modal', modal)
      : $('.era-reward-modal', modal);
    if (!fromSearch && (!modal.open || continuation?.dataset.eraId !== currentEra().id)) {
      showEraReward();
      return;
    }
    closeModal();
    if (i === 6) navigate('future');
    else enterEra(ERAS[i + 1].id);
  }
  function sourceHTML(source) {
    return `<article class="source-item"><h3>${esc(source.title)}</h3><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.publisher)} ↗</a><p>${esc(source.note)}</p></article>`;
  }
  function factModal(id) {
    const era = ERAS.find((e) => e.id === id) || currentEra();
    const sources = SOURCES.filter((s) => (SOURCE_MAP[era.id] || []).includes(s.id));
    openModal(
      `<div class="modal-inner"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button><span class="eyebrow">О ВРЕМЕНИ · ${esc(era.date)}</span><h2 id="modal-title">${esc(era.fact.title)}</h2><p>${esc(era.fact.text)}</p>${era.id === 'soviet' ? '<p>В 1960–1970-е годы опасные производства постепенно переносили в Никольское. Это был длительный процесс, а не одномоментное закрытие всей территории.</p>' : ''}<span class="fact-label">${era.id === 'future' ? 'Художественная фантазия' : 'Исторический контекст'}</span><div class="source-list">${sources.map(sourceHTML).join('')}</div><h3 class="modal-section-title">Что придумано для игры</h3><p>Персонажи, их реплики, задания, жетон и артефакты вымышлены. Изображения созданы с помощью ИИ как художественные реконструкции. Они не являются архивными фотографиями и не воспроизводят точную планировку.</p><div class="actions"><button class="button secondary small" data-action="close">Вернуться к путешествию</button></div></div>`,
    );
  }
  function artifactModal(id) {
    const era = ERAS.find((e) => e.id === id);
    if (!era || !isComplete(id)) return;
    openModal(
      `<div class="modal-inner reward-modal"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button><span class="eyebrow">МОЙ АРХИВ · ${esc(era.date)}</span>${artifactIcon(era)}<h2 id="modal-title">${esc(era.artifact.name)}</h2><p>${esc(era.artifact.description)}</p>${era.id === 'war' ? `<div class="letter-preview"><span class="eyebrow">ХУДОЖЕСТВЕННЫЙ ТЕКСТ · НЕ АРХИВНЫЙ ДОКУМЕНТ</span>${esc(fullLetter())}</div>` : ''}<div class="actions"><button class="button secondary small" data-action="fact" data-id="${era.id}">История и источники ${icon('info')}</button><button class="text-button" data-action="era" data-id="${era.id}">Вернуться в эпоху →</button></div></div>`,
    );
  }
  function aboutModal() {
    openModal(
      `<div class="modal-inner"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button><span class="eyebrow">ФАКТЫ. ОБРАЗЫ. ПАМЯТЬ.</span><h2 id="modal-title">Об игре и источниках</h2><p>«ВНЕ ВРЕМЕНИ. Одна точка. Семь жизней» — исторический квест о памяти территории у устья Смоленки. Современный адрес комплекса — Санкт-Петербург, Уральская, 1, Василеостровский район, остров Декабристов.</p><div class="about-key"><div><span class="fact-label">Исторический контекст</span><p>Ключевые даты опираются на источники ниже. Справка каждой эпохи отделена от реплик персонажей.</p></div><div><span class="fact-label">Художественная реконструкция</span><p>Все иллюстрации созданы с помощью ИИ. Они передают атмосферу, а не точный внешний вид реальных помещений. Ранний берег — обобщённая сцена островной территории.</p></div><div><span class="fact-label">Художественный вымысел</span><p>Жетон, путешествие, персонажи, диалоги, игровые артефакты и письмо созданы для игры. Варианты 2126 года — фантазия, а не утверждённые проекты.</p></div></div><h3 class="modal-section-title">Как играть</h3><p>В каждой эпохе поговорите с персонажем и выполните задание. Ошибка открывает подсказку и возможность попробовать снова. Семь артефактов открывают выбор будущего. Номера предметов появляются после открытия задания эпохи. За правильное выполнение с первой попытки в сундук добавляются 5 или 10 игровых монет, всего можно собрать 50. Попыткой считается проверка полностью заполненного задания; подсказки и правка ответа до проверки её не расходуют. После каждого задания открывается окно награды с рекламной карточкой сервиса. Нажмите «Осмотреться», чтобы изучать предметы прямо в сцене: выбранный предмет подсветится и покажет описание. Локация целиком помещается на экране. Кнопка «Предметы» открывает список объектов и подсказку с контурами. Управление: мышь, касание или Tab и Enter; Escape закрывает окно или сворачивает панель. Звук включается кнопкой в верхнем правом углу.</p><p>Прогресс хранится только в localStorage этого браузера. Если хранение запрещено, прохождение продолжается в памяти открытой вкладки. Игра не отправляет данные и не требует регистрации. Ссылки на источники и сайты сервисов открываются в отдельной вкладке. Переход по рекламной ссылке не влияет на награду и продолжение игры. После финала открывается мастерская: за монеты можно развить персонажа и получить демонстрационные купоны сервисов. У купонов нет действующих промокодов; знак СберВместе является игровой наградой, а не денежным пожертвованием. Покупки сохраняются вместе с прогрессом.</p><h3 class="modal-section-title">Источники</h3><div class="source-list">${SOURCES.map(sourceHTML).join('')}</div><div class="actions"><button class="button secondary small" data-action="close">Вернуться в игру</button></div></div>`,
    );
  }
  const modal = $('#modal');
  function openModal(html) {
    if (!modal.open) modalOpener = document.activeElement;
    $('#modal-content').innerHTML = html;
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    const target = $('h2', modal);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }
  function closeModal() {
    if (modal.open) modal.close();
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      const r = modal.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        closeModal();
    }
  });
  modal.addEventListener('close', () => {
    if (modalOpener?.isConnected) modalOpener.focus({ preventScroll: true });
  });
  function confirmRestart() {
    openModal(
      `<div class="modal-inner"><button class="close-modal icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button><span class="eyebrow">НОВОЕ ПУТЕШЕСТВИЕ</span><h2 id="modal-title">Начать заново?</h2><p>Будут удалены собранные артефакты, игровые монеты, покупки, развитие персонажа, история попыток, ответы и выбранный финал. Вы вернётесь к жетону в прологе.</p><div class="actions"><button class="button danger" data-action="confirm-restart">Да, начать заново</button><button class="button secondary" data-action="close">Сохранить мой прогресс</button></div></div>`,
    );
  }
  document.addEventListener('change', (event) => {
    const select = event.target.closest('select[data-pair]');
    if (
      !select ||
      view !== 'scene' ||
      !dialogueAnsweredThisVisit ||
      currentEra().task.type !== 'match' ||
      isComplete(currentEra().id)
    )
      return;
    const s = taskState(currentEra());
    s.answers ||= {};
    s.answers[select.dataset.pair] = select.value;
    s.verified = (s.verified || []).filter((id) => id !== select.dataset.pair);
    taskMessage = '';
    taskMessageKind = '';
    save();
    const f = $('#task-feedback');
    if (f) {
      f.textContent = '';
      f.className = 'task-status';
    }
    select.closest('.match-row').classList.remove('is-correct');
  });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action,
      id = button.dataset.id;
    if (
      [
        'home',
        'continue',
        'map',
        'archive',
        'era',
        'future',
        'legacy',
        'finish',
        'ending',
        'shop',
      ].includes(action)
    )
      closeModal();
    if (action === 'home') {
      navigate('home');
      return;
    }
    if (action === 'start') {
      start();
      return;
    }
    if (action === 'continue') {
      continueGame();
      return;
    }
    if (action === 'portal') {
      play('portal');
      enterEra('shore');
      return;
    }
    if (action === 'map') {
      navigate('map');
      return;
    }
    if (action === 'archive') {
      navigate('archive');
      return;
    }
    if (action === 'era') {
      play('page');
      enterEra(id);
      return;
    }
    if (action === 'shop' || action === 'ending') {
      navigate(action);
      return;
    }
    if (action === 'buy') {
      confirmShopPurchase(id);
      return;
    }
    if (action === 'confirm-buy') {
      buyShopItem(id);
      return;
    }
    if (action === 'purchase') {
      if (view === 'shop') purchaseReceipt(id);
      return;
    }
    if (action === 'sound') {
      state.sound = !state.sound;
      save();
      updateChrome();
      if (state.sound) play('choice');
      toast(state.sound ? 'Звук включён' : 'Звук выключен');
      return;
    }
    if (action === 'about') {
      aboutModal();
      return;
    }
    if (action === 'fact') {
      factModal(id);
      return;
    }
    if (action === 'artifact') {
      artifactModal(id);
      return;
    }
    if (action === 'close') {
      closeModal();
      return;
    }
    if (action === 'restart') {
      confirmRestart();
      return;
    }
    if (action === 'confirm-restart') {
      const sound = state.sound;
      state = emptyState();
      state.sound = sound;
      taskMessage = '';
      showHint = false;
      selectedObject = null;
      closeModal();
      save();
      start();
      announce('Началось новое путешествие.');
      return;
    }
    if (action === 'dialogue') {
      if (view !== 'scene') return;
      const era = currentEra(),
        choice = era.openingDialogue.choices.find((item) => item.id === id);
      if (!choice) return;
      dialogueAnsweredThisVisit = true;
      state.dialogueChoices[era.id] = id;
      save();
      play('choice');
      $('#conversation').innerHTML = renderDialogue(era);
      const response = $('#task-dialogue');
      response.innerHTML = renderTaskDialogue(era);
      response.hidden = false;
      openTask(true, { includeDialogueReply: true });
      $('#task-panel').scrollTop = 0;
      $('#task-section').scrollTop = 0;
      $('#conversation').scrollTop = 0;
      announce(`${era.character.name}: ${choice.response} Задание: ${era.task.title}.`);
      return;
    }
    if (action === 'task') {
      openTask();
      return;
    }
    if (['hint', 'quiz', 'fragment', 'clear-order'].includes(action) && !requireDialogue()) return;
    if (action === 'look' || action === 'talk') {
      if (view === 'scene') SCENE.setMode(action, { focus: true });
      return;
    }
    if (action === 'scene-list') {
      if (view === 'scene') SCENE.toggleList();
      return;
    }
    if (action === 'scene-hints') {
      if (view === 'scene') SCENE.toggleHints();
      return;
    }
    if (action === 'inspect') {
      inspectObject(id, button.dataset.focus === 'true');
      return;
    }
    if (action === 'hint') {
      showHint = !showHint;
      updateTask('[data-action="hint"]');
      if (showHint) announce(currentEra().task.hint);
      return;
    }
    if (action === 'explore') {
      inspectObject(id, true);
      return;
    }
    if (action === 'quiz') {
      const era = currentEra();
      if (
        era.task.type !== 'quiz' ||
        !era.task.options.some((o) => o.id === id) ||
        isComplete(era.id)
      )
        return;
      taskState(era).selected = id;
      taskMessage = '';
      taskMessageKind = '';
      save();
      play('choice');
      updateTask(`[data-action="quiz"][data-id="${id}"]`);
      return;
    }
    if (action === 'fragment') {
      const era = currentEra();
      if (era.task.type !== 'order' || isComplete(era.id)) return;
      const s = taskState(era);
      s.order ||= [];
      if (s.order.includes(id)) s.order = s.order.filter((x) => x !== id);
      else if (era.task.fragments.some((f) => f.id === id)) s.order.push(id);
      taskMessage = '';
      taskMessageKind = '';
      save();
      play('page');
      updateTask(`[data-action="fragment"][data-id="${id}"]`);
      announce(`Выбрано ${s.order.length} из трёх фрагментов.`);
      return;
    }
    if (action === 'clear-order') {
      taskState(currentEra()).order = [];
      taskMessage = '';
      taskMessageKind = '';
      save();
      updateTask('[data-action="clear-order"]');
      return;
    }
    if (action === 'check') {
      checkTask();
      return;
    }
    if (action === 'explore-summary-next') {
      const summary = $('.explore-summary-modal', modal);
      if (
        !modal.open ||
        !summary ||
        !summary.contains(button) ||
        summary.dataset.eraId !== currentEra().id
      )
        return;
      checkTask({ fromExploreSummary: true });
      return;
    }
    if (action === 'next') {
      nextEra();
      return;
    }
    if (action === 'era-artifacts') {
      startArtifactSearch();
      return;
    }
    if (action === 'era-artifacts-skip') {
      if (view !== 'scene' || !app.contains(button) || !optionalSearchActive(currentEra())) return;
      nextEra({ fromSearch: true });
      return;
    }
    if (action === 'era-artifacts-next') {
      const summary = $('.era-artifacts-modal', modal);
      if (!modal.open || !summary?.contains(button) || summary.dataset.eraId !== currentEra().id)
        return;
      nextEra({ fromArtifacts: true });
      return;
    }
    if (action === 'future') {
      navigate('future');
      return;
    }
    if (action === 'select-future') {
      if (state.completed.length < 7 || !STORY.futures.some((f) => f.id === id)) return;
      state.futureChoice = id;
      state.finished = false;
      save();
      play('choice');
      render(false);
      $(`[data-action="select-future"][data-id="${id}"]`)?.focus({
        preventScroll: true,
      });
      announce(STORY.futures.find((f) => f.id === id).title);
      return;
    }
    if (action === 'legacy') {
      navigate('legacy');
      return;
    }
    if (action === 'select-legacy') {
      if (
        view !== 'legacy' ||
        !STORY.legacies.some((l) => l.id === id) ||
        state.completed.length < 7
      )
        return;
      state.legacyChoice = id;
      state.finished = false;
      save();
      play('choice');
      render(false);
      $(`[data-action="select-legacy"][data-id="${id}"]`)?.focus({
        preventScroll: true,
      });
      return;
    }
    if (action === 'finish') {
      if (
        view !== 'legacy' ||
        state.completed.length !== 7 ||
        !state.futureChoice ||
        !state.legacyChoice
      )
        return;
      state.finished = true;
      play('complete');
      navigate('ending');
      return;
    }
  });
  // Повреждённое/запрещённое хранилище не мешает начать или завершить игру.
  render();
  if (corruptedSave) toast('Сохранение не удалось прочитать. Можно начать новое путешествие.');
})();
