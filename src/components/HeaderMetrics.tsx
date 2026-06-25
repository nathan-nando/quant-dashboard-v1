"use client";

import React, { useState } from 'react';
import { Activity, Power, MachineLearningModel, DataBase } from '@carbon/icons-react';
import { Toggle, Modal, Loading } from '@carbon/react';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { API_BASE_URL } from '@/config/env';

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull', color: '#24a148' };
  if (regime === 'TREND_BEAR') return { text: 'Bear', color: '#fa4d56' };
  if (regime === 'VOLATILE_CHOP') return { text: 'Chop', color: '#f1c21b' };
  if (regime === 'MEAN_REVERTING') return { text: 'Range', color: '#4589ff' };
  return { text: regime, color: '#f4f4f4' };
};

export default function HeaderMetrics() {
  const { state } = useGlobalState();
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    body: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    body: '',
    onConfirm: () => {}
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirmSubmit = async () => {
    setConfirmLoading(true);
    try {
      await modalConfig.onConfirm();
    } catch (e) {
      console.error("Confirmation action failed:", e);
    } finally {
      setConfirmLoading(false);
    }
  };

  if (!state) return null;

  const regime = getRegimeFormat(state.regime);
  
  // Market Open/Close logic roughly based on UTC time (Gold is closed Friday 21:00 UTC to Sunday 21:00 UTC)
  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    if (day === 6) return false; // Saturday
    if (day === 5 && hour >= 21) return false; // Friday after 21:00 UTC
    if (day === 0 && hour < 21) return false; // Sunday before 21:00 UTC
    return true;
  };
  const marketStatus = isMarketOpen() ? 'OPEN' : 'CLOSED';
  const marketColor = isMarketOpen() ? '#24a148' : '#fa4d56';

  const handleToggleEngine = (checked: boolean) => {
    setModalConfig({
      isOpen: true,
      title: checked ? "Start Trading Engine" : "Stop Trading Engine",
      body: `Are you sure you want to ${checked ? 'start' : 'stop'} the Trading Engine?`,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/configurations/thresholds`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ engine_active: checked })
          });
        } catch (err) {
          console.error("Failed to toggle engine", err);
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleAuto = (checked: boolean) => {
    setModalConfig({
      isOpen: true,
      title: checked ? "Enable Auto Trade" : "Disable Auto Trade",
      body: `Are you sure you want to ${checked ? 'enable' : 'disable'} Auto Trade Execution?`,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/configurations/thresholds`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auto_execution_enabled: checked })
          });
        } catch (err) {
          console.error("Failed to toggle auto execution", err);
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const MetricBox = ({ label, value, color, icon: Icon }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.15rem 0.5rem', minWidth: '70px' }}>
      <Icon size={12} color="#a8a8a8" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', lineHeight: 1 }}>
        <span style={{ fontSize: '0.55rem', color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color }}>{value}</span>
      </div>
    </div>
  );

  const MetricToggle = ({ label, toggled, onToggle, icon: Icon, id }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.15rem 0.5rem', minWidth: '70px' }}>
      <Icon size={12} color={toggled ? "#24a148" : "#fa4d56"} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', lineHeight: 1 }}>
        <span style={{ fontSize: '0.55rem', color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', height: '16px' }}>
          <Toggle
            id={id}
            size="sm"
            labelText=""
            labelA=""
            labelB=""
            toggled={toggled}
            onToggle={onToggle}
            hideLabel
            style={{ margin: 0 }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '0.15rem', columnGap: '0rem', alignItems: 'center', marginRight: '1rem' }}>
        <MetricToggle 
          id="engine-nav-toggle"
          label="Engine" 
          toggled={state.engine_active} 
          onToggle={handleToggleEngine}
          icon={Power}
        />
        <MetricToggle 
          id="auto-nav-toggle"
          label="Auto" 
          toggled={state.auto_execution} 
          onToggle={handleToggleAuto}
          icon={MachineLearningModel}
        />
        <MetricBox 
          label="Regime:" 
          value={regime.text} 
          color={regime.color} 
          icon={Activity}
        />
        <MetricBox 
          label="Market:" 
          value={marketStatus} 
          color={marketColor} 
          icon={DataBase}
        />
      </div>

      <Modal
        open={modalConfig.isOpen}
        modalHeading={modalConfig.title}
        primaryButtonText={confirmLoading ? "Processing..." : "Confirm"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={confirmLoading}
        onRequestClose={() => !confirmLoading && setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onRequestSubmit={handleConfirmSubmit}
      >
        {confirmLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
            <Loading withOverlay={false} small />
            <span style={{ fontSize: '0.875rem', color: '#a8a8a8' }}>Please wait...</span>
          </div>
        ) : (
          <p style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{modalConfig.body}</p>
        )}
      </Modal>
    </>
  );
}
