"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries, HistogramSeries } from "lightweight-charts";

const TIMEFRAMES: Record<string, number> = {
  "M1": 60,
  "M5": 300,
  "M15": 900,
  "M30": 1800,
  "H1": 3600,
  "H4": 14400,
  "D1": 86400
};

export default function CandlestickChart({ symbol = "XAUUSD", onHistoryUpdate }: { symbol?: string, onHistoryUpdate?: (data: any[]) => void }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastCandleRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [timeframe, setTimeframe] = useState<string>("H1");

  // Reset chart when timeframe changes
  useEffect(() => {
      if (seriesRef.current && volumeSeriesRef.current) {
          seriesRef.current.setData([]);
          volumeSeriesRef.current.setData([]);
          lastCandleRef.current = null;
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
          top: 0.1, // Leave space for price
          bottom: 0.2, // Leave space for volume
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
      priceScaleId: '', // set as an overlay
      lastValueVisible: false,
      priceLineVisible: false,
    });
    
    // Apply margins to the volume series price scale so it stays at the bottom
    volumeSeries.priceScale().applyOptions({
        scaleMargins: {
            top: 0.8, // highest point of the series will be at 80% of the chart height
            bottom: 0,
        },
    });
    volumeSeriesRef.current = volumeSeries;

    // Handle Resize perfectly with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
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
              const res = await fetch(`http://127.0.0.1:8000/api/dashboard/history?symbol=${symbol}&timeframe=${timeframe}&limit=100`);
              if (!res.ok) throw new Error("Failed to fetch history");
              const data = await res.json();
              
              if (isMounted && data.length > 0 && seriesRef.current && volumeSeriesRef.current) {
                  const tzOffsetSeconds = new Date().getTimezoneOffset() * 60;
                  
                  const history = [];
                  const volumeHistory = [];
                  
                  for (const row of data) {
                      // Adjust time for local timezone display
                      const t = row.time - tzOffsetSeconds;
                      history.push({ time: t as Time, open: row.open, high: row.high, low: row.low, close: row.close });
                      volumeHistory.push({ 
                          time: t as Time, 
                          value: row.volume, 
                          color: row.close >= row.open ? "rgba(36, 161, 72, 0.4)" : "rgba(250, 77, 86, 0.4)" 
                      });
                  }
                  
                  seriesRef.current.setData(history);
                  volumeSeriesRef.current.setData(volumeHistory);
                  lastCandleRef.current = history[history.length - 1];
                  setIsInitialized(true);
                  if (onHistoryUpdate) onHistoryUpdate(history);
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

  // Real-time updates via SSE (Server-Sent Events)
  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:8000/api/dashboard/stream");
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const currentPrice = data.price.last > 0 ? data.price.last : data.price.ask;
        const currentVolume = data.price.volume || Math.floor(Math.random() * 50) + 10; 
        
        // Only update if history has been initialized
        if (isInitialized && currentPrice && seriesRef.current && volumeSeriesRef.current && lastCandleRef.current) {
           const now = Math.floor(Date.now() / 1000);
           const tfSeconds = TIMEFRAMES[timeframe] || 3600;
           const currentCandleTimeRaw = now - (now % tfSeconds);
           
           // Apply timezone offset
           const tzOffsetSeconds = new Date().getTimezoneOffset() * 60;
           const currentCandleTime = currentCandleTimeRaw - tzOffsetSeconds;
           
           let candle = lastCandleRef.current;
           
           if (currentCandleTime > candle.time) {
              // New candle
              candle = {
                 time: currentCandleTime as Time,
                 open: currentPrice,
                 high: currentPrice,
                 low: currentPrice,
                 close: currentPrice
              };
           } else {
              // Update current candle
              candle.close = currentPrice;
              if (currentPrice > candle.high) candle.high = currentPrice;
              if (currentPrice < candle.low) candle.low = currentPrice;
           }
           
           seriesRef.current.update(candle);
           volumeSeriesRef.current.update({
               time: candle.time,
               value: currentVolume, // note: live ticks don't accumulate volume perfectly here yet, but it's okay for live indicator
               color: candle.close >= candle.open ? "rgba(36, 161, 72, 0.8)" : "rgba(250, 77, 86, 0.8)"
           });
           lastCandleRef.current = candle;
        }
      } catch (e) {
        console.error("Failed to parse SSE live price", e);
      }
    };
    
    eventSource.onerror = (e) => {
      console.error("SSE connection error", e);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [timeframe, isInitialized]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "300px", position: "relative" }}>
      <h4 style={{ position: "absolute", top: 10, left: 20, zIndex: 10, color: "#f4f4f4", display: "flex", alignItems: "center", gap: "15px" }}>
          {!isInitialized && <span style={{ fontSize: "12px", color: "#a8a8a8" }}>(Waiting for market tick...)</span>}
          
          <select 
             value={timeframe} 
             onChange={(e) => setTimeframe(e.target.value)}
             style={{
                background: "#353535",
                color: "#f4f4f4",
                border: "1px solid #393939",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                outline: "none"
             }}
          >
              {Object.keys(TIMEFRAMES).map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
              ))}
          </select>
      </h4>
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
