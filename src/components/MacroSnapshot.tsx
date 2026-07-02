"use client";

import React from 'react';
import { Tile, ProgressBar } from '@carbon/react';
import { ChartLine, Globe, Activity, Percentage } from '@carbon/icons-react';
import { useGlobalState } from '../contexts/GlobalStateContext';

export default function MacroSnapshot() {
    const { state } = useGlobalState();
    const snapshot = state?.macro_snapshot;

    return (
        <div className="macro-metrics-grid">
            <Tile>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
                    <ChartLine size={14} color="#a8a8a8" />
                    <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>10Y TIPS Yield</p>
                </div>
                {snapshot?.tips_10y !== undefined && snapshot?.tips_10y !== null ? (
                    <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
                        {snapshot.tips_10y.toFixed(2) + '%'}
                    </h4>
                ) : (
                    <div style={{ padding: '0.2rem 0', width: '100%' }}>
                        <ProgressBar label="Loading TIPS" hideLabel size="small" />
                    </div>
                )}
            </Tile>

            <Tile>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
                    <Globe size={14} color="#a8a8a8" />
                    <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>DXY Broad Index</p>
                </div>
                {snapshot?.dxy_broad !== undefined && snapshot?.dxy_broad !== null ? (
                    <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
                        {snapshot.dxy_broad.toFixed(2)}
                    </h4>
                ) : (
                    <div style={{ padding: '0.2rem 0', width: '100%' }}>
                        <ProgressBar label="Loading DXY" hideLabel size="small" />
                    </div>
                )}
            </Tile>

            <Tile>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
                    <Activity size={14} color="#a8a8a8" />
                    <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>VIX Volatility</p>
                </div>
                {snapshot?.vix !== undefined && snapshot?.vix !== null ? (
                    <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
                        {snapshot.vix.toFixed(2)}
                    </h4>
                ) : (
                    <div style={{ padding: '0.2rem 0', width: '100%' }}>
                        <ProgressBar label="Loading VIX" hideLabel size="small" />
                    </div>
                )}
            </Tile>

            <Tile>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
                    <Percentage size={14} color="#a8a8a8" />
                    <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Fed Funds Rate</p>
                </div>
                {snapshot?.fed_rate !== undefined && snapshot?.fed_rate !== null ? (
                    <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
                        {snapshot.fed_rate.toFixed(2) + '%'}
                    </h4>
                ) : (
                    <div style={{ padding: '0.2rem 0', width: '100%' }}>
                        <ProgressBar label="Loading Fed Rate" hideLabel size="small" />
                    </div>
                )}
            </Tile>
        </div>
    );
}
