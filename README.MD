# Go-Vest: Monitoring and Emergency Response for Worker's Safety

**Go-Vest** adalah sistem rompi keselamatan pintar terintegrasi berbasis **AIoT (Artificial Intelligence & Internet of Things)** yang dirancang khusus untuk memonitor kesehatan, mendeteksi kecelakaan kerja (*fall detection*), serta memberikan respons darurat otomatis (*early warning system*) bagi pekerja di sektor industri berat dan pertambangan.

---
## Fitur Utama

* **Edge Machine Learning Fall Detection:** Deteksi jatuh langsung di mikrokontroler (*on-device*) menggunakan ekstraksi fitur kinematika (*jerk*, *tilt angle*, *magnitude*) dan algoritma *Decision Tree* hasil konversi Python ke C murni (0% beban library pihak ketiga).
* **Real-time Vital Sign & Gas Monitoring:** Pemantauan detak jantung (BPM), saturasi oksigen ($SpO_2$), serta deteksi kadar gas beracun/berbahaya di lingkungan kerja secara *real-time*.
* **Dual-Channel Emergency Response System:** * *Primary Channel:* Publikasi data sensor super cepat ke awan menggunakan **Secure MQTT (TLS)** via HiveMQ Cloud.
    * *Secondary/Fallback Channel:* Pengiriman SMS darurat koordinat GPS via **SIM800L** dan notifikasi otomatis WhatsApp via CallMeBot API jika koneksi internet/WiFi terputus.
* **Web Dashboard Modern:** Antarmuka pemantauan terpusat dengan peta pelacakan posisi pekerja (Leaflet), visualisasi orientasi tubuh 3D, grafik tren kesehatan, dan fitur penanganan *alert* terintegrasi.

---
## 🏗️ Arsitektur Sistem

Proyek ini dibangun menggunakan arsitektur *Monorepo* yang membagi sistem menjadi 4 komponen utama:

```text
 ┌──────────────┐      Secure MQTT (TLS)       ┌─────────────────────┐
 │  ESP32S3     | ───────────────────────────> │ MQTT Bridge Worker  │
 │  (Go-Vest)   │ <─────────────────────────── │     (Node.js)       │
 └──────────────┘         Command WA           └─────────────────────┘
        │                                                 │
        │ Fallback Channel (SMS)                          │ Insert/Realtime
        ▼                                                 ▼
 ┌──────────────┐                              ┌─────────────────────┐
 │ Worker/Admin │                              │  Supabase Database  │
 │  Smartphone  │ <─────────────────────────── │  (Postgres Cloud)   │
 └──────────────┘      Realtime Subscription   └─────────────────────┘
                                                          ▲
                                                          │ NextJS Data Fetch
                                                          ▼
                                               ┌─────────────────────┐
                                               │    Web Dashboard    │
                                               │      (Next.js)      │
                                               └─────────────────────┘
```
---
## Struktur Repository

GO-VEST
├── edge-ml/                  # Pipeline Machine Learning (Python)
│   ├── data/                 # Folder tempat dataset
│   ├── output/               # Ekstraksi model & visualisasi metrik 
│   └── scripts/              # Skrip pemrograman Python untuk ML Pipeline
│       ├── preprocessing.py    # Ekstraksi fitur (sliding window, jerk, tilt)
|       ├── labelling_splitting.py # Pelabelan data (Fall vs ADL) & subject-wise splitting
│       ├── traindecisiontree.py  # Proses melatih model & evaluasi metrik Gini
│       └── convert_tree_to_c.py  # Ekstraktor struktur tree menjadi fungsi C murni
├── hardware/                 # Firmware Mikrokontroler
│   ├── Go-Vest_Fase2.ino     # Kode utama ESP32S3 dengan sensor, TLS, & MQTT Client
│   └── fall_decision_tree.h  # Hasil konversi pohon keputusan AI berbentuk kode if-else C
├── mqtt-bridge/              # Worker Penghubung (Node.js)
│   ├── index.js              # Subscriber MQTT & parser data masuk ke Supabase
│   └── package.json
└── web-dashboard/            # Dashboard Monitoring (Next.js + Tailwind)
    ├── src/app/              # Halaman & API routing dashboard
    ├── src/components/       # Komponen visual (Peta Leaflet, Grafik Chart)
    └── src/lib/              # Handler Supabase client & tipe data TypeScript

---
## Teknologi & Spesifikasi Komponen

Hardware & Sensor
1. Mikrokontroler: ESP32-S3
2. Sensor Kinematika: MPU6050 (Akselerometer & Giroskop)
3. Sensor Kesehatan: MAX30105 (Oksimetri & Detak Jantung)
4. Sensor Lingkungan: MQ135 (Kualitas Udara & Gas Berbahaya)
5. Telekomunikasi: GPS Neo-6M & Modul GSM SIM800L
6. Aktuator: Active Buzzer 5V

Perangkat Lunak & Cloud
1. Cloud MQTT Broker: HiveMQ Cloud (Mendukung Enkripsi TLS Port 8883)
2. Backend & Database: Supabase (PostgreSQL dengan Realtime Replication)
3. Frontend Framework: Next.js 14 (App Router) dengan TailwindCSS
4. Bridge Service: Node.js MQTT Client berjalan pada long-running instance

