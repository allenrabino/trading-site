export const CHART_TIMEFRAMES = {
  '1m': { label: '1m', days: 1, intervalMs: 60 * 1000 },
  '5m': { label: '5m', days: 1, intervalMs: 5 * 60 * 1000 },
  '15m': { label: '15m', days: 1, intervalMs: 15 * 60 * 1000 },
  '30m': { label: '30m', days: 1, intervalMs: 30 * 60 * 1000 },
  '1h': { label: '1h', days: 7, intervalMs: 60 * 60 * 1000 },
  Day: { label: 'Day', days: 30, intervalMs: 24 * 60 * 60 * 1000 },
  Month: { label: 'Month', days: 365, intervalMs: 30 * 24 * 60 * 60 * 1000 },
};

export const MA_COLORS = {
  ma5: '#ff9800',
  ma10: '#9c27b0',
  ma30: '#2196f3',
  ma60: '#e91e63',
  volMa5: '#ff9800',
  volMa10: '#9c27b0',
  volMa20: '#2196f3',
};

function alignVolumeMap(volumes) {
  const map = new Map();
  for (const point of volumes ?? []) {
    const ts = typeof point.time === 'number' ? point.time : new Date(point.time).getTime();
    map.set(ts, point.volume ?? 0);
  }
  return map;
}

export function buildCandles(prices, volumes = [], intervalMs) {
  if (!prices?.length) return [];

  const volumeByTime = alignVolumeMap(volumes);
  const buckets = new Map();

  for (const point of prices) {
    const ts = typeof point.time === 'number' ? point.time : new Date(point.time).getTime();
    const price = point.price;
    const bucket = Math.floor(ts / intervalMs) * intervalMs;

    if (!buckets.has(bucket)) {
      buckets.set(bucket, {
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volumeByTime.get(ts) ?? 0,
      });
      continue;
    }

    const candle = buckets.get(bucket);
    candle.high = Math.max(candle.high, price);
    candle.low = Math.min(candle.low, price);
    candle.close = price;
    candle.volume += volumeByTime.get(ts) ?? 0;
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, candle]) => ({
      time: Math.floor(bucket / 1000),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }));
}

export function computeMA(candles, period, key = 'close') {
  if (!candles.length || period < 1) return [];

  const result = [];
  for (let i = period - 1; i < candles.length; i += 1) {
    const slice = candles.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, item) => sum + item[key], 0) / period;
    result.push({ time: candles[i].time, value: avg });
  }
  return result;
}

export function getChartStats(candles) {
  if (!candles.length) {
    return { high: 0, low: 0, volume: 0, diff: 0, current: 0 };
  }

  const high = Math.max(...candles.map(c => c.high));
  const low = Math.min(...candles.map(c => c.low));
  const volume = candles.reduce((sum, c) => sum + (c.volume ?? 0), 0);
  const first = candles[0];
  const last = candles[candles.length - 1];
  const diff = first.open ? ((last.close - first.open) / first.open) * 100 : 0;

  return {
    high,
    low,
    volume,
    diff,
    current: last.close,
  };
}

export function formatChartPrice(value) {
  if (value == null || Number.isNaN(value)) return '0.00';
  if (value >= 1000) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return value.toFixed(6);
}

export function formatChartVolume(value) {
  if (value == null || Number.isNaN(value)) return '0';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return Math.round(value).toLocaleString('en-US');
}

export function getPriceFormat(price) {
  if (!price || price <= 0) return { precision: 2, minMove: 0.01 };
  if (price >= 1000) return { precision: 2, minMove: 0.01 };
  if (price >= 1) return { precision: 4, minMove: 0.0001 };
  if (price >= 0.01) return { precision: 6, minMove: 0.000001 };
  return { precision: 8, minMove: 0.00000001 };
}
