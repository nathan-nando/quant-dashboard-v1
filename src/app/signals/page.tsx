"use client";

import { Grid, Column } from "@carbon/react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";
import { useGlobalState } from "../../contexts/GlobalStateContext";
import DashboardPanel from "../../components/DashboardPanel";
import { API_BASE_URL } from '@/config/env';

const CandlestickChart = dynamic(() => import("../../components/CandlestickChart"), { ssr: false });

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' };
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' };
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' };
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' };
  return { text: regime, color: '#f4f4f4' };
};

export default function SignalsPage() {
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: 'signal' | 'feature_snapshot' } | null>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const { signals: liveSignals } = useGlobalState();

  const headers = [
    { key: "timestamp", header: "Time" },
    { key: "direction", header: "Signal" },
    { key: "entry_price", header: "Price / SL / TP / R:R" },
    { key: "model", header: "Model / Conf" },
    { key: "regime", header: "Regime" },
    { key: "status", header: "Status" },
  ];

  const formatCell = (cellId: string, value: any) => {
    const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
    if (col.includes("timestamp") && value) {
      const d = new Date(value);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#11a3c6', flexShrink: 0 }}>
              <path d="M16 4C9.383 4 4 9.383 4 16s5.383 12 12 12 12-5.383 12-12S22.617 4 16 4zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6zm-1 3v8h6v-2h-4v-6h-2z" />
            </svg>
            <span style={{ color: '#11a3c6', whiteSpace: 'nowrap' }}>Pending Execution</span>
          </div>
        );
      }
      if (value === "EXECUTED") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
              <path d="M14 21.414l-5.707-5.707-1.414 1.414 7.121 7.121 12-12-1.414-1.414z" />
            </svg>
            <span style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>Executed</span>
          </div>
        );
      }
      if (value === "NEW") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
              <circle cx="16" cy="16" r="8" />
            </svg>
            <span style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>New</span>
          </div>
        );
      }
      // Fallback
      const readableValue = value ? value.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
          <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#6f6f6f', flexShrink: 0 }}>
            <circle cx="16" cy="16" r="8" />
          </svg>
          <span style={{ color: '#a8a8a8', whiteSpace: 'nowrap' }}>{readableValue}</span>
        </div>
      );
    }
    if (col.includes("direction")) {
      const readable = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
      return <span style={{ color: value === 'BUY' ? '#24a148' : value === 'SELL' ? '#fa4d56' : '#f4f4f4', fontWeight: 'bold' }}>{readable}</span>;
    }
    if (col.includes("entry_price")) {
      const rowId = cellId.split(':')[0];
      const signal = signals.find((s: any) => String(s.id) === String(rowId));
      if (!signal) return <span>{value ? Number(value).toFixed(2) : '-'}</span>;
      const entry = signal.entry_price ? Number(signal.entry_price).toFixed(2) : '-';
      const sl = signal.sl_price ? Number(signal.sl_price).toFixed(2) : '-';
      const tp = signal.tp_price ? Number(signal.tp_price).toFixed(2) : '-';
      const rr = Number(signal.rr_ratio) || 0;
      const rrColor = rr >= 2.0 ? '#24a148' : '#a8a8a8';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>{entry}</span>
            {signal.rr_ratio !== undefined && (
              <span style={{ fontSize: '10px', color: rrColor, marginLeft: '6px' }}>
                (R:R {rr.toFixed(2)})
              </span>
            )}
          </div>
          <div style={{ fontSize: '10px', color: '#a8a8a8' }}>
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
        <span style={{ color: format.color, fontWeight: 'bold', fontSize: '0.85em', display: 'inline-block', lineHeight: '1.1' }}>
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
        <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
          {modelName ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#4589ff', flexShrink: 0 }}>
                <path d="M26,8V6a2,2,0,0,0-2-2H22V2H20V4H18V2H16V4H14V2H12V4H10V2H8V4H6A2,2,0,0,0,4,6V8H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2A2,2,0,0,0,6,28H8v2h2V28h2v2h2V28h2v2h2V28h2v2h2V28h2A2,2,0,0,0,28,26V24h2V22H28V20h2V18H28V16h2V14H28V12h2V10H28V8ZM26,26H6V6H26Z" />
                <rect x="10" y="10" width="12" height="12" />
              </svg>
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap' }}>
                {readableModelText}
              </span>
            </div>
          ) : (
            <span>-</span>
          )}
          {conf !== undefined && conf !== null && (
            <span style={{ color: confColor, fontWeight: 'bold', fontSize: '10px', whiteSpace: 'nowrap' }}>
              {(conf * 100).toFixed(2)}%
            </span>
          )}
        </div>
      );
    }
    return value;
  };

  return (
    <Grid fullWidth>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Signals</h3>
      </Column>

      {/* Chart + Table — one row, 0.2rem gap, full height */}
      <Column lg={16} md={8} sm={4}>
        <div style={{
          display: 'flex',
          gap: '0.2rem',
          alignItems: 'stretch',
          height: 'calc(100vh - 10rem)',
          width: '100%',
        }}>

          {/* Chart */}
          <div style={{
            flex: '0 0 50%',
            position: 'relative',
          }}>
            <DashboardPanel 
              title="XAUUSD" 
              tooltipInfo="Interactive candlestick chart with technical indicators."
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
                <CandlestickChart symbol="XAUUSD" signals={signals} />
              </div>
            </DashboardPanel>
          </div>

          {/* Table */}
          <div style={{ flex: '1 1 0', position: 'relative' }}>
            <DashboardPanel 
              title="Signal History"
              tooltipInfo="List of generated strategy signals and their details."
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
                link.setAttribute("download", `signal_history_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <div style={{ height: "100%" }}>
                <GlobalTable 
                  title=""
                  headers={headers}
                  fetchUrl={`${API_BASE_URL}/dashboard/signals`}
                  onViewDetails={(id) => setSelectedItem({ id: Number(id), type: 'signal' })}
                  formatCell={formatCell}
                  onPageDataChange={setSignals}
                  refreshTrigger={liveSignals.length > 0 ? liveSignals[0].id : 0}
                />
              </div>
            </DashboardPanel>
          </div>

        </div>
      </Column>

      <Column lg={16} md={8} sm={4} style={{ marginTop: '0.2rem', paddingBottom: '2rem', position: 'relative' }}>
        <DashboardPanel 
          title="Feature Snapshots"
          tooltipInfo="PSI and feature indicators value at generation time."
        >
          <div style={{ height: "100%" }}>
            <GlobalTable 
              title=""
              headers={[
                { key: "timestamp", header: "Time" },
                { key: "symbol", header: "Symbol" },
                { key: "timeframe", header: "TF" },
                { key: "regime", header: "Regime" },
                { key: "edge_status", header: "Edge Status" },
                { key: "remarks", header: "Remarks" },
                { key: "edge_psi", header: "PSI" },
              ]}
              fetchUrl={`${API_BASE_URL}/dashboard/feature-snapshots`}
              onViewDetails={(id) => setSelectedItem({ id: Number(id), type: 'feature_snapshot' })}
              formatCell={(cellId, value) => {
                const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
                if (col.includes("edge_status")) {
                  const isValid = value === "VALID";
                  const color = isValid ? "#24a148" : "#fa4d56";
                  return (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                      {isValid ? (
                        <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: color, flexShrink: 0 }}>
                          <path d="M14 21.414l-5.707-5.707-1.414 1.414 7.121 7.121 12-12-1.414-1.414z" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: color, flexShrink: 0 }}>
                          <path d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16z" />
                        </svg>
                      )}
                      <span style={{ color, whiteSpace: 'nowrap' }}>{value}</span>
                    </div>
                  );
                }
                return formatCell(cellId, value);
              }}
              refreshTrigger={liveSignals.length > 0 ? liveSignals[0].id : 0}
            />
          </div>
        </DashboardPanel>
      </Column>
      
      <GlobalDetailTable 
        id={selectedItem?.id || null} 
        type={selectedItem?.type || 'signal'}
        onClose={() => setSelectedItem(null)} 
      />
    </Grid>
  );
}
