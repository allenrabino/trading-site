export const DEFAULT_TRADE_DURATION_SEC = 7 * 24 * 60 * 60;
export const MIN_TRADE_DURATION_SEC = 60;
export const MAX_TRADE_DURATION_SEC = 365 * 24 * 60 * 60;

export function durationPartsToSeconds(days, hours, minutes) {
  const d = Math.max(0, parseInt(days, 10) || 0);
  const h = Math.max(0, parseInt(hours, 10) || 0);
  const m = Math.max(0, parseInt(minutes, 10) || 0);
  return d * 86400 + h * 3600 + m * 60;
}

export function secondsToDurationParts(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return { days, hours, minutes };
}

export function formatDuration(seconds) {
  const { days, hours, minutes } = secondsToDurationParts(seconds);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) return '< 1m';
  return parts.join(' ');
}

export function formatRemaining(seconds) {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getTradeRemainingSeconds(trade) {
  if (!trade.duration_sec || !trade.created_date) return null;
  const endsAt = new Date(trade.created_date).getTime() + trade.duration_sec * 1000;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export function validateDurationSeconds(durationSec) {
  if (!durationSec || durationSec < MIN_TRADE_DURATION_SEC) {
    return 'Minimum duration is 1 minute';
  }
  if (durationSec > MAX_TRADE_DURATION_SEC) {
    return 'Maximum duration is 365 days';
  }
  return null;
}
