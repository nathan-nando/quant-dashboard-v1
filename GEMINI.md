# Quant Dashboard V1 - Subsystem Rules & Architecture

`quant-dashboard-v1` is the web control portal for the Quant-V1 ecosystem, built with **Next.js (App Router)** and **IBM Carbon Design System**.

---

## 🏛️ Architecture & Component Layout

- **Framework**: Next.js 15+ (App Router).
- **Design System**: IBM Carbon React (`@carbon/react`, `@carbon/icons-react`, Carbon Grid).
- **Charts**: Lightweight Charts by TradingView for real-time Range Bar candlestick charting.
- **Layouting**: React Grid Layout for customizable dashboard widgets.
- **Live Stream Integration**: Server-Sent Events (SSE) connecting to `http://localhost:8000/api/dashboard/stream`.

---

## ⚡ Key Dashboard Capabilities

1. **Range Bar Telemetry Monitor**:
   - Live progress indicator of current active bar formation `[$X.XX / $2.00] (0% - 100%)`.
   - Metrics: Price Velocity (\$/sec), Bar Duration (sec), Streak Count, Bar Velocity Sparkline.
2. **Pyramiding Decision State Widget**:
   - Visual indicators for 3 layers: `L1 Base`, `L2 Add`, `L3 Cap`.
   - Cluster average price and Dynamic Trailing Stop locking indicator.
3. **Pure Range Bar Charting**:
   - Candlestick stream driven by discrete \$2.00 range bars (Micro scale).
   - Event marker overlays (`ENTRY`, `+P2`, `+P3`, `TRAIL`).
   - Timeframe switcher: `RANGE ($2.00)`, `M1`, `M5`, `M15`, `H1`.
4. **Macro Soft-Switching & Threshold Control**:
   - Visual regime status (*Strong Bullish, Moderate Bullish, Neutral, Moderate Bearish, Strong Bearish*).
   - Interactive sliders/inputs to tune probability thresholds.

---

## 🛠️ Critical Rules for Dashboard Development

1. **Carbon Design Compliance**:
   - Always use IBM Carbon React design components (`Button`, `Tile`, `Tag`, `ProgressBar`, `InlineLoading`, `DataTable`) and IBM Carbon color tokens (`@carbon/styles`, `g100` / dark theme tokens).
   - Avoid generic ad-hoc styles when a Carbon component/token exists.
2. **Next.js App Router Conventions**:
   - Follow Next.js App Router guidelines (`app/layout.tsx`, `app/page.tsx`, client components marked with `'use client'`).
3. **SSE Connection Resilience**:
   - Always handle SSE disconnects, reconnect backoffs, and stream state reset gracefully.
4. **Verification & Build Rules (IMPORTANT - WSL Environment Preferred)**:
   - **Always Use WSL Environment**: All UI commands (type checking, docker build/up) must be executed in WSL (`/mnt/c/code/quant-v1/quant-dashboard-v1`).
   - **Verification via Type Checking**: For UI/component changes, run `npx tsc --noEmit` via WSL. DO NOT run `npm run build`.
   - **Container Rebuild (`make rebuild`)**: If and ONLY IF `npx tsc` passes with 0 errors, execute `make rebuild` in WSL.
5. **Standard WSL Command Sequence**:
   1. Check types: `wsl bash -c 'source ~/.nvm/nvm.sh && cd /mnt/c/code/quant-v1/quant-dashboard-v1 && npx tsc --noEmit'`
   2. If passes: `wsl bash -c 'cd /mnt/c/code/quant-v1/quant-dashboard-v1 && make rebuild'`
6. **Active Model Threshold & Regime Disambiguation**:
   - Radial Gauges di widget *Macro Climate & Calibrated Hurdles* wajib menampilkan **threshold efektif dari model yang sedang aktif** (`effective_buy_threshold`, `effective_sell_threshold`), bukan rumus makro global statis, agar 100% konsisten dengan angka pemicu pada tabel *Recent Signals*.
   - Selalu pertahankan pemisahan visual yang jelas antara **Microstructure Price Action** ($2/$6/$18 event clock) dan **Macro Intermarket Climate** (H1/DXY time-series).
