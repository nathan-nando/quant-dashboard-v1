"use client";

import { Grid, Column, Tile, Form, FormGroup, NumberInput, Button, Toggle } from "@carbon/react";
import { useEffect, useState } from "react";

export default function ThresholdsPage() {
  const [config, setConfig] = useState({
    auto_execution_enabled: false,
    max_drawdown_pct: 5.0,
    risk_per_trade_pct: 1.0,
    max_open_positions: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/config/risk")
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    await fetch("http://127.0.0.1:8000/api/config/risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    setSaving(false);
    alert("Configuration saved successfully!");
  };

  if (loading) return <div>Loading configuration...</div>;

  return (
    <Grid>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h1 style={{ marginBottom: "1rem" }}>Thresholds & Gate Configuration</h1>
        <p style={{ marginBottom: "2rem" }}>Configure execution logic parameters and gating conditions.</p>
      </Column>
      
      <Column lg={8} md={8} sm={4}>
        <Tile>
          <h4>Risk & Execution Parameters</h4>
          <Form style={{marginTop: "2rem"}} onSubmit={handleSave}>
            <FormGroup legendText="">
              <Toggle 
                id="auto_exec" 
                labelText="Auto Execution Master Switch" 
                labelA="Off" 
                labelB="On" 
                toggled={config.auto_execution_enabled}
                onToggle={(val) => setConfig({...config, auto_execution_enabled: val})}
              />
              <div style={{marginTop: "2rem"}}>
                <NumberInput 
                  id="max_drawdown" 
                  label="Max Daily Drawdown (%)" 
                  value={config.max_drawdown_pct} 
                  min={1} max={100} 
                  onChange={(e: any, { value }: any) => setConfig({...config, max_drawdown_pct: Number(value)})}
                />
              </div>
              <div style={{marginTop: "1rem"}}>
                <NumberInput 
                  id="risk_per_trade" 
                  label="Risk Per Trade (%)" 
                  value={config.risk_per_trade_pct} 
                  min={0.1} max={100} step={0.1} 
                  onChange={(e: any, { value }: any) => setConfig({...config, risk_per_trade_pct: Number(value)})}
                />
              </div>
              <div style={{marginTop: "1rem"}}>
                <NumberInput 
                  id="max_positions" 
                  label="Max Open Positions" 
                  value={config.max_open_positions} 
                  min={1} max={20} 
                  onChange={(e: any, { value }: any) => setConfig({...config, max_open_positions: Number(value)})}
                />
              </div>
            </FormGroup>
            <Button type="submit" style={{marginTop: "1rem"}} disabled={saving}>
              {saving ? "Saving..." : "Save Configurations"}
            </Button>
          </Form>
        </Tile>
      </Column>
    </Grid>
  );
}
