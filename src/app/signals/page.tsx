"use client";

import { Grid, Column, Tag } from "@carbon/react";
import { useState } from "react";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' }; // Green
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' }; // Red
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' }; // Yellow
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' }; // Blue
  return { text: regime, color: '#f4f4f4' };
};

export default function SignalsPage() {
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

  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);

  return (
    <Grid>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>All Signals</h3>
      </Column>
      <Column lg={16} md={8} sm={4}>
        <GlobalTable 
          title="Signal History"
          headers={headers}
          fetchUrl="http://127.0.0.1:8000/api/dashboard/signals"
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
      </Column>
      
      <GlobalDetailTable 
        id={selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />
    </Grid>
  );
}
