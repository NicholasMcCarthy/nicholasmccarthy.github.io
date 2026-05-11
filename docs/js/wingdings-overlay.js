(() => {
  const textSelector = "p, li, a, span, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption";
  const wingdingsStack = '"Wingdings", "Wingdings 2", "Wingdings 3", cursive';

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

    activeElement.style.fontFamily = activeElementOriginalFont;
    activeElement = null;
    activeElementOriginalFont = "";
  };

  const setActiveElement = (nextElement) => {
    if (!nextElement || nextElement === activeElement) {
      return;
    }

    clearActiveElement();
    activeElement = nextElement;
    activeElementOriginalFont = nextElement.style.fontFamily;
    nextElement.style.fontFamily = wingdingsStack;
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
