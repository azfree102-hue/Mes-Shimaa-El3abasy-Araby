(() => {
  "use strict";

  const API_BASE = String(window.PLATFORM_API_URL || "").replace(/\/+$/, "");
  const API_URL = API_BASE ? `${API_BASE}/api/sync/` : "";

  const SYNC_KEYS = new Set([
    "teacherGroups",
    "teacherStudents",
    "teacherJoinRequests",
    "teacherLessons",
    "teacherTests",
    "teacherFiles",
    "teacherClasses",
    "teacherNotifications",
    "teacherPayments",
    "teacherChats",
    "teacherGroupChats",
    "studentAccounts"
  ]);

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const timers = new Map();
  const pending = new Set();
  let ready = false;

  function parseJSON(value) {
    try { return JSON.parse(value); } catch { return value; }
  }

  async function sendKey(key, value) {
    if (!API_URL || !SYNC_KEYS.has(key)) return false;
    pending.add(key);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: parseJSON(value) })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return true;
    } catch (error) {
      console.warn("Cloud sync failed:", error);
      return false;
    } finally {
      pending.delete(key);
    }
  }

  function scheduleSync(key, value) {
    if (!ready || !SYNC_KEYS.has(key)) return;
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(async () => {
      timers.delete(key);
      await sendKey(key, value);
    }, 300));
  }

  async function pullFromServer() {
    if (!API_URL) return;

    try {
      const response = await fetch(API_URL, {
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      const serverData = payload && payload.data && typeof payload.data === "object"
        ? payload.data
        : {};

      let changed = false;

      for (const key of SYNC_KEYS) {
        if (pending.has(key)) continue;

        if (Object.prototype.hasOwnProperty.call(serverData, key)) {
          const nextRaw = JSON.stringify(serverData[key]);
          const currentRaw = localStorage.getItem(key);

          if (currentRaw !== nextRaw) {
            originalSetItem.call(localStorage, key, nextRaw);
            changed = true;
          }
        }
      }

      if (changed) {
        window.dispatchEvent(new CustomEvent("cloudDataUpdated"));
      }
    } catch (error) {
      console.warn("Cloud refresh failed:", error);
    }
  }

  async function loadFromServer() {
    if (!API_URL) {
      ready = true;
      window.dispatchEvent(new CustomEvent("storageReady"));
      return;
    }

    try {
      const response = await fetch(API_URL, {
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      const serverData = payload && payload.data && typeof payload.data === "object"
        ? payload.data
        : {};

      // Existing server values are shared values and therefore win.
      // A key that exists only on this device is uploaded once to seed the DB.
      for (const key of SYNC_KEYS) {
        const localValue = localStorage.getItem(key);

        if (Object.prototype.hasOwnProperty.call(serverData, key)) {
          originalSetItem.call(
            localStorage,
            key,
            JSON.stringify(serverData[key])
          );
        } else if (localValue !== null) {
          await sendKey(key, localValue);
        }
      }
    } catch (error) {
      console.warn(
        "Could not load cloud data. Local data will remain available:",
        error
      );
    } finally {
      ready = true;
      window.dispatchEvent(new CustomEvent("storageReady"));
    }
  }

  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage) scheduleSync(key, value);
  };

  Storage.prototype.removeItem = function(key) {
    originalRemoveItem.call(this, key);
    if (this === localStorage && ready && SYNC_KEYS.has(key)) {
      clearTimeout(timers.get(key));
      timers.set(key, setTimeout(async () => {
        timers.delete(key);
        await sendKey(key, null);
      }, 300));
    }
  };

  window.storageReady = loadFromServer();

  // Keep open dashboards in sync across phones/computers.
  setInterval(pullFromServer, 5000);
})();
