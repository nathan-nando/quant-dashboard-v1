# Quant Dashboard V1 (Portal)

`quant-dashboard-v1` adalah portal *frontend* berbasis **Next.js** dan **IBM Carbon UI** untuk sistem trading algoritmik Quant-V1. Dashboard ini bertindak sebagai panel kendali utama yang ditenagai oleh layout *draggable* interaktif.

## Fitur Utama

- **Real-Time Market Data & Charting:**
  - Terintegrasi dengan **Lightweight Charts** by TradingView.
  - Memiliki fitur lanjutan seperti **Chart Markers Toggle** untuk menyorot eksekusi transaksi (Buy/Sell) langsung di atas grafik secara presisi.
  - Tampilan sinyal yang mendukung **Fullscreen Mode** untuk fokus pada *price action*.
- **Draggable & Resizable Grid:** Didukung oleh `react-grid-layout`, pengguna dapat memodifikasi susunan panel *dashboard* secara interaktif sesuai preferensi.
- **Model & AI Lifecycle:**
  - Mengatur arsitektur model (*Champion* vs *Challenger*) untuk setiap rezim (TREND BULL, TREND BEAR, MEAN REVERTING).
  - Melacak log performa, Win Rate, PnL berjalan, hingga *Concept Drift* metrics.
- **Analytics & History:** Visualisasi untung rugi historis, *latency* eksekusi sistem, dan jejak aktivitas (*Audit Logs*).

## Stack Teknologi

- **Framework:** Next.js (App Router)
- **UI System:** IBM Carbon React
- **Charting:** Lightweight Charts
- **Layouting:** React Grid Layout
- **Styling:** Global SCSS dengan estetika teknikal industrial.

## Cara Menjalankan

1. Masuk ke direktori dan install dependensi:
   ```bash
   npm install
   ```
2. Jalankan server *development*:
   ```bash
   npm run dev
   ```
3. Buka [http://localhost:3000](http://localhost:3000) di browser Anda. Pastikan *server* API `quant-engine-v1` sedang berjalan di port `8000` agar koneksi SSE (Server-Sent Events) bekerja maksimal.
