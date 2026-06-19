import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, LineData, Time, LineSeries, LineType } from 'lightweight-charts';

interface RunData {
  id: string;
  name: string;
  initialCapital: number;
  equityData: { timestamp: string; equity: number }[];
}

interface ComparisonChartProps {
  runs: RunData[];
}

// A palette of distinct colors for the different simulation runs
const COLORS = [
  '#0f62fe', // Blue
  '#24a148', // Green
  '#fa4d56', // Red
  '#f1c21b', // Yellow
  '#8a3ffc', // Purple
  '#002d9c', // Dark Blue
  '#009d9a', // Teal
  '#ee5396', // Magenta
];

export default function ComparisonChart({ runs }: ComparisonChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || runs.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#161616' },
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
    });

    chartRef.current = chart;

    runs.forEach((run, index) => {
      if (!run.equityData || run.equityData.length === 0) return;

      const seriesColor = COLORS[index % COLORS.length];

      const series = chart.addSeries(LineSeries, {
        color: seriesColor,
        lineWidth: 2,
        lineType: LineType.Simple,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => price.toFixed(2) + '%',
          minMove: 0.01,
        },
      });

      const formattedData: LineData[] = [];
      let lastPushedTime: number | null = null;
      
      const sortedData = [...run.equityData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      sortedData.forEach((d) => {
        const timeSecs = Math.floor(new Date(d.timestamp).getTime() / 1000);
        
        if (timeSecs !== lastPushedTime && d.equity != null && !isNaN(d.equity)) {
          // Normalize to percentage return
          const pctReturn = ((d.equity - run.initialCapital) / run.initialCapital) * 100;
          
          formattedData.push({
            time: timeSecs as Time,
            value: pctReturn,
          });
          lastPushedTime = timeSecs;
        }
      });

      series.setData(formattedData);
    });

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
  }, [runs]);

  if (runs.length === 0) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161616', border: '1px solid #393939' }}>
        <span style={{ color: '#8d8d8d' }}>No runs selected for comparison</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid #393939', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 10,
        backgroundColor: 'rgba(22, 22, 22, 0.8)',
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #393939',
        fontSize: '12px',
        color: '#c6c6c6',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        maxHeight: '80%',
        overflowY: 'auto'
      }}>
        <strong style={{ marginBottom: '4px', fontSize: '11px', color: '#8d8d8d' }}>% Return</strong>
        {runs.map((run, idx) => (
          <div key={run.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '16px', height: '2px', backgroundColor: COLORS[idx % COLORS.length], marginRight: '8px' }}></div>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
              {run.name}
            </span>
          </div>
        ))}
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
