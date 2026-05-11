(() => {
  const textSelector = "p, li, a, span, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption";
  const wingdingsStack = '"Wingdings", "Wingdings 2", "Wingdings 3", cursive';
  const swapGlyphs = "@#$%&*<>?/\\|[]{}~=+0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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
    document.addEventListener("DOMContentLoaded", mountOverlay, { once: true });
  } else {
    mountOverlay();
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

    const swaps = Math.max(1, Math.floor(nonSpaceIndexes.length * 0.08));

    for (let step = 0; step < swaps; step += 1) {
      const fromIndex = nonSpaceIndexes[(tick + step) % nonSpaceIndexes.length];
      const toIndex = nonSpaceIndexes[(tick + step + 1) % nonSpaceIndexes.length];
      [chars[fromIndex], chars[toIndex]] = [chars[toIndex], chars[fromIndex]];
    }

    const replacements = Math.max(1, Math.floor(nonSpaceIndexes.length * 0.04));

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
      const tick = Math.floor(elapsed / 45);
      const rotate = Math.sin(elapsed / 220) * 2.5;
      const bob = Math.sin(elapsed / 180) * 1.8;
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
