"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, AreaSeries, ColorType } from 'lightweight-charts';

interface Trade {
  entry_time: string;
  exit_time?: string;
  pnl_money: number;
}

interface PnLChartProps {
  trades: Trade[];
}

export default function PnLChart({ trades }: PnLChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a8a8a8',
      },
      grid: {
        vertLines: { color: '#393939' },
        horzLines: { color: '#393939' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#4589ff',
      topColor: 'rgba(69, 137, 255, 0.4)',
      bottomColor: 'rgba(69, 137, 255, 0.0)',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    
    // Sort trades by exit time
    const sortedTrades = [...trades].filter(t => t.exit_time).sort((a, b) => new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime());
    
    let cumulative = 0;
    const data = sortedTrades.map(t => {
      cumulative += t.pnl_money;
      return {
        time: (new Date(t.exit_time!).getTime() / 1000) as Time,
        value: cumulative
      };
    });

    // If we have data, set it
    if (data.length > 0) {
      // Remove duplicates by time (lightweight charts needs strictly increasing times)
      const uniqueData = [];
      const seenTimes = new Set<number>();
      for (const item of data) {
        const timeVal = item.time as number;
        if (!seenTimes.has(timeVal)) {
          uniqueData.push(item);
          seenTimes.add(timeVal);
        } else {
          // Overwrite with latest value for the same timestamp
          uniqueData[uniqueData.length - 1].value = item.value;
        }
      }

      // Final pass to ensure strictly increasing times if there are anomalies
      let finalData = [];
      let lastTime = -1;
      for (let i = 0; i < uniqueData.length; i++) {
         let t = uniqueData[i].time as number;
         if (t <= lastTime) {
             t = lastTime + 1;
             uniqueData[i].time = t as Time;
         }
         finalData.push(uniqueData[i]);
         lastTime = t;
      }

      seriesRef.current.setData(finalData);
      chartRef.current.timeScale().fitContent();
    }
  }, [trades]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '300px' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      {trades.length === 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(38,38,38,0.7)', zIndex: 10 }}>
          <span style={{ color: '#8d8d8d' }}>No trades data for chart.</span>
        </div>
      )}
    </div>
  );
}
