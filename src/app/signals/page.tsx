"use client";

import { Grid, Column } from "@carbon/react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";
import { useGlobalState } from "../../contexts/GlobalStateContext";
import DashboardPanel from "../../components/DashboardPanel";
import RangeBarPyramidVisualizer from "../../components/RangeBarPyramidVisualizer";
import { API_BASE_URL } from '@/config/env';
import { formatJakartaDateTime } from "../../utils/date";

const CandlestickChart = dynamic(() => import("../../components/CandlestickChart"), { ssr: false });
import { getMarketRegimeFormat as getRegimeFormat, getEngineSourceFormat } from "../../utils/formatters";

export default function SignalsPage() {
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: 'signal' | 'feature_snapshot' } | null>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const { signals: liveSignals } = useGlobalState();

  const headers = [
    { key: "timestamp", header: "Time" },
    { key: "direction", header: "Signal" },
    { key: "entry_price", header: "Price / SL / TP / R:R" },
    { key: "model", header: "Model" },
    { key: "regime", header: "Regime" },
    { key: "status", header: "Status" },
    { key: "remarks", header: "Remarks" },
  ];

  const formatCell = (cellId: string, value: any, row?: any) => {
    const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
    if (col.includes("timestamp") && value) {
      const { date, time } = formatJakartaDateTime(value);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
          <span>{date}</span>
          <span style={{ color: '#a8a8a8', fontSize: '0.9em' }}>{time}</span>
        </div>
      );
    }
    if (col.includes("status")) {
      if (value === "PYRAMID_HOLD") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#f1c21b', flexShrink: 0 }}>
              <path d="M16 4C9.383 4 4 9.383 4 16s5.383 12 12 12 12-5.383 12-12S22.617 4 16 4zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6zm-1 3v8h6v-2h-4v-6h-2z" />
            </svg>
            <span style={{ color: '#f1c21b', whiteSpace: 'nowrap' }}>Pyramid Hold</span>
          </div>
        );
      }
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
    if (col.includes("remarks")) {
      if (!value) return <span style={{ color: '#525252' }}>-</span>;
      const isError = String(value).toLowerCase().includes("error") || String(value).toLowerCase().includes("rejected") || String(value).toLowerCase().includes("blocked") || String(value).toLowerCase().includes("exceeded");
      return <span style={{ color: isError ? '#fa4d56' : '#f1c21b', fontSize: '0.65rem', lineHeight: '1.25', display: 'inline-block' }}>{value}</span>;
    }
    if (col.includes("direction")) {
      const readable = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
      return <span style={{ color: value === 'BUY' ? '#24a148' : value === 'SELL' ? '#fa4d56' : '#f4f4f4', fontWeight: 'bold' }}>{readable}</span>;
    }
    if (col.includes("entry_price")) {
      const rowId = cellId.split(':')[0];
      const signal = row || signals.find((s: any) => String(s.id) === String(rowId));
      if (!signal && !value) return <span>-</span>;
      const entryVal = signal?.entry_price || value;
      const entry = entryVal ? Number(entryVal).toFixed(2) : '-';
      const sl = signal?.sl_price ? Number(signal.sl_price).toFixed(2) : '-';
      const tp = signal?.tp_price ? Number(signal.tp_price).toFixed(2) : '-';
      const rr = Number(signal?.rr_ratio) || 0;
      const rrColor = rr >= 2.0 ? '#24a148' : '#a8a8a8';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>{entry}</span>
            <span style={{ fontSize: '10px', color: rrColor, marginLeft: '6px' }}>
              (R:R {rr.toFixed(2)})
            </span>
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
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', fontSize: '9.5px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#4589ff', flexShrink: 0 }}>
              <path d="M26,8V6a2,2,0,0,0-2-2H22V2H20V4H18V2H16V4H14V2H12V4H10V2H8V4H6A2,2,0,0,0,4,6V8H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2A2,2,0,0,0,6,28H8v2h2V28h2v2h2V28h2v2h2V28h2v2h2V28h2A2,2,0,0,0,28,26V24h2V22H28V20h2V18H28V16h2V14H28V12h2V10H28V8ZM26,26H6V6H26Z" />
              <rect x="10" y="10" width="12" height="12" />
            </svg>
            <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap' }}>
              {readableModelText}
            </span>
          </div>
          <div style={{ fontSize: '8.5px', fontWeight: 'bold', display: 'flex', gap: '3px', marginTop: '1px' }}>
            <span style={{ color: '#24a148' }}>B:{calBuy !== undefined ? (calBuy * 100).toFixed(1) : '0.0'}%</span>
            <span style={{ color: '#6f6f6f' }}>|</span>
            <span style={{ color: '#fa4d56' }}>S:{calSell !== undefined ? (calSell * 100).toFixed(1) : '0.0'}%</span>
          </div>
        </div>
      );
    }
    return value;
  };

  return (
    <Grid fullWidth>
      <Column lg={16} md={8} sm={4} className="landing-page__banner" style={{ marginBottom: "0.2rem" }}>
        <h3 style={{ fontWeight: 400 }}>Signals</h3>
      </Column>

      {/* Range Bar & Pyramiding Monitor */}
      <Column lg={16} md={8} sm={4} style={{ marginBottom: "0.1rem" }}>
        <RangeBarPyramidVisualizer />
      </Column>

      {/* Chart + Table — stack on mobile, row on desktop */}
      <Column lg={16} md={8} sm={4}>
        <div className="signals-layout">

          {/* Chart */}
          <div className="signals-chart-wrapper">
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
          <div className="signals-table-wrapper">
            <DashboardPanel 
              title="Signal History"
              tooltipInfo="List of generated strategy signals and their details."
              onExportCsv={() => {
                const headers = ["Time", "Signal", "Price", "SL", "TP", "R:R", "Conf", "Regime", "Model", "Status", "Remarks"];
                const rows = signals.map(s => [
                  formatJakartaDateTime(s.timestamp).full,
                  s.direction,
                  s.entry_price || '',
                  s.sl_price || '',
                  s.tp_price || '',
                  s.rr_ratio || '',
                  (s.confidence * 100).toFixed(2) + '%',
                  s.regime,
                  s.model || '',
                  s.status,
                  s.remarks || ''
                ].map(v => `"${v}"`).join(","));
                
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
