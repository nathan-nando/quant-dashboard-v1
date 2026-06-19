"use client";

import React, { useEffect, useState } from 'react';
import {
  Modal,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  Tag,
  Loading
} from '@carbon/react';
import { ChevronDown, ChevronUp, Copy } from '@carbon/icons-react';

const CollapsibleJSON = ({ displayValue }: { displayValue: string }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: 'transparent', border: '1px dashed #8d8d8d', color: 'inherit', padding: '0.5rem', borderRadius: '4px' }}>
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
          title={collapsed ? "Expand Data" : "Collapse Data"}
          onClick={() => setCollapsed(!collapsed)} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
      {!collapsed && (
        <div style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'Consolas, "Courier New", monospace', color: 'inherit' }}>
            {displayValue}
          </pre>
        </div>
      )}
    </div>
  );
};

interface GlobalDetailTableProps {
  id?: number | string | null;
  type?: 'signal' | 'model' | 'dataset';
  dataObj?: any;
  onClose: () => void;
}

export default function GlobalDetailTable({ id, type = 'signal', dataObj, onClose }: GlobalDetailTableProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    
    fetch(`http://127.0.0.1:8000/api/dashboard/signals/${id}`)
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
      modalHeading={type === 'signal' ? `Signal Details #${id}` : type === 'dataset' ? `Dataset Details` : `Model Details`}
      primaryButtonText="Close"
      onRequestSubmit={onClose}
      size="lg"
    >
      {loading && <Loading withOverlay={false} />}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {data && !loading && !error && type === 'signal' && (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <Tag type="blue">{data.symbol}</Tag>
            <Tag type={data.direction === 'BUY' ? 'green' : data.direction === 'SELL' ? 'red' : 'gray'}>
              {data.direction}
            </Tag>
            <span>Conf: {(data.confidence * 100).toFixed(2)}%</span>
            <span>Entry: <strong>{data.entry_price ? data.entry_price.toFixed(2) : '-'}</strong></span>
            <Tag type="red">SL: {data.sl_price ? data.sl_price.toFixed(2) : '-'} ({data.sl_pips}p)</Tag>
            <Tag type="green">TP: {data.tp_price ? data.tp_price.toFixed(2) : '-'} ({data.tp_pips}p)</Tag>
            <span>R:R: {data.rr_ratio}</span>
            <span>Regime: {data.regime}</span>
          </div>

          <h4 style={{ marginBottom: "0.5rem" }}>Technical Indicators (XGBoost Features)</h4>
          {data.features && Object.keys(data.features).length > 0 ? (
            <StructuredListWrapper isCondensed>
              <StructuredListHead>
                <StructuredListRow head>
                  <StructuredListCell head>Feature Name</StructuredListCell>
                  <StructuredListCell head>Value</StructuredListCell>
                </StructuredListRow>
              </StructuredListHead>
              <StructuredListBody>
                {Object.entries(data.features).map(([key, value]: [string, any]) => (
                  <StructuredListRow key={key}>
                    <StructuredListCell style={{ fontWeight: "bold" }}>{key}</StructuredListCell>
                    <StructuredListCell>
                      {value !== null && value !== undefined ? Number(value).toFixed(4) : "N/A"}
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          ) : (
            <p style={{ color: "#a8a8a8", fontSize: "0.9rem" }}>No feature snapshot available for this signal.</p>
          )}
        </div>
      )}

      {data && (type === 'model' || type === 'dataset') && (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <StructuredListWrapper isCondensed style={{ marginBottom: "2rem" }}>
            <StructuredListHead>
               <StructuredListRow head>
                  <StructuredListCell head>Property</StructuredListCell>
                  <StructuredListCell head>Value</StructuredListCell>
               </StructuredListRow>
            </StructuredListHead>
            <StructuredListBody>
               {Object.entries(data).map(([key, value]: [string, any]) => {
                  if (key === 'id') return null;
                  
                  let displayValue = value;
                  let isNested = false;
                  
                  if (value === null || value === undefined) {
                      displayValue = "-";
                  } else if (typeof value === 'object') {
                      displayValue = JSON.stringify(value, null, 2);
                      isNested = true;
                  } else if (typeof value === 'string') {
                      // Try to parse JSON strings
                      try {
                          if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                              const parsed = JSON.parse(value);
                              displayValue = JSON.stringify(parsed, null, 2);
                              isNested = true;
                          }
                      } catch (e) {}
                  }

                  // Special date formatting for known date fields
                  if (['train_start_time', 'created_at', 'updated_at'].includes(key) && value && !isNested) {
                      displayValue = new Date(value).toLocaleString();
                  }

                  // Format key
                  const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                  return (
                      <StructuredListRow key={key}>
                        <StructuredListCell style={{ fontWeight: "bold", width: "30%", verticalAlign: "top" }}>{formattedKey}</StructuredListCell>
                        <StructuredListCell>
                            {isNested ? (
                               <CollapsibleJSON displayValue={displayValue as string} />
                            ) : (
                                displayValue
                            )}
                        </StructuredListCell>
                      </StructuredListRow>
                  );
               })}
            </StructuredListBody>
          </StructuredListWrapper>
        </div>
      )}
    </Modal>
  );
}
