"use client";

import React, { useState, useEffect } from 'react';
import { Grid, Column, Tile } from '@carbon/react';
import DashboardPanel from '@/components/DashboardPanel';
import { API_BASE_URL } from '@/config/env';
import dynamic from 'next/dynamic';

const GaugeComponent = dynamic(() => import('react-gauge-component'), { ssr: false });

interface ModelMetric {
  id: number;
  timestamp: string;
  model_id: string;
  psi_score: number;
  ks_stat: number;
  ks_pvalue: number;
  is_drifted: boolean;
}

export default function DriftMetricsWidget({ models }: { models: any[] }) {
  const [metrics, setMetrics] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/dashboard/model-metrics`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) {
          // Sort chronologically just in case
          data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setMetrics(data);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: '1rem' }}>Loading drift metrics...</p>;
  if (metrics.length === 0) return <p style={{ padding: '1rem' }}>No drift metrics available.</p>;

  // Group metrics by model
  const metricsByModel = metrics.reduce((acc, metric) => {
    if (!acc[metric.model_id]) acc[metric.model_id] = [];
    acc[metric.model_id].push(metric);
    return acc;
  }, {} as Record<string, ModelMetric[]>);

  return (
    <div style={{ marginTop: '0' }}>
      <div className="drift-widget-grid">
        {Object.entries(metricsByModel).map(([modelId, modelMetrics]) => {
          const modelName = models?.find((m) => m.id === modelId)?.name || modelId;
          const latestMetric = modelMetrics[modelMetrics.length - 1];

          return (
            <div key={modelId} className="drift-card-wrapper">
              <DashboardPanel title={`Drift: ${modelName}`} tooltipInfo="Current live measurement of feature degradation for this model">
                <div className="drift-card-content">
                  
                  {/* PSI Gauge */}
                  <div className="drift-gauge-wrapper">
                    <h6 style={{ marginBottom: '0.25rem', color: '#c6c6c6', fontSize: '0.75rem', fontWeight: 600 }}>PSI Score</h6>
                    <GaugeComponent
                      type="semicircle"
                      arc={{
                        width: 0.15,
                        padding: 0.02,
                        cornerRadius: 1,
                        subArcs: [
                          { limit: 0.1, color: '#24a148' }, // Healthy (0 - 0.1)
                          { limit: 0.2, color: '#f1c21b' }, // Warning (0.1 - 0.2)
                          { limit: 1.0, color: '#da1e28' }  // Critical (> 0.2)
                        ]
                      }}
                      pointer={{
                        color: '#f4f4f4',
                        length: 0.70,
                        width: 6,
                      }}
                      labels={{
                        valueLabel: { 
                          formatTextValue: (v: any) => v.toFixed(3),
                          style: { fill: '#f4f4f4', fontSize: '17px' }
                        },
                        tickLabels: {
                          type: 'outer',
                          ticks: [
                            { value: 0 },
                            { value: 0.1 },
                            { value: 0.2 },
                            { value: 0.5 },
                          ],
                          defaultTickValueConfig: {
                            formatTextValue: (v: any) => v.toString(),
                            style: { fill: '#c6c6c6', fontSize: '9.5px' }
                          }
                        }
                      }}
                      value={latestMetric.psi_score}
                      minValue={0}
                      maxValue={0.5}
                    />
                  </div>

                  {/* KS P-Value Gauge */}
                  <div className="drift-gauge-wrapper">
                    <h6 style={{ marginBottom: '0.25rem', color: '#c6c6c6', fontSize: '0.75rem', fontWeight: 600 }}>KS P-Value</h6>
                    <GaugeComponent
                      type="semicircle"
                      arc={{
                        width: 0.15,
                        padding: 0.02,
                        cornerRadius: 1,
                        subArcs: [
                          { limit: 0.05, color: '#da1e28' }, // Drifted (0 - 0.05)
                          { limit: 0.1, color: '#f1c21b' },  // Warning (0.05 - 0.1)
                          { limit: 1.0, color: '#24a148' }   // Healthy (> 0.1)
                        ]
                      }}
                      pointer={{
                        color: '#f4f4f4',
                        length: 0.70,
                        width: 6,
                      }}
                      labels={{
                        valueLabel: { 
                          formatTextValue: (v: any) => v.toFixed(3),
                          style: { fill: '#f4f4f4', fontSize: '17px' }
                        },
                        tickLabels: {
                          type: 'outer',
                          ticks: [
                            { value: 0 },
                            { value: 0.05 },
                            { value: 0.1 },
                            { value: 0.5 },
                          ],
                          defaultTickValueConfig: {
                            formatTextValue: (v: any) => v.toString(),
                            style: { fill: '#c6c6c6', fontSize: '9.5px' }
                          }
                        }
                      }}
                      value={latestMetric.ks_pvalue}
                      minValue={0}
                      maxValue={0.5}
                    />
                  </div>

                </div>
              </DashboardPanel>
            </div>
          );
        })}
      </div>
    </div>
  );
}
