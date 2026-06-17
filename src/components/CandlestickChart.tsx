"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries } from "lightweight-charts";

export default function CandlestickChart({ symbol = "XAUUSD" }: { symbol?: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastCandleRef = useRef<any>(null);

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
      height: 400,
      timeScale: {
        timeVisible: true,
      },
    });
    
    chartRef.current = chart;

    // Create candlestick series (lightweight-charts v4+ syntax)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#24a148", // Carbon Green
      downColor: "#fa4d56", // Carbon Red
      borderVisible: false,
      wickUpColor: "#24a148",
      wickDownColor: "#fa4d56",
    });
    seriesRef.current = candlestickSeries;

    // Generate initial contextual data (Mock 5 minutes before live)
    const now = Math.floor(Date.now() / 1000);
    const currentMinute = now - (now % 60);
    
    // Base it on roughly where XAUUSD is right now (e.g. 4326)
    const basePrice = 4326;
    
    const initialData = [
      { time: (currentMinute - 60*4) as Time, open: basePrice, high: basePrice+5, low: basePrice-2, close: basePrice+3 },
      { time: (currentMinute - 60*3) as Time, open: basePrice+3, high: basePrice+8, low: basePrice+1, close: basePrice+6 },
      { time: (currentMinute - 60*2) as Time, open: basePrice+6, high: basePrice+10, low: basePrice+5, close: basePrice+7 },
      { time: (currentMinute - 60*1) as Time, open: basePrice+7, high: basePrice+8, low: basePrice+2, close: basePrice+4 },
      { time: currentMinute as Time, open: basePrice+4, high: basePrice+6, low: basePrice+3, close: basePrice+4 }
    ];
    candlestickSeries.setData(initialData);
    lastCandleRef.current = initialData[initialData.length - 1];

    // Handle Resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Real-time updates via SSE (Server-Sent Events)
  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:8000/api/dashboard/stream");
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const currentPrice = data.price.last > 0 ? data.price.last : data.price.ask;
        
        if (currentPrice && seriesRef.current && lastCandleRef.current) {
           const now = Math.floor(Date.now() / 1000);
           const currentMinute = now - (now % 60);
           
           let candle = lastCandleRef.current;
           
           if (currentMinute > candle.time) {
              // Time crossed into a new minute: Start a new candle
              candle = {
                 time: currentMinute as Time,
                 open: currentPrice,
                 high: currentPrice,
                 low: currentPrice,
                 close: currentPrice
              };
           } else {
              // Still in the same minute: Update the wick and close price
              candle.close = currentPrice;
              if (currentPrice > candle.high) candle.high = currentPrice;
              if (currentPrice < candle.low) candle.low = currentPrice;
           }
           
           seriesRef.current.update(candle);
           lastCandleRef.current = candle;
        }
      } catch (e) {
        console.error("Failed to parse SSE live price", e);
      }
    };
    
    eventSource.onerror = (e) => {
      console.error("SSE connection error", e);
      eventSource.close();
      // Browser usually auto-reconnects natively if not explicitly closed, 
      // but we close it manually and let React re-mount handle it if needed.
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "400px", position: "relative" }}>
      <h4 style={{ position: "absolute", top: 10, left: 20, zIndex: 10, color: "#f4f4f4" }}>{symbol} Real-Time</h4>
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
