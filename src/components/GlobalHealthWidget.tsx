"use client";

import React, { useEffect, useState } from "react";
import { Tile, ProgressBar } from "@carbon/react";
import { Activity, Warning, CheckmarkOutline, ErrorOutline } from "@carbon/icons-react";
import { API_BASE_URL } from '@/config/env';

export default function GlobalHealthWidget({ models }: { models: any[] }) {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      const data = [];
      for (const m of models) {
        if (m.status === "Active") {
          try {
            const res = await fetch(`${API_BASE_URL}/models/${m.id}/health`);
            if (res.ok) {
              const h = await res.json();
              data.push(h);
            }
          } catch (e) {
            console.error("Failed to fetch health for", m.name);
          }
        }
      }
      setHealthData(data);
      setLoading(false);
    };

    if (models.length > 0) {
      fetchHealth();
    } else {
      setLoading(false);
    }
  }, [models]);

  const formatStatusText = (status: string) => {
    if (!status) return "";
    if (status === "INSUFFICIENT_DATA") return "Insufficient Data";
    return status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  if (loading) return <ProgressBar label="Loading model health..." />;

  if (healthData.length === 0) {
    return (
      <Tile>
        <p>No active models to monitor. Please activate a model to see health metrics.</p>
      </Tile>
    );
  }

  return (
    <div className="health-widget-grid">
      {healthData.map((h, i) => (
        <Tile 
          key={i} 
          className="health-widget-tile"
          style={{ borderTop: h.status === "HEALTHY" ? "4px solid #24a148" : h.status === "WARNING" ? "4px solid #f1c21b" : h.status === "CRITICAL" ? "4px solid #da1e28" : "4px solid #8d8d8d" }}
        >
          <h5 className="health-widget-title">
            {h.status === "HEALTHY" && <CheckmarkOutline fill="#24a148" size={16} />}
            {h.status === "WARNING" && <Warning fill="#f1c21b" size={16} />}
            {h.status === "CRITICAL" && <ErrorOutline fill="#da1e28" size={16} />}
            {h.status === "INSUFFICIENT_DATA" && <Activity fill="#8d8d8d" size={16} />}
            {h.model_name}
          </h5>
          
          <div className="health-widget-info">
            <div className="health-widget-info-group">
              <span className="health-widget-info-label">Status</span>
              <span style={{ fontWeight: "bold", color: h.status === "HEALTHY" ? "#24a148" : h.status === "WARNING" ? "#f1c21b" : h.status === "CRITICAL" ? "#da1e28" : "#8d8d8d" }}>
                {formatStatusText(h.status)}
              </span>
            </div>
            <div className="health-widget-info-group">
              <span className="health-widget-info-label">Win Rate</span>
              <span style={{ fontWeight: 600 }}>{(h.rolling_win_rate * 100).toFixed(1)}%</span>
            </div>
            <div className="health-widget-info-group">
              <span className="health-widget-info-label">Live Trades</span>
              <span style={{ fontWeight: 600 }}>{h.total_trades}</span>
            </div>
            <div className="health-widget-info-group">
              <span className="health-widget-info-label">Avg Conf (Win)</span>
              <span style={{ fontWeight: 600 }}>{h.average_confidence_win?.toFixed(3) || "0.000"}</span>
            </div>
            <div className="health-widget-info-group" style={{ gridColumn: "span 2" }}>
              <span className="health-widget-info-label">Avg Conf (Loss)</span>
              <span style={{ fontWeight: 600 }}>{h.average_confidence_loss?.toFixed(3) || "0.000"}</span>
            </div>
          </div>
        </Tile>
      ))}
    </div>
  );
}
