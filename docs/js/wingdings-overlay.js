(() => {
  const textSelector = "p, li, a, span, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption";
  const wingdingsStack = '"Wingdings", "Wingdings 2", "Wingdings 3", cursive';
  const swapGlyphs = "@#$%&*<>?/\\|[]{}~=+0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const controlsMarker = "[data-wingdings-control='true']";
  const settingsStorageKey = "wingdingsSwimSettings";

  const settingDefinitions = [
    { key: "swapStepMs", label: "Swap Speed (ms)", min: 30, max: 600, step: 5, defaultValue: 180 },
    { key: "swapPercent", label: "Swap Amount (%)", min: 0, max: 30, step: 1, defaultValue: 4 },
    { key: "replacementPercent", label: "Glyph Amount (%)", min: 0, max: 20, step: 1, defaultValue: 1 },
    { key: "rotationAmount", label: "Rotation Amount (deg)", min: 0, max: 20, step: 0.1, defaultValue: 0 },
    { key: "rotationSpeed", label: "Rotation Speed", min: 40, max: 800, step: 5, defaultValue: 220 },
    { key: "verticalBobAmount", label: "Vertical Bob (px)", min: 0, max: 14, step: 0.1, defaultValue: 0 },
    { key: "verticalBobSpeed", label: "Vertical Bob Speed", min: 40, max: 800, step: 5, defaultValue: 180 }
  ];

  const settings = settingDefinitions.reduce((acc, item) => {
    acc[item.key] = item.defaultValue;
    return acc;
  }, {});

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const loadSettings = () => {
    try {
      const raw = localStorage.getItem(settingsStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      for (const item of settingDefinitions) {
        const nextValue = Number(parsed[item.key]);
        if (Number.isFinite(nextValue)) {
          settings[item.key] = clamp(nextValue, item.min, item.max);
        }
      }
    } catch (_) {
      return;
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    } catch (_) {
      return;
    }
  };

  const formatValue = (value, step) => {
    const precision = step.toString().includes(".") ? step.toString().split(".")[1].length : 0;
    if (precision === 0) {
      return String(Math.round(value));
    }

    return Number(value.toFixed(precision)).toString();
  };

  const injectControlStyles = () => {
    if (document.getElementById("wingdings-controls-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "wingdings-controls-style";
    style.textContent = `
      .wingdings-controls {
        position: fixed;
        top: 58px;
        right: 12px;
        width: min(340px, calc(100vw - 24px));
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: rgba(10, 10, 10, 0.94);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
        border-radius: 10px;
        padding: 12px;
        z-index: 10001;
        color: #f4f4f4;
      }

      .wingdings-controls[hidden] {
        display: none;
      }

      .wingdings-controls-title {
        font-size: 0.9rem;
        font-weight: 700;
        margin: 0 0 10px;
      }

      .wingdings-setting-row {
        display: grid;
        grid-template-columns: minmax(116px, 1.2fr) minmax(120px, 2fr) auto;
        gap: 8px;
        align-items: center;
        margin: 0 0 8px;
      }

      .wingdings-setting-name {
        font-size: 0.78rem;
        font-weight: 700;
        line-height: 1.25;
      }

      .wingdings-setting-value {
        display: flex;
        flex-direction: column;
        gap: 3px;
        align-items: flex-start;
      }

      .wingdings-setting-value-label {
        font-size: 0.68rem;
        opacity: 0.75;
      }

      .wingdings-setting-slider {
        width: 100%;
        margin: 0;
      }

      .wingdings-setting-number {
        width: 66px;
        border: 1px solid rgba(255, 255, 255, 0.28);
        background: rgba(255, 255, 255, 0.1);
        color: #f4f4f4;
        border-radius: 6px;
        height: 28px;
        padding: 0 6px;
        font-size: 0.8rem;
      }

      .wingdings-control-note {
        font-size: 0.72rem;
        opacity: 0.85;
        margin-top: 8px;
      }

      @media (max-width: 680px) {
        .wingdings-controls {
          top: 54px;
          right: 8px;
          width: calc(100vw - 16px);
        }

        .wingdings-setting-row {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const createSettingRow = (definition) => {
    const row = document.createElement("div");
    row.className = "wingdings-setting-row";
    row.setAttribute("data-wingdings-control", "true");

    const controlIdBase = `wingdings-setting-${definition.key}`;
    const sliderId = `${controlIdBase}-slider`;
    const numberId = `${controlIdBase}-number`;

    const name = document.createElement("div");
    name.className = "wingdings-setting-name";
    name.textContent = definition.label;
    name.setAttribute("data-wingdings-control", "true");

    const sliderWrap = document.createElement("div");
    sliderWrap.setAttribute("data-wingdings-control", "true");

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "wingdings-setting-slider";
    slider.id = sliderId;
    slider.min = String(definition.min);
    slider.max = String(definition.max);
    slider.step = String(definition.step);
    slider.value = formatValue(settings[definition.key], definition.step);
    slider.setAttribute("data-wingdings-control", "true");

    const numberWrap = document.createElement("div");
    numberWrap.className = "wingdings-setting-value";
    numberWrap.setAttribute("data-wingdings-control", "true");

    const numberLabel = document.createElement("label");
    numberLabel.className = "wingdings-setting-value-label";
    numberLabel.textContent = "Value";
    numberLabel.htmlFor = numberId;
    numberLabel.setAttribute("data-wingdings-control", "true");

    const number = document.createElement("input");
    number.type = "number";
    number.className = "wingdings-setting-number";
    number.id = numberId;
    number.min = String(definition.min);
    number.max = String(definition.max);
    number.step = String(definition.step);
    number.value = formatValue(settings[definition.key], definition.step);
    number.setAttribute("data-wingdings-control", "true");

    const setValue = (rawValue) => {
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) {
        number.value = formatValue(settings[definition.key], definition.step);
        return;
      }

      const next = clamp(parsed, definition.min, definition.max);
      settings[definition.key] = next;
      const formatted = formatValue(next, definition.step);
      slider.value = formatted;
      number.value = formatted;
      saveSettings();
    };

    slider.addEventListener("input", () => setValue(slider.value));
    number.addEventListener("input", () => setValue(number.value));
    number.addEventListener("blur", () => setValue(number.value));

    sliderWrap.append(slider);
    numberWrap.append(numberLabel, number);
    row.append(name, sliderWrap, numberWrap);
    return row;
  };

  const mountControls = () => {
    const menuList = document.querySelector(".terminal-menu ul");
    if (!menuList) {
      return;
    }

    injectControlStyles();

    const menuItem = document.createElement("li");
    menuItem.setAttribute("property", "itemListElement");
    menuItem.setAttribute("typeof", "ListItem");
    menuItem.setAttribute("data-wingdings-control", "true");

    const menuButton = document.createElement("a");
    menuButton.href = "#";
    menuButton.className = "menu-item";
    menuButton.setAttribute("aria-label", "Swim text settings");
    menuButton.setAttribute("data-wingdings-control", "true");
    menuButton.textContent = "🙂";

    const positionMeta = document.createElement("meta");
    positionMeta.setAttribute("property", "position");
    positionMeta.setAttribute("content", String(menuList.children.length));

    menuItem.append(menuButton, positionMeta);
    menuList.appendChild(menuItem);

    const panel = document.createElement("section");
    panel.className = "wingdings-controls";
    panel.hidden = true;
    panel.setAttribute("data-wingdings-control", "true");

    const title = document.createElement("h3");
    title.className = "wingdings-controls-title";
    title.textContent = "Swim Settings";
    title.setAttribute("data-wingdings-control", "true");
    panel.appendChild(title);

    for (const definition of settingDefinitions) {
      panel.appendChild(createSettingRow(definition));
    }

    const note = document.createElement("p");
    note.className = "wingdings-control-note";
    note.textContent = "Default keeps rotation and bobbing off. Increase values to turn them on.";
    note.setAttribute("data-wingdings-control", "true");
    panel.appendChild(note);

    document.body.appendChild(panel);

    menuButton.addEventListener("click", (event) => {
      event.preventDefault();
      panel.hidden = !panel.hidden;
    });

    document.addEventListener("click", (event) => {
      if (panel.hidden) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (panel.contains(target) || menuButton.contains(target)) {
        return;
      }

      panel.hidden = true;
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        panel.hidden = true;
      }
    });
  };

  loadSettings();

  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "84px",
    height: "84px",
    borderRadius: "50%",
    border: "2px solid rgba(255, 255, 255, 0.45)",
    background: "radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.03) 70%)",
    boxShadow: "0 0 16px rgba(255, 255, 255, 0.22)",
    pointerEvents: "none",
    transform: "translate(-50%, -50%)",
    transition: "opacity 120ms ease-out",
    opacity: "0",
    zIndex: "9999"
  });

  const mountOverlay = () => {
    if (!document.body.contains(overlay)) {
      document.body.appendChild(overlay);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        mountOverlay();
        mountControls();
      },
      { once: true }
    );
  } else {
    mountOverlay();
    mountControls();
  }

  let activeElement = null;
  let activeElementOriginalFont = "";
  let activeElementOriginalTransform = "";
  let activeElementOriginalTransition = "";
  let activeElementOriginalWillChange = "";
  let activeTextNodes = [];
  let swimFrame = 0;
  let swimStartTime = 0;

  const collectTextNodes = (element) => {
    const nodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    let node = walker.nextNode();
    while (node) {
      nodes.push({ node, value: node.nodeValue });
      node = walker.nextNode();
    }

    return nodes;
  };

  const swapCharacters = (text, tick) => {
    if (!text || !text.trim()) {
      return text;
    }

    const chars = text.split("");
    const nonSpaceIndexes = [];

    for (let index = 0; index < chars.length; index += 1) {
      if (/\S/.test(chars[index])) {
        nonSpaceIndexes.push(index);
      }
    }

    if (nonSpaceIndexes.length < 2) {
      return text;
    }

    const swapRatio = settings.swapPercent / 100;
    const replacementRatio = settings.replacementPercent / 100;
    const swaps = Math.floor(nonSpaceIndexes.length * swapRatio);
    const replacements = Math.floor(nonSpaceIndexes.length * replacementRatio);

    if (swaps < 1 && replacements < 1) {
      return text;
    }

    for (let step = 0; step < swaps; step += 1) {
      const fromIndex = nonSpaceIndexes[(tick + step) % nonSpaceIndexes.length];
      const toIndex = nonSpaceIndexes[(tick + step + 1) % nonSpaceIndexes.length];
      [chars[fromIndex], chars[toIndex]] = [chars[toIndex], chars[fromIndex]];
    }

    for (let step = 0; step < replacements; step += 1) {
      const charIndex = nonSpaceIndexes[(tick * 3 + step * 5) % nonSpaceIndexes.length];
      if (/[A-Za-z0-9]/.test(chars[charIndex])) {
        chars[charIndex] = swapGlyphs[(tick + step * 11 + charIndex) % swapGlyphs.length];
      }
    }

    return chars.join("");
  };

  const stopSwimEffect = () => {
    if (swimFrame) {
      cancelAnimationFrame(swimFrame);
      swimFrame = 0;
    }

    for (const item of activeTextNodes) {
      item.node.nodeValue = item.value;
    }

    activeTextNodes = [];

    if (activeElement) {
      activeElement.style.transform = activeElementOriginalTransform;
      activeElement.style.transition = activeElementOriginalTransition;
      activeElement.style.willChange = activeElementOriginalWillChange;
    }
  };

  const startSwimEffect = () => {
    if (!activeElement) {
      return;
    }

    activeTextNodes = collectTextNodes(activeElement);
    if (!activeTextNodes.length) {
      return;
    }

    activeElementOriginalTransform = activeElement.style.transform;
    activeElementOriginalTransition = activeElement.style.transition;
    activeElementOriginalWillChange = activeElement.style.willChange;

    activeElement.style.transition = "transform 90ms linear";
    activeElement.style.willChange = "transform";

    swimStartTime = performance.now();

    const animate = (timestamp) => {
      if (!activeElement) {
        return;
      }

      const elapsed = timestamp - swimStartTime;
      const tick = Math.floor(elapsed / Math.max(16, settings.swapStepMs));
      const rotate = Math.sin(elapsed / Math.max(1, settings.rotationSpeed)) * settings.rotationAmount;
      const bob = Math.sin(elapsed / Math.max(1, settings.verticalBobSpeed)) * settings.verticalBobAmount;
      const transformPrefix = activeElementOriginalTransform ? `${activeElementOriginalTransform} ` : "";

      activeElement.style.transform = `${transformPrefix}rotate(${rotate.toFixed(2)}deg) translateY(${bob.toFixed(2)}px)`;

      for (const item of activeTextNodes) {
        item.node.nodeValue = swapCharacters(item.value, tick);
      }

      swimFrame = requestAnimationFrame(animate);
    };

    swimFrame = requestAnimationFrame(animate);
  };

  const getTextElement = (target) => {
    if (!(target instanceof Element)) {
      return null;
    }

    const candidate = target.closest(textSelector);
    if (!candidate) {
      return null;
    }

    if (candidate.closest(controlsMarker)) {
      return null;
    }

    return candidate.textContent && candidate.textContent.trim() ? candidate : null;
  };

  const clearActiveElement = () => {
    if (!activeElement) {
      return;
    }

    stopSwimEffect();
    activeElement.style.fontFamily = activeElementOriginalFont;
    activeElement = null;
    activeElementOriginalFont = "";
    activeElementOriginalTransform = "";
    activeElementOriginalTransition = "";
    activeElementOriginalWillChange = "";
  };

  const setActiveElement = (nextElement) => {
    if (!nextElement || nextElement === activeElement) {
      return;
    }

    clearActiveElement();
    activeElement = nextElement;
    activeElementOriginalFont = nextElement.style.fontFamily;
    nextElement.style.fontFamily = wingdingsStack;
    startSwimEffect();
  };

  const hideEffect = () => {
    overlay.style.opacity = "0";
    clearActiveElement();
  };

  document.addEventListener("mousemove", (event) => {
    overlay.style.left = `${event.clientX}px`;
    overlay.style.top = `${event.clientY}px`;

    const elementUnderCursor = getTextElement(document.elementFromPoint(event.clientX, event.clientY));
    if (!elementUnderCursor) {
      hideEffect();
      return;
    }

    overlay.style.opacity = "1";
    setActiveElement(elementUnderCursor);
  });

  document.addEventListener("mouseleave", hideEffect);
})();
