document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-flash-message]").forEach((message) => {
    window.setTimeout(() => {
      message.classList.add("is-fading");
      message.addEventListener("transitionend", () => message.remove(), { once: true });
    }, 4000);
  });

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
});
