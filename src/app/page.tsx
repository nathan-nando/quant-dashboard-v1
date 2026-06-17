"use client";

import { Grid, Column, Tile } from "@carbon/react";
import { CurrencyDollar, Activity, Power, Wallet } from "@carbon/icons-react";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import GlobalTable from '../components/GlobalTable';

const CandlestickChart = dynamic(() => import('../components/CandlestickChart'), { ssr: false });

export default function Home() {
  const [state, setState] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    // 1. Subscribe to lightning-fast SSE for ALL live state (Price, Regime, Execution, Signals)
    const eventSource = new EventSource("http://127.0.0.1:8000/api/dashboard/stream");
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setState(payload);
        if (payload.recent_signals) {
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
    { key: "direction", header: "Signal" },
    { key: "status", header: "Status" },
  ];

  return (
    <Grid fullWidth style={{ maxWidth: '100%', padding: '0 2rem' }}>
      
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
            <h3 style={{ margin: 0, color: "#4589ff" }}>{state?.regime || "UNKNOWN"}</h3>
          </Tile>

          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <Power size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0 }}>Auto Execution</p>
            </div>
            <h3 style={{ margin: 0, color: state?.auto_execution ? "#24a148" : "#fa4d56" }}>
              {state?.auto_execution ? "ACTIVE" : "DISABLED"}
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
      <Column lg={10} md={8} sm={4} style={{marginTop: "0.5rem"}}>
        <Tile style={{ padding: 0, overflow: 'hidden', height: "100%", minHeight: "400px" }}>
          <CandlestickChart symbol="XAUUSD" />
        </Tile>
      </Column>

      <Column lg={6} md={8} sm={4} style={{marginTop: "0.5rem"}}>
        <GlobalTable 
          title={<span style={{ fontSize: "14px", fontWeight: "normal" }}>Recent Signals</span>}
          headers={signalHeaders}
          initialData={signals}
        />
      </Column>
    </Grid>
  );
}
