"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Theme,
  Modal,
  CodeSnippet
} from '@carbon/react';
import { Settings, Notification, Dashboard, SettingsAdjust, Activity, MachineLearningModel, Analytics, User } from '@carbon/icons-react';
import MarketClock from './MarketClock';
import HeaderMetrics from './HeaderMetrics';
import GlobalJobsWidget from './GlobalJobsWidget';

const HeaderAny = Header as any;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Job Logs Modal States
  const [detailLogs, setDetailLogs] = useState<string>("");
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  
  const detailJobIdRef = useRef<string | null>(null);
  useEffect(() => {
    detailJobIdRef.current = detailJobId;
  }, [detailJobId]);

  useEffect(() => {
    const handleOpenDetails = (e: Event) => {
      const jobId = (e as CustomEvent).detail?.jobId;
      if (jobId) openJobDetails(jobId);
    };
    window.addEventListener('open-job-details', handleOpenDetails);
    return () => {
      window.removeEventListener('open-job-details', handleOpenDetails);
    };
  }, []);

  const handleLogLine = useCallback((taskId: string, line: string) => {
    if (taskId === detailJobIdRef.current) {
      setDetailLogs(prev => {
        if (!prev || prev === "Loading logs..." || prev === "No logs available.") return line;
        if (prev.endsWith(line)) return prev;
        return prev + "\n" + line;
      });
    }
  }, []);

  const openJobDetails = async (jobId: string) => {
    setDetailLogs("Loading logs...");
    setDetailModalOpen(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/jobs/logs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailLogs(data.logs || "No logs available.");
        setDetailJobId(jobId);
      } else {
        setDetailLogs("Failed to load logs.");
      }
    } catch (e) {
      setDetailLogs("Failed to load logs.");
    }
  };

  const navItem = (href: string, label: string, Icon: any) => (
    <HeaderMenuItem
      href={href}
      onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push(href); }}
      aria-current={pathname === href ? 'page' : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={16} /> {label}
      </div>
    </HeaderMenuItem>
  );

  return (
    <>
      <Theme theme="g100">
        <HeaderContainer
          render={() => (
            <HeaderAny aria-label="QuantV1" style={{ display: 'flex', alignItems: 'stretch' }}>
              <SkipToContent />

              {/* Brand — in normal flow */}
              <HeaderName
                href="/"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/'); }}
                prefix=""
                style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px', flexShrink: 0 }}
              >
                QuantV1
              </HeaderName>

              {/* Group 1 — starts flush after brand, aligns with page content */}
              <HeaderNavigation aria-label="Main" style={{ border: 'none' }}>
                {navItem('/', 'Dashboard', Dashboard)}
                {navItem('/signals', 'Signals', Activity)}
                {navItem('/account', 'Account', User)}
                {navItem('/thresholds', 'Thresholds', SettingsAdjust)}
              </HeaderNavigation>

              {/* Spacer — pushes Group 2 toward the right */}
              <MarketClock />

              {/* Group 2 — sits just before the global action icons */}
              <HeaderNavigation aria-label="Tools" style={{ border: 'none' }}>
                {navItem('/models', 'Models', MachineLearningModel)}
                {navItem('/simulation', 'Simulation', Analytics)}
              </HeaderNavigation>

              {/* Global actions */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <HeaderMetrics />
                <HeaderGlobalBar>
                  <HeaderGlobalAction aria-label="Notifications" tooltipAlignment="end">
                    <Notification size={20} />
                  </HeaderGlobalAction>
                  <HeaderGlobalAction aria-label="Settings" tooltipAlignment="end" onClick={() => router.push('/settings')}>
                    <Settings size={20} />
                  </HeaderGlobalAction>
                </HeaderGlobalBar>
              </div>
            </HeaderAny>
          )}
        />
      </Theme>
      <Theme theme="g100" className="main-theme-wrapper">
        <main style={{ marginTop: '3rem', padding: '1rem 0', minHeight: 'calc(100vh - 3rem)' }}>
          {children}
        </main>
      </Theme>

      <Theme theme="g100">
        {/* Logs Modal */}
        <Modal 
            open={isDetailModalOpen} 
            onRequestClose={() => { setDetailModalOpen(false); setDetailJobId(null); }} 
            passiveModal 
            modalHeading="Job Logs" 
        >
            <div style={{ height: "75vh", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ flexGrow: 1, minHeight: "100%" }}>
                    <CodeSnippet type="multi" feedback="Copied to clipboard" maxCollapsedNumberOfRows={0} maxExpandedNumberOfRows={0}>
                        {detailLogs}
                    </CodeSnippet>
                </div>
            </div>
        </Modal>

        {/* Global Jobs Widget (monitoring all active dataset & training jobs) */}
        <GlobalJobsWidget openJobDetails={openJobDetails} onLogLine={handleLogLine} />
      </Theme>
    </>
  );
}
