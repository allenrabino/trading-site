import { calculateHoldings, getHoldingAmount, roundAmount, roundValue } from '@/lib/portfolio';

const USERS_KEY = 'trading_users';
const TOKEN_KEY = 'trading_access_token';
const PENDING_OTP_KEY = 'trading_pending_otp';
const DEFAULT_BALANCE = 10000;
const STARTER_BTC_INVESTMENT = 10000;
const FALLBACK_BTC_PRICE = 95000;

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

async function fetchBtcPrice() {
  try {
    const response = await fetch('/api/crypto/markets');
    if (!response.ok) return FALLBACK_BTC_PRICE;
    const data = await response.json();
    const btc = data.find((coin) => coin.id === 'bitcoin');
    return btc?.current_price ?? FALLBACK_BTC_PRICE;
  } catch {
    return FALLBACK_BTC_PRICE;
  }
}

async function seedStarterBtcHolding(userId) {
  const users = getUsers();
  const userIndex = users.findIndex((entry) => entry.id === userId);
  if (userIndex === -1 || users[userIndex].starterPortfolioSeeded) return;

  const tradesKey = userStorageKey('trading_trades', userId);
  const trades = readJson(tradesKey, []);
  if (trades.length > 0) {
    users[userIndex].starterPortfolioSeeded = true;
    saveUsers(users);
    return;
  }

  const btcPrice = await fetchBtcPrice();
  const amount = roundAmount(STARTER_BTC_INVESTMENT / btcPrice);

  trades.push({
    id: generateId(),
    created_date: new Date().toISOString(),
    coin_id: 'bitcoin',
    coin_symbol: 'BTC',
    coin_name: 'Bitcoin',
    type: 'buy',
    amount,
    price_per_coin: roundValue(btcPrice),
    total_value: STARTER_BTC_INVESTMENT,
    status: 'completed',
  });

  writeJson(tradesKey, trades);
  users[userIndex].balance = Math.max(0, getUserBalance(userId) - STARTER_BTC_INVESTMENT);
  users[userIndex].starterPortfolioSeeded = true;
  saveUsers(users);
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

      if (prefix === 'trading_trades') {
        const amount = roundAmount(data.amount);
        const price = roundValue(data.price_per_coin);
        const totalValue = roundValue(amount * price);

        if (amount <= 0 || price <= 0 || totalValue <= 0) {
          return Promise.reject(new Error('Invalid trade amount'));
        }

        if (data.type === 'buy') {
          const balance = getUserBalance(userId);
          if (totalValue > balance + 0.01) {
            return Promise.reject(new Error('Insufficient balance'));
          }
          setUserBalance(userId, roundValue(balance - totalValue));
        } else if (data.type === 'sell') {
          const holdings = calculateHoldings(items);
          const held = getHoldingAmount(holdings, data.coin_id);
          if (amount > held + 0.00000001) {
            return Promise.reject(new Error('Insufficient holdings'));
          }
          setUserBalance(userId, roundValue(getUserBalance(userId) + totalValue));
        } else {
          return Promise.reject(new Error('Invalid trade type'));
        }

        const record = {
          id: generateId(),
          created_date: new Date().toISOString(),
          coin_id: data.coin_id,
          coin_symbol: data.coin_symbol,
          coin_name: data.coin_name,
          type: data.type,
          amount,
          price_per_coin: price,
          total_value: totalValue,
          status: 'completed',
        };
        items.push(record);
        writeJson(key, items);
        return Promise.resolve(record);
      }

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
    await seedStarterBtcHolding(userId);
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
    await seedStarterBtcHolding(user.id);
    return toSafeUser(ensureUserBalance(getUserRecord(user.id)));
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
    await seedStarterBtcHolding(user.id);
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
