"use client";

import React from 'react';
import { Tile, ProgressBar } from '@carbon/react';
import { ChartLine, Globe, Activity, Percentage } from '@carbon/icons-react';
import { useGlobalState } from '../contexts/GlobalStateContext';

export default function MacroSnapshot() {
    const { state } = useGlobalState();
    const snapshot = state?.macro_snapshot;

    return (
        <div className="macro-metrics-grid" style={{ height: '100%' }}>
            <Tile style={{ padding: '0.25rem 0.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%', gap: '0.5rem' }}>
                    {/* TIPS Yield */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
                            <ChartLine size={13} color="#a8a8a8" />
                            <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>10Y TIPS</p>
                        </div>
                        {snapshot?.tips_10y !== undefined && snapshot?.tips_10y !== null ? (
                            <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
                                {snapshot.tips_10y.toFixed(2) + '%'}
                            </h4>
                        ) : (
                            <div style={{ padding: '0.2rem 0', minWidth: '45px' }}>
                                <ProgressBar label="Loading TIPS" hideLabel size="small" />
                            </div>
                        )}
                    </div>

                    <div style={{ width: '1px', height: '65%', backgroundColor: '#393939' }} />

                    {/* DXY Index */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
                            <Globe size={13} color="#a8a8a8" />
                            <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>DXY Index</p>
                        </div>
                        {snapshot?.dxy_broad !== undefined && snapshot?.dxy_broad !== null ? (
                            <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
                                {snapshot.dxy_broad.toFixed(2)}
                            </h4>
                        ) : (
                            <div style={{ padding: '0.2rem 0', minWidth: '45px' }}>
                                <ProgressBar label="Loading DXY" hideLabel size="small" />
                            </div>
                        )}
                    </div>

                    <div style={{ width: '1px', height: '65%', backgroundColor: '#393939' }} />

                    {/* VIX Volatility */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
                            <Activity size={13} color="#a8a8a8" />
                            <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>VIX</p>
                        </div>
                        {snapshot?.vix !== undefined && snapshot?.vix !== null ? (
                            <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
                                {snapshot.vix.toFixed(2)}
                            </h4>
                        ) : (
                            <div style={{ padding: '0.2rem 0', minWidth: '45px' }}>
                                <ProgressBar label="Loading VIX" hideLabel size="small" />
                            </div>
                        )}
                    </div>

                    <div style={{ width: '1px', height: '65%', backgroundColor: '#393939' }} />

                    {/* Fed Funds Rate */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
                            <Percentage size={13} color="#a8a8a8" />
                            <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Fed Rate</p>
                        </div>
                        {snapshot?.fed_rate !== undefined && snapshot?.fed_rate !== null ? (
                            <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
                                {snapshot.fed_rate.toFixed(2) + '%'}
                            </h4>
                        ) : (
                            <div style={{ padding: '0.2rem 0', minWidth: '45px' }}>
                                <ProgressBar label="Loading Fed Rate" hideLabel size="small" />
                            </div>
                        )}
                    </div>
                </div>
            </Tile>
        </div>
    );
}
