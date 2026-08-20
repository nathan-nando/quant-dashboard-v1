# Quant Dashboard V1 (Portal Kontrol Visual & Telemetri Real-Time)

`quant-dashboard-v1` adalah antarmuka visual berbasis **Next.js (App Router)** dan **IBM Carbon Design System** untuk mengendalikan, memantau, dan menganalisis operasional ekosistem trading kuantitatif **Quant-V1**.

---

## 🌟 Fitur Utama Dashboard

### 1. ⚡ Event-Driven Price Engine Monitor
* **Current Range Progress:** Menampilkan status pembentukan Range Bar aktif `[$X.XX / $1.50] (0% - 100%)`.
* **Telemetry Metrics:** Live *Price Velocity* (\$/detik), *Bar Duration* (detik), *Streak Direction*, dan frekuensi tick.
* **Bar Velocity Momentum Sparkline:** Visualisasi batang kecepatan 8 bar terakhir untuk mendeteksi akselerasi (**`▲ Accelerating`**) atau deselerasi (**`▼ Decelerating`**) momentum.
* **Pyramiding Scale-In State:** Visualisasi status keputusan 4 layer (**`L1 Base`**, **`L2 Add`**, **`L3 Waiting`**, **`L4 Cap`**), rata-rata harga klaster, dan level penguncian *Dynamic Trailing Stop*.

### 2. 📊 Pure Range Bar Charting & Multi-View Context
* **Range Bar Candlestick:** Grafik candlestick berbasis pergerakan harga diskret (\$1.50) murni via **Lightweight Charts**.
* **Event Overlays:** Penanda pin eksekusi langsung di atas grafik (`ENTRY`, `+P2`, `+P3`, `+P4`, `TRAIL`).
* **Multi-View Context Timeframes:** Pilihan tampilan instan:
  * **`RANGE ($1.50)`**: Struktur eksekusi event-driven.
  * **`M1 (Micro)`**: Aksi harga mikro intraday.
  * **`M5 (Intraday)`**: Struktur pasar intraday.
  * **`H1 (Macro Context)`**: Konteks tren makro.

### 3. 🌐 Macro Soft-Switching & Regime Detection
* Visualisasi status rezim ekonomi makro (*Strong Bullish, Moderate Bullish, Neutral Sideways, Moderate Bearish, Strong Bearish*).
* Tampilan dinamis ambang batas probabilitas BUY / SELL yang menyesuaikan otomatis dengan bias makro.

### 4. 💼 Multi-Broker & Account Workspace
* Kemudahan berpindah antara akun **MetaTrader 5 (Live/Demo)** dan **Paper Trading Sandbox (\$50,000.00)**.
* Ringkasan saldo, ekuitas, margin, drawdown, serta riwayat transaksi live.

### 5. 🎛️ Dynamic Thresholds & Model Governance
* Halaman pengaturan ambang batas probabilitas AI secara interaktif.
* Pemantauan model AI (*Champion / Challenger*), metrik *Feature Drift* (PSI/KS), dan *Explainability* (SHAP).

---

## 🛠️ Stack Teknologi

- **Framework:** Next.js (React 18, App Router)
- **Design System:** IBM Carbon React (`@carbon/react`, `@carbon/icons-react`)
- **Charting:** Lightweight Charts by TradingView
- **Layouting:** React Grid Layout
- **Real-Time Stream:** Server-Sent Events (SSE)

---

## 🚀 Cara Menjalankan

1. **Instal Dependensi:**
   ```bash
   npm install
   ```
2. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
3. Buka **`http://localhost:3000`** di browser Anda.
