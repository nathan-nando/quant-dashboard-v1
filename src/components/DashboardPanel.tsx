"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Tile, IconButton, Tooltip, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { Maximize, Minimize, Information, OverflowMenuVertical } from '@carbon/icons-react';

interface DashboardPanelProps {
  title: string;
  tooltipInfo?: string;
  onExportCsv?: () => void;
  children: React.ReactNode;
}

export default function DashboardPanel({ title, tooltipInfo, onExportCsv, children }: DashboardPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (panelRef.current?.requestFullscreen) {
        panelRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      // If the fullscreen element is not our panel, it means we exited
      if (document.fullscreenElement !== panelRef.current) {
        setIsFullscreen(false);
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <Tile 
      ref={panelRef} 
      style={{ 
        padding: 0, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        // In fullscreen mode, ensure it takes up the whole screen
        width: isFullscreen ? '100vw' : '100%',
        backgroundColor: '#353535'
      }}
    >
      {/* Header / Drag Handle */}
      <div 
        className="panel-drag-handle" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.5rem 1rem',
          cursor: 'grab',
          backgroundColor: '#353535',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{title}</h4>
          {tooltipInfo && (
            <Tooltip align="bottom" label={tooltipInfo}>
              <button style={{ background: 'none', border: 'none', cursor: 'help', padding: 0, display: 'flex', transform: 'translateY(-2px)' }} type="button">
                <Information size={14} style={{ fill: '#a8a8a8' }} />
              </button>
            </Tooltip>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }} className="nodrag">
          {onExportCsv && (
            <OverflowMenu flipped size="sm" ariaLabel="Options" iconDescription="Options" renderIcon={() => <OverflowMenuVertical size={16} />}>
              <OverflowMenuItem itemText="Export CSV" onClick={onExportCsv} />
            </OverflowMenu>
          )}
          <IconButton 
            kind="ghost" 
            size="sm" 
            label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </IconButton>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }} className="nodrag">
        {children}
      </div>
    </Tile>
  );
}
