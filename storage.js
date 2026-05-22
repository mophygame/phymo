(function () {
  const WINDOW_NAME_KEY = "__phymo_storage__";

  function safeArea(type) {
    try {
      const area = window[type];
      const testKey = "__phymo_storage_test__";
      area.setItem(testKey, "1");
      area.removeItem(testKey);
      return area;
    } catch (error) {
      return null;
    }
  }

  function readWindowName() {
    try {
      if (!window.name) return {};
      const parsed = JSON.parse(window.name);
      return parsed && typeof parsed === "object" && parsed[WINDOW_NAME_KEY]
        ? parsed[WINDOW_NAME_KEY]
        : {};
    } catch (error) {
      return {};
    }
  }

  function writeWindowName(data) {
    try {
      let parsed = {};
      if (window.name) {
        try {
          parsed = JSON.parse(window.name) || {};
        } catch (error) {
          parsed = {};
        }
      }

      parsed[WINDOW_NAME_KEY] = data;
      window.name = JSON.stringify(parsed);
    } catch (error) {
      // If even window.name is blocked, storage simply becomes best effort.
    }
  }

  function fallbackGet(key) {
    return readWindowName()[key] || null;
  }

  function fallbackSet(key, value) {
    const data = readWindowName();
    data[key] = String(value);
    writeWindowName(data);
  }

  function fallbackRemove(key) {
    const data = readWindowName();
    delete data[key];
    writeWindowName(data);
  }

  const local = safeArea("localStorage");
  const session = safeArea("sessionStorage");

  window.PhymoStorage = {
    get(key) {
      try {
        return session?.getItem(key) || local?.getItem(key) || fallbackGet(key);
      } catch (error) {
        return fallbackGet(key);
      }
    },

    set(key, value, options = {}) {
      const shouldPersist = Boolean(options.persist);
      const preferred = shouldPersist ? local : session;

      try {
        if (preferred) {
          preferred.setItem(key, String(value));
          return;
        }
      } catch (error) {
        // Try the secondary store before falling back.
      }

      if (shouldPersist) {
        try {
          if (session) {
            session.setItem(key, String(value));
            return;
          }
        } catch (error) {
          // Fall back to window.name.
        }
      }

      fallbackSet(key, value);
    },

    remove(key) {
      try {
        session?.removeItem(key);
      } catch (error) {
        // Ignore inaccessible storage.
      }

      try {
        local?.removeItem(key);
      } catch (error) {
        // Ignore inaccessible storage.
      }

      fallbackRemove(key);
    }
  };
})();
