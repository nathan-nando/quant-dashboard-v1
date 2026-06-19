"use client";

import React from 'react';
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
} from '@carbon/react';
import { Settings, Notification, Dashboard, SettingsAdjust, Activity, CurrencyDollar, ChartBar, MachineLearningModel, Analytics } from '@carbon/icons-react';

const HeaderAny = Header as any;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
                {navItem('/transactions', 'Transactions', CurrencyDollar)}
                {navItem('/thresholds', 'Thresholds', SettingsAdjust)}
              </HeaderNavigation>

              {/* Spacer — pushes Group 2 toward the right */}
              <div style={{ flex: 1 }} />

              {/* Group 2 — sits just before the global action icons */}
              <HeaderNavigation aria-label="Tools" style={{ border: 'none' }}>
                {navItem('/models', 'Models', MachineLearningModel)}
                {navItem('/simulation', 'Simulation', Analytics)}
                {navItem('/analytics', 'Analytics', ChartBar)}
              </HeaderNavigation>

              {/* Global actions */}
              <HeaderGlobalBar>
                <HeaderGlobalAction aria-label="Notifications" tooltipAlignment="end">
                  <Notification size={20} />
                </HeaderGlobalAction>
                <HeaderGlobalAction aria-label="Settings" tooltipAlignment="end" onClick={() => router.push('/settings')}>
                  <Settings size={20} />
                </HeaderGlobalAction>
              </HeaderGlobalBar>
            </HeaderAny>
          )}
        />
      </Theme>
      <Theme theme="g100" className="main-theme-wrapper">
        <main style={{ marginTop: '3rem', padding: '2rem 0', minHeight: 'calc(100vh - 3rem)' }}>
          {children}
        </main>
      </Theme>
    </>
  );
}
