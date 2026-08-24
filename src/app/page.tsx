"use client";

import { Grid, Column, Button, ToastNotification, Tag, Tile } from "@carbon/react";
import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from 'next/dynamic';
import GlobalTable from '../components/GlobalTable';
import GlobalDetailTable from '../components/GlobalDetailTable';
import TradeHistoryTable from '../components/TradeHistoryTable';
import DashboardPanel from '../components/DashboardPanel';
import DashboardMetrics from '../components/DashboardMetrics';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';

const ResponsiveGridLayout = WidthProvider(Responsive);
const CandlestickChart = dynamic(() => import('../components/CandlestickChart'), { ssr: false });
import MarketSummaryWidget from '../components/MarketSummaryWidget';
import MacroSnapshot from '../components/MacroSnapshot';
import HMMRegimeGauges from '../components/HMMRegimeGauges';
import RangeBarPyramidVisualizer from '../components/RangeBarPyramidVisualizer';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { API_BASE_URL } from '@/config/env';
import { formatJakartaDateTime } from '../utils/date';
import { getMarketRegimeFormat as getRegimeFormat, getEngineSourceFormat } from '../utils/formatters';

import { useCallback } from "react";

export default function Home() {
  const { state, signals, totalTrades, positions } = useGlobalState();
  const [signalsHistory, setSignalsHistory] = useState<any[]>([]);

  const latestSignalIdRef = useRef<number | null>(null);
  const chartHistoryRef = useRef<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const fetchSignals = useCallback(() => {
    fetch(`${API_BASE_URL}/dashboard/signals?limit=100`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.data)) setSignalsHistory(data.data);
        else if (data.items) setSignalsHistory(data.items);
        else if (Array.isArray(data)) setSignalsHistory(data);
        else setSignalsHistory([]);
      })
      .catch(err => console.error("Failed to fetch signals in dashboard", err));
  }, []);

  const allSignals = useMemo(() => {
    const map = new Map<number, any>();
    signalsHistory.forEach((s: any) => {
      if (s.id) map.set(s.id, s);
    });
    (signals || []).forEach((s: any) => {
      if (s.id) map.set(s.id, s);
    });
    const list = Array.from(map.values());
    list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    return list;
  }, [signalsHistory, signals]);

  const nonShadowSignals = useMemo(() => {
    return allSignals.filter((s: any) => s.status !== 'SHADOW');
  }, [allSignals]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTrades = () => {
    fetch(`${API_BASE_URL}/dashboard/trades`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.data)) setTrades(data.data);
        else if (data.items) setTrades(data.items);
        else if (Array.isArray(data)) setTrades(data);
        else setTrades([]);
      })
      .catch(err => console.error("Failed to fetch trades in dashboard", err));
  };

  useEffect(() => {
    fetchTrades();
    fetchSignals();
  }, [totalTrades, fetchSignals]);

  const mergedTrades = useMemo(() => {
    return trades.map(t => {
      if (t.status === 'OPEN') {
        const pos = positions.find(p => String(p.ticket) === String(t.mt5_ticket));
        if (pos) {
          return {
            ...t,
            pnl_money: pos.profit,
            exit_price: pos.price_current
          };
        }
      }
      return t;
    });
  }, [trades, positions]);

  const liveTrades = useMemo(() => {
    return positions.map(pos => {
      const dbTrade = trades.find(t => String(t.mt5_ticket) === String(pos.ticket));
      return {
        trade_id: dbTrade ? dbTrade.trade_id : String(pos.ticket),
        signal_id: dbTrade ? dbTrade.signal_id : null,
        mt5_ticket: String(pos.ticket),
        symbol: pos.symbol,
        direction: pos.type === 0 ? "BUY" : "SELL",
        entry_time: new Date(pos.time * 1000).toISOString(),
        exit_time: "",
        entry_price: pos.price_open,
        exit_price: pos.price_current,
        volume: pos.volume,
        pnl_money: pos.profit,
        pnl_pips: dbTrade ? dbTrade.pnl_pips : 0,
        close_reason: dbTrade ? dbTrade.close_reason : "",
        status: "OPEN",
        confidence: dbTrade ? dbTrade.confidence : 0,
        model_version: dbTrade ? dbTrade.model_version : "MANUAL",
        regime: dbTrade ? dbTrade.regime : "UNKNOWN",
        sl_price: pos.sl > 0 ? pos.sl : (dbTrade ? dbTrade.sl_price : null),
        tp_price: pos.tp > 0 ? pos.tp : (dbTrade ? dbTrade.tp_price : null)
      };
    });
  }, [positions, trades]);

  const recentClosedTrades = useMemo(() => {
    return mergedTrades
      .filter((t: any) => t.status !== 'OPEN')
      .sort((a: any, b: any) => {
        const timeA = new Date(a.exit_time || a.entry_time || 0).getTime();
        const timeB = new Date(b.exit_time || b.entry_time || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 10);
  }, [mergedTrades]);

  const signalHeaders = [
    { key: "direction", header: "Signal", width: "75px" },
    { key: "timestamp", header: "Time" },
    { key: "entry_price", header: "Price / SL / TP / R:R" },
    { key: "model", header: "Model" },
    { key: "status", header: "Status", width: "80px" },
  ];
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);

  const defaultLayouts = {
    lg: [
      { i: 'top_metrics', x: 0, y: 0, w: 7.4, h: 0.55, minW: 4, minH: 0.4 },
      { i: 'chart', x: 0, y: 0.55, w: 4.1, h: 4.45, minW: 3, minH: 2 },
      { i: 'range_pyramid', x: 4.1, y: 0.55, w: 3.3, h: 4.45, minW: 2.5, minH: 2 },
      { i: 'live_trades', x: 7.4, y: 0, w: 2.6, h: 2.5, minW: 2, minH: 1.5 },
      { i: 'hmm_gauges', x: 7.4, y: 2.5, w: 2.6, h: 2.5, minW: 2, minH: 1.5 },
      { i: 'recent_trades', x: 0, y: 5.0, w: 5, h: 4.5, minW: 3, minH: 2 },
      { i: 'signals', x: 5, y: 5.0, w: 5, h: 4.5, minW: 3, minH: 2 }
    ],
    md: [
      { i: 'top_metrics', x: 0, y: 0, w: 8, h: 0.55 },
      { i: 'chart', x: 0, y: 0.55, w: 4, h: 4.15 },
      { i: 'range_pyramid', x: 4, y: 0.55, w: 4, h: 4.15 },
      { i: 'live_trades', x: 0, y: 4.7, w: 4, h: 2.8 },
      { i: 'hmm_gauges', x: 4, y: 4.7, w: 4, h: 2.8 },
      { i: 'recent_trades', x: 0, y: 7.5, w: 4, h: 4.8 },
      { i: 'signals', x: 4, y: 7.5, w: 4, h: 4.8 }
    ],
    sm: [
      { i: 'top_metrics', x: 0, y: 0, w: 4, h: 1.1 },
      { i: 'live_trades', x: 0, y: 1.1, w: 4, h: 2.5 },
      { i: 'chart', x: 0, y: 3.6, w: 4, h: 4 },
      { i: 'range_pyramid', x: 0, y: 7.6, w: 4, h: 3.8 },
      { i: 'hmm_gauges', x: 0, y: 11.4, w: 4, h: 2.5 },
      { i: 'recent_trades', x: 0, y: 13.9, w: 4, h: 4.8 },
      { i: 'signals', x: 0, y: 18.7, w: 4, h: 4.8 }
    ],
    xs: [
      { i: 'top_metrics', x: 0, y: 0, w: 2, h: 1.3 },
      { i: 'live_trades', x: 0, y: 1.3, w: 2, h: 2.5 },
      { i: 'chart', x: 0, y: 3.8, w: 2, h: 3 },
      { i: 'range_pyramid', x: 0, y: 6.8, w: 2, h: 3.5 },
      { i: 'hmm_gauges', x: 0, y: 10.3, w: 2, h: 3 },
      { i: 'recent_trades', x: 0, y: 13.3, w: 2, h: 4.8 },
      { i: 'signals', x: 0, y: 18.1, w: 2, h: 4.8 }
    ]
  };
  const [layouts, setLayouts] = useState<any>(defaultLayouts);

  useEffect(() => {
    // Clear all older layout keys from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("quantDashboardLayout_") || key === "dashboard-layouts") && key !== "quantDashboardLayout_v59") {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}

    const saved = localStorage.getItem('quantDashboardLayout_v59');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setLayouts(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleLayoutChange = (layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem("quantDashboardLayout_v59", JSON.stringify(allLayouts));
  };
  return (
    <div style={{ maxWidth: '100%', padding: '0 2rem', position: 'relative' }}>

      {/* --- DYNAMIC CHARTS, PANELS, AND SIGNALS --- */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1056, md: 672, sm: 320, xs: 0 }}
        cols={{ lg: 10, md: 8, sm: 4, xs: 2 }}
        rowHeight={90}
        draggableHandle=".panel-drag-handle"
        margin={[3, 3]} // 0.2rem gap
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        isDraggable={!isMobile}
        isResizable={!isMobile}
      >
        <div key="top_metrics">
          <div className="top-metrics-container" style={{ height: '100%', marginBottom: 0 }}>
            <div className="dashboard-metrics-wrapper">
              <DashboardMetrics />
            </div>
            <div className="macro-snapshot-wrapper">
              <MacroSnapshot />
            </div>
          </div>
        </div>
        <div key="chart">
          <DashboardPanel 
            title="XAUUSD" 
            tooltipInfo="Interactive candlestick chart with technical indicators."
            onExportCsv={() => {
              if (!chartHistoryRef.current || chartHistoryRef.current.length === 0) return;
              const headers = ["Time", "Open", "High", "Low", "Close"];
              const rows = chartHistoryRef.current.map((c: any) => [
                formatJakartaDateTime(c.time).full,
                c.open,
                c.high,
                c.low,
                c.close
              ].join(","));
              
              const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `xauusd_chart_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
             <div style={{ height: "100%", overflow: "hidden", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: '#262626' }}>
               {/* Legend */}
               <div style={{
                 position: 'absolute', top: 8, right: 14, zIndex: 20,
                 display: 'flex', gap: '10px', alignItems: 'center', fontSize: '9px', color: '#a8a8a8'
               }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                   <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#24a148' }}/>
                   BUY
                 </span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                   <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#fa4d56' }}/>
                   SELL
                 </span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                   <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#e8e8e8' }}/>
                   Neutral
                 </span>
               </div>

               {/* Market Summary Overlay HUD */}
               <div 
                 className="chart-market-summary-hud"
                 style={{
                   position: 'absolute',
                   top: '5px',
                   left: '140px',
                   right: '160px',
                   zIndex: 5,
                   background: 'none',
                   padding: '0',
                   border: 'none',
                   boxShadow: 'none',
                   pointerEvents: 'none' // Let clicks pass through to chart
                 }}
               >
                 <MarketSummaryWidget />
               </div>

                  <CandlestickChart 
                    symbol="XAUUSD" 
                    onHistoryUpdate={(data) => chartHistoryRef.current = data} 
                    signals={nonShadowSignals} 
                    trades={mergedTrades} 
                  />
             </div>
          </DashboardPanel>
        </div>

        <div key="signals">
          <DashboardPanel 
            title="Recent Signals" 
            tooltipInfo="Latest trade recommendations generated by the strategy."
            onExportCsv={() => {
              const headers = ["Time", "Signal", "Price", "SL", "TP", "R:R", "Conf", "Regime", "Model", "Status"];
              const rows = nonShadowSignals.map(s => [
                formatJakartaDateTime(s.timestamp).full,
                s.direction,
                s.entry_price || '',
                s.sl_price || '',
                s.tp_price || '',
                s.rr_ratio || '',
                (s.confidence * 100).toFixed(2) + '%',
                s.regime,
                s.model || '',
                s.status
              ].join(","));
              
              const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `recent_signals_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <div style={{ height: "100%" }}>
              <GlobalTable 
                title=""
                headers={signalHeaders}
                initialData={nonShadowSignals.slice(0, 15)}
                hidePagination
                hideSearch
                onViewDetails={(id) => setSelectedSignal(Number(id))}
                compact
                formatCell={(cellId, value, row) => {
                  const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
                  if (col.includes("direction")) {
                    const isBuy = value === 'BUY';
                    const isSell = value === 'SELL';
                    const dirColor = isBuy ? '#24a148' : isSell ? '#fa4d56' : '#8d8d8d';
                    const readableVal = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'Neutral';
                    return (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '11px' }}>
                        <svg width="8" height="8" viewBox="0 0 32 32" style={{ fill: dirColor, flexShrink: 0 }}>
                          <circle cx="16" cy="16" r="8" />
                        </svg>
                        <span style={{ color: dirColor, whiteSpace: 'nowrap' }}>{readableVal}</span>
                      </div>
                    );
                  }
                  if (col.includes("timestamp") && value) {
                    const { date, time } = formatJakartaDateTime(value);
                    const allSigs = nonShadowSignals.slice(0, 15);
                    const curIdx = allSigs.findIndex((s: any) => String(s.id) === String(row?.id));
                    const prevSig = curIdx > 0 ? allSigs[curIdx - 1] : null;
                    const prevDate = prevSig ? formatJakartaDateTime(prevSig.timestamp).date : null;
                    const showDate = !prevDate || prevDate !== date;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                        {showDate && (
                          <span style={{ color: '#8d8d8d', fontSize: '8.5px', marginBottom: '1px' }}>{date}</span>
                        )}
                        <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 600 }}>{time}</span>
                      </div>
                    );
                  }
                  if (col.includes("entry_price")) {
                    const rowId = cellId.split(':')[0];
                    const signal = row || signals.find((s: any) => String(s.id) === String(rowId));
                    if (!signal && !value) return <span style={{ fontSize: '9.5px' }}>-</span>;
                    const entryVal = signal?.entry_price || value;
                    const entry = entryVal ? Number(entryVal).toFixed(2) : '-';
                    const sl = signal?.sl_price ? Number(signal.sl_price).toFixed(2) : '-';
                    const tp = signal?.tp_price ? Number(signal.tp_price).toFixed(2) : '-';
                    const rr = Number(signal?.rr_ratio) || 0;
                    const rrColor = rr >= 2.0 ? '#24a148' : '#a8a8a8';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', fontSize: '10.5px' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{entry}</span>
                          <span style={{ fontSize: '9.5px', color: rrColor, marginLeft: '4px' }}>
                            (R:R {rr.toFixed(2)})
                          </span>
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#a8a8a8' }}>
                          <span style={{ color: '#fa4d56' }}>{sl}</span>
                          <span style={{ margin: '0 4px' }}>|</span>
                          <span style={{ color: '#24a148' }}>{tp}</span>
                        </div>
                      </div>
                    );
                  }
                  if (col.includes("regime")) {
                    const format = getRegimeFormat(value);
                    const parts = format.text.split(' ');
                    return (
                      <span style={{ color: format.color, fontWeight: 'bold', fontSize: '9px', display: 'inline-block', lineHeight: '1.1' }}>
                        {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <br/>}</span>)}
                      </span>
                    );
                  }
                  if (col.includes("model")) {
                    const rowId = cellId.split(':')[0];
                    const signal = row || signals.find((s: any) => String(s.id) === String(rowId));
                    if (!signal && !value) return <span>-</span>;
                    const modelName = signal?.model || signal?.model_version || value;
                    const conf = Number(signal?.confidence || 0);
                    
                    let readableModelText = 'range_scalper_v1';
                    if (modelName) {
                      readableModelText = String(modelName);
                    }
                    
                    const mo = signal?.signal_metadata?.model_output || signal?.metadata?.model_output || {};
                    const calBuy = mo.cal_buy !== undefined ? Number(mo.cal_buy) : (signal?.cal_buy !== undefined ? Number(signal.cal_buy) : (conf > 0 ? conf * 0.88 : undefined));
                    const calSell = mo.cal_sell !== undefined ? Number(mo.cal_sell) : (signal?.cal_sell !== undefined ? Number(signal.cal_sell) : (conf > 0 ? conf : undefined));
                    
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', fontSize: '10.5px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#4589ff', flexShrink: 0 }}>
                            <path d="M26,8V6a2,2,0,0,0-2-2H22V2H20V4H18V2H16V4H14V2H12V4H10V2H8V4H6A2,2,0,0,0,4,6V8H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2A2,2,0,0,0,6,28H8v2h2V28h2v2h2V28h2v2h2V28h2v2h2V28h2A2,2,0,0,0,28,26V24h2V22H28V20h2V18H28V16h2V14H28V12h2V10H28V8ZM26,26H6V6H26Z" />
                            <rect x="10" y="10" width="12" height="12" />
                          </svg>
                          <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '10.5px', whiteSpace: 'nowrap' }}>
                            {readableModelText}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', gap: '4px', marginTop: '2px' }}>
                          <span style={{ color: '#24a148' }}>B:{calBuy !== undefined ? (calBuy * 100).toFixed(1) : '0.0'}%</span>
                          <span style={{ color: '#6f6f6f' }}>|</span>
                          <span style={{ color: '#fa4d56' }}>S:{calSell !== undefined ? (calSell * 100).toFixed(1) : '0.0'}%</span>
                        </div>
                      </div>
                    );
                  }
                  if (col.includes("status")) {
                    const valUpper = String(value || '').toUpperCase();
                    if (valUpper === "PENDING_EXECUTION") {
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '10.5px' }}>
                          <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#11a3c6', flexShrink: 0 }}>
                            <path d="M16 4C9.383 4 4 9.383 4 16s5.383 12 12 12 12-5.383 12-12S22.617 4 16 4zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6zm-1 3v8h6v-2h-4v-6h-2z" />
                          </svg>
                          <span style={{ color: '#11a3c6', whiteSpace: 'nowrap' }}>Pending Execution</span>
                        </div>
                      );
                    }
                    if (valUpper === "EXECUTED") {
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '10.5px' }}>
                          <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                            <path d="M14 21.414l-5.707-5.707-1.414 1.414 7.121 7.121 12-12-1.414-1.414z" />
                          </svg>
                          <span style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>Executed</span>
                        </div>
                      );
                    }
                    if (valUpper === "NEW") {
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '10.5px' }}>
                          <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
                            <circle cx="16" cy="16" r="8" />
                          </svg>
                          <span style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>New</span>
                        </div>
                      );
                    }
                    if (valUpper === "NEUTRAL" || valUpper === "IGNORED" || !value) {
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '10.5px' }}>
                          <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#8d8d8d', flexShrink: 0 }}>
                            <circle cx="16" cy="16" r="8" />
                          </svg>
                          <span style={{ color: '#8d8d8d', whiteSpace: 'nowrap' }}>Ignored</span>
                        </div>
                      );
                    }
                    // Fallback
                    let readableValue = value ? value.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Ignored';
                    if (readableValue.toLowerCase() === 'neutral') readableValue = 'Ignored';
                    return (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '10.5px' }}>
                        <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#8d8d8d', flexShrink: 0 }}>
                          <circle cx="16" cy="16" r="8" />
                        </svg>
                        <span style={{ color: '#8d8d8d', whiteSpace: 'nowrap' }}>{readableValue}</span>
                      </div>
                    );
                  }
                  return value;
                }}
              />
            </div>
          </DashboardPanel>
        </div>
        <div key="live_trades">
          <DashboardPanel 
            title="Live Trades" 
            tooltipInfo="Currently open trades/positions."
            onExportCsv={() => {
              const headers = ["Direction", "Entry Time", "Entry", "Current Price", "Lots", "Model", "Conf", "PnL"];
              const rows = liveTrades.map(t => [
                t.direction,
                t.entry_time ? formatJakartaDateTime(t.entry_time).full : '',
                t.entry_price || '',
                t.exit_price || '',
                t.volume || '',
                t.model_version || '',
                t.confidence ? (t.confidence * 100).toFixed(2) + '%' : '',
                t.pnl_money || ''
              ].join(","));
              
              const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `live_trades_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <div style={{ height: "100%" }}>
              <TradeHistoryTable trades={liveTrades} title="" hidePagination hideSearch compact isLiveTrades={true} hideRegime={true} onReload={fetchTrades} />
            </div>
          </DashboardPanel>
        </div>

        <div key="recent_trades">
          <DashboardPanel 
            title="Recent Trades" 
            tooltipInfo="Last 5 completed trade executions and closed positions."
            onExportCsv={() => {
              const headers = ["Direction", "Entry Time", "Exit Time", "Entry Price", "Exit Price", "Lots", "PnL", "Reason", "Model"];
              const rows = recentClosedTrades.map(t => [
                t.direction,
                t.entry_time ? formatJakartaDateTime(t.entry_time).full : '',
                t.exit_time ? formatJakartaDateTime(t.exit_time).full : '',
                t.entry_price || '',
                t.exit_price || '',
                t.volume || '',
                t.pnl_money || '',
                t.close_reason || '',
                t.model_version || ''
              ].join(","));
              
              const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `recent_trades_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <div style={{ height: "100%" }}>
              <TradeHistoryTable trades={recentClosedTrades} title="" hidePagination hideSearch compact isLiveTrades={false} hideRegime={true} onReload={fetchTrades} />
            </div>
          </DashboardPanel>
        </div>

        <div key="range_pyramid">
          <DashboardPanel 
            title="Event-Driven Price Engine" 
            tooltipInfo="Live range bar builder and pyramiding scale-in state."
          >
            <RangeBarPyramidVisualizer />
          </DashboardPanel>
        </div>

        <div key="hmm_gauges">
          <DashboardPanel title="Regime Detection" tooltipInfo="Hidden Markov Model regime probabilities.">
            <HMMRegimeGauges />
          </DashboardPanel>
        </div>

      </ResponsiveGridLayout>
      
      {/* --- SIGNAL DETAIL MODAL --- */}
      <GlobalDetailTable 
        id={selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />

      {/* --- BACKEND DEBUG PANEL (bottom-right overlay) --- */}
      
    </div>
  );
}
