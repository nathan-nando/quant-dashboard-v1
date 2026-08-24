"use client";

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tile, IconButton, Tooltip, OverflowMenu, OverflowMenuItem, Modal } from '@carbon/react';
import { Maximize, Minimize, Information, OverflowMenuVertical } from '@carbon/icons-react';

interface DashboardPanelProps {
  title: string;
  tooltipInfo?: string;
  infoModalTitle?: string;
  infoModalContent?: React.ReactNode;
  onExportCsv?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardPanel({ 
  title, 
  tooltipInfo, 
  infoModalTitle,
  infoModalContent,
  onExportCsv, 
  headerActions, 
  children 
}: DashboardPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          {(tooltipInfo || infoModalContent) && (
            <Tooltip align="bottom" label={tooltipInfo || "Click for details"}>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: infoModalContent ? 'pointer' : 'help', 
                  padding: 0, 
                  display: 'flex', 
                  transform: 'translateY(-2px)' 
                }} 
                type="button"
                onClick={(e) => {
                  if (infoModalContent) {
                    e.stopPropagation();
                    setShowInfoModal(true);
                  }
                }}
              >
                <Information size={14} style={{ fill: '#a8a8a8' }} />
              </button>
            </Tooltip>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="nodrag">
          {headerActions}
          {onExportCsv && (
            <OverflowMenu 
              flipped 
              size="sm" 
              ariaLabel="Options" 
              iconDescription="Options" 
              renderIcon={() => <OverflowMenuVertical size={12} />}
              style={{
                height: '24px',
                width: '24px',
                minHeight: '24px',
                padding: 0
              }}
            >
              <OverflowMenuItem itemText="Export CSV" onClick={onExportCsv} />
            </OverflowMenu>
          )}
          <IconButton 
            kind="ghost" 
            size="sm" 
            label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            onClick={toggleFullscreen}
            style={{
              height: '24px',
              width: '24px',
              minHeight: '24px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
          </IconButton>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }} className="nodrag">
        {children}
      </div>

      {/* Info Guide Modal - Rendered via Portal to document.body to avoid layout/grid trapping */}
      {mounted && infoModalContent && showInfoModal && createPortal(
        <Modal
          open={showInfoModal}
          onRequestClose={() => setShowInfoModal(false)}
          modalHeading={infoModalTitle || title}
          passiveModal
          size="lg"
        >
          <div style={{ padding: '0.5rem 0', maxHeight: '70vh', overflowY: 'auto' }}>
            {infoModalContent}
          </div>
        </Modal>,
        document.body
      )}
    </Tile>
  );
}
