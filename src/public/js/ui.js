document.addEventListener("DOMContentLoaded", () => {
  const flashMessages = document.querySelectorAll("[data-flash-message]");

  const fadeFlashMessage = (message) => {
    if (message.dataset.fading === "true") {
      return;
    }

    message.dataset.fading = "true";

    if (message.dataset.fadeTimer) {
      window.clearTimeout(Number(message.dataset.fadeTimer));
    }

    const removeMessage = (event) => {
      if (event.target !== message || event.propertyName !== "opacity") {
        return;
      }

      message.removeEventListener("transitionend", removeMessage);
      message.remove();
    };

    message.addEventListener("transitionend", removeMessage);
    window.setTimeout(() => message.remove(), 600);

    message.classList.add("is-fading");
  };

  document.querySelectorAll("[data-flash-message]").forEach((message) => {
    const fadeTimer = window.setTimeout(() => fadeFlashMessage(message), 4000);
    message.dataset.fadeTimer = String(fadeTimer);
  });

  if (flashMessages.length) {
    document.addEventListener("click", () => {
      flashMessages.forEach(fadeFlashMessage);
    });
  }

  document.querySelectorAll(".btn-drop").forEach((button) => {
    const targetClass = button.dataset.class;
    const target = targetClass ? document.querySelector(`.${targetClass}`) : null;

    button.addEventListener("click", () => {
      button.classList.toggle("active");
      target?.classList.toggle("active");
    });
  });

  document.querySelectorAll(".tabsBlock").forEach((tabsBlock) => {
    const buttons = tabsBlock.querySelectorAll("[data-tab-target]");
    const panels = tabsBlock.querySelectorAll("[data-tab-panel]");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetName = button.dataset.tabTarget;

        buttons.forEach((item) => item.classList.toggle("active", item === button));
        panels.forEach((panel) => {
          panel.classList.toggle("active", panel.dataset.tabPanel === targetName);
        });
      });
    });
  });

  document.querySelectorAll("[data-character-tabs]").forEach((characterTabs) => {
    const cards = characterTabs.querySelectorAll("[data-character-card]");
    const panels = characterTabs.querySelectorAll("[data-character-panel]");

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const target = card.dataset.characterCard;

        cards.forEach((item) => {
          const isActive = item === card;

          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-selected", String(isActive));
        });

        panels.forEach((panel) => {
          const isActive = panel.dataset.characterPanel === target;

          panel.classList.toggle("is-active", isActive);
          panel.hidden = !isActive;
        });
      });
    });
  });
});
