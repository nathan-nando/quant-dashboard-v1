"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries, HistogramSeries, createSeriesMarkers } from "lightweight-charts";
import { useGlobalState } from '../contexts/GlobalStateContext';
import { API_BASE_URL } from '@/config/env';
import { JAKARTA_OFFSET_SECONDS } from '../utils/date';

const TIMEFRAME_CONFIGS: Record<string, { seconds: number; label: string; isRange?: boolean }> = {
  "RANGE_1.5": { seconds: 30, label: "RANGE", isRange: true },
  "M1": { seconds: 60, label: "M1" },
  "M5": { seconds: 300, label: "M5" },
  "M15": { seconds: 900, label: "M15" },
  "M30": { seconds: 1800, label: "M30" },
  "H1": { seconds: 3600, label: "H1" },
  "H4": { seconds: 14400, label: "H4" },
  "D1": { seconds: 86400, label: "D1" }
};

interface HoverCandleInfo {
  x: number;
  y: number;
  dateStr: string;
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePct: number;
  range: number;
  volume?: number;
}

export default function CandlestickChart({ 
  symbol = "XAUUSD", 
  initialTimeframe = "M15",
  onHistoryUpdate, 
  signals = [],
  trades = [],
  maxHistoryLimit,
  visibleBarsCount
}: { 
  symbol?: string, 
  initialTimeframe?: string,
  onHistoryUpdate?: (data: any[]) => void, 
  signals?: any[],
  trades?: any[],
  maxHistoryLimit?: number,
  visibleBarsCount?: number
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastCandleRef = useRef<any>(null);
  const dataRef = useRef<any[]>([]);
  const markersRef = useRef<any>(null);
  const { state } = useGlobalState();
  const [isInitialized, setIsInitialized] = useState(false);
  const [timeframe, setTimeframe] = useState<string>(initialTimeframe);
  const [marketStatus, setMarketStatus] = useState<string>("OPEN");
  const [showSignals, setShowSignals] = useState<boolean>(true);
  const [showTrades, setShowTrades] = useState<boolean>(true);
  const [hoverInfo, setHoverInfo] = useState<HoverCandleInfo | null>(null);

  // Reset chart and markers when timeframe changes
  useEffect(() => {
      if (seriesRef.current && volumeSeriesRef.current) {
          seriesRef.current.setData([]);
          volumeSeriesRef.current.setData([]);
          lastCandleRef.current = null;
          dataRef.current = [];
          setHoverInfo(null);
          if (markersRef.current) {
              try { markersRef.current.setMarkers([]); } catch (_) {}
          }
          setIsInitialized(false);
      }
  }, [timeframe]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#c6c6c6",
        fontSize: 10,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: "#393939" },
        horzLines: { color: "#393939" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.18,
          bottom: 0.15,
        },
      },
      crosshair: {
        vertLine: {
          color: '#6f6f6f',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: '#6f6f6f',
          width: 1,
          style: 3,
        },
      },
    });
    
    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#24a148", 
      downColor: "#fa4d56", 
      borderVisible: false,
      wickUpColor: "#24a148",
      wickDownColor: "#fa4d56",
    });
    seriesRef.current = candlestickSeries;

    // Create Volume series overlay at the bottom
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    
    volumeSeries.priceScale().applyOptions({
        scaleMargins: {
            top: 0.8,
            bottom: 0,
        },
    });
    volumeSeriesRef.current = volumeSeries;

    // Subscribe to crosshair movement for candlestick popover
    chart.subscribeCrosshairMove((param) => {
      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > (chartContainerRef.current?.clientWidth || 0) ||
        param.point.y < 0 ||
        param.point.y > (chartContainerRef.current?.clientHeight || 0)
      ) {
        setHoverInfo(null);
        return;
      }

      const candleData = param.seriesData.get(candlestickSeries) as any;
      if (!candleData || candleData.open === undefined) {
        setHoverInfo(null);
        return;
      }

      const volData = param.seriesData.get(volumeSeries) as any;

      // The time in param.time is the Jakarta-shifted unix seconds timestamp
      const tSec = Number(param.time);
      const d = new Date(tSec * 1000);
      
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const day = d.getUTCDate().toString().padStart(2, '0');
      const month = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      const hours = d.getUTCHours().toString().padStart(2, '0');
      const mins = d.getUTCMinutes().toString().padStart(2, '0');
      const secs = d.getUTCSeconds().toString().padStart(2, '0');

      const open = Number(candleData.open);
      const high = Number(candleData.high);
      const low = Number(candleData.low);
      const close = Number(candleData.close);
      const change = close - open;
      const changePct = open > 0 ? (change / open) * 100 : 0;
      const range = high - low;

      setHoverInfo({
        x: param.point.x,
        y: param.point.y,
        dateStr: `${day} ${month} ${year}`,
        timeStr: `${hours}:${mins}:${secs}`,
        open,
        high,
        low,
        close,
        change,
        changePct,
        range,
        volume: volData?.value !== undefined ? Number(volData.value) : undefined
      });
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.resize(newRect.width, newRect.height);
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Fetch real historical data when timeframe changes
  useEffect(() => {
      let isMounted = true;
      
      const fetchHistory = async () => {
          setIsInitialized(false);
          try {
              const tfConfig = TIMEFRAME_CONFIGS[timeframe] || { seconds: 300, isRange: false };
              const tfSeconds = tfConfig.seconds;
              let limit = maxHistoryLimit || 120;
              
              const timestamps: number[] = [];
              if (signals && signals.length > 0) {
                  signals.forEach(s => {
                      if (s.timestamp) {
                          const t = new Date(s.timestamp).getTime();
                          if (!isNaN(t)) timestamps.push(t);
                      }
                  });
              }
              if (trades && trades.length > 0) {
                  trades.forEach(t => {
                      if (t.entry_time) {
                          const tEnt = new Date(t.entry_time).getTime();
                          if (!isNaN(tEnt)) timestamps.push(tEnt);
                      }
                      if (t.exit_time) {
                          const tExt = new Date(t.exit_time).getTime();
                          if (!isNaN(tExt)) timestamps.push(tExt);
                      }
                  });
              }

              if (!maxHistoryLimit && timestamps.length > 0) {
                  const minTimestamp = Math.min(...timestamps);
                  const timeSinceEarliest = Math.floor(Date.now() / 1000) - Math.floor(minTimestamp / 1000);
                  const candlesNeeded = Math.ceil(timeSinceEarliest / tfSeconds) + 20;
                  
                  if (candlesNeeded > limit) {
                      limit = Math.min(candlesNeeded, 1000);
                  }
              }

              const url = `${API_BASE_URL}/dashboard/history?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`;
              
              const res = await fetch(url);
              if (!res.ok) throw new Error("Failed to fetch history");
              const data = await res.json();
              
              if (isMounted && data.length > 0 && seriesRef.current && volumeSeriesRef.current) {
                  const history: any[] = [];
                  const volumeHistory: any[] = [];
                  
                  // Ensure strictly ascending unique timestamps shifted to Jakarta Time (WIB, UTC+7)
                  let lastT = 0;
                  for (const row of data) {
                      let t = Number(row.time) + JAKARTA_OFFSET_SECONDS;
                      if (t <= lastT) {
                          t = lastT + 1;
                      }
                      lastT = t;

                      history.push({ 
                        time: t as Time, 
                        open: Number(row.open), 
                        high: Number(row.high), 
                        low: Number(row.low), 
                        close: Number(row.close),
                        rawTime: Number(row.time),
                        volume: Number(row.volume || 1)
                      });

                      volumeHistory.push({ 
                          time: t as Time, 
                          value: Number(row.volume || 1), 
                          color: Number(row.close) >= Number(row.open) ? "rgba(36, 161, 72, 0.4)" : "rgba(250, 77, 86, 0.4)" 
                      });
                  }
                  
                  seriesRef.current.setData(history);
                  volumeSeriesRef.current.setData(volumeHistory);
                  dataRef.current = history;
                  lastCandleRef.current = history[history.length - 1];
                  setIsInitialized(true);
                  if (onHistoryUpdate) onHistoryUpdate(history);
                   
                  if (visibleBarsCount && history.length > 0) {
                      setTimeout(() => {
                          chartRef.current?.timeScale().setVisibleLogicalRange({
                              from: history.length - visibleBarsCount - 0.5,
                              to: history.length + 1.5
                          });
                      }, 50);
                  }
              }
          } catch (e) {
              console.error("Error fetching history:", e);
          }
      };
      
      if (seriesRef.current && volumeSeriesRef.current) {
          seriesRef.current.setData([]);
          volumeSeriesRef.current.setData([]);
          lastCandleRef.current = null;
      }
      
      fetchHistory();
      
      return () => { isMounted = false; };
  }, [timeframe, symbol]);

  // Handle Signals, Trades & Pyramiding Event Markers
  useEffect(() => {
    if (!seriesRef.current || !isInitialized) return;

    if (!markersRef.current) {
        markersRef.current = createSeriesMarkers(seriesRef.current, []);
    }

    if (dataRef.current.length === 0) {
        markersRef.current.setMarkers([]);
        return;
    }

    const tfConfig = TIMEFRAME_CONFIGS[timeframe] || { seconds: 300, isRange: false };
    const tfSeconds = tfConfig.seconds;

    // Helper to snap unix seconds in Jakarta time to closest chart candle
    const snapToCandle = (timeJkt: number): number | null => {
        if (!dataRef.current || dataRef.current.length === 0) return null;
        const firstTime = dataRef.current[0].time as number;
        const lastTime = dataRef.current[dataRef.current.length - 1].time as number;
        
        // Prevent ancient/future timestamps beyond loaded candles
        if (timeJkt < firstTime - tfSeconds * 2 || timeJkt > lastTime + tfSeconds * 2) {
            return null;
        }

        let closest = dataRef.current[0];
        let minDiff = Math.abs((closest.time as number) - timeJkt);
        for (const c of dataRef.current) {
            const diff = Math.abs((c.time as number) - timeJkt);
            if (diff < minDiff) { minDiff = diff; closest = c; }
        }
        return closest.time as number;
    };

    interface BarMarkerSlot {
        type: 'trade_entry' | 'trade_exit' | 'signal' | 'combined';
        isBuy?: boolean;
        isProfit?: boolean;
        text: string;
        color: string;
        shape: any;
        count: number;
        netPnl?: number;
    }

    // Map of candleTime -> { below?: BarMarkerSlot, above?: BarMarkerSlot }
    // Consolidates markers per candle so texts never overlap vertically into unreadable towers
    const barMarkersMap = new Map<number, {
        below?: BarMarkerSlot;
        above?: BarMarkerSlot;
    }>();

    const getOrCreateBar = (t: number) => {
        if (!barMarkersMap.has(t)) barMarkersMap.set(t, {});
        return barMarkersMap.get(t)!;
    };

    // 1. Process Trade Entries & Exits (if showTrades is active)
    if (showTrades && trades && trades.length > 0) {
        trades.forEach(t => {
            // Trade Entry
            if (t.entry_time) {
                const entryUtc = new Date(t.entry_time).getTime() / 1000;
                if (!isNaN(entryUtc)) {
                    const entryJkt = entryUtc + JAKARTA_OFFSET_SECONDS;
                    const candleJkt = Math.floor(entryJkt / tfSeconds) * tfSeconds;
                    const targetTime = tfConfig.isRange ? Math.floor(entryJkt) : Math.floor(candleJkt);
                    const markerTime = snapToCandle(targetTime);
                    if (markerTime !== null) {
                        const bar = getOrCreateBar(markerTime);
                        const isBuy = t.direction === 'BUY';
                        const slot = isBuy ? 'below' : 'above';

                        if (!bar[slot] || bar[slot]!.type !== 'trade_entry') {
                            bar[slot] = {
                                type: 'trade_entry',
                                isBuy: isBuy,
                                text: '',
                                color: isBuy ? '#24a148' : '#fa4d56',
                                shape: isBuy ? 'arrowUp' : 'arrowDown',
                                count: 1
                            };
                        } else {
                            bar[slot]!.count += 1;
                            bar[slot]!.text = `${bar[slot]!.count}x`;
                        }
                    }
                }
            }

            // Trade Exit
            if (t.exit_time) {
                const exitUtc = new Date(t.exit_time).getTime() / 1000;
                if (!isNaN(exitUtc)) {
                    const exitJkt = exitUtc + JAKARTA_OFFSET_SECONDS;
                    const candleJkt = Math.floor(exitJkt / tfSeconds) * tfSeconds;
                    const targetTime = tfConfig.isRange ? Math.floor(exitJkt) : Math.floor(candleJkt);
                    const markerTime = snapToCandle(targetTime);
                    if (markerTime !== null) {
                        const bar = getOrCreateBar(markerTime);
                        const pnl = Number(t.pnl_money) || 0;
                        const isBuy = t.direction === 'BUY';
                        // BUY exits appear aboveBar; SELL exits appear belowBar
                        const slot = isBuy ? 'above' : 'below';

                        if (!bar[slot] || bar[slot]!.type !== 'trade_exit') {
                            bar[slot] = {
                                type: 'trade_exit',
                                netPnl: pnl,
                                count: 1,
                                text: pnl >= 0 ? `+${pnl.toFixed(1)}` : `-${Math.abs(pnl).toFixed(1)}`,
                                color: pnl >= 0 ? '#24a148' : '#fa4d56',
                                shape: 'circle'
                            };
                        } else {
                            const prev = bar[slot]!;
                            prev.count += 1;
                            prev.netPnl = (prev.netPnl || 0) + pnl;
                            const net = prev.netPnl;
                            prev.text = net >= 0 ? `+${net.toFixed(1)}` : `-${Math.abs(net).toFixed(1)}`;
                            prev.color = net >= 0 ? '#24a148' : '#fa4d56';
                        }
                    }
                }
            }
        });
    }

    // 2. Process Actionable Signals (BUY, SELL, Pyramiding +P2/+P3/+P4)
    if (showSignals && signals && signals.length > 0) {
        signals.forEach(s => {
            if (!s.timestamp) return;
            // Ignore NEUTRAL and SHADOW signals to prevent chart pollution
            if (s.direction !== 'BUY' && s.direction !== 'SELL') return;
            if (s.status === 'SHADOW') return;

            const timeRawUtc = new Date(s.timestamp).getTime() / 1000;
            if (isNaN(timeRawUtc)) return;
            const timeRawJkt = timeRawUtc + JAKARTA_OFFSET_SECONDS;
            const currentCandleTimeJkt = Math.floor(timeRawJkt / tfSeconds) * tfSeconds;
            const targetTime = tfConfig.isRange ? Math.floor(timeRawJkt) : Math.floor(currentCandleTimeJkt);
            const markerTime = snapToCandle(targetTime);
            if (markerTime === null) return;

            const bar = getOrCreateBar(markerTime);
            const isBuy = s.direction === 'BUY';
            const meta = s.signal_metadata || {};
            const layerIdx = Number(meta.layer_index || (s.remarks && s.remarks.includes('Layer') ? s.remarks.split('Layer')[1].trim().charAt(0) : 1));

            // Only show layer numbers or count numbers - no words
            const sigText = layerIdx > 1 ? `+P${layerIdx}` : '';
            const sigColor = isBuy ? '#24a148' : '#fa4d56';

            const slot = isBuy ? 'below' : 'above';

            if (!bar[slot]) {
                bar[slot] = {
                    type: 'signal',
                    isBuy: isBuy,
                    text: sigText,
                    color: sigColor,
                    shape: isBuy ? 'arrowUp' : 'arrowDown',
                    count: 1
                };
            } else if (bar[slot]!.type === 'signal') {
                bar[slot]!.count += 1;
                bar[slot]!.text = layerIdx > 1 ? `+P${layerIdx}` : (bar[slot]!.count > 1 ? `${bar[slot]!.count}x` : '');
            } else if (bar[slot]!.type === 'trade_entry') {
                if (layerIdx > 1) {
                    bar[slot]!.text = `+P${layerIdx}`;
                }
            }
        });
    }

    // 3. Build Final Clean Sorted Marker Array
    const allMarkers: any[] = [];
    for (const [timeKey, bar] of barMarkersMap.entries()) {
        if (bar.below) {
            allMarkers.push({
                time: timeKey as Time,
                position: 'belowBar',
                color: bar.below.color,
                shape: bar.below.shape,
                text: bar.below.text,
                size: bar.below.shape === 'circle' ? 0.6 : 0.8
            });
        }
        if (bar.above) {
            allMarkers.push({
                time: timeKey as Time,
                position: 'aboveBar',
                color: bar.above.color,
                shape: bar.above.shape,
                text: bar.above.text,
                size: bar.above.shape === 'circle' ? 0.6 : 0.8
            });
        }
    }

    allMarkers.sort((a, b) => (a.time as number) - (b.time as number));

    try {
        markersRef.current.setMarkers(allMarkers);
    } catch (e) {
        console.error('Failed to set markers:', e);
    }
  }, [signals, trades, isInitialized, timeframe, showSignals, showTrades]);

  // Real-time updates via Global Context
  useEffect(() => {
    if (!state) return;

    try {
      const data = state;
      
      if (data.market_status) {
         setMarketStatus(data.market_status);
      }
      
      const currentPrice = data.price?.last > 0 ? Number(data.price.last) : Number(data.price?.ask || 0);
      const currentVolume = Number(data.price?.volume || 1);
      
      if (isInitialized && currentPrice > 0 && seriesRef.current && volumeSeriesRef.current && lastCandleRef.current) {
         const tfConfig = TIMEFRAME_CONFIGS[timeframe] || { seconds: 300, isRange: false };
         
         // 1. If in RANGE BAR mode: Update running bar from state.range_bar_state
         if (tfConfig.isRange) {
             const rb = data.range_bar_state;
             let candle = lastCandleRef.current;
             if (rb && rb.active) {
                 candle = {
                     time: candle.time,
                     open: Number(rb.open || candle.open),
                     high: Number(rb.high || candle.high),
                     low: Number(rb.low || candle.low),
                     close: Number(rb.close || currentPrice),
                     rawTime: candle.rawTime,
                     volume: Number(rb.tick_volume || candle.volume || 1)
                 };
                 seriesRef.current.update(candle);
                 lastCandleRef.current = candle;
             }
             return;
         }

         // 2. If in Time-based mode (M1, M5, H1):
         const rawTickUtc = data.timestamp ? Number(data.timestamp) : Math.floor(Date.now() / 1000);
         const alignedTickTimeJkt = rawTickUtc + JAKARTA_OFFSET_SECONDS;
         const currentCandleTime = alignedTickTimeJkt - (alignedTickTimeJkt % tfConfig.seconds);
         
         let candle = lastCandleRef.current;
         
         if (currentCandleTime > candle.time) {
            candle = {
               time: currentCandleTime as Time,
               open: currentPrice,
               high: currentPrice,
               low: currentPrice,
               close: currentPrice,
               rawTime: rawTickUtc,
               volume: currentVolume
            };
            dataRef.current.push(candle);
         } else {
            candle.close = currentPrice;
            if (currentPrice > candle.high) candle.high = currentPrice;
            if (currentPrice < candle.low) candle.low = currentPrice;
            if (dataRef.current.length > 0) {
               dataRef.current[dataRef.current.length - 1] = candle;
            }
         }
         
         seriesRef.current.update(candle);
         volumeSeriesRef.current.update({
             time: candle.time,
             value: currentVolume,
             color: candle.close >= candle.open ? "rgba(36, 161, 72, 0.8)" : "rgba(250, 77, 86, 0.8)"
         });
         lastCandleRef.current = candle;
      }
    } catch (e) {
      console.error("Failed to parse live price in chart", e);
    }
  }, [state, timeframe, isInitialized]);

  const containerW = chartContainerRef.current?.clientWidth || 400;
  const containerH = chartContainerRef.current?.clientHeight || 300;

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "300px", position: "relative" }}>
      
      {/* Sleek, Compact Controls Overlay (Timeframe & Signals Switch) */}
      <div style={{ 
        position: "absolute", 
        top: 6, 
        left: 4, 
        zIndex: 15, 
        display: "flex", 
        alignItems: "center", 
        gap: "4px",
        background: "none",
        padding: "0"
      }}>
        {!isInitialized && <span style={{ fontSize: "8.5px", color: "#a8a8a8" }}>Connecting...</span>}
        
        {marketStatus !== "OPEN" && (
          <span style={{ 
            background: marketStatus === "CLOSED" ? "rgba(250, 77, 86, 0.2)" : "rgba(241, 194, 27, 0.2)", 
            color: marketStatus === "CLOSED" ? "#fa4d56" : "#f1c21b", 
            padding: "1px 4px", 
            borderRadius: "2px", 
            fontSize: "8px", 
            fontWeight: "bold"
          }}>
            {marketStatus === "CLOSED" ? "CLOSED" : "MAINT"}
          </span>
        )}

        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          style={{
            background: "transparent",
            color: "#f4f4f4",
            fontWeight: 600,
            border: "none",
            padding: "0 2px",
            fontSize: "9px",
            cursor: "pointer",
            outline: "none",
            letterSpacing: "0.3px"
          }}
        >
          {Object.entries(TIMEFRAME_CONFIGS).map(([tfKey, cfg]) => (
            <option key={tfKey} value={tfKey} style={{ background: '#262626', color: '#fff' }}>
              {cfg.label}
            </option>
          ))}
        </select>

        <div style={{ width: '1px', height: '10px', background: '#393939' }} />

        {/* Compact Toggle for Signal Markers */}
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '3px', 
          cursor: 'pointer', 
          fontSize: '8.5px', 
          color: showSignals ? '#f4f4f4' : '#8d8d8d', 
          userSelect: 'none'
        }}>
          <span style={{ 
            position: 'relative', 
            display: 'inline-block', 
            width: '15px', 
            height: '8px' 
          }}>
            <input 
              type="checkbox" 
              checked={showSignals} 
              onChange={(e) => setShowSignals(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} 
            />
            <span style={{
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: showSignals ? '#24a148' : '#525252',
              borderRadius: '8px',
              transition: '0.15s'
            }} />
            <span style={{
              position: 'absolute', 
              top: '1px', 
              left: showSignals ? '8px' : '1px', 
              height: '6px', 
              width: '6px', 
              backgroundColor: '#ffffff', 
              borderRadius: '50%',
              transition: '0.15s'
            }} />
          </span>
          <span>Sig</span>
        </label>

        {/* Compact Toggle for Trade Markers */}
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '3px', 
          cursor: 'pointer', 
          fontSize: '8.5px', 
          color: showTrades ? '#f4f4f4' : '#8d8d8d', 
          userSelect: 'none'
        }}>
          <span style={{ 
            position: 'relative', 
            display: 'inline-block', 
            width: '15px', 
            height: '8px' 
          }}>
            <input 
              type="checkbox" 
              checked={showTrades} 
              onChange={(e) => setShowTrades(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} 
            />
            <span style={{
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: showTrades ? '#0f62fe' : '#525252',
              borderRadius: '8px',
              transition: '0.15s'
            }} />
            <span style={{
              position: 'absolute', 
              top: '1px', 
              left: showTrades ? '8px' : '1px', 
              height: '6px', 
              width: '6px', 
              backgroundColor: '#ffffff', 
              borderRadius: '50%',
              transition: '0.15s'
            }} />
          </span>
          <span>Trades</span>
        </label>
      </div>

      {/* Candlestick Hover Popover / Tooltip */}
      {hoverInfo && (
        <div
          style={{
            position: "absolute",
            left: Math.min(
              Math.max(10, hoverInfo.x + 14),
              Math.max(10, containerW - 165)
            ),
            top: Math.min(
              Math.max(10, hoverInfo.y - 30),
              Math.max(10, containerH - 145)
            ),
            zIndex: 35,
            pointerEvents: "none",
            backgroundColor: "rgba(20, 20, 20, 0.94)",
            backdropFilter: "blur(6px)",
            border: "1px solid #3d3d3d",
            borderRadius: "4px",
            padding: "5px 8px",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.65)",
            width: "148px",
            fontSize: "9.5px",
            fontFamily: "monospace",
            color: "#f4f4f4"
          }}
        >
          <div style={{ borderBottom: "1px solid #333", paddingBottom: "2px", marginBottom: "3px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#a8a8a8", fontSize: "8.5px" }}>{hoverInfo.dateStr}</span>
            <span style={{ color: "#4589ff", fontWeight: 600, fontSize: "9px" }}>
              {hoverInfo.timeStr} <span style={{ fontSize: "7px", color: "#8d8d8d" }}>WIB</span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: "6px", rowGap: "1.5px", fontSize: "9px", lineHeight: "1.2" }}>
            <span style={{ color: "#8d8d8d" }}>O:</span>
            <span style={{ textAlign: "right", color: "#e0e0e0" }}>{hoverInfo.open.toFixed(2)}</span>

            <span style={{ color: "#8d8d8d" }}>H:</span>
            <span style={{ textAlign: "right", color: "#24a148" }}>{hoverInfo.high.toFixed(2)}</span>

            <span style={{ color: "#8d8d8d" }}>L:</span>
            <span style={{ textAlign: "right", color: "#fa4d56" }}>{hoverInfo.low.toFixed(2)}</span>

            <span style={{ color: "#8d8d8d" }}>C:</span>
            <span style={{ textAlign: "right", color: "#ffffff", fontWeight: "bold" }}>{hoverInfo.close.toFixed(2)}</span>

            <span style={{ color: "#8d8d8d" }}>Chg:</span>
            <span style={{ textAlign: "right", color: hoverInfo.change >= 0 ? "#24a148" : "#fa4d56", fontWeight: "bold" }}>
              {hoverInfo.change >= 0 ? "+" : ""}{hoverInfo.change.toFixed(2)} ({hoverInfo.change >= 0 ? "+" : ""}{hoverInfo.changePct.toFixed(2)}%)
            </span>

            <span style={{ color: "#8d8d8d" }}>Range:</span>
            <span style={{ textAlign: "right", color: "#f1c21b" }}>{hoverInfo.range.toFixed(2)}</span>

            {hoverInfo.volume !== undefined && (
              <>
                <span style={{ color: "#8d8d8d" }}>Vol:</span>
                <span style={{ textAlign: "right", color: "#c6c6c6" }}>{hoverInfo.volume.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      )}

      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
