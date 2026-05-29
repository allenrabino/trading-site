const USERS_KEY = 'trading_users';
const TOKEN_KEY = 'trading_access_token';
const PENDING_OTP_KEY = 'trading_pending_otp';

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
    const diff = new Date(a.created_date) - new Date(b.created_date);
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
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async loginViaEmailPassword(email, password) {
    const user = getUsers().find(
      (entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password
    );
    if (!user) {
      throw new Error('Invalid email or password');
    }
    localStorage.setItem(TOKEN_KEY, user.id);
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async register({ email, password }) {
    const normalizedEmail = email.toLowerCase();
    if (getUsers().some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists');
    }
    writeJson(PENDING_OTP_KEY, { email: normalizedEmail, password, otp: '123456' });
  },

  async verifyOtp({ email, otpCode }) {
    const pending = readJson(PENDING_OTP_KEY, null);
    if (!pending || pending.email !== email.toLowerCase()) {
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
      created_date: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    localStorage.removeItem(PENDING_OTP_KEY);

    const token = user.id;
    localStorage.setItem(TOKEN_KEY, token);
    return { access_token: token };
  },

  async resendOtp(email) {
    const pending = readJson(PENDING_OTP_KEY, null);
    if (!pending || pending.email !== email.toLowerCase()) {
      throw new Error('No pending verification for this email');
    }
  },

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  redirectToLogin() {
    window.location.href = '/login';
  },

  loginWithProvider() {
    throw new Error('Social login is not available in local demo mode');
  },

  async resetPasswordRequest() {
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
