import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from 'lightweight-charts';
import { cn } from '@/lib/utils';
import { useCoinChart } from '@/hooks/useCryptoPrices';
import CoinPicker from '@/components/trade/CoinPicker';
import {
  CHART_TIMEFRAMES,
  MA_COLORS,
  buildCandles,
  computeMA,
  getChartStats,
  formatChartPrice,
  formatChartVolume,
  getPriceFormat,
} from '@/lib/chartUtils';

const TIMEFRAMES = Object.keys(CHART_TIMEFRAMES);

function MaLabel({ label, color, value }) {
  return (
    <span className="text-[10px] font-mono whitespace-nowrap">
      <span style={{ color }}>{label}</span>
      <span className="text-gray-600 ml-0.5">{value != null ? formatChartPrice(value) : '--'}</span>
    </span>
  );
}

export default function PriceChart({ coin, coins = [], onCoinChange, onBuy }) {
  const [timeframe, setTimeframe] = useState('5m');
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  const { data: chartRaw, isLoading } = useCoinChart(coin?.id, timeframe);
  const intervalMs = CHART_TIMEFRAMES[timeframe]?.intervalMs ?? CHART_TIMEFRAMES['5m'].intervalMs;

  const candles = useMemo(() => {
    if (!chartRaw?.prices?.length) return [];
    return buildCandles(chartRaw.prices, chartRaw.volumes, intervalMs);
  }, [chartRaw, intervalMs]);

  const ma5 = useMemo(() => computeMA(candles, 5), [candles]);
  const ma10 = useMemo(() => computeMA(candles, 10), [candles]);
  const ma30 = useMemo(() => computeMA(candles, 30), [candles]);
  const ma60 = useMemo(() => computeMA(candles, 60), [candles]);
  const volMa5 = useMemo(() => computeMA(candles, 5, 'volume'), [candles]);
  const volMa10 = useMemo(() => computeMA(candles, 10, 'volume'), [candles]);
  const volMa20 = useMemo(() => computeMA(candles, 20, 'volume'), [candles]);

  const stats = useMemo(() => getChartStats(candles), [candles]);
  const displayPrice = coin?.price ?? stats.current;
  const displayChange = coin?.change24h ?? stats.diff;
  const isPositive = displayChange >= 0;

  const lastMa = {
    ma5: ma5.at(-1)?.value,
    ma10: ma10.at(-1)?.value,
    ma30: ma30.at(-1)?.value,
    ma60: ma60.at(-1)?.value,
    volMa5: volMa5.at(-1)?.value,
    volMa10: volMa10.at(-1)?.value,
    volMa20: volMa20.at(-1)?.value,
  };

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !candles.length) return undefined;

    const referencePrice = stats.current || coin?.price || candles.at(-1)?.close || 1;
    const priceFormat = getPriceFormat(referencePrice);

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#666666',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#f0f0f0', style: 2 },
        horzLines: { color: '#f0f0f0', style: 2 },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: '#eeeeee',
        minimumWidth: 72,
        scaleMargins: { top: 0.05, bottom: 0.25 },
        autoScale: true,
        alignLabels: true,
        ticksVisible: true,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: timeframe === '1m' || timeframe === '5m',
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#cccccc', width: 1, style: 2, labelVisible: true },
        horzLine: { color: '#cccccc', width: 1, style: 2, labelVisible: true },
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceFormat: {
        type: 'price',
        ...priceFormat,
      },
      lastValueVisible: true,
      priceLineVisible: true,
    });
    candleSeries.setData(candles);

    candleSeries.createPriceLine({
      price: stats.current,
      color: '#555555',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '',
    });

    const addMaLine = (data, color) => {
      if (!data.length) return;
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          ...priceFormat,
        },
      });
      series.setData(data);
    };

    addMaLine(ma5, MA_COLORS.ma5);
    addMaLine(ma10, MA_COLORS.ma10);
    addMaLine(ma30, MA_COLORS.ma30);
    addMaLine(ma60, MA_COLORS.ma60);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale('volume').applyOptions({
      visible: false,
      scaleMargins: { top: 0.82, bottom: 0 },
      borderVisible: false,
    });

    volumeSeries.setData(
      candles.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)',
      }))
    );

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0]?.contentRect ?? {};
      if (width && height) {
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, ma5, ma10, ma30, ma60, stats.current, timeframe, coin?.price]);

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        {coins.length > 0 && onCoinChange ? (
          <div className="mb-3">
            <CoinPicker coins={coins} value={coin?.id} onChange={onCoinChange} />
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-900 mb-2">{coin?.name}</p>
        )}

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900 font-mono">
            {formatChartPrice(displayPrice)}
          </span>
          <span className={cn('text-sm font-medium font-mono', isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]')}>
            {isPositive ? '+' : ''}{displayChange.toFixed(4)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">High</span>
            <span className="font-mono text-gray-800">{formatChartPrice(stats.high)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Low</span>
            <span className="font-mono text-gray-800">{formatChartPrice(stats.low)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Volumes</span>
            <span className="font-mono text-gray-800">{formatChartVolume(stats.volume)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Diff</span>
            <span className={cn('font-mono', isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]')}>
              {isPositive ? '+' : ''}{stats.diff.toFixed(4)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                'shrink-0 text-xs font-medium px-1 py-0.5 transition-colors',
                timeframe === tf ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {CHART_TIMEFRAMES[tf].label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-0 pt-1 pb-0 bg-white">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1 px-3">
          <MaLabel label="MA5" color={MA_COLORS.ma5} value={lastMa.ma5} />
          <MaLabel label="MA10" color={MA_COLORS.ma10} value={lastMa.ma10} />
          <MaLabel label="MA30" color={MA_COLORS.ma30} value={lastMa.ma30} />
          <MaLabel label="MA60" color={MA_COLORS.ma60} value={lastMa.ma60} />
        </div>

        <div className="relative h-[300px]">
          {isLoading && !candles.length ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : null}
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-3 pb-2 border-t border-gray-100 pt-1">
          <MaLabel label="VOL MA5" color={MA_COLORS.volMa5} value={lastMa.volMa5} />
          <MaLabel label="MA10" color={MA_COLORS.volMa10} value={lastMa.volMa10} />
          <MaLabel label="MA20" color={MA_COLORS.volMa20} value={lastMa.volMa20} />
        </div>
      </div>

      {onBuy && (
        <div className="p-3 pt-0 bg-white">
          <button
            type="button"
            onClick={onBuy}
            className="w-full h-11 primary-gradient text-primary-foreground font-bold text-base rounded-lg hover:opacity-90 transition-opacity"
          >
            Buy
          </button>
        </div>
      )}
    </div>
  );
}
