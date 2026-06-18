# Quant Dashboard V1 (Portal)

`quant-dashboard-v1` adalah portal *frontend* berbasis **Next.js** dan **IBM Carbon UI** untuk sistem trading algoritmik Quant-V1. Dashboard ini bertindak sebagai panel kendali utama untuk memantau, melatih, dan mengelola model *Machine Learning* serta mengevaluasi strategi trading secara *real-time*.

## 🚀 Fitur Utama

- **Model & AI Lifecycle:**
  - **Routes**: Mengatur arsitektur model secara dinamis. Menetapkan *Champion* dan *Challenger* yang spesifik untuk setiap *market regime* (TREND BULL, TREND BEAR, MEAN REVERTING, VOLATILE CHOP).
  - **Train**: Memicu dan memantau status pelatihan *machine learning* (XGBoost Ensemble). Progress, metrik evaluasi Optuna, hingga jejak *log error* dikirim ke browser secara instan menggunakan *Server-Sent Events* (SSE).
  - **Registry**: Pusat penyimpanan model terlatih. Anda bisa melihat format JSON parameter secara *collapsible*, detail performa, menghapus, atau mendaftarkan model eksternal secara manual.
- **Signals & Transactions:** Memantau rekam jejak rekomendasi arah yang diberikan *Alpha Engine*, serta posisi terbuka/tertutup dari transaksi yang dieksekusi.
- **Thresholds & Analytics:** Mengatur parameter pelindung (*Kill Switch*, Stop Loss global) dan metrik rasio untung/rugi.

## 🛠️ Stack Teknologi

- **Framework:** Next.js 14/15
- **UI System:** IBM Carbon React
- **Styling:** Global SCSS dengan sentuhan estetika teknikal (Monospace font, Dark/Light neutral tones)

## 🏁 Cara Menjalankan

1. Masuk ke direktori dan install dependensi:
   ```bash
   cd quant-dashboard-v1
   npm install
   ```
2. Jalankan server *development*:
   ```bash
   npm run dev
   ```
3. Buka [http://localhost:3000](http://localhost:3000) di browser Anda. Pastikan *server* API `quant-engine-v1` sedang berjalan di port `8000` agar seluruh data termuat sempurna.
