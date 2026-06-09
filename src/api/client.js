const USERS_KEY = 'trading_users';
const TOKEN_KEY = 'trading_access_token';
const PENDING_OTP_KEY = 'trading_pending_otp';
const DEFAULT_BALANCE = 10000;

const storage = typeof window !== 'undefined' ? window.localStorage : null;

function readJson(key, fallback) {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readJson(USERS_KEY, []);
}

function saveUsers(users) {
  writeJson(USERS_KEY, users);
}

function getCurrentUserId() {
  return storage?.getItem(TOKEN_KEY) ?? null;
}

function userStorageKey(prefix, userId) {
  return `${prefix}_${userId}`;
}

function generateId() {
  return crypto.randomUUID();
}

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error('Email is required');
  }
  return normalized;
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return getUsers().find(
    (entry) => entry.email && entry.email.toLowerCase() === normalized
  );
}

function getInitialBalance() {
  return DEFAULT_BALANCE;
}

function getUserRecord(userId) {
  return getUsers().find((entry) => entry.id === userId);
}

function getUserBalance(userId) {
  const user = getUserRecord(userId);
  if (!user) return 0;
  if (user.balance == null) return getInitialBalance();
  return user.balance;
}

function setUserBalance(userId, balance) {
  const users = getUsers();
  const index = users.findIndex((entry) => entry.id === userId);
  if (index === -1) return;
  users[index].balance = balance;
  saveUsers(users);
}

function ensureUserBalance(user) {
  const users = getUsers();
  const index = users.findIndex((entry) => entry.id === user.id);
  if (index === -1) return user;

  if (users[index].balance == null) {
    users[index].balance = getInitialBalance();
    saveUsers(users);
    return { ...users[index], password: undefined };
  }

  return user;
}

function toSafeUser(user) {
  const { password: _, ...safeUser } = user;
  return { ...safeUser, balance: getUserBalance(user.id) };
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

      if (data.type === 'buy') {
        const balance = getUserBalance(userId);
        if (data.total_value > balance) {
          return Promise.reject(new Error('Insufficient balance'));
        }
        setUserBalance(userId, balance - data.total_value);
      } else if (data.type === 'sell') {
        setUserBalance(userId, getUserBalance(userId) + data.total_value);
      }

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
    if (!user || !user.email) {
      storage?.removeItem(TOKEN_KEY);
      const error = new Error('Not authenticated');
      error.status = 401;
      throw error;
    }
    return toSafeUser(ensureUserBalance(user));
  },

  async loginViaEmailPassword(email, password) {
    if (!password) {
      throw new Error('Password is required');
    }
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    storage?.setItem(TOKEN_KEY, user.id);
    return toSafeUser(ensureUserBalance(user));
  },

  async register({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    if (getUsers().some((entry) => entry.email && entry.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists');
    }
    writeJson(PENDING_OTP_KEY, { email: normalizedEmail, password, otp: '123456' });
  },

  async verifyOtp({ email, otpCode }) {
    const normalizedEmail = normalizeEmail(email);
    const pending = readJson(PENDING_OTP_KEY, null);
    if (!pending || pending.email !== normalizedEmail) {
      throw new Error('Invalid verification code');
    }
    if (otpCode !== pending.otp) {
      throw new Error('Invalid verification code');
    }

    const users = getUsers();
    const user = {
      id: generateId(),
      email: pending.email,
      password: pending.password,
      role: 'user',
      balance: getInitialBalance(),
      created_date: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    storage?.removeItem(PENDING_OTP_KEY);

    const token = user.id;
    storage?.setItem(TOKEN_KEY, token);
    return { access_token: token };
  },

  async resendOtp(email) {
    const normalizedEmail = normalizeEmail(email);
    const pending = readJson(PENDING_OTP_KEY, null);
    if (!pending || pending.email !== normalizedEmail) {
      throw new Error('No pending verification for this email');
    }
  },

  setToken(token) {
    storage?.setItem(TOKEN_KEY, token);
  },

  logout() {
    storage?.removeItem(TOKEN_KEY);
  },

  redirectToLogin() {
    window.location.href = '/login';
  },

  async resetPasswordRequest(_email) {
    return { success: true };
  },

  async resetPassword({ resetToken, newPassword }) {
    if (!resetToken) {
      throw new Error('Invalid reset token');
    }
    const users = getUsers();
    const user = users.find((entry) => entry.resetToken === resetToken);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    user.password = newPassword;
    delete user.resetToken;
    saveUsers(users);
  },
};

export const api = {
  auth,
  entities: {
    Trade: createEntityStore('trading_trades'),
    Watchlist: createEntityStore('trading_watchlist'),
  },
};
