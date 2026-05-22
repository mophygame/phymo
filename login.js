(function () {
  const config = window.PHYMO_SUPABASE;
  const form = document.querySelector(".login-card");
  const nicknameInput = form?.querySelector("[name='nickname']");
  const passwordInput = form?.querySelector("[name='password']");
  const passwordToggle = form?.querySelector(".password-toggle");
  const rememberInput = form?.querySelector("[name='remember']");
  const submitButton = form?.querySelector(".login-button");
  const message = document.querySelector(".login-message");

  if (!form) return;

  function setMessage(text, type = "error") {
    if (!message) return;
    message.textContent = text;
    message.dataset.type = type;
  }

  function setLoading(isLoading) {
    if (!submitButton) return;
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "登入中..." : "登入";
  }

  function hasSupabaseConfig() {
    return Boolean(
      window.supabase &&
      config?.url &&
      config?.anonKey &&
      !config.url.includes("YOUR_PROJECT_ID") &&
      !config.anonKey.includes("YOUR_SUPABASE_ANON_KEY")
    );
  }

  function saveLoginState(profile, remember) {
    const fallbackName = nicknameInput.value.trim();
    const nicknameColumn = config.nicknameColumn || "nickname";
    const profileId = profile?.profile_id || profile?.id || "";

    window.PhymoStorage.set("phymo-user-nickname", profile?.[nicknameColumn] || fallbackName, {
      persist: remember
    });
    if (profileId) {
      window.PhymoStorage.set("phymo-user-id", profileId, { persist: remember });
    }
    window.PhymoStorage.set("phymo-login-verified", "1", { persist: remember });
    window.PhymoStorage.set("phymo-play-office-music", "1");
    window.PhymoStorage.set("phymo-music-enabled", "1", { persist: true });
  }

  async function verifyLogin(client, nickname, password) {
    const { data, error } = await client.rpc(config.verifyLoginFunction || "verify_phymo_login", {
      input_nickname: nickname,
      input_password: password
    });

    if (error) {
      error.isSupabaseConnectionError = true;
      throw error;
    }
    return Array.isArray(data) ? data[0] : data;
  }

  passwordToggle?.addEventListener("click", () => {
    const shouldShow = passwordInput.type === "password";
    passwordInput.type = shouldShow ? "text" : "password";
    passwordToggle.textContent = shouldShow ? "隱藏" : "顯示";
    passwordToggle.setAttribute("aria-label", shouldShow ? "隱藏密碼" : "顯示密碼");
    passwordToggle.setAttribute("aria-pressed", String(shouldShow));
    passwordInput.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    const nickname = nicknameInput.value.trim();
    const password = passwordInput.value;
    const remember = Boolean(rememberInput?.checked);

    if (!nickname || !password) {
      setMessage("請輸入暱稱和密碼。");
      return;
    }

    if (!hasSupabaseConfig()) {
      setMessage("連結失效");
      return;
    }

    setLoading(true);

    try {
      const client = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: remember,
          autoRefreshToken: remember
        }
      });
      const result = await verifyLogin(client, nickname, password);
      const isValid = Boolean(result?.is_valid);
      const nicknameValue = result?.nickname || nickname;

      if (!isValid) {
        if (result?.reason === "nickname_not_found") {
          setMessage("暱稱不存在");
          return;
        }

        if (result?.reason === "wrong_password") {
          setMessage("密碼錯誤");
          return;
        }

        setMessage("其他錯誤");
        return;
      }

      saveLoginState({
        [config.nicknameColumn || "nickname"]: nicknameValue,
        profile_id: result?.profile_id
      }, remember);
      window.location.href = `office.html?nickname=${encodeURIComponent(nicknameValue)}`;
    } catch (error) {
       setMessage(error?.isSupabaseConnectionError ? error.message : error.message);
      //setMessage(error?.isSupabaseConnectionError ? error.message : "其他錯誤");
    } finally {
      setLoading(false);
    }
  });
})();
