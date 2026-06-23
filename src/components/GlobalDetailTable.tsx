"use client";

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Tag,
  Loading
} from '@carbon/react';
import { ChevronDown, ChevronUp, Copy } from '@carbon/icons-react';

const CollapsibleJSON = ({ 
  displayValue, 
  isExpanded, 
  onToggle 
}: { 
  displayValue: string; 
  isExpanded: boolean; 
  onToggle: () => void; 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: 'transparent', border: '1px dashed #8d8d8d', color: 'inherit', padding: '0.5rem', borderRadius: '4px', width: 'fit-content', maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button 
          type="button" 
          title="Copy"
          onClick={handleCopy} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
        >
          {copied ? <span style={{fontSize: '0.75rem', marginRight: '0.2rem'}}>Copied!</span> : <Copy size={16} />}
        </button>
        <button 
          type="button" 
          title={!isExpanded ? "Expand Data" : "Collapse Data"}
          onClick={onToggle} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
        >
          {!isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
      {isExpanded && (
        <div style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'Consolas, "Courier New", monospace', color: 'inherit' }}>
            {displayValue}
          </pre>
        </div>
      )}
    </div>
  );
};

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' }; // Green
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' }; // Red
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' }; // Yellow
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' }; // Blue
  return { text: regime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '), color: '#f4f4f4' };
};

interface GlobalDetailTableProps {
  id?: number | string | null;
  type?: 'signal' | 'model' | 'dataset' | 'feature_snapshot';
  dataObj?: any;
  onClose: () => void;
}

export default function GlobalDetailTable({ id, type = 'signal', dataObj, onClose }: GlobalDetailTableProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedKeys({});
    
    if (type === 'model' || type === 'dataset') {
      if (dataObj) setData(dataObj);
      else setData(null);
      return;
    }

    if (id === null || id === undefined) {
      setData(null);
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    
    const url = type === 'feature_snapshot' 
      ? `http://127.0.0.1:8000/api/dashboard/feature-snapshots/${id}`
      : `http://127.0.0.1:8000/api/dashboard/signals/${id}`;
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch signal details");
        return res.json();
      })
      .then(json => {
        if (isMounted) setData(json);
      })
      .catch(err => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [id, type, dataObj]);

  if (id === null && !dataObj) return null;

  return (
    <Modal
      open={(id !== null && id !== undefined) || !!dataObj}
      onRequestClose={onClose}
      modalHeading={type === 'signal' ? `Signal Details #${id}` : type === 'dataset' ? `Dataset Details` : type === 'feature_snapshot' ? `Feature Snapshot #${id}` : `Model Details`}
      primaryButtonText="Close"
      onRequestSubmit={onClose}
      size="lg"
    >
      {loading && <Loading withOverlay={false} />}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {data && !loading && !error && type === 'signal' && (
        <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "0.5rem" }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem 0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Symbol / Direction</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.875rem' }}>{data.symbol || '-'}</strong>
                <Tag type={data.direction === 'BUY' ? 'green' : data.direction === 'SELL' ? 'red' : 'gray'} size="sm" style={{ margin: 0 }}>
                  {data.direction}
                </Tag>
              </div>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Confidence</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{(data.confidence * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Entry Price</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{data.entry_price ? data.entry_price.toFixed(5) : '-'}</p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>R:R Ratio</p>
              <p style={{ fontSize: '0.875rem' }}>{data.rr_ratio || '-'}</p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>SL Price</p>
              <p style={{ fontSize: '0.875rem', color: '#ff8389', fontWeight: '500' }}>
                {data.sl_price ? data.sl_price.toFixed(5) : '-'} <span style={{ color: '#a8a8a8', fontSize: '0.75rem', fontWeight: 'normal' }}>({data.sl_pips} pips)</span>
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>TP Price</p>
              <p style={{ fontSize: '0.875rem', color: '#42be65', fontWeight: '500' }}>
                {data.tp_price ? data.tp_price.toFixed(5) : '-'} <span style={{ color: '#a8a8a8', fontSize: '0.75rem', fontWeight: 'normal' }}>({data.tp_pips} pips)</span>
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Regime</p>
              <strong style={{ fontSize: '0.875rem', color: getRegimeFormat(data.regime).color }}>
                {getRegimeFormat(data.regime).text}
              </strong>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Timestamp</p>
              <p style={{ fontSize: '0.875rem' }}>{data.timestamp ? new Date(data.timestamp).toLocaleString() : '-'}</p>
            </div>
          </div>

          <h4 style={{ marginBottom: "1rem", fontSize: "1rem", borderTop: "1px solid #393939", paddingTop: "1rem" }}>Technical Indicators (XGBoost Features)</h4>
          {data.features && Object.keys(data.features).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem 0.75rem', marginBottom: '1rem' }}>
              {Object.entries(data.features).map(([key, value]: [string, any]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #262626', paddingBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#a8a8a8', fontWeight: '500' }}>{key}</span>
                  <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                    {value !== null && value !== undefined ? Number(value).toFixed(4) : "N/A"}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#a8a8a8", fontSize: "0.9rem", marginBottom: "1rem" }}>No feature snapshot available for this signal.</p>
          )}
        </div>
      )}

      {data && (type === 'model' || type === 'dataset' || type === 'feature_snapshot') && (() => {
         const entries = Object.entries(data).filter(([key]) => key !== 'id');
         const flatEntries: [string, any][] = [];
         const nestedEntries: [string, any][] = [];
         
         entries.forEach(([key, value]) => {
            let isNested = false;
            if (value !== null && value !== undefined) {
               if (typeof value === 'object') {
                  isNested = true;
               } else if (typeof value === 'string') {
                  try {
                     if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                        JSON.parse(value);
                        isNested = true;
                     }
                  } catch (e) {}
               }
            }
            if (isNested) {
               nestedEntries.push([key, value]);
            } else {
               flatEntries.push([key, value]);
            }
         });

         return (
           <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "0.5rem" }}>
             {/* Part 1: Flat Properties Grid */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem 0.75rem', marginBottom: nestedEntries.length > 0 ? '1.5rem' : '0' }}>
                {flatEntries.map(([key, value]) => {
                   let displayValue = value;
                   if (value === null || value === undefined) {
                       displayValue = "-";
                   }
                   if (['train_start_time', 'created_at', 'updated_at'].includes(key) && value) {
                       displayValue = new Date(value).toLocaleString();
                   }
                   const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                   return (
                       <div key={key}>
                         <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>{formattedKey}</p>
                         <p style={{ fontSize: '0.875rem', fontWeight: (typeof value === 'number' || key === 'status') ? 'bold' : 'normal' }}>
                           {key === 'regime' ? (
                             <span style={{ color: getRegimeFormat(String(displayValue)).color }}>
                               {getRegimeFormat(String(displayValue)).text}
                             </span>
                           ) : String(displayValue)}
                         </p>
                       </div>
                   );
                })}
             </div>

             {/* Part 2: Nested Properties Grid */}
             {nestedEntries.length > 0 && (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem 0.75rem', borderTop: '1px solid #393939', paddingTop: '1.5rem', marginTop: '1rem', marginBottom: '1.5rem', alignItems: 'start' }}>
                  {nestedEntries.map(([key, value]) => {
                     let displayValue = value;
                     if (typeof value === 'object') {
                         displayValue = JSON.stringify(value, null, 2);
                     } else if (typeof value === 'string') {
                         try {
                             const parsed = JSON.parse(value);
                             displayValue = JSON.stringify(parsed, null, 2);
                         } catch (e) {}
                     }
                     const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                     const isExpanded = !!expandedKeys[key];

                     return (
                         <div key={key}>
                           <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>{formattedKey}</p>
                           <CollapsibleJSON 
                             displayValue={displayValue as string} 
                             isExpanded={isExpanded}
                             onToggle={() => setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }))}
                           />
                         </div>
                     );
                  })}
               </div>
             )}
           </div>
         );
      })()}
    </Modal>
  );
}
