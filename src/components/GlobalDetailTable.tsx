"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Modal,
  Loading,
  Theme
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
  if (regime === 'TEST_MANUAL') return { text: 'Manual', color: '#8a3ffc' };
  if (regime === 'MoE' || regime === 'MOE_ENSEMBLE') return { text: 'MoE Ensemble', color: '#8a3ffc' };
  if (regime === 'TREND_EXPERT' || regime === 'trend') return { text: 'Trend Expert', color: '#24a148' };
  if (regime === 'MEANREV_EXPERT' || regime === 'meanrev') return { text: 'MeanRev Expert', color: '#4589ff' };
  if (regime === 'MACRO_EXPERT' || regime === 'macro') return { text: 'Macro Expert', color: '#d12771' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' };
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' };
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' };
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' };
  return { text: regime.replace('_EXPERT', ' Expert').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '), color: '#f4f4f4' };
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  if (!mounted) return null;

  return createPortal(
    <Theme theme="g100">
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
          {data.status === 'FAILED' && data.remarks && (
            <div style={{
              background: 'rgba(250, 77, 86, 0.1)',
              border: '1px solid #fa4d56',
              borderRadius: '4px',
              padding: '0.75rem',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <span style={{ color: '#fa4d56', fontWeight: 'bold', fontSize: '0.75rem' }}>⚠️ EXECUTION FAILURE REMARKS</span>
              <span style={{ fontSize: '0.875rem', color: '#f4f4f4' }}>{data.remarks}</span>
            </div>
          )}
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
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
              {data.trades.map((t: any) => (
                <div key={t.trade_id} style={{ display: 'grid', gridTemplateColumns: '100px 120px 100px 150px 120px', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #393939' }}>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>Trade ID</p>
                    <p style={{ fontSize: '0.875rem' }}>{t.trade_id}</p>
                  </div>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>Status</p>
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
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>Volume</p>
                    <p style={{ fontSize: '0.875rem' }}>{t.volume}</p>
                  </div>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>Entry</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                        <path d="M18 6l-1.43 1.39L22.47 13H4v2h18.47l-5.9 5.61L18 22l8-8z" />
                      </svg>
                      <strong style={{ fontSize: '0.875rem' }}>{t.entry_price ? Number(t.entry_price).toFixed(5) : '-'}</strong>
                    </div>
                  </div>
                  <div>
                    <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>PnL</p>
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

          {(() => {
            const explainability = data.metadata?.model_output?.explainability || 
                                   data.metadata?.explainability || 
                                   data.explainability || null;

            let categories = explainability?.categories || [];

            if (!categories || categories.length === 0) {
              const baseShapList: any[] = 
                data.metadata?.model_output?.shap_values || 
                data.metadata?.shap_values || 
                data.shap_values || [];
              if (baseShapList && baseShapList.length > 0) {
                categories = [{
                  name: "Evaluated Features",
                  key: "all",
                  count: baseShapList.length,
                  features: baseShapList
                }];
              }
            }

            if (!categories || categories.length === 0) return null;

            // Sort categories: macro first, then technical
            const sortedCategories = [...categories].sort((a: any, b: any) => {
              const aName = (a.name || '').toLowerCase();
              const bName = (b.name || '').toLowerCase();
              const aKey = (a.key || '').toLowerCase();
              const bKey = (b.key || '').toLowerCase();
              const aIsMacro = aName.includes('macro') || aKey.includes('macro');
              const bIsMacro = bName.includes('macro') || bKey.includes('macro');
              if (aIsMacro && !bIsMacro) return -1;
              if (!aIsMacro && bIsMacro) return 1;
              return 0;
            });

            let allContribs: number[] = [];
            sortedCategories.forEach((cat: any) => {
              if (cat.features && Array.isArray(cat.features)) {
                cat.features.forEach((f: any) => allContribs.push(Math.abs(Number(f.contribution || 0))));
              }
            });
            const maxContrib = Math.max(...allContribs, 0.0001);

            return (
              <div style={{ marginBottom: "1.5rem", borderTop: "1px solid #393939", paddingTop: "1rem" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.25rem" }}>
                  <h4 style={{ fontSize: "1rem", margin: 0 }}>Model Explainibilty</h4>
                  <span style={{ fontSize: "0.75rem", color: "#a8a8a8", background: "#262626", padding: "2px 8px", borderRadius: "12px" }}>
                    {explainability?.total_features || allContribs.length} features evaluated
                  </span>
                </div>

                {sortedCategories.map((cat: any, cIdx: number) => {
                  if (!cat.features || cat.features.length === 0) return null;
                  return (
                    <div key={cIdx} style={{ marginBottom: cIdx < categories.length - 1 ? "1.5rem" : "0" }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "0.5rem" }}>
                        <h5 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#d1d1d1", margin: 0 }}>
                          {(cat.name || '').toLowerCase().includes('macro') || (cat.key || '').toLowerCase().includes('macro')
                            ? 'Macro Features'
                            : (cat.name || '').toLowerCase().includes('technical') || (cat.key || '').toLowerCase().includes('technical')
                              ? 'Technical Features'
                              : cat.name}
                        </h5>
                        <span style={{ fontSize: "0.75rem", color: "#a8a8a8" }}>{cat.count || cat.features.length} features</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem 1.5rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem', background: 'transparent', padding: '1rem', borderRadius: '0', border: '1px dashed #393939' }}>
                        {cat.features.map((item: any, idx: number) => {
                          const contrib = Number(item.contribution || 0);
                          const isPos = contrib >= 0;
                          const pct = Math.min(Math.round((Math.abs(contrib) / maxContrib) * 100), 100);
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: '600', color: '#f4f4f4', textTransform: 'uppercase' }}>{item.feature}</span>
                                <span style={{ fontWeight: 'bold', color: isPos ? '#42be65' : '#ff8389' }}>
                                  {isPos ? '+' : ''}{contrib.toFixed(4)}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '4px', background: '#262626', borderRadius: '0', overflow: 'hidden', display: 'flex', justifyContent: isPos ? 'flex-start' : 'flex-end' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: isPos ? '#42be65' : '#ff8389', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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
                {data.regime || '-'} <span style={{ color: '#8a3ffc' }}>({data.model_version === 'Manual Override' ? 'Manual' : (data.model_version || 'Unknown')})</span>
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
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>
                {data.status === "OPEN" ? "Prices (Entry & Current)" : "Prices (Entry & Exit)"}
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                    <title>Entry Price</title>
                    <path d="M18 6l-1.43 1.39L22.47 13H4v2h18.47l-5.9 5.61L18 22l8-8z" />
                  </svg>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {data.entry_price != null ? Number(data.entry_price).toFixed(5) : '-'}
                  </span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: data.status === "OPEN" ? '#4589ff' : '#fa4d56', flexShrink: 0 }}>
                    <title>{data.status === "OPEN" ? "Current Price" : "Exit Price"}</title>
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
              <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                <span style={{ color: '#ff8389' }}>SL: {data.sl_price || associatedSignal?.sl_price || '-'}</span>
                <span style={{ color: '#c6c6c6', margin: '0 6px' }}>|</span>
                <span style={{ color: '#42be65' }}>TP: {data.tp_price || associatedSignal?.tp_price || '-'}</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: '220px 150px 100px 150px', gap: '1rem 0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>Signal ID / Time</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    <strong style={{ color: '#8a3ffc' }}>#{associatedSignal.id}</strong>
                    <span style={{ color: '#c6c6c6', margin: '0 6px' }}>|</span>
                    <span style={{ fontSize: '0.8rem' }}>{associatedSignal.timestamp ? new Date(associatedSignal.timestamp).toLocaleString() : '-'}</span>
                  </p>
                </div>
                <div>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>Signal Confidence</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{associatedSignal.confidence ? `${(associatedSignal.confidence * 100).toFixed(2)}%` : '-'}</p>
                </div>
                <div>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>R:R Ratio</p>
                  <p style={{ fontSize: '0.875rem' }}>{associatedSignal.rr_ratio || '-'}</p>
                </div>
                <div>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '2px' }}>Signal Status</p>
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
              
              {associatedSignal.remarks && (
                <div style={{ marginTop: '0.75rem', padding: '8px', background: 'rgba(250, 77, 86, 0.1)', borderLeft: '3px solid #fa4d56' }}>
                  <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Remarks (Error Details)</p>
                  <p style={{ fontSize: '0.875rem', color: '#fa4d56' }}>{associatedSignal.remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* Model Explainability / Features at Entry for Trades */}
          {(() => {
            const explainability = data.features_at_entry?.explainability ||
                                   data.features_at_entry?.model_output?.explainability ||
                                   data.metadata?.model_output?.explainability ||
                                   data.metadata?.explainability ||
                                   data.explainability || null;

            let categories = explainability?.categories || [];

            if (!categories || categories.length === 0) {
              const baseShapList: any[] = 
                data.features_at_entry?.shap_values ||
                data.features_at_entry?.model_output?.shap_values ||
                data.metadata?.model_output?.shap_values || 
                data.metadata?.shap_values || 
                data.shap_values || [];
              if (baseShapList && baseShapList.length > 0) {
                categories = [{
                  name: "Evaluated Features",
                  key: "all",
                  count: baseShapList.length,
                  features: baseShapList
                }];
              }
            }

            const rawFeatures = data.features_at_entry 
              ? Object.entries(data.features_at_entry).filter(([key, val]) => 
                  !key.startsWith('_') && 
                  key !== 'explainability' && 
                  key !== 'shap_values' && 
                  val !== null &&
                  val !== undefined &&
                  typeof val !== 'object'
                )
              : [];

            const hasExplainability = categories && categories.length > 0;
            const hasRawFeatures = rawFeatures && rawFeatures.length > 0;

            if (!hasExplainability && !hasRawFeatures) return null;

            return (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #393939', paddingTop: '1.25rem' }}>
                {hasExplainability && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.25rem" }}>
                      <h4 style={{ fontSize: "1.0rem", margin: 0, fontWeight: 'bold' }}>Model Explainibility</h4>
                      <span style={{ fontSize: "0.75rem", color: "#a8a8a8", background: "#262626", padding: "2px 8px", borderRadius: "12px" }}>
                        SHAP Values
                      </span>
                    </div>

                    {(() => {
                      // Sort categories
                      const sortedCategories = [...categories].sort((a: any, b: any) => {
                        const aName = (a.name || '').toLowerCase();
                        const bName = (b.name || '').toLowerCase();
                        const aKey = (a.key || '').toLowerCase();
                        const bKey = (b.key || '').toLowerCase();
                        const aIsMacro = aName.includes('macro') || aKey.includes('macro');
                        const bIsMacro = bName.includes('macro') || bKey.includes('macro');
                        if (aIsMacro && !bIsMacro) return -1;
                        if (!aIsMacro && bIsMacro) return 1;
                        return 0;
                      });

                      let allContribs: number[] = [];
                      sortedCategories.forEach((cat: any) => {
                        if (cat.features && Array.isArray(cat.features)) {
                          cat.features.forEach((f: any) => allContribs.push(Math.abs(Number(f.contribution || 0))));
                        }
                      });
                      const maxContrib = Math.max(...allContribs, 0.0001);

                      return sortedCategories.map((cat: any, cIdx: number) => {
                        if (!cat.features || cat.features.length === 0) return null;
                        return (
                          <div key={cIdx} style={{ marginBottom: cIdx < sortedCategories.length - 1 ? "1.5rem" : "0" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "0.5rem" }}>
                              <h5 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#d1d1d1", margin: 0 }}>
                                {(cat.name || '').toLowerCase().includes('macro') || (cat.key || '').toLowerCase().includes('macro')
                                  ? 'Macro Features'
                                  : (cat.name || '').toLowerCase().includes('technical') || (cat.key || '').toLowerCase().includes('technical')
                                    ? 'Technical Features'
                                    : cat.name}
                              </h5>
                              <span style={{ fontSize: "0.75rem", color: "#a8a8a8" }}>{cat.count || cat.features.length} features</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem 1.5rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem', background: 'transparent', padding: '1rem', borderRadius: '0', border: '1px dashed #393939' }}>
                              {cat.features.map((item: any, idx: number) => {
                                const contrib = Number(item.contribution || 0);
                                const isPos = contrib >= 0;
                                const pct = Math.min(Math.round((Math.abs(contrib) / maxContrib) * 100), 100);
                                return (
                                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                      <span style={{ fontWeight: '600', color: '#f4f4f4', textTransform: 'uppercase' }}>{item.feature}</span>
                                      <span style={{ fontWeight: 'bold', color: isPos ? '#42be65' : '#ff8389' }}>
                                        {isPos ? '+' : ''}{contrib.toFixed(4)}
                                      </span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#262626', borderRadius: '0', overflow: 'hidden', display: 'flex', justifyContent: isPos ? 'flex-start' : 'flex-end' }}>
                                      <div style={{ width: `${pct}%`, height: '100%', background: isPos ? '#42be65' : '#ff8389', transition: 'width 0.3s ease' }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {hasRawFeatures && (
                  <div>
                    <h4 style={{ fontSize: "1.0rem", marginBottom: "1rem", fontWeight: 'bold' }}>Features at Entry</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem 1.5rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem', background: 'transparent', padding: '1rem', borderRadius: '0', border: '1px dashed #393939' }}>
                      {rawFeatures.map(([key, val]: [string, any]) => {
                        const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        const displayVal = typeof val === 'number' ? val.toFixed(5).replace(/\.?0+$/, '') : String(val);
                        return (
                          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{formattedKey}</span>
                            <strong style={{ fontSize: '0.875rem', color: '#f4f4f4' }}>{displayVal}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
    </Theme>,
    document.body
  );
}
