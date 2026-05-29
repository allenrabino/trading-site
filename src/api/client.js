const USERS_KEY = 'trading_users';
const TOKEN_KEY = 'trading_access_token';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readJson(USERS_KEY, []);
}

function saveUsers(users) {
  writeJson(USERS_KEY, users);
}

function getCurrentUserId() {
  return localStorage.getItem(TOKEN_KEY);
}

function userStorageKey(prefix, userId) {
  return `${prefix}_${userId}`;
}

function generateId() {
  return crypto.randomUUID();
}

function sortByCreatedDate(items, sort) {
  const descending = sort?.startsWith('-');
  return [...items].sort((a, b) => {
    const diff = new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
    return descending ? -diff : diff;
  });
}

function createEntityStore(prefix) {
  return {
    list(sort, limit) {
      const userId = getCurrentUserId();
      if (!userId) return Promise.resolve([]);
      const items = readJson(userStorageKey(prefix, userId), []);
      const sorted = sortByCreatedDate(items, sort);
      return Promise.resolve(limit ? sorted.slice(0, limit) : sorted);
    },
    create(data) {
      const userId = getCurrentUserId();
      if (!userId) return Promise.reject(new Error('Not authenticated'));
      const key = userStorageKey(prefix, userId);
      const items = readJson(key, []);
      const record = {
        id: generateId(),
        created_date: new Date().toISOString(),
        ...data,
      };
      items.push(record);
      writeJson(key, items);
      return Promise.resolve(record);
    },
    delete(id) {
      const userId = getCurrentUserId();
      if (!userId) return Promise.reject(new Error('Not authenticated'));
      const key = userStorageKey(prefix, userId);
      const items = readJson(key, []);
      writeJson(key, items.filter((item) => item.id !== id));
      return Promise.resolve();
    },
  };
}

const auth = {
  async me() {
    const userId = getCurrentUserId();
    if (!userId) {
      const error = new Error('Not authenticated');
      error.status = 401;
      throw error;
    }
    const user = getUsers().find((entry) => entry.id === userId);
    if (!user) {
      localStorage.removeItem(TOKEN_KEY);
      const error = new Error('Not authenticated');
      error.status = 401;
      throw error;
    }
    return user;
  },

  async connectWallet(address) {
    if (!address) {
      throw new Error('Wallet address is required');
    }

    const normalized = address.toLowerCase();
    const users = getUsers();
    let user = users.find((entry) => entry.walletAddress?.toLowerCase() === normalized);

    if (!user) {
      user = {
        id: generateId(),
        walletAddress: normalized,
        role: 'user',
        created_date: new Date().toISOString(),
      };
      users.push(user);
      saveUsers(users);
    }

    localStorage.setItem(TOKEN_KEY, user.id);
    return user;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  redirectToLogin() {
    window.location.href = '/login';
  },
};

export const api = {
  auth,
  entities: {
    Trade: createEntityStore('trading_trades'),
    Watchlist: createEntityStore('trading_watchlist'),
  },
};
