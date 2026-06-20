import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineData, Time, LineSeries, AreaSeries, LineType, createSeriesMarkers } from 'lightweight-charts';

interface SimulationChartProps {
  equityData: { timestamp: string; equity: number; drawdown: number; balance: number; price?: number }[];
  trades: any[];
}

export default function SimulationChart({ equityData, trades }: SimulationChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || equityData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#262626' },
        textColor: '#c6c6c6',
      },
      grid: {
        vertLines: { color: '#393939' },
        horzLines: { color: '#393939' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#393939',
      },
      leftPriceScale: {
        visible: true,
        borderColor: '#393939',
      },
    });

    chartRef.current = chart;

    // Line Series for Equity (Solid blue line without gradient)
    const equitySeries = chart.addSeries(LineSeries, {
      color: '#0f62fe', // IBM Carbon Blue 50
      lineWidth: 2,
      lineType: LineType.Simple, // Straight lines prevent bezier curve looping artifacts
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // Format and compress data for lightweight-charts
    // Only keep points where equity changes, plus the first and last point, to optimize rendering.
    if (equityData.length > 0) {
      const formattedData: LineData[] = [];
      let lastPushedTime: number | null = null;
      
      // Sort data by time ascending first
      const sortedData = [...equityData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      sortedData.forEach((d) => {
        const timeSecs = Math.floor(new Date(d.timestamp).getTime() / 1000);
        
        // Skip duplicate timestamps and invalid values
        if (timeSecs !== lastPushedTime && d.equity != null && !isNaN(d.equity)) {
          formattedData.push({
            time: timeSecs as Time,
            value: d.equity,
          });
          lastPushedTime = timeSecs;
        }
      });

      equitySeries.setData(formattedData);
      
      // Price data
      const hasPriceData = sortedData.some(d => d.price !== undefined);
      if (hasPriceData) {
        const priceSeries = chart.addSeries(LineSeries, {
          color: '#f1c21b', // Gold color
          lineWidth: 1,
          priceScaleId: 'left',
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });
        
        const priceData: LineData[] = [];
        let lastPriceTime: number | null = null;
        sortedData.forEach((d) => {
          const timeSecs = Math.floor(new Date(d.timestamp).getTime() / 1000);
          if (timeSecs !== lastPriceTime && d.price != null && !isNaN(d.price)) {
            priceData.push({ time: timeSecs as Time, value: d.price });
            lastPriceTime = timeSecs;
          }
        });
        priceSeries.setData(priceData);
      }
    }

    // Add Trade Markers
    if (trades && trades.length > 0) {
      const markers: any[] = [];
      trades.forEach(t => {
        if (t.entry_time) {
          markers.push({
            time: (new Date(t.entry_time).getTime() / 1000) as Time,
            position: t.direction === 'BUY' ? 'belowBar' : 'aboveBar',
            color: t.direction === 'BUY' ? '#24a148' : '#fa4d56',
            shape: t.direction === 'BUY' ? 'arrowUp' : 'arrowDown'
          });
        }
        if (t.exit_time) {
          markers.push({
            time: (new Date(t.exit_time).getTime() / 1000) as Time,
            position: 'inBar',
            color: t.pnl_money > 0 ? '#24a148' : '#fa4d56',
            shape: 'circle'
          });
        }
      });
      
      // Sort markers by time
      markers.sort((a, b) => (a.time as number) - (b.time as number));
      
      // We can only set markers if times exist in the series data exactly
      // For lightweight-charts, markers often need exact time matches
      try {
        createSeriesMarkers(equitySeries, markers);
      } catch (e) {
        console.warn("Could not set markers exactly on series times", e);
      }
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [equityData, trades]);

  if (equityData.length === 0) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#262626', border: '1px solid #393939' }}>
        <span style={{ color: '#8d8d8d' }}>No equity data to display</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid #393939', overflow: 'hidden', backgroundColor: '#262626' }}>
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 10,
        backgroundColor: 'rgba(38, 38, 38, 0.8)',
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #393939',
        fontSize: '12px',
        color: '#c6c6c6',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#f1c21b', marginRight: '8px' }}></div>
          <span>XAUUSD (Left Axis)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#0f62fe', marginRight: '8px' }}></div>
          <span>Equity (Right Axis)</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#24a148' }}>▲</span> Buy Entry
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#fa4d56' }}>▼</span> Sell Entry
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#24a148' }}>●</span> Win Exit
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#fa4d56' }}>●</span> Loss Exit
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
