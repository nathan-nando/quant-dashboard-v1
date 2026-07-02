"use client";

import React from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';
import GlobalTable from './GlobalTable';

export default function MacroCalendar() {
    const { state } = useGlobalState();
    const calendar = state?.calendar || [];

    const calendarHeaders = [
        { key: 'date', header: 'Date', width: '90px' },
        { key: 'event', header: 'Event' },
        { key: 'currency', header: 'Currency', width: '70px' },
        { key: 'impact', header: 'Impact', width: '70px' }
    ];

    if (!calendar || calendar.length === 0) {
        return <div style={{ color: '#a8a8a8', padding: '1rem', fontSize: '0.8rem' }}>No upcoming high-impact events.</div>;
    }

    const rows = calendar.map((e: any, i: number) => {
        return {
            id: i.toString(),
            date: e.date,
            event: e.event,
            impact: e.impact,
            currency: e.currency
        };
    });

    const formatCell = (cellId: string, value: any) => {
        const colKey = cellId.split(':').pop();
        if (colKey === 'date' && value) {
            const d = new Date(value);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = d.getDate().toString().padStart(2, '0');
            const month = months[d.getMonth()];
            const year = d.getFullYear().toString().slice(-2);
            const time = d.toTimeString().split(' ')[0];
            return (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', fontSize: '9.5px' }}>
                    <span>{`${day} ${month} ${year}`}</span>
                    <span style={{ color: '#a8a8a8', fontSize: '8.5px' }}>{time}</span>
                </div>
            );
        }
        if (colKey === 'impact' && value) {
            const valUpper = value.toUpperCase();
            let dotColor = '#6f6f6f';
            let textColor = '#a8a8a8';
            if (valUpper === 'HIGH') {
                dotColor = '#fa4d56';
                textColor = '#ffffff';
            } else if (valUpper === 'MEDIUM') {
                dotColor = '#f1c21b';
                textColor = '#ffffff';
            } else if (valUpper === 'LOW') {
                dotColor = '#24a148';
                textColor = '#a8a8a8';
            }
            const readableValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            return (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '9.5px' }}>
                    <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: dotColor, flexShrink: 0 }}>
                        <circle cx="16" cy="16" r="8" />
                    </svg>
                    <span style={{ color: textColor, whiteSpace: 'nowrap' }}>{readableValue}</span>
                </div>
            );
        }
        return value;
    };

    return (
        <GlobalTable 
            title="" 
            headers={calendarHeaders} 
            initialData={rows} 
            formatCell={formatCell}
            compact 
            hidePagination 
            hideSearch 
            hideReload 
        />
    );
}
