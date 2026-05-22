(function () {
  const fallbackMenu = {
    items: [
      {
        title: "辦公室",
        desc: "在這裡，尋找屬於你的心動情景",
        href: "office.html",
        icon: "⌂"
      },
      {
        title: "情書集",
        desc: "屬於我們的記憶",
        href: "love-letter.html",
        icon: "▤"
      },
      {
        title: "角色檔案",
        desc: "認識我更多",
        href: "character.html",
        icon: "♧"
      },
      {
        title: "典藏音樂",
        desc: "為妳做的歌",
        href: "music.html",
        icon: "♪"
      },
      {
        title: "特典卡片",
        desc: "墨非的特典收藏",
        href: "study.html",
        icon: "▣"
      }
    ]
  };

  async function readMenu() {
    try {
      const response = await fetch("assets/menu.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Unable to load menu.json: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      return fallbackMenu;
    }
  }

  function currentFileName() {
    const path = window.location.pathname;
    return path.slice(path.lastIndexOf("/") + 1) || "index.html";
  }

  function createMenuButton(item) {
    const button = document.createElement("button");
    button.className = "office-menu-item";
    button.type = "button";
    button.dataset.title = item.title || "";
    button.dataset.desc = item.desc || "";
    button.dataset.href = item.href || "";

    const icon = document.createElement("span");
    icon.className = "menu-icon";
    icon.textContent = item.icon || "";

    const text = document.createElement("span");
    text.textContent = item.title || "";

    button.append(icon, text);
    return button;
  }

  window.initPhymoMenu = async function initPhymoMenu(options) {
    const menu = document.querySelector(options.menuSelector);
    const title = document.querySelector(options.titleSelector);
    const desc = document.querySelector(options.descSelector);
    const titlePanel = document.querySelector(options.titlePanelSelector);

    if (!menu) return [];

    const data = await readMenu();
    const items = Array.isArray(data.items) ? data.items : [];
    const activeFile = currentFileName();

    menu.replaceChildren();

    const buttons = items.map((item) => {
      const button = createMenuButton(item);

      button.addEventListener("click", () => {
        buttons.forEach((menuItem) => menuItem.classList.remove("is-active"));
        button.classList.add("is-active");

        if (title) title.textContent = button.dataset.title;
        if (desc) desc.textContent = button.dataset.desc;
        if (titlePanel) titlePanel.classList.remove("is-empty");

        const href = button.dataset.href;
        if (href && href !== activeFile) {
          window.setTimeout(() => {
            window.location.href = href;
          }, 180);
        }
      });

      menu.append(button);
      return button;
    });

    return buttons;
  };
})();
