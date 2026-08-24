"use client";

import React from 'react';
import { Tag } from '@carbon/react';

export default function EventDrivenEngineGuide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#f4f4f4', fontSize: '0.875rem', lineHeight: '1.5' }}>
      
      {/* Intro Header */}
      <div style={{ background: '#262626', padding: '1rem', borderLeft: '4px solid #0f62fe' }}>
        <h5 style={{ margin: '0 0 0.4rem 0', color: '#78a9ff', fontSize: '0.95rem', fontWeight: 600 }}>
          🏛️ Arsitektur Multi-Scale Event-Driven &amp; Pyramiding (Quant-V1)
        </h5>
        <p style={{ margin: 0, color: '#c6c6c6', fontSize: '0.825rem' }}>
          Sistem perdagangan kuantitatif berlatensi rendah untuk instrumen <strong>XAUUSD</strong> (Emas). Berbeda dengan candlestick berbasis waktu (Time-based), pergerakan harga diukur berdasarkan <strong>Delta Harga Diskrit (ΔP)</strong> untuk menangkap momentum mikrostruktur secara objektif.
        </p>
      </div>

      {/* 4 Core Pillars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        
        {/* 1. Micro Scale */}
        <div style={{ background: '#222', border: '1px solid #393939', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#42be65', fontSize: '0.9rem' }}>⚡ 1. Micro Scale ($2.00 / 20 Pips)</span>
            <Tag type="green" size="sm">Atomik Eksekusi</Tag>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#c6c6c6' }}>
            Unit pembentuk harga dasar. Setiap kali harga bergerak bersih <strong>ΔP = $2.00</strong>, satu Range Bar ditutup seketika tanpa jeda waktu.
          </p>
          <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.775rem', color: '#a8a8a8' }}>
            <li><strong>Price Velocity ($/s):</strong> Mengukur laju kecepatan pembentukan bar untuk menyaring noise pasar lambat (&lt; $0.040/s).</li>
            <li><strong>Dual AI Inference:</strong> Model LightGBM BUY dan SELL mengevaluasi 58 fitur mikrostruktur &amp; volatilitas setiap bar tertutup.</li>
          </ul>
        </div>

        {/* 2. Meso Scale */}
        <div style={{ background: '#222', border: '1px solid #393939', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#4589ff', fontSize: '0.9rem' }}>🌊 2. Meso Scale ($6.00 / 60 Pips)</span>
            <Tag type="blue" size="sm">Gatekeeper Tren</Tag>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#c6c6c6' }}>
            Struktur tren gelombang menengah. Dibangun dari akumulasi <strong>3 Range Bar mikro</strong> ($2.00 × 3 = $6.00).
          </p>
          <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.775rem', color: '#a8a8a8' }}>
            <li><strong>Strict Anti-Falling-Knife:</strong> Saat Meso = <span style={{ color: '#fa4d56', fontWeight: 600 }}>BEARISH</span>, semua sinyal BUY 100% diblokir mutlak (anti menangkap pisau jatuh).</li>
            <li><strong>Exhaustion Counter-Scalp:</strong> Sisi SELL diizinkan masuk saat Meso BULLISH jika terdeteksi jenuh beli di pucuk gelombang (single-layer).</li>
          </ul>
        </div>

        {/* 3. Macro Scale */}
        <div style={{ background: '#222', border: '1px solid #393939', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#a56eff', fontSize: '0.9rem' }}>🌐 3. Macro Scale ($18.00 / 180 Pips)</span>
            <Tag type="purple" size="sm">Rezim Global</Tag>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#c6c6c6' }}>
            Rezim arah likuiditas pasar institusional. Akumulasi dari <strong>3 bar Meso</strong> ($6.00 × 3 = $18.00) diselaraskan dengan data makro DXY, TIPS 10Y, &amp; VIX.
          </p>
          <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.775rem', color: '#a8a8a8' }}>
            <li><strong>Dynamic Soft-Switching:</strong> Menurunkan threshold BUY (50-55%) di tren Bullish dan menaikkan threshold SELL (68-70%) secara adaptif.</li>
            <li><strong>Conviction Sizing:</strong> Pro-Trend (1.00x) vs Counter-Trend (0.40x).</li>
          </ul>
        </div>

        {/* 4. Pyramiding Scale-In */}
        <div style={{ background: '#222', border: '1px solid #393939', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#f1c21b', fontSize: '0.9rem' }}>🏛️ 4. Pyramiding Engine</span>
            <Tag type="teal" size="sm">House Money Rule</Tag>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#c6c6c6' }}>
            Manajemen scale-in posisi bertingkat hingga maksimal <strong>3 - 4 Lapisan</strong> (L1 Base → L2 Add → L3 Add → L4 Cap).
          </p>
          <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.775rem', color: '#a8a8a8' }}>
            <li><strong>Syarat Layer N+1:</strong> Hanya boleh dibuka jika posisi sebelumnya telah menghasilkan profit ≥ +20 pips (+$2.00).</li>
            <li><strong>Ratchet Stop Loss:</strong> Stop Loss posisi sebelumnya otomatis dikunci ke Breakeven (+$2.00 profit) — <em>Zero Capital Risk</em>.</li>
            <li><strong>Cluster Trailing Stop:</strong> Menjaga total akumulasi profit klaster dengan jarak trailing 35 pips dari puncak harga.</li>
          </ul>
        </div>

      </div>

      {/* Safety & Execution Summary Banner */}
      <div style={{ background: '#1c1c1c', border: '1px dashed #525252', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>
          🔒 Parameter Keamanan: SL 40 pips ($4.00) • TP 60 pips ($6.00) • Spread Filter ≤ 3.0 pips • News Window 15m • Circuit Breaker 5 Losses
        </span>
        <span style={{ fontSize: '0.75rem', color: '#78a9ff', fontWeight: 600 }}>
          Quant-V1 Event Engine Core
        </span>
      </div>

    </div>
  );
}
