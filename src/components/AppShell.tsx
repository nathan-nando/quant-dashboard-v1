"use client";

import React, { useState } from 'react';
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
  Grid,
  Column
} from '@carbon/react';
import { Settings, Notification, Dashboard, SettingsAdjust, Activity, CurrencyDollar, ChartBar } from '@carbon/icons-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <Theme theme="g100">
        <HeaderContainer
          render={() => (
            <Header aria-label="QuantV1">
              <SkipToContent />
              
              {/* Brand positioned absolutely to the left */}
              <HeaderName 
                href="/" 
                onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/'); }}
                prefix="" 
                style={{ position: 'absolute', left: '1rem', zIndex: 10, height: '100%', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px' }}
              >
                QuantV1
              </HeaderName>
              
              {/* Navigation wrapped in the exact same Grid layout as the main content for perfect alignment */}
              <div style={{ width: '100vw', height: '100%', display: 'flex' }}>
                <Grid style={{ width: '100%', height: '100%', margin: '0 auto' }}>
                  <Column lg={16} md={8} sm={4} style={{ display: 'flex', height: '100%' }}>
                    <HeaderNavigation aria-label="QuantV1 Navigation" style={{ border: 'none' }}>
                      <HeaderMenuItem 
                        href="/" 
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/'); }}
                        aria-current={pathname === '/' ? 'page' : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Dashboard size={16} /> Dashboard</div>
                      </HeaderMenuItem>
                      <HeaderMenuItem 
                        href="/thresholds" 
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/thresholds'); }}
                        aria-current={pathname === '/thresholds' ? 'page' : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><SettingsAdjust size={16} /> Thresholds</div>
                      </HeaderMenuItem>
                      <HeaderMenuItem 
                        href="/signals" 
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/signals'); }}
                        aria-current={pathname === '/signals' ? 'page' : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} /> Signals</div>
                      </HeaderMenuItem>
                      <HeaderMenuItem 
                        href="/transactions" 
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/transactions'); }}
                        aria-current={pathname === '/transactions' ? 'page' : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CurrencyDollar size={16} /> Transactions</div>
                      </HeaderMenuItem>
                      <HeaderMenuItem 
                        href="/analytics" 
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/analytics'); }}
                        aria-current={pathname === '/analytics' ? 'page' : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChartBar size={16} /> Analytics</div>
                      </HeaderMenuItem>
                    </HeaderNavigation>
                  </Column>
                </Grid>
              </div>
              
              {/* Actions positioned absolutely to the right */}
              <HeaderGlobalBar style={{ position: 'absolute', right: 0, zIndex: 10, height: '100%' }}>
                <HeaderGlobalAction aria-label="Notifications" tooltipAlignment="end">
                  <Notification size={20} />
                </HeaderGlobalAction>
                <HeaderGlobalAction aria-label="Settings" tooltipAlignment="end" onClick={() => router.push('/settings')}>
                  <Settings size={20} />
                </HeaderGlobalAction>
              </HeaderGlobalBar>
            </Header>
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
