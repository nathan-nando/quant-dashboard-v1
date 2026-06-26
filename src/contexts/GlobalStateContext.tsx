"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { ToastNotification } from "@carbon/react";
import { API_BASE_URL } from '@/config/env';

interface GlobalStateContextType {
  state: any;
  signals: any[];
  analytics: any;
  totalTrades: number;
  positions: any[];
}

const GlobalStateContext = createContext<GlobalStateContextType>({
  state: null,
  signals: [],
  analytics: null,
  totalTrades: 0,
  positions: []
});

export const useGlobalState = () => useContext(GlobalStateContext);

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' }; 
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' }; 
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' }; 
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' }; 
  return { text: regime, color: '#f4f4f4' };
};

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [totalTrades, setTotalTrades] = useState<number>(0);
  const [positions, setPositions] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<{ kind: any, title: string, subtitle: React.ReactNode, caption?: string } | null>(null);
  
  const latestSignalIdRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Subscribe to lightning-fast SSE for ALL live state
    const eventSource = new EventSource(`${API_BASE_URL}/dashboard/stream`);
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setState(payload);
        
        if (payload.total_trades !== undefined) setTotalTrades(payload.total_trades);
        if (payload.positions) setPositions(payload.positions);
        
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
    fetch(`${API_BASE_URL}/dashboard/analytics`)
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(err => console.error("Failed to load analytics", err));

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <GlobalStateContext.Provider value={{ state, signals, analytics, totalTrades, positions }}>
      {/* Toast Notification Mount Point */}
      {toastMsg && (
        <div style={{ position: "fixed", top: "4rem", right: "2rem", zIndex: 9999 }}>
          <ToastNotification
            key={toastMsg.caption || toastMsg.title}
            kind={toastMsg.kind}
            title={toastMsg.title}
            subtitle={toastMsg.subtitle as any}
            caption={toastMsg.caption}
            timeout={5000}
            onClose={() => setToastMsg(null)}
          />
        </div>
      )}
      {children}
    </GlobalStateContext.Provider>
  );
}
