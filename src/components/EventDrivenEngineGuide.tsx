"use client";

import React from 'react';

export default function EventDrivenEngineGuide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: '#f4f4f4', fontSize: '0.85rem', lineHeight: '1.45' }}>
      
      {/* Intro Header */}
      <div style={{ background: '#262626', padding: '0.75rem 1rem', border: '1px solid #353535', borderLeft: '3px solid #6f6f6f' }}>
        <h5 style={{ margin: '0 0 0.25rem 0', color: '#f4f4f4', fontSize: '0.9rem', fontWeight: 600 }}>
          Arsitektur Multi-Scale Event-Driven &amp; Pyramiding (Quant-V1)
        </h5>
        <p style={{ margin: 0, color: '#c6c6c6', fontSize: '0.785rem' }}>
          Sistem perdagangan kuantitatif berlatensi rendah untuk instrumen <strong style={{ color: '#f4f4f4' }}>XAUUSD</strong> (Emas). Pergerakan harga diukur berdasarkan <strong style={{ color: '#f4f4f4' }}>Delta Harga Diskrit (ΔP)</strong> untuk menangkap momentum mikrostruktur secara objektif.
        </p>
      </div>

      {/* 4 Core Pillars Grid with 0.2rem gap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.2rem' }}>
        
        {/* 1. Micro Scale */}
        <div style={{ background: '#262626', border: '1px solid #353535', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#f4f4f4', fontSize: '0.85rem' }}>1. Micro Scale ($2.00 / 20 Pips)</span>
            <span style={{ background: '#353535', color: '#c6c6c6', border: '1px solid #474747', padding: '1px 6px', fontSize: '9.5px', fontWeight: 500 }}>Atomik Eksekusi</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.775rem', color: '#c6c6c6' }}>
            Unit pembentuk harga dasar. Setiap kali harga bergerak bersih <strong style={{ color: '#f4f4f4' }}>ΔP = $2.00</strong>, satu Range Bar ditutup seketika tanpa jeda waktu.
          </p>
          <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: '#a8a8a8' }}>
            <li><strong style={{ color: '#e0e0e0' }}>Price Velocity ($/s):</strong> Mengukur laju kecepatan pembentukan bar untuk menyaring noise pasar lambat (&lt; $0.040/s).</li>
            <li><strong style={{ color: '#e0e0e0' }}>Dual AI Inference:</strong> Model LightGBM BUY dan SELL mengevaluasi 58 fitur mikrostruktur &amp; volatilitas setiap bar tertutup.</li>
          </ul>
        </div>

        {/* 2. Meso Scale */}
        <div style={{ background: '#262626', border: '1px solid #353535', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#f4f4f4', fontSize: '0.85rem' }}>2. Meso Scale ($6.00 / 60 Pips)</span>
            <span style={{ background: '#353535', color: '#c6c6c6', border: '1px solid #474747', padding: '1px 6px', fontSize: '9.5px', fontWeight: 500 }}>Gatekeeper Tren</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.775rem', color: '#c6c6c6' }}>
            Struktur tren gelombang menengah. Dibangun dari akumulasi <strong style={{ color: '#f4f4f4' }}>3 Range Bar mikro</strong> ($2.00 × 3 = $6.00).
          </p>
          <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: '#a8a8a8' }}>
            <li><strong style={{ color: '#e0e0e0' }}>Strict Anti-Falling-Knife:</strong> Saat Meso = Bearish, semua sinyal BUY 100% diblokir mutlak (anti menangkap pisau jatuh).</li>
            <li><strong style={{ color: '#e0e0e0' }}>Exhaustion Counter-Scalp:</strong> Sisi SELL diizinkan masuk saat Meso Bullish jika terdeteksi jenuh beli di pucuk gelombang (single-layer).</li>
          </ul>
        </div>

        {/* 3. Macro Scale */}
        <div style={{ background: '#262626', border: '1px solid #353535', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#f4f4f4', fontSize: '0.85rem' }}>3. Macro Scale ($18.00 / 180 Pips)</span>
            <span style={{ background: '#353535', color: '#c6c6c6', border: '1px solid #474747', padding: '1px 6px', fontSize: '9.5px', fontWeight: 500 }}>Rezim Global</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.775rem', color: '#c6c6c6' }}>
            Rezim arah likuiditas pasar institusional. Akumulasi dari <strong style={{ color: '#f4f4f4' }}>3 bar Meso</strong> ($6.00 × 3 = $18.00) diselaraskan dengan data makro DXY, TIPS 10Y, &amp; VIX.
          </p>
          <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: '#a8a8a8' }}>
            <li><strong style={{ color: '#e0e0e0' }}>Dynamic Soft-Switching:</strong> Menyesuaikan threshold BUY dan SELL secara adaptif terhadap bias makro.</li>
            <li><strong style={{ color: '#e0e0e0' }}>Conviction Sizing:</strong> Pro-Trend (1.00x) vs Counter-Trend (0.40x).</li>
          </ul>
        </div>

        {/* 4. Pyramiding Scale-In */}
        <div style={{ background: '#262626', border: '1px solid #353535', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#f4f4f4', fontSize: '0.85rem' }}>4. Pyramiding Engine</span>
            <span style={{ background: '#353535', color: '#c6c6c6', border: '1px solid #474747', padding: '1px 6px', fontSize: '9.5px', fontWeight: 500 }}>House Money Rule</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.775rem', color: '#c6c6c6' }}>
            Manajemen scale-in posisi bertingkat hingga maksimal <strong style={{ color: '#f4f4f4' }}>3 Lapisan</strong> (L1 Base → L2 Add → L3 Cap).
          </p>
          <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: '#a8a8a8' }}>
            <li><strong style={{ color: '#e0e0e0' }}>Syarat Layer N+1:</strong> Hanya boleh dibuka jika posisi sebelumnya menghasilkan profit ≥ +20 pips (+$2.00).</li>
            <li><strong style={{ color: '#e0e0e0' }}>Ratchet Stop Loss:</strong> Stop Loss posisi sebelumnya otomatis dikunci ke Breakeven (+$2.00 profit) — Zero Capital Risk.</li>
            <li><strong style={{ color: '#e0e0e0' }}>Cluster Trailing Stop:</strong> Menjaga total akumulasi profit klaster dengan jarak trailing 40 pips.</li>
          </ul>
        </div>

      </div>

      {/* Safety & Execution Summary Banner */}
      <div style={{ background: '#262626', border: '1px solid #353535', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>
          Parameter Keamanan: SL 40 pips ($4.00) • TP 60 pips ($6.00) • Spread Filter ≤ 3.0 pips • News Window 15m • Circuit Breaker 5 Losses
        </span>
        <span style={{ fontSize: '0.75rem', color: '#f4f4f4', fontWeight: 600 }}>
          Quant-V1 Event Engine Core
        </span>
      </div>

    </div>
  );
}
