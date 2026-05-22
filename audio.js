(function () {
  const MUSIC_ENABLED_KEY = "phymo-music-enabled";
  const LEGACY_LOGIN_KEY = "phymo-play-office-music";
  const MUSIC_TIME_KEY = "phymo-music-current-time";
  const MUSIC_BUTTON_ID = "phymo-music-toggle";
  const SESSION_CONTROLS_ID = "phymo-session-controls";
  const LOGOUT_BUTTON_ID = "phymo-logout";

  if (window.PhymoStorage?.get(LEGACY_LOGIN_KEY) === "1") {
    window.PhymoStorage.set(MUSIC_ENABLED_KEY, "1", { persist: true });
    window.PhymoStorage.remove(LEGACY_LOGIN_KEY);
  }

  const root = document.querySelector("main") || document.body;
  const music = document.querySelector("#phymo-bgm") || document.createElement("audio");
  const controls = document.querySelector(`#${SESSION_CONTROLS_ID}`) || document.createElement("div");
  const toggle = document.querySelector(`#${MUSIC_BUTTON_ID}`) || document.createElement("button");
  const logout = document.querySelector(`#${LOGOUT_BUTTON_ID}`) || document.createElement("button");
  const isLoginPage = root.classList.contains("login-screen");
  const profileTrigger = document.querySelector(".office-profile, .profile-link");
  const profileNames = document.querySelectorAll(".office-profile strong");

  function storedNickname() {
    const params = new URLSearchParams(window.location.search);
    return (
      window.PhymoStorage?.get("phymo-user-nickname") ||
      params.get("nickname") ||
      ""
    ).trim();
  }

  function updateProfileName() {
    const nickname = storedNickname();
    if (!nickname) return;

    profileNames.forEach((name) => {
      name.textContent = nickname;
    });
  }

  music.id = "phymo-bgm";
  music.src = "assets/music.mp3";
  music.loop = true;
  music.preload = "auto";
  music.volume = 0.45;

  if (!music.parentNode) {
    root.appendChild(music);
  }

  controls.id = SESSION_CONTROLS_ID;
  controls.className = "session-controls";
  controls.setAttribute("aria-hidden", "true");

  if (!controls.parentNode) {
    document.body.appendChild(controls);
  }

  toggle.id = MUSIC_BUTTON_ID;
  toggle.type = "button";
  toggle.className = "music-toggle";
  toggle.setAttribute("aria-label", "切換背景音樂");
  controls.appendChild(toggle);

  if (!isLoginPage) {
    logout.id = LOGOUT_BUTTON_ID;
    logout.type = "button";
    logout.className = "logout-toggle";
    logout.textContent = "登出";
    logout.setAttribute("aria-label", "登出");
    controls.appendChild(logout);
  }

  if (!isLoginPage) {
    updateProfileName();
  }

  function isEnabled() {
    return window.PhymoStorage?.get(MUSIC_ENABLED_KEY) === "1";
  }

  function savedTime() {
    const time = Number(window.PhymoStorage?.get(MUSIC_TIME_KEY));
    return Number.isFinite(time) && time > 0 ? time : 0;
  }

  function normalizedTime(time) {
    if (!Number.isFinite(music.duration) || music.duration <= 0) return time;
    return time % music.duration;
  }

  function restoreTime() {
    const time = normalizedTime(savedTime());
    if (time > 0) {
      music.currentTime = time;
    }
  }

  function saveTime() {
    if (Number.isFinite(music.currentTime)) {
      window.PhymoStorage?.set(MUSIC_TIME_KEY, String(normalizedTime(music.currentTime)), {
        persist: true
      });
    }
  }

  function updateToggle() {
    const enabled = isEnabled();
    toggle.classList.toggle("is-on", enabled && !music.paused);
    toggle.setAttribute("aria-pressed", String(enabled && !music.paused));
    toggle.innerHTML = `<span>${enabled && !music.paused ? "音樂 ON" : "音樂 OFF"}</span>`;
  }

  function closeMenu() {
    controls.classList.remove("is-open");
    controls.setAttribute("aria-hidden", "true");
    if (profileTrigger) {
      profileTrigger.setAttribute("aria-expanded", "false");
    }
  }

  function positionMenu() {
    if (!profileTrigger) return;

    const rect = profileTrigger.getBoundingClientRect();
    const gap = 10;
    const right = Math.max(12, window.innerWidth - rect.right);
    const top = Math.min(rect.bottom + gap, window.innerHeight - controls.offsetHeight - 12);
    controls.style.top = `${Math.max(12, top)}px`;
    controls.style.right = `${right}px`;
  }

  function toggleMenu() {
    const willOpen = !controls.classList.contains("is-open");
    if (willOpen) {
      positionMenu();
    }
    controls.classList.toggle("is-open", willOpen);
    controls.setAttribute("aria-hidden", String(!willOpen));
    if (profileTrigger) {
      profileTrigger.setAttribute("aria-expanded", String(willOpen));
    }
  }

  music.addEventListener("loadedmetadata", restoreTime, { once: true });
  music.addEventListener("timeupdate", saveTime);
  music.addEventListener("play", updateToggle);
  music.addEventListener("pause", updateToggle);
  window.addEventListener("pagehide", saveTime);
  window.addEventListener("beforeunload", saveTime);

  if (music.readyState >= 1) {
    restoreTime();
  }

  async function playMusic() {
    window.PhymoStorage?.set(MUSIC_ENABLED_KEY, "1", { persist: true });
    if (!music.paused) return;

    try {
      await music.play();
      updateToggle();
    } catch {
      window.addEventListener("pointerdown", playMusic, { once: true });
      window.addEventListener("keydown", playMusic, { once: true });
      updateToggle();
    }
  }

  function pauseMusic() {
    saveTime();
    window.PhymoStorage?.set(MUSIC_ENABLED_KEY, "0", { persist: true });
    music.pause();
    updateToggle();
  }

  function logoutUser() {
    saveTime();
    music.pause();
    window.PhymoStorage?.remove(MUSIC_ENABLED_KEY);
    window.PhymoStorage?.remove("phymo-user-nickname");
    window.PhymoStorage?.remove("phymo-user-id");
    window.PhymoStorage?.remove("phymo-login-verified");
    window.PhymoStorage?.remove(LEGACY_LOGIN_KEY);
    window.location.href = "index.html";
  }

  toggle.addEventListener("click", () => {
    if (isEnabled() && !music.paused) {
      pauseMusic();
      return;
    }

    playMusic();
  });

  if (!isLoginPage) {
    logout.addEventListener("click", logoutUser);
  }

  if (!isLoginPage && profileTrigger) {
    profileTrigger.setAttribute("aria-haspopup", "menu");
    profileTrigger.setAttribute("aria-expanded", "false");
    profileTrigger.setAttribute("role", "button");

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest(".office-profile, .profile-link");
      if (trigger) {
        event.preventDefault();
        event.stopPropagation();
        toggleMenu();
        return;
      }

      if (controls.contains(event.target) || profileTrigger.contains(event.target)) return;
      closeMenu();
    });

    window.addEventListener("resize", () => {
      if (controls.classList.contains("is-open")) positionMenu();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  updateToggle();

  if (isEnabled()) {
    playMusic();
  }
})();
