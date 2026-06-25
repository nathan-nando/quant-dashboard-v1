"use client";

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Loading
} from '@carbon/react';
import { ChevronDown, ChevronUp, Copy } from '@carbon/icons-react';
import { API_BASE_URL } from '@/config/env';

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
  type?: 'signal' | 'model' | 'dataset' | 'feature_snapshot' | 'trade';
  dataObj?: any;
  onClose: () => void;
}

export default function GlobalDetailTable({ id, type = 'signal', dataObj, onClose }: GlobalDetailTableProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [associatedSignal, setAssociatedSignal] = useState<any>(null);
  const [loadingSignal, setLoadingSignal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setExpandedKeys({});
    setAssociatedSignal(null);
    
    if (type === 'model' || type === 'dataset') {
      if (dataObj) setData(dataObj);
      else setData(null);
      return;
    }

    if (type === 'trade') {
      if (dataObj) {
        setData(dataObj);
        const sigId = dataObj.signal_id;
        if (sigId) {
          setLoadingSignal(true);
          fetch(`${API_BASE_URL}/dashboard/signals/${sigId}`)
            .then(res => {
              if (!res.ok) throw new Error("Failed to fetch associated signal");
              return res.json();
            })
            .then(json => {
              if (isMounted) setAssociatedSignal(json);
            })
            .catch(err => console.error("Failed to fetch associated signal", err))
            .finally(() => {
              if (isMounted) setLoadingSignal(false);
            });
        }
      } else {
        setData(null);
      }
      return () => { isMounted = false; };
    }

    if (id === null || id === undefined) {
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const url = type === 'feature_snapshot' 
      ? `${API_BASE_URL}/dashboard/feature-snapshots/${id}`
      : `${API_BASE_URL}/dashboard/signals/${id}`;
    
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
      modalHeading={type === 'signal' ? `Signal Details #${id}` : type === 'dataset' ? `Dataset Details` : type === 'feature_snapshot' ? `Feature Snapshot #${id}` : type === 'trade' ? `Trade Details #${id || ''}` : `Model Details`}
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
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                  {data.direction === 'BUY' ? (
                    <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                      <path d="M16 4L6 14h7v14h6V14h7z" />
                    </svg>
                  ) : data.direction === 'SELL' ? (
                    <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
                      <path d="M16 28l10-10h-7V4h-6v14H6z" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#a8a8a8', flexShrink: 0 }}>
                      <circle cx="16" cy="16" r="8" />
                    </svg>
                  )}
                  <span style={{ color: data.direction === 'BUY' ? '#24a148' : data.direction === 'SELL' ? '#fa4d56' : '#a8a8a8', whiteSpace: 'nowrap' }}>
                    {data.direction ? data.direction.charAt(0).toUpperCase() + data.direction.slice(1).toLowerCase() : ''}
                  </span>
                </div>
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

          <h4 style={{ marginBottom: "1rem", fontSize: "1rem", borderTop: "1px solid #393939", paddingTop: "1rem" }}>Associated Trades</h4>
          {data.trades && data.trades.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {data.trades.map((t: any) => (
                <div key={t.trade_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#262626', padding: '0.75rem', borderRadius: '4px' }}>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Trade ID</p>
                    <p style={{ fontSize: '0.875rem' }}>{t.trade_id}</p>
                  </div>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Status</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                      <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: t.status === 'CLOSED' ? '#6f6f6f' : '#4589ff', flexShrink: 0 }}>
                        <circle cx="16" cy="16" r="8" />
                      </svg>
                      <span style={{ color: t.status === 'CLOSED' ? '#a8a8a8' : '#4589ff', whiteSpace: 'nowrap' }}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Volume</p>
                    <p style={{ fontSize: '0.875rem' }}>{t.volume}</p>
                  </div>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Entry</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                        <path d="M18 6l-1.43 1.39L22.47 13H4v2h18.47l-5.9 5.61L18 22l8-8z" />
                      </svg>
                      <strong style={{ fontSize: '0.875rem' }}>{t.entry_price ? Number(t.entry_price).toFixed(5) : '-'}</strong>
                    </div>
                  </div>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>PnL</p>
                    <p style={{ fontSize: '0.875rem', color: t.pnl_money !== null ? (t.pnl_money >= 0 ? '#42be65' : '#ff8389') : '#ffffff', fontWeight: 'bold' }}>
                      {t.pnl_money !== null ? `$${Number(t.pnl_money).toFixed(2)}` : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#a8a8a8", fontSize: "0.9rem", marginBottom: "1rem" }}>No trades executed for this signal.</p>
          )}

          <h4 style={{ marginBottom: "1rem", fontSize: "1rem", borderTop: "1px solid #393939", paddingTop: "1rem" }}>Metadata</h4>
          {data.metadata && Object.keys(data.metadata).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem 0.75rem', marginBottom: '1rem', alignItems: 'start' }}>
              {Object.entries(data.metadata).map(([key, value]: [string, any]) => {
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
                const expandedKey = `metadata_${key}`;
                const isExpanded = !!expandedKeys[expandedKey];

                return (
                  <div key={key}>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>{formattedKey}</p>
                    <CollapsibleJSON 
                      displayValue={String(displayValue)} 
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedKeys(prev => ({ ...prev, [expandedKey]: !prev[expandedKey] }))}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#a8a8a8", fontSize: "0.9rem", marginBottom: "1rem" }}>No metadata available for this signal.</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1rem", borderTop: "1px solid #393939", paddingTop: "1rem" }}>
            <h4 style={{ fontSize: "1rem", margin: 0 }}>Technical Indicators (XGBoost Features)</h4>
            <button 
              type="button" 
              onClick={() => setExpandedKeys(prev => ({ ...prev, features_collapsed: !prev['features_collapsed'] }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a8a8', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem' }}
            >
              <span style={{ fontSize: '0.75rem' }}>{!!expandedKeys['features_collapsed'] ? 'Expand' : 'Collapse'}</span>
              {!!expandedKeys['features_collapsed'] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
          {data.features && Object.keys(data.features).length > 0 ? (
            !expandedKeys['features_collapsed'] && (
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
            )
          ) : (
            <p style={{ color: "#a8a8a8", fontSize: "0.9rem", marginBottom: "1rem" }}>No feature snapshot available for this signal.</p>
          )}
        </div>
      )}

      {data && !loading && !error && type === 'trade' && (
        <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "0.5rem" }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem 0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Trade ID / Signal ID</p>
              <p style={{ fontSize: '0.875rem' }}>
                {data.trade_id || data.id || '-'} <span style={{ color: '#c6c6c6' }}>/ </span>
                {data.signal_id ? (
                  <span style={{ color: '#8a3ffc' }}>
                    {data.signal_id}
                  </span>
                ) : '-'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Symbol / Direction</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.875rem' }}>{data.symbol || '-'}</strong>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                  {data.direction === "BUY" ? (
                    <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                      <path d="M16 4L6 14h7v14h6V14h7z" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
                      <path d="M16 28l10-10h-7V4h-6v14H6z" />
                    </svg>
                  )}
                  <span style={{ color: data.direction === "BUY" ? '#24a148' : '#fa4d56', whiteSpace: 'nowrap' }}>
                    {data.direction ? data.direction.charAt(0).toUpperCase() + data.direction.slice(1).toLowerCase() : ''}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Status</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: data.status === "OPEN" ? '#24a148' : '#8d8d8d', flexShrink: 0 }}>
                  <circle cx="16" cy="16" r="8" />
                </svg>
                <span style={{ color: data.status === "OPEN" ? '#24a148' : '#8d8d8d', whiteSpace: 'nowrap' }}>
                  {data.status === "OPEN" ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Regime / Model</p>
              <p style={{ fontSize: '0.875rem' }}>
                {data.regime || '-'} <span style={{ color: '#8a3ffc' }}>({data.model_version || 'Unknown'})</span>
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Model Confidence</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                {data.confidence ? `${(data.confidence * 100).toFixed(2)}%` : '-'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Entry Time</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                  <path d="M18 6l-1.43 1.39L22.47 13H4v2h18.47l-5.9 5.61L18 22l8-8z" />
                </svg>
                <span style={{ fontSize: '0.875rem' }}>{data.entry_time ? new Date(data.entry_time).toLocaleString() : '-'}</span>
              </div>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Exit Time</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
                  <path d="M14 22l1.43-1.39L9.53 15H28v-2H9.53l5.9-5.61L14 6l-8 8z" />
                </svg>
                <span style={{ fontSize: '0.875rem', color: '#e0e0e0' }}>{data.exit_time ? new Date(data.exit_time).toLocaleString() : '-'}</span>
              </div>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Prices (Entry &amp; Exit)</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                    <path d="M18 6l-1.43 1.39L22.47 13H4v2h18.47l-5.9 5.61L18 22l8-8z" />
                  </svg>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {data.entry_price != null ? Number(data.entry_price).toFixed(5) : '-'}
                  </span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
                    <path d="M14 22l1.43-1.39L9.53 15H28v-2H9.53l5.9-5.61L14 6l-8 8z" />
                  </svg>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#e0e0e0' }}>
                    {data.exit_price != null ? Number(data.exit_price).toFixed(5) : '-'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>SL / TP Levels</p>
              <p style={{ fontSize: '0.875rem' }}>
                SL: {data.sl_price || '-'} | TP: {data.tp_price || '-'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Volume</p>
              <p style={{ fontSize: '0.875rem' }}>{data.volume} Lots</p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Costs (Commission / Slippage)</p>
              <p style={{ fontSize: '0.875rem' }}>
                ${data.commission_cost?.toFixed(2) || '0.00'} / ${data.slippage_cost?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Net PnL (Money / Pips)</p>
              <p style={{ fontSize: '0.875rem', color: data.pnl_money != null ? (data.pnl_money >= 0 ? "#24a148" : "#da1e28") : "#c6c6c6", fontWeight: 'bold' }}>
                {data.pnl_money != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.pnl_money) : '-'} 
                <span style={{ fontWeight: 'normal', color: '#c6c6c6', marginLeft: '0.5rem' }}>({data.pnl_pips != null ? Number(data.pnl_pips).toFixed(1) : '-'} pips)</span>
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Close Reason / Duration</p>
              <p style={{ fontSize: '0.875rem' }}>
                {data.close_reason ? (
                  data.close_reason === "SL_HIT" ? "SL Hit" :
                  data.close_reason === "TP_HIT" ? "TP Hit" :
                  data.close_reason === "SIGNAL_REVERSE" ? "Signal Reverse" :
                  data.close_reason === "END_OF_DATA" ? "End of Data" :
                  data.close_reason === "MANUAL" ? "Manual" :
                  data.close_reason.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                ) : '-'} <span style={{ color: '#c6c6c6' }}>| </span>{data.trade_duration || '-'}
              </p>
            </div>
          </div>
          
          {data.features_at_entry?._probabilities && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #393939', paddingTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>Model Class Probabilities</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {Object.entries(data.features_at_entry._probabilities).map(([cls, prob]: [string, any]) => {
                  const probVal = Number(prob);
                  const isHighest = probVal === Math.max(...Object.values(data.features_at_entry._probabilities).map(Number));
                  return (
                    <div key={cls} style={{ background: '#161616', padding: '0.75rem', borderLeft: isHighest ? '4px solid #24a148' : '4px solid #393939' }}>
                      <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>{cls}</p>
                      <strong style={{ fontSize: '1rem' }}>{(probVal * 100).toFixed(2)}%</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loadingSignal && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #393939', paddingTop: '1rem', color: '#a8a8a8', fontSize: '0.875rem' }}>
              Loading associated signal details...
            </div>
          )}

          {associatedSignal && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #393939', paddingTop: '1.25rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold' }}>Associated Signal Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem 0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Signal ID / Time</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    <strong style={{ color: '#8a3ffc' }}>#{associatedSignal.id}</strong>
                    <span style={{ color: '#c6c6c6', margin: '0 6px' }}>|</span>
                    <span style={{ fontSize: '0.8rem' }}>{associatedSignal.timestamp ? new Date(associatedSignal.timestamp).toLocaleString() : '-'}</span>
                  </p>
                </div>
                <div>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Signal Confidence</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{associatedSignal.confidence ? `${(associatedSignal.confidence * 100).toFixed(2)}%` : '-'}</p>
                </div>
                <div>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>R:R Ratio</p>
                  <p style={{ fontSize: '0.875rem' }}>{associatedSignal.rr_ratio || '-'}</p>
                </div>
                <div>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Signal Status</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                    <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: associatedSignal.status === 'EXECUTED' ? '#24a148' : associatedSignal.status === 'PENDING_EXECUTION' ? '#11a3c6' : '#fa4d56', flexShrink: 0 }}>
                      <circle cx="16" cy="16" r="8" />
                    </svg>
                    <span style={{ color: associatedSignal.status === 'EXECUTED' ? '#24a148' : associatedSignal.status === 'PENDING_EXECUTION' ? '#11a3c6' : '#fa4d56', whiteSpace: 'nowrap' }}>
                      {associatedSignal.status ? associatedSignal.status.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {associatedSignal.features && Object.keys(associatedSignal.features).length > 0 && (
                <>
                  <h5 style={{ marginBottom: "0.75rem", fontSize: "0.875rem", color: '#e0e0e0', fontWeight: '500' }}>Technical Indicators (XGBoost Features)</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem 0.75rem' }}>
                    {Object.entries(associatedSignal.features).map(([key, value]: [string, any]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #262626', paddingBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#a8a8a8', fontWeight: '500' }}>{key}</span>
                        <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                          {value !== null && value !== undefined ? Number(value).toFixed(4) : "N/A"}
                        </strong>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
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
