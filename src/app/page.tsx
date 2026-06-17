"use client";

import { Grid, Column, Tile, Button, ToastNotification } from "@carbon/react";
import { CurrencyDollar, Activity, Power, Wallet, MachineLearningModel } from "@carbon/icons-react";
import { useEffect, useState, useRef } from "react";
import dynamic from 'next/dynamic';
import GlobalTable from '../components/GlobalTable';
import GlobalDetailTable from '../components/GlobalDetailTable';
import { Tag } from '@carbon/react';

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

  useEffect(() => {
    // 1. Subscribe to lightning-fast SSE for ALL live state (Price, Regime, Execution, Signals)
    const eventSource = new EventSource("http://127.0.0.1:8000/api/dashboard/stream");
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setState(payload);
        if (payload.recent_signals && payload.recent_signals.length > 0) {
          const topSignal = payload.recent_signals[0];
          
          // Check if this is a genuinely new signal arriving during the session
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

    // 2. Fetch Analytics snapshot for Total PnL
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
    { key: "symbol", header: "Symbol" },
    { key: "entry_price", header: "Price" },
    { key: "direction", header: "Signal" },
    { key: "confidence", header: "Conf" },
    { key: "sl_price", header: "SL $" },
    { key: "tp_price", header: "TP $" },
    { key: "rr_ratio", header: "R:R" },
    { key: "regime", header: "Regime" },
    { key: "status", header: "Status" },
  ];

  const [isTriggering, setIsTriggering] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ kind: any, title: string, subtitle: React.ReactNode, caption?: string } | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);

  const handleTriggerML = async () => {
    setIsTriggering(true);
    setToastMsg(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/trigger-signal?symbol=XAUUSD", {
        method: "POST"
      });
      const data = await res.json();
      if (data.status === "success") {
        setToastMsg({ kind: "success", title: "ML Triggered", subtitle: "Signal computed successfully!", caption: new Date().toLocaleTimeString() });
        console.log("Triggered ML Engine Successfully:", data.signal);
      } else {
        setToastMsg({ kind: "error", title: "ML Engine Error", subtitle: data.message, caption: new Date().toLocaleTimeString() });
        console.error("Error triggering ML Engine:", data.message);
      }
    } catch (err: any) {
      setToastMsg({ kind: "error", title: "Network Error", subtitle: err.message, caption: new Date().toLocaleTimeString() });
      console.error("Fetch error:", err);
    }
    setIsTriggering(false);
  };

  return (
    <Grid fullWidth style={{ maxWidth: '100%', padding: '0 2rem', position: 'relative' }}>
      
      {/* --- FLASH MESSAGE --- */}
      {toastMsg && (
        <div style={{ position: "absolute", top: "1rem", right: "2rem", zIndex: 9999 }}>
          <ToastNotification
            kind={toastMsg.kind}
            title={toastMsg.title}
            subtitle={toastMsg.subtitle as any}
            caption={toastMsg.caption}
            timeout={5000}
            onClose={() => setToastMsg(null)}
          />
        </div>
      )}

      {/* --- HEADER CONTROLS --- */}
      <Column lg={16} md={8} sm={4} style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
        <Button 
          renderIcon={MachineLearningModel} 
          onClick={handleTriggerML}
          disabled={isTriggering}
          kind="tertiary"
        >
          {isTriggering ? "Evaluating..." : "Force Trigger ML Engine"}
        </Button>
      </Column>

      {/* --- ROW 1: LIVE STATE METRICS --- */}
      <Column lg={16} md={8} sm={4} style={{ marginBottom: "1rem" }}>
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
            <h3 style={{ margin: 0, color: getRegimeFormat(state?.regime).color }}>{getRegimeFormat(state?.regime).text}</h3>
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
      </Column>

      {/* --- ROW 2: CHARTS AND SIGNALS --- */}
      <Column lg={16} md={8} sm={4} style={{marginTop: "0.5rem"}}>
        <div className="dashboard-row-2">
          <Tile style={{ padding: 0, overflow: 'hidden', height: "100%", minHeight: "400px" }}>
            <CandlestickChart symbol="XAUUSD" />
          </Tile>
          
          <div style={{ height: "100%", overflow: "hidden" }}>
            <GlobalTable 
              title={<span style={{ fontSize: "14px", fontWeight: "normal" }}>Recent Signals</span>}
              headers={signalHeaders}
              initialData={signals}
              onViewDetails={(id) => setSelectedSignal(Number(id))}
              formatCell={(cellId, value) => {
                const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
                if (col.includes("timestamp") && value) {
                  return new Date(value).toLocaleString();
                }
                if (col.includes("status")) {
                  return <Tag type={value === "NEW" ? "blue" : value === "PENDING_EXECUTION" ? "cyan" : "gray"}>{value}</Tag>;
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
                if (col.includes("entry_price")) {
                  return <span>{value ? Number(value).toFixed(2) : '-'}</span>;
                }
                if (col.includes("sl_price") || col.includes("sl_pips")) {
                  return <span style={{ color: '#fa4d56' }}>{value ? Number(value).toFixed(2) : '-'}</span>;
                }
                if (col.includes("tp_price") || col.includes("tp_pips")) {
                  return <span style={{ color: '#24a148' }}>{value ? Number(value).toFixed(2) : '-'}</span>;
                }
                if (col.includes("rr_ratio")) {
                  const rr = Number(value) || 0;
                  return <span style={{ color: rr >= 2.0 ? '#24a148' : '#f4f4f4' }}>{rr.toFixed(2)}</span>;
                }
                if (col.includes("regime")) {
                  const format = getRegimeFormat(value);
                  return <span style={{ color: format.color, fontWeight: 'bold' }}>{format.text}</span>;
                }
                return value;
              }}
            />
          </div>
        </div>
      </Column>
      
      {/* --- SIGNAL DETAIL MODAL --- */}
      <GlobalDetailTable 
        signalId={selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />
    </Grid>
  );
}
