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

interface GlobalDetailTableProps {
  signalId: number | null;
  onClose: () => void;
}

export default function GlobalDetailTable({ signalId, onClose }: GlobalDetailTableProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (signalId === null) {
      setData(null);
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    
    fetch(`http://127.0.0.1:8000/api/dashboard/signals/${signalId}`)
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
  }, [signalId]);

  if (signalId === null) return null;

  return (
    <Modal
      open={signalId !== null}
      onRequestClose={onClose}
      modalHeading={`Signal Details #${signalId}`}
      primaryButtonText="Close"
      onRequestSubmit={onClose}
      size="lg"
    >
      {loading && <Loading withOverlay={false} />}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {data && !loading && !error && (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
            <p style={{ fontStyle: "italic", color: "#8d8d8d" }}>No features snapshot recorded for this signal.</p>
          )}
        </div>
      )}
    </Modal>
  );
}
