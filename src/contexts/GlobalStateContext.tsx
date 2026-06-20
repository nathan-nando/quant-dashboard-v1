"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { ToastNotification } from "@carbon/react";

interface GlobalStateContextType {
  state: any;
  signals: any[];
  analytics: any;
}

const GlobalStateContext = createContext<GlobalStateContextType>({
  state: null,
  signals: [],
  analytics: null
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
  const [toastMsg, setToastMsg] = useState<{ kind: any, title: string, subtitle: React.ReactNode, caption?: string } | null>(null);
  
  const latestSignalIdRef = useRef<number | null>(null);

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

  return (
    <GlobalStateContext.Provider value={{ state, signals, analytics }}>
      {/* Toast Notification Mount Point */}
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
      {children}
    </GlobalStateContext.Provider>
  );
}
