// A real login session needs to be remembered somewhere. For the standalone apps
// (/customer, /driver) that's localStorage, like any normal web app — sign in once,
// stay signed in across visits. Live Demo is the one place that deliberately does NOT
// want that: it puts a Customer pane and a Driver pane on the same page, and a real
// browser only has one localStorage per origin, so both panes would fight over the
// same "logged in as" slot. Each Live Demo pane instead gets its own in-memory store
// (this same shape, just backed by a plain object instead of localStorage) that
// disappears when the tab closes — appropriate for a demo harness, not for the real app.

export function createLocalStorageSession(key) {
  return {
    get() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore — private browsing / storage disabled
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

export function createMemorySession() {
  let value = null;
  return {
    get: () => value,
    set: (v) => {
      value = v;
    },
    clear: () => {
      value = null;
    },
  };
}
