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
import ShapPanel from '../components/ShapPanel';
import RegimeTimeline from '../components/RegimeTimeline';
import AttributionPanel from '../components/AttributionPanel';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { API_BASE_URL } from '@/config/env';

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' }; // Green
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' }; // Red
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' }; // Yellow
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' }; // Blue
  return { text: regime, color: '#f4f4f4' };
};

export default function Home() {
  const { signals, totalTrades, positions } = useGlobalState();

  const latestSignalIdRef = useRef<number | null>(null);
  const chartHistoryRef = useRef<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

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
  }, [totalTrades]);

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

  const signalHeaders = [
    { key: "timestamp", header: "Time" },
    { key: "direction", header: "Signal", width: "70px" },
    { key: "entry_price", header: "Price / SL / TP / R:R" },
    { key: "model", header: "Model / Conf" },
    { key: "regime", header: "Regime", width: "90px" },
    { key: "status", header: "Status", width: "80px" },
  ];
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);

  const defaultLayouts = {
    lg: [
      { i: 'chart', x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 2 },
      { i: 'attribution', x: 4, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
      { i: 'shap', x: 4, y: 3, w: 2, h: 3, minW: 2, minH: 2 },
      { i: 'regime', x: 0, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
      { i: 'trades', x: 6, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'signals', x: 6, y: 3, w: 4, h: 5, minW: 3, minH: 2 }
    ],
    md: [
      { i: 'chart', x: 0, y: 0, w: 4, h: 3 },
      { i: 'attribution', x: 4, y: 0, w: 4, h: 3 },
      { i: 'shap', x: 4, y: 3, w: 4, h: 3 },
      { i: 'regime', x: 0, y: 3, w: 4, h: 3 },
      { i: 'trades', x: 0, y: 6, w: 8, h: 3 },
      { i: 'signals', x: 0, y: 9, w: 8, h: 5 }
    ],
    sm: [
      { i: 'chart', x: 0, y: 0, w: 4, h: 3 },
      { i: 'attribution', x: 0, y: 3, w: 4, h: 3 },
      { i: 'shap', x: 0, y: 9, w: 4, h: 3 },
      { i: 'regime', x: 0, y: 6, w: 4, h: 3 },
      { i: 'trades', x: 0, y: 12, w: 4, h: 3 },
      { i: 'signals', x: 0, y: 15, w: 4, h: 5 }
    ],
    xs: [
      { i: 'chart', x: 0, y: 0, w: 2, h: 3 },
      { i: 'attribution', x: 0, y: 3, w: 2, h: 3 },
      { i: 'shap', x: 0, y: 9, w: 2, h: 3 },
      { i: 'regime', x: 0, y: 6, w: 2, h: 3 },
      { i: 'trades', x: 0, y: 12, w: 2, h: 3 },
      { i: 'signals', x: 0, y: 15, w: 2, h: 5 }
    ]
  };
  const [layouts, setLayouts] = useState<any>(defaultLayouts);
 
  useEffect(() => {
    // Clear all older layout keys from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("quantDashboardLayout_") && key !== "quantDashboardLayout_v26") {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
 
    const saved = localStorage.getItem("quantDashboardLayout_v26");
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);
 
  const handleLayoutChange = (layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem("quantDashboardLayout_v26", JSON.stringify(allLayouts));
  };
  return (
    <div style={{ maxWidth: '100%', padding: '0 2rem', position: 'relative' }}>

      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: ".5rem", fontWeight: 400 }}>Dashboard</h3>
      </Column>

      {/* --- ROW 1: STATIC LIVE STATE METRICS & MARKET SUMMARY --- */}
      <div style={{ display: "flex", gap: "0.2rem", marginBottom: "0.2rem", width: '100%', alignItems: 'stretch' }}>
        <DashboardMetrics />
      </div>

      {/* --- ROW 2: DYNAMIC CHARTS AND SIGNALS --- */}
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
      >
        <div key="chart">
          <DashboardPanel 
            title="XAUUSD" 
            tooltipInfo="Interactive candlestick chart with technical indicators."
            onExportCsv={() => {
              if (!chartHistoryRef.current || chartHistoryRef.current.length === 0) return;
              const headers = ["Time", "Open", "High", "Low", "Close"];
              const rows = chartHistoryRef.current.map((c: any) => [
                new Date(c.time * 1000).toLocaleString(),
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
                 position: 'absolute', top: 10, right: 16, zIndex: 20,
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
                   left: '100px',
                   right: '185px',
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

                <CandlestickChart symbol="XAUUSD" onHistoryUpdate={(data) => chartHistoryRef.current = data} signals={signals} maxHistoryLimit={50} visibleBarsCount={12} />
             </div>
          </DashboardPanel>
        </div>

        <div key="signals">
          <DashboardPanel 
            title="Recent Signals" 
            tooltipInfo="Latest trade recommendations generated by the strategy."
            onExportCsv={() => {
              const headers = ["Time", "Signal", "Price", "SL", "TP", "R:R", "Conf", "Regime", "Model", "Status"];
              const rows = signals.map(s => [
                new Date(s.timestamp).toLocaleString(),
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
                initialData={signals.slice(0, 15)}
                hidePagination
                hideSearch
                onViewDetails={(id) => setSelectedSignal(Number(id))}
                compact
                formatCell={(cellId, value) => {
                  const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
                  if (col.includes("timestamp") && value) {
                    const d = new Date(value);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const day = d.getDate().toString().padStart(2, '0');
                    const month = months[d.getMonth()];
                    const year = d.getFullYear().toString().slice(-2);
                    const time = d.toTimeString().split(' ')[0];
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', fontSize: '9.5px' }}>
                        <span>{`${day} ${month} ${year}`}</span>
                        <span style={{ color: '#a8a8a8', fontSize: '8.5px' }}>{time}</span>
                      </div>
                    );
                  }
                  if (col.includes("status")) {
                    if (value === "PENDING_EXECUTION") {
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '9.5px' }}>
                          <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#11a3c6', flexShrink: 0 }}>
                            <path d="M16 4C9.383 4 4 9.383 4 16s5.383 12 12 12 12-5.383 12-12S22.617 4 16 4zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6zm-1 3v8h6v-2h-4v-6h-2z" />
                          </svg>
                          <span style={{ color: '#11a3c6', whiteSpace: 'nowrap' }}>Pending Execution</span>
                        </div>
                      );
                    }
                    if (value === "EXECUTED") {
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '9.5px' }}>
                          <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                            <path d="M14 21.414l-5.707-5.707-1.414 1.414 7.121 7.121 12-12-1.414-1.414z" />
                          </svg>
                          <span style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>Executed</span>
                        </div>
                      );
                    }
                    if (value === "NEW") {
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '9.5px' }}>
                          <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
                            <circle cx="16" cy="16" r="8" />
                          </svg>
                          <span style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>New</span>
                        </div>
                      );
                    }
                    // Fallback
                    const readableValue = value ? value.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
                    return (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '9.5px' }}>
                        <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#6f6f6f', flexShrink: 0 }}>
                          <circle cx="16" cy="16" r="8" />
                        </svg>
                        <span style={{ color: '#a8a8a8', whiteSpace: 'nowrap' }}>{readableValue}</span>
                      </div>
                    );
                  }
                  if (col.includes("direction")) {
                    const readableVal = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
                    return <span style={{ color: value === 'BUY' ? '#24a148' : value === 'SELL' ? '#fa4d56' : '#f4f4f4', fontWeight: 'bold' }}>{readableVal}</span>;
                  }
                  if (col.includes("entry_price")) {
                    const rowId = cellId.split(':')[0];
                    const signal = signals.find((s: any) => String(s.id) === String(rowId));
                    if (!signal) return <span style={{ fontSize: '9.5px' }}>{value ? Number(value).toFixed(2) : '-'}</span>;
                    const entry = signal.entry_price ? Number(signal.entry_price).toFixed(2) : '-';
                    const sl = signal.sl_price ? Number(signal.sl_price).toFixed(2) : '-';
                    const tp = signal.tp_price ? Number(signal.tp_price).toFixed(2) : '-';
                    const rr = Number(signal.rr_ratio) || 0;
                    const rrColor = rr >= 2.0 ? '#24a148' : '#a8a8a8';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', fontSize: '9.5px' }}>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>{entry}</span>
                          {signal.rr_ratio !== undefined && (
                            <span style={{ fontSize: '8.5px', color: rrColor, marginLeft: '4px' }}>
                              (R:R {rr.toFixed(2)})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '8.5px', color: '#a8a8a8' }}>
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
                    const signal = signals.find((s: any) => String(s.id) === String(rowId));
                    if (!signal) return <span>-</span>;
                    const modelName = signal.model || signal.model_version;
                    const conf = signal.confidence;
                    const confColor = conf >= 0.7 ? '#24a148' : conf >= 0.5 ? '#f1c21b' : '#fa4d56';
                    
                    let readableModelText = '-';
                    if (modelName) {
                      const words = modelName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                      readableModelText = words.join(' ');
                    }
                    
                    return (
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center', flexWrap: 'nowrap', fontSize: '9.5px' }}>
                        {modelName ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#4589ff', flexShrink: 0 }}>
                              <path d="M26,8V6a2,2,0,0,0-2-2H22V2H20V4H18V2H16V4H14V2H12V4H10V2H8V4H6A2,2,0,0,0,4,6V8H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2A2,2,0,0,0,6,28H8v2h2V28h2v2h2V28h2v2h2V28h2v2h2V28h2A2,2,0,0,0,28,26V24h2V22H28V20h2V18H28V16h2V14H28V12h2V10H28V8ZM26,26H6V6H26Z" />
                              <rect x="10" y="10" width="12" height="12" />
                            </svg>
                            <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '9.5px', whiteSpace: 'nowrap' }}>
                              {readableModelText}
                            </span>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                        {conf !== undefined && conf !== null && (
                          <span style={{ color: confColor, fontWeight: 'bold', fontSize: '8.5px', whiteSpace: 'nowrap' }}>
                            {(conf * 100).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    );
                  }
                  return value;
                }}
              />
            </div>
          </DashboardPanel>
        </div>
        <div key="trades">
          <DashboardPanel 
            title="Recent Trades" 
            tooltipInfo="Recent executed trades and their PnL details."
            onExportCsv={() => {
              const headers = ["Direction", "Entry Time", "Exit Time", "Entry", "Exit", "Lots", "Reason", "Regime", "Model", "Conf", "PnL"];
              const rows = mergedTrades.map(t => [
                t.direction,
                t.entry_time ? new Date(t.entry_time).toLocaleString() : '',
                t.exit_time ? new Date(t.exit_time).toLocaleString() : '',
                t.entry_price || '',
                t.exit_price || '',
                t.volume || '',
                t.close_reason || '',
                t.regime || '',
                t.model_version || '',
                t.confidence ? (t.confidence * 100).toFixed(2) + '%' : '',
                t.pnl_money || ''
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
              <TradeHistoryTable trades={mergedTrades.slice(0, 5)} title="" hidePagination hideSearch compact />
            </div>
          </DashboardPanel>
        </div>

        <div key="shap">
          <DashboardPanel title="Latest Signal Explainability" tooltipInfo="Top 5 features contributing to the latest signal (Pseudo-SHAP)">
            <ShapPanel 
              shapValues={signals[0]?.signal_metadata?.model_output?.shap_values || signals[0]?.shap_values || []} 
              direction={signals[0]?.direction || "NEUTRAL"} 
              probabilities={signals[0]?.signal_metadata?.model_output?.probabilities || {}}
            />
          </DashboardPanel>
        </div>

        <div key="attribution">
          <DashboardPanel title="Factor Attribution" tooltipInfo="Performance decomposition based on recent closed trades.">
            <AttributionPanel />
          </DashboardPanel>
        </div>

        <div key="regime">
          <DashboardPanel title="Regime Timeline" tooltipInfo="Historical changes in market regime.">
            <RegimeTimeline />
          </DashboardPanel>
        </div>
      </ResponsiveGridLayout>
      
      {/* --- SIGNAL DETAIL MODAL --- */}
      <GlobalDetailTable 
        id={selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />
    </div>
  );
}
