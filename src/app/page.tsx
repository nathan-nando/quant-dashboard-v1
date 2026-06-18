"use client";

import { Grid, Column, Button, ToastNotification, Tag, Tile } from "@carbon/react";
import { CurrencyDollar, Activity, Power, Wallet, MachineLearningModel } from "@carbon/icons-react";
import { useEffect, useState, useRef } from "react";
import dynamic from 'next/dynamic';
import GlobalTable from '../components/GlobalTable';
import GlobalDetailTable from '../components/GlobalDetailTable';
import DashboardPanel from '../components/DashboardPanel';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';

const ResponsiveGridLayout = WidthProvider(Responsive);
const CandlestickChart = dynamic(() => import('../components/CandlestickChart'), { ssr: false });

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' }; // Green
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' }; // Red
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' }; // Yellow
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' }; // Blue
  return { text: regime, color: '#f4f4f4' };
};

export default function Home() {
  const [state, setState] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const latestSignalIdRef = useRef<number | null>(null);
  const chartHistoryRef = useRef<any[]>([]);

  useEffect(() => {
    // 1. Subscribe to lightning-fast SSE for ALL live state
    const eventSource = new EventSource("http://127.0.0.1:8000/api/dashboard/stream");
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setState(payload);
        if (payload.recent_signals && payload.recent_signals.length > 0) {
          const topSignal = payload.recent_signals[0];
          
          if (latestSignalIdRef.current !== null && latestSignalIdRef.current !== topSignal.id) {
            let msgKind = "info";
            if (topSignal.direction === "BUY") msgKind = "success";
            if (topSignal.direction === "SELL") msgKind = "error";
            
            const readableDirection = topSignal.direction ? topSignal.direction.charAt(0).toUpperCase() + topSignal.direction.slice(1).toLowerCase() : '';
            const format = getRegimeFormat(topSignal.regime);

            setToastMsg({ 
              kind: msgKind, 
              title: "🔔 New Live Signal", 
              subtitle: (
                <div style={{ marginTop: '0.25rem', lineHeight: '1.4' }}>
                  <strong>{topSignal.symbol}</strong> &mdash; <strong style={{ color: format.color }}>{readableDirection}</strong> @ <strong>{topSignal.entry_price?.toFixed(2) || '-'}</strong><br/>
                  Confidence: {(topSignal.confidence * 100).toFixed(2)}%<br/>
                  SL: <strong>{topSignal.sl_price?.toFixed(2) || '-'}</strong> ({topSignal.sl_pips}p) | TP: <strong>{topSignal.tp_price?.toFixed(2) || '-'}</strong> ({topSignal.tp_pips}p) (R:R {topSignal.rr_ratio})<br/>
                  Regime: <strong>{format.text}</strong>
                </div>
              ),
              caption: new Date().toLocaleTimeString()
            });
          }
          
          latestSignalIdRef.current = topSignal.id;
          setSignals(payload.recent_signals);
        }
      } catch (err) {
        console.error("Failed to parse SSE state data", err);
      }
    };

    // 2. Fetch Analytics snapshot
    fetch("http://127.0.0.1:8000/api/dashboard/analytics")
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(err => console.error("Failed to load analytics", err));

    return () => {
      eventSource.close();
    };
  }, []);

  const signalHeaders = [
    { key: "timestamp", header: "Time" },
    { key: "direction", header: "Signal", width: "1%" },
    { key: "entry_price", header: "Price" },
    { key: "sl_price", header: "SL $" },
    { key: "tp_price", header: "TP $" },
    { key: "rr_ratio", header: "R:R", width: "1%" },
    { key: "confidence", header: "Conf" },
    { key: "regime", header: "Regime", width: "1%" },
    { key: "model", header: "Model" },
    { key: "status", header: "Status" },
  ];

  const [toastMsg, setToastMsg] = useState<{ kind: any, title: string, subtitle: React.ReactNode, caption?: string } | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);

  const defaultLayout = [
    { i: 'chart', x: 0, y: 0, w: 7, h: 5, minW: 4, minH: 3 },
    { i: 'signals', x: 7, y: 0, w: 9, h: 5, minW: 4, minH: 3 }
  ];
  const [layouts, setLayouts] = useState<any>({ lg: defaultLayout });

  useEffect(() => {
    const saved = localStorage.getItem("quantDashboardLayout");
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleLayoutChange = (layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem("quantDashboardLayout", JSON.stringify(allLayouts));
  };

  return (
    <div style={{ maxWidth: '100%', padding: '0 2rem', position: 'relative' }}>
      {/* --- FLASH MESSAGE --- */}
      {toastMsg && (
        <div style={{ position: "fixed", top: "4rem", right: "2rem", zIndex: 9999 }}>
          <ToastNotification
            key={Date.now()}
            kind={toastMsg.kind}
            title={toastMsg.title}
            subtitle={toastMsg.subtitle as any}
            caption={toastMsg.caption}
            timeout={5000}
            onClose={() => setToastMsg(null)}
          />
        </div>
      )}

      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Dashboard</h3>
      </Column>

      {/* --- ROW 1: STATIC LIVE STATE METRICS --- */}
      <div style={{ marginBottom: "1rem", width: '100%' }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.25rem" }}>
          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <CurrencyDollar size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0 }}>Live Price</p>
            </div>
            <h3 style={{ margin: 0, color: "#f4f4f4" }}>
              {state?.price ? (
                state.price.ask > 0 ? state.price.ask.toFixed(2) : state.price.last?.toFixed(2) || "0.00"
              ) : "Loading..."}
            </h3>
          </Tile>

          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <Activity size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0 }}>Regime</p>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: getRegimeFormat(state?.regime).color }}>{getRegimeFormat(state?.regime).text}</h3>
          </Tile>

          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <Power size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0 }}>Auto Execution</p>
            </div>
            <h3 style={{ margin: 0, color: state?.auto_execution ? "#24a148" : "#fa4d56" }}>
              {state?.auto_execution ? "ON" : "OFF"}
            </h3>
          </Tile>

          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <Wallet size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0 }}>Total PnL</p>
            </div>
            <h3 style={{ margin: 0, color: analytics?.total_pnl >= 0 ? "#24a148" : "#fa4d56" }}>
              {analytics ? `$${analytics.total_pnl.toFixed(2)}` : "..."}
            </h3>
          </Tile>
        </div>
      </div>

      {/* --- ROW 2: DYNAMIC CHARTS AND SIGNALS --- */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1056, md: 672, sm: 320, xs: 0 }}
        cols={{ lg: 16, md: 8, sm: 4, xs: 2 }}
        rowHeight={90}
        draggableHandle=".panel-drag-handle"
        margin={[4, 4]} // 0.25rem gap equivalent, matching metrics
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
             <div style={{ height: "100%", overflow: "hidden", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
               <CandlestickChart symbol="XAUUSD" onHistoryUpdate={(data) => chartHistoryRef.current = data} />
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
                initialData={signals.slice(0, 5)}
                hidePagination
                onViewDetails={(id) => setSelectedSignal(Number(id))}
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
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                        <span>{`${day} ${month} ${year}`}</span>
                        <span style={{ color: '#a8a8a8', fontSize: '0.9em' }}>{time}</span>
                      </div>
                    );
                  }
                  if (col.includes("status")) {
                    if (value === "PENDING_EXECUTION") {
                      return (
                        <Tag type="cyan" style={{ height: 'auto', padding: '4px 6px', lineHeight: '1.2', textAlign: 'left' }}>
                          Pending<br/>Execution
                        </Tag>
                      );
                    }
                    const readableStatus = value === "NEW" ? "New" : value;
                    return <Tag type={value === "NEW" ? "blue" : "gray"}>{readableStatus}</Tag>;
                  }
                  if (col.includes("direction")) {
                    const readableVal = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
                    return <span style={{ color: value === 'BUY' ? '#24a148' : value === 'SELL' ? '#fa4d56' : '#f4f4f4', fontWeight: 'bold' }}>{readableVal}</span>;
                  }
                  if (col.includes("confidence")) {
                    const conf = Number(value);
                    const color = conf >= 0.7 ? '#24a148' : conf >= 0.5 ? '#f1c21b' : '#fa4d56';
                    return <span style={{ color, fontWeight: 'bold' }}>{(conf * 100).toFixed(2)}%</span>;
                  }
                  if (col.includes("entry_price")) return <span>{value ? Number(value).toFixed(2) : '-'}</span>;
                  if (col.includes("sl_price") || col.includes("sl_pips")) return <span style={{ color: '#fa4d56' }}>{value ? Number(value).toFixed(2) : '-'}</span>;
                  if (col.includes("tp_price") || col.includes("tp_pips")) return <span style={{ color: '#24a148' }}>{value ? Number(value).toFixed(2) : '-'}</span>;
                  if (col.includes("rr_ratio")) {
                    const rr = Number(value) || 0;
                    return <span style={{ color: rr >= 2.0 ? '#24a148' : '#f4f4f4' }}>{rr.toFixed(2)}</span>;
                  }
                  if (col.includes("regime")) {
                    const format = getRegimeFormat(value);
                    const parts = format.text.split(' ');
                    return (
                      <span style={{ color: format.color, fontWeight: 'bold', fontSize: '0.85em', display: 'inline-block', lineHeight: '1.1' }}>
                        {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <br/>}</span>)}
                      </span>
                    );
                  }
                  if (col.includes("model")) {
                    if (!value) return <Tag type="purple" style={{ margin: 0 }}>-</Tag>;
                    const words = value.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                    const readableModel = words.length > 1 ? <>{words[0]}<br/>{words.slice(1).join(' ')}</> : words[0];
                    return (
                      <Tag type="purple" style={{ margin: 0, height: 'auto', minHeight: '24px', whiteSpace: 'normal', lineHeight: '1.2', padding: '4px 8px', textAlign: 'left' }}>
                        {readableModel}
                      </Tag>
                    );
                  }
                  return value;
                }}
              />
            </div>
          </DashboardPanel>
        </div>
      </ResponsiveGridLayout>
      
      {/* --- SIGNAL DETAIL MODAL --- */}
      <GlobalDetailTable 
        signalId={selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />
    </div>
  );
}
