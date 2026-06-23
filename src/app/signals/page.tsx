"use client";

import { Grid, Column, Tag } from "@carbon/react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";
import { useGlobalState } from "../../contexts/GlobalStateContext";

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
          <Tag type="cyan" style={{ height: 'auto', padding: '4px 6px', lineHeight: '1.2', textAlign: 'left' }}>
            Pending<br/>Execution
          </Tag>
        );
      }
      return <Tag type={value === "NEW" ? "blue" : "gray"}>{value === "NEW" ? "New" : value}</Tag>;
    }
    if (col.includes("direction")) {
      const readable = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
      return <span style={{ color: value === 'BUY' ? '#24a148' : value === 'SELL' ? '#fa4d56' : '#f4f4f4', fontWeight: 'bold' }}>{readable}</span>;
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
            background: '#262626',
            border: '1px solid #393939',
            borderRadius: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Legend */}
            <div style={{
              position: 'absolute', top: 10, right: 16, zIndex: 20,
              display: 'flex', gap: '16px', alignItems: 'center', fontSize: '11px', color: '#a8a8a8'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#24a148' }}/>
                BUY
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#fa4d56' }}/>
                SELL
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#e8e8e8' }}/>
                Neutral
              </span>
            </div>
            <CandlestickChart symbol="XAUUSD" signals={signals} />
          </div>

      {/* Table */}
          <div style={{ flex: '1 1 0', overflow: 'auto', background: '#262626', border: '1px solid #393939', borderRadius: 0 }}>
            <GlobalTable 
              title="Signal History"
              headers={headers}
              fetchUrl="http://127.0.0.1:8000/api/dashboard/signals"
              onViewDetails={(id) => setSelectedItem({ id: Number(id), type: 'signal' })}
              formatCell={formatCell}
              onPageDataChange={setSignals}
              refreshTrigger={liveSignals.length > 0 ? liveSignals[0].id : 0}
            />
          </div>

        </div>
      </Column>

      <Column lg={16} md={8} sm={4} style={{ marginTop: '0.2rem', paddingBottom: '2rem' }}>
        <div style={{ background: '#262626', border: '1px solid #393939', borderRadius: 0 }}>
          <GlobalTable 
            title="Feature Snapshots"
            headers={[
              { key: "timestamp", header: "Time" },
              { key: "symbol", header: "Symbol" },
              { key: "timeframe", header: "TF" },
              { key: "regime", header: "Regime" },
              { key: "edge_status", header: "Edge Status" },
              { key: "remarks", header: "Remarks" },
              { key: "edge_psi", header: "PSI" },
            ]}
            fetchUrl="http://127.0.0.1:8000/api/dashboard/feature-snapshots"
            onViewDetails={(id) => setSelectedItem({ id: Number(id), type: 'feature_snapshot' })}
            formatCell={(cellId, value) => {
              const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
              if (col.includes("edge_status")) {
                return <Tag type={value === "VALID" ? "green" : "red"}>{value}</Tag>;
              }
              return formatCell(cellId, value);
            }}
            refreshTrigger={liveSignals.length > 0 ? liveSignals[0].id : 0}
          />
        </div>
      </Column>
      
      <GlobalDetailTable 
        id={selectedItem?.id || null} 
        type={selectedItem?.type || 'signal'}
        onClose={() => setSelectedItem(null)} 
      />
    </Grid>
  );
}
