"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
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
import { Settings, Notification } from '@carbon/icons-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Theme theme="g100">
        <HeaderContainer
          render={() => (
            <Header aria-label="QuantV1">
              <SkipToContent />
              
              {/* Brand positioned absolutely to the left */}
              <HeaderName href="/" prefix="" style={{ position: 'absolute', left: 0, zIndex: 10, height: '100%' }}>
                QuantV1
              </HeaderName>
              
              {/* Navigation wrapped in the exact same Grid layout as the main content for perfect alignment */}
              <div style={{ width: '100vw', height: '100%', display: 'flex' }}>
                <Grid style={{ width: '100%', height: '100%', margin: '0 auto' }}>
                  <Column lg={16} md={8} sm={4} style={{ display: 'flex', height: '100%' }}>
                    <HeaderNavigation aria-label="QuantV1 Navigation" style={{ border: 'none' }}>
                      <HeaderMenuItem href="/" aria-current={pathname === '/' ? 'page' : undefined}>Dashboard</HeaderMenuItem>
                      <HeaderMenuItem href="/thresholds" aria-current={pathname === '/thresholds' ? 'page' : undefined}>Thresholds & Gate</HeaderMenuItem>
                      <HeaderMenuItem href="/monitoring" aria-current={pathname === '/monitoring' ? 'page' : undefined}>Monitoring & History</HeaderMenuItem>
                      <HeaderMenuItem href="/analytics" aria-current={pathname === '/analytics' ? 'page' : undefined}>Analytics</HeaderMenuItem>
                    </HeaderNavigation>
                  </Column>
                </Grid>
              </div>
              
              {/* Actions positioned absolutely to the right */}
              <HeaderGlobalBar style={{ position: 'absolute', right: 0, zIndex: 10, height: '100%' }}>
                <HeaderGlobalAction aria-label="Notifications" tooltipAlignment="end">
                  <Notification size={20} />
                </HeaderGlobalAction>
                <HeaderGlobalAction aria-label="Settings" tooltipAlignment="end">
                  <Settings size={20} />
                </HeaderGlobalAction>
              </HeaderGlobalBar>
            </Header>
          )}
        />
      </Theme>
      <Theme theme="g100" className="main-theme-wrapper">
        <main style={{ marginTop: '4rem', height: 'calc(100vh - 4rem)', padding: '2rem 0', overflowY: 'auto' }}>
          {children}
        </main>
      </Theme>
    </>
  );
}
