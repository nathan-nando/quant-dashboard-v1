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
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      localization: {
        dateFormat: 'yyyy-MM-dd',
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
    const dailyPnL = new Map<string, number>();
    
    if (sortedTrades.length > 0) {
      // Add initial point 0 at one day before the first trade so the chart always has a starting origin
      const firstDate = new Date(sortedTrades[0].exit_time!);
      firstDate.setDate(firstDate.getDate() - 1);
      const initialDateStr = firstDate.toISOString().split('T')[0];
      dailyPnL.set(initialDateStr, 0);
    }
    
    for (const t of sortedTrades) {
      cumulative += t.pnl_money;
      // Extract YYYY-MM-DD
      const dateStr = new Date(t.exit_time!).toISOString().split('T')[0];
      // Overwrite so that the map stores the final cumulative equity of that day
      dailyPnL.set(dateStr, cumulative);
    }

    const finalData = Array.from(dailyPnL.entries()).map(([dateStr, val]) => {
      return {
        time: dateStr as Time,
        value: val
      };
    });

    // If we have data, set it
    if (finalData.length > 0) {
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
