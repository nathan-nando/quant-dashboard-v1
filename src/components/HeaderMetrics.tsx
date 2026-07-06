"use client";

import React, { useState } from 'react';
import { Power, MachineLearningModel } from '@carbon/icons-react';
import { Toggle, Modal, Loading } from '@carbon/react';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { API_BASE_URL } from '@/config/env';

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

  const MetricToggle = ({ label, toggled, onToggle, icon: Icon, id }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0px 0.5rem', height: '14px' }}>
      <Icon size={12} color={toggled ? "#24a148" : "#fa4d56"} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '0.55rem', color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '38px', lineHeight: 1, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', height: '12px', flexShrink: 0 }}>
        <Toggle
          id={id}
          size="sm"
          labelText=""
          labelA=""
          labelB=""
          toggled={toggled}
          onToggle={onToggle}
          hideLabel
          style={{ margin: 0, height: '12px' }}
        />
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', justifyContent: 'center' }}>
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
