"use client";

import { Grid, Column, Tile, FormGroup, NumberInput, Button, Toggle } from "@carbon/react";
import { View, ViewOff, Save } from "@carbon/icons-react";
import { useEffect, useState } from "react";

export default function ThresholdsPage() {
  const [config, setConfig] = useState<any>({
    auto_execution_enabled: false,
    max_drawdown_pct: 5.0,
    risk_per_trade_pct: 1.0,
    max_open_positions: 1,
    rsi_buy_threshold: 30,
    rsi_sell_threshold: 70,
    ml_confidence_threshold: 0.6,
    adx_trend_threshold: 25,
    bb_width_volatility_threshold: 5.0,
    sl_mult_trend: 1.5,
    tp_mult_trend: 3.0,
    sl_mult_mean_reverting: 1.0,
    tp_mult_mean_reverting: 1.5,
    sl_mult_volatile: 2.0,
    tp_mult_volatile: 2.0
  });

  const [originalConfig, setOriginalConfig] = useState<any>(null);
  
  const [visibleCategories, setVisibleCategories] = useState({
    "risk-execution": true,
    "alpha-model": true,
    "regime-detection": true,
    "sltp-multipliers": true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/configurations/thresholds")
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setOriginalConfig(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("http://127.0.0.1:8000/api/configurations/thresholds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    setOriginalConfig({ ...config });
    setSaving(false);
    alert("Configuration saved successfully!");
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (id: string) => {
    setVisibleCategories(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  const hasChanges = (keys: string[]) => {
    if (!originalConfig) return false;
    return keys.some(key => config[key] !== originalConfig[key]);
  };

  const riskKeys = ["auto_execution_enabled", "max_drawdown_pct", "risk_per_trade_pct", "max_open_positions"];
  const alphaKeys = ["rsi_buy_threshold", "rsi_sell_threshold", "ml_confidence_threshold"];
  const regimeKeys = ["adx_trend_threshold", "bb_width_volatility_threshold"];
  const sltpKeys = ["sl_mult_trend", "tp_mult_trend", "sl_mult_mean_reverting", "tp_mult_mean_reverting", "sl_mult_volatile", "tp_mult_volatile"];

  if (loading) return <div>Loading configuration...</div>;

  return (
    <Grid>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h1 style={{ marginBottom: "1rem" }}>Thresholds</h1>
      </Column>
      
      <Column lg={12} md={6} sm={4}>
        {visibleCategories["risk-execution"] && (
          <Tile id="risk-execution" style={{ marginBottom: "2rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Risk & Execution Parameters</h4>
              <Button size="sm" renderIcon={Save} onClick={handleSave} disabled={saving || !hasChanges(riskKeys)} style={{ border: 'none' }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <FormGroup legendText="" style={{ marginTop: "1rem" }}>
              <Toggle 
                id="auto_exec" 
                labelText="Auto Execution Master Switch" 
                labelA="Off" 
                labelB="On" 
                toggled={config.auto_execution_enabled}
                onToggle={(val) => updateConfig("auto_execution_enabled", val)}
              />
              <div style={{marginTop: "2rem"}}>
                <NumberInput 
                  id="max_drawdown" label="Max Daily Drawdown (%)" value={config.max_drawdown_pct} 
                  min={1} max={100} onChange={(e: any, { value }: any) => updateConfig("max_drawdown_pct", Number(value))}
                />
              </div>
              <div style={{marginTop: "1rem"}}>
                <NumberInput 
                  id="risk_per_trade" label="Risk Per Trade (%)" value={config.risk_per_trade_pct} 
                  min={0.1} max={100} step={0.1} onChange={(e: any, { value }: any) => updateConfig("risk_per_trade_pct", Number(value))}
                />
              </div>
              <div style={{marginTop: "1rem"}}>
                <NumberInput 
                  id="max_positions" label="Max Open Positions" value={config.max_open_positions} 
                  min={1} max={20} onChange={(e: any, { value }: any) => updateConfig("max_open_positions", Number(value))}
                />
              </div>
            </FormGroup>
          </Tile>
        )}

        {visibleCategories["alpha-model"] && (
          <Tile id="alpha-model" style={{ marginBottom: "2rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Alpha / Signal Model Thresholds</h4>
              <Button size="sm" renderIcon={Save} onClick={handleSave} disabled={saving || !hasChanges(alphaKeys)} style={{ border: 'none' }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <FormGroup legendText="" style={{ marginTop: "1rem" }}>
              <div>
                <NumberInput 
                  id="rsi_buy" label="RSI Buy Threshold" value={config.rsi_buy_threshold} 
                  min={1} max={100} onChange={(e: any, { value }: any) => updateConfig("rsi_buy_threshold", Number(value))}
                />
              </div>
              <div style={{marginTop: "1rem"}}>
                <NumberInput 
                  id="rsi_sell" label="RSI Sell Threshold" value={config.rsi_sell_threshold} 
                  min={1} max={100} onChange={(e: any, { value }: any) => updateConfig("rsi_sell_threshold", Number(value))}
                />
              </div>
              <div style={{marginTop: "1rem"}}>
                <NumberInput 
                  id="ml_conf" label="ML Confidence Threshold" value={config.ml_confidence_threshold} 
                  min={0.1} max={1.0} step={0.05} onChange={(e: any, { value }: any) => updateConfig("ml_confidence_threshold", Number(value))}
                />
              </div>
            </FormGroup>
          </Tile>
        )}

        {visibleCategories["regime-detection"] && (
          <Tile id="regime-detection" style={{ marginBottom: "2rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Regime Detection Thresholds</h4>
              <Button size="sm" renderIcon={Save} onClick={handleSave} disabled={saving || !hasChanges(regimeKeys)} style={{ border: 'none' }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <FormGroup legendText="" style={{ marginTop: "1rem" }}>
              <div>
                <NumberInput 
                  id="adx_trend" label="ADX Trend Threshold" value={config.adx_trend_threshold} 
                  min={1} max={100} onChange={(e: any, { value }: any) => updateConfig("adx_trend_threshold", Number(value))}
                />
              </div>
              <div style={{marginTop: "1rem"}}>
                <NumberInput 
                  id="bb_width" label="Bollinger Bands Width Threshold (%)" value={config.bb_width_volatility_threshold} 
                  min={0.1} max={20} step={0.5} onChange={(e: any, { value }: any) => updateConfig("bb_width_volatility_threshold", Number(value))}
                />
              </div>
            </FormGroup>
          </Tile>
        )}

        {visibleCategories["sltp-multipliers"] && (
          <Tile id="sltp-multipliers" style={{ marginBottom: "2rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>SL/TP Multipliers</h4>
              <Button size="sm" renderIcon={Save} onClick={handleSave} disabled={saving || !hasChanges(sltpKeys)} style={{ border: 'none' }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <p style={{marginBottom: "1rem", marginTop: "0.5rem", fontSize: "12px", color: "#525252"}}>Multipliers based on Average True Range (ATR)</p>
            <FormGroup legendText="Trend Regime" style={{ marginTop: "1rem" }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <NumberInput 
                  id="sl_trend" label="SL Multiplier" value={config.sl_mult_trend} 
                  min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("sl_mult_trend", Number(value))}
                />
                <NumberInput 
                  id="tp_trend" label="TP Multiplier" value={config.tp_mult_trend} 
                  min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("tp_mult_trend", Number(value))}
                />
              </div>
            </FormGroup>
            <FormGroup legendText="Mean Reverting Regime" style={{ marginTop: "1rem" }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <NumberInput 
                  id="sl_mr" label="SL Multiplier" value={config.sl_mult_mean_reverting} 
                  min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("sl_mult_mean_reverting", Number(value))}
                />
                <NumberInput 
                  id="tp_mr" label="TP Multiplier" value={config.tp_mult_mean_reverting} 
                  min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("tp_mult_mean_reverting", Number(value))}
                />
              </div>
            </FormGroup>
            <FormGroup legendText="Volatile Chop Regime" style={{ marginTop: "1rem" }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <NumberInput 
                  id="sl_vol" label="SL Multiplier" value={config.sl_mult_volatile} 
                  min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("sl_mult_volatile", Number(value))}
                />
                <NumberInput 
                  id="tp_vol" label="TP Multiplier" value={config.tp_mult_volatile} 
                  min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("tp_mult_volatile", Number(value))}
                />
              </div>
            </FormGroup>
          </Tile>
        )}
      </Column>

      <Column lg={4} md={2} sm={0}>
        <div style={{ position: "sticky", top: "5rem" }}>
          <h4 style={{ marginBottom: "1rem", fontSize: "14px", fontWeight: "bold" }}>Table of Contents</h4>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "13px" }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ cursor: 'pointer', display: 'flex', color: visibleCategories["risk-execution"] ? "#0f62fe" : "#8d8d8d" }} onClick={() => toggleCategory("risk-execution")}>
                {visibleCategories["risk-execution"] ? <View size={16} /> : <ViewOff size={16} />}
              </div>
              <a href="#risk-execution" style={{ textDecoration: "none", color: visibleCategories["risk-execution"] ? "#0f62fe" : "#8d8d8d" }}>Risk & Execution</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ cursor: 'pointer', display: 'flex', color: visibleCategories["alpha-model"] ? "#0f62fe" : "#8d8d8d" }} onClick={() => toggleCategory("alpha-model")}>
                {visibleCategories["alpha-model"] ? <View size={16} /> : <ViewOff size={16} />}
              </div>
              <a href="#alpha-model" style={{ textDecoration: "none", color: visibleCategories["alpha-model"] ? "#0f62fe" : "#8d8d8d" }}>Alpha / Signal Model</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ cursor: 'pointer', display: 'flex', color: visibleCategories["regime-detection"] ? "#0f62fe" : "#8d8d8d" }} onClick={() => toggleCategory("regime-detection")}>
                {visibleCategories["regime-detection"] ? <View size={16} /> : <ViewOff size={16} />}
              </div>
              <a href="#regime-detection" style={{ textDecoration: "none", color: visibleCategories["regime-detection"] ? "#0f62fe" : "#8d8d8d" }}>Regime Detection</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ cursor: 'pointer', display: 'flex', color: visibleCategories["sltp-multipliers"] ? "#0f62fe" : "#8d8d8d" }} onClick={() => toggleCategory("sltp-multipliers")}>
                {visibleCategories["sltp-multipliers"] ? <View size={16} /> : <ViewOff size={16} />}
              </div>
              <a href="#sltp-multipliers" style={{ textDecoration: "none", color: visibleCategories["sltp-multipliers"] ? "#0f62fe" : "#8d8d8d" }}>SL/TP Multipliers</a>
            </li>
          </ul>
        </div>
      </Column>
    </Grid>
  );
}
