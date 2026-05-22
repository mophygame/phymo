(function () {
  const LOGIN_PAGE = "index.html";
  const VERIFIED_KEY = "phymo-login-verified";
  const NICKNAME_KEY = "phymo-user-nickname";

  function getStoredValue(key) {
    return window.PhymoStorage?.get(key) || null;
  }

  function isVerified() {
    return getStoredValue(VERIFIED_KEY) === "1" && Boolean(getStoredValue(NICKNAME_KEY));
  }

  if (!isVerified()) {
    window.location.replace(LOGIN_PAGE);
  }
})();
