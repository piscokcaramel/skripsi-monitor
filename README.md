# 📡 SkripsiMonitor

Sistem pemantauan ujian skripsi real-time berbasis **WebRTC + PWA**.  
Dua perangkat bisa saling memantau kamera & audio via data seluler — tidak perlu stay di web, cukup install sebagai PWA.

---

## 🗂️ Isi File

```
skripsi-monitor/
├── index.html       ← Aplikasi PWA (frontend)
├── server.js        ← Signaling server (WebSocket + HTTP)
├── sw.js            ← Service Worker (background notifikasi)
├── manifest.webmanifest ← Konfigurasi PWA
└── package.json     ← Dependensi Node.js
```

---

## 🚀 Cara Menjalankan Server

### 1. Install Node.js
Download di https://nodejs.org (pilih versi LTS)

### 2. Install dependensi
```bash
cd skripsi-monitor
npm install
```

### 3. Jalankan server
```bash
node server.js
```

Server berjalan di: `http://localhost:3000`

---

## 🌐 Akses dari 2 HP Berbeda (Data Seluler)

Karena dua HP menggunakan data seluler berbeda, server harus bisa diakses dari internet.  
Gunakan salah satu cara berikut:

### Cara A: ngrok (Gratis, Mudah)
```bash
# Install ngrok dari https://ngrok.com/download
ngrok http 3000
```
Salin URL yang muncul, contoh: `https://abc123.ngrok.io`  
→ WebSocket URL: `wss://abc123.ngrok.io`

### Cara B: Deploy ke Railway / Render (Gratis)
1. Buka https://railway.app atau https://render.com
2. Upload folder ini
3. Set start command: `node server.js`
4. Dapatkan URL publik → gunakan `wss://URL-ANDA`

---

## 📱 Cara Pakai di HP

### HP 1 (User A — Penguji):
1. Buka browser (Chrome/Edge) → ketuk URL server
2. Pilih **User A**, isi nama & Room ID (misal: `ujian2025`)
3. Isi Server URL: `wss://URL-SERVER-ANDA`
4. Ketuk **Hubungkan** → izinkan kamera & mikrofon
5. Ketuk **Mulai Pantau**

### HP 2 (User B — Mahasiswa):
1. Buka URL yang sama di browser
2. Pilih **User B**, isi nama & **Room ID yang sama**
3. Ketuk **Hubungkan**
4. Otomatis terhubung ke User A

---

## 📲 Install sebagai Aplikasi HP (PWA)

Agar bisa menerima notifikasi meski browser ditutup:

**Chrome Android:**
- Buka web → ketuk menu **⋮** → **"Add to Home Screen"** / **"Install App"**

**Safari iPhone:**
- Buka web → ketuk **Share** → **"Add to Home Screen"**

Setelah install, izinkan notifikasi. Notifikasi akan muncul otomatis saat:
- Partner online/offline
- Partner mengirim pesan/alert

---

## 🎮 Fitur Kontrol

| Tombol | Fungsi |
|--------|--------|
| 🎤 Mic On/Off | Aktifkan/matikan mikrofon |
| 🔊 Speaker | On/Off audio dari partner |
| 🔄 Balik Cam | Ganti kamera depan ↔ belakang |
| 📷 Kamera | Aktifkan/matikan video |
| 📞 Mulai Pantau | Mulai/hentikan video call |
| 🔔 Notif Partner | Kirim notifikasi ke partner |
| ℹ️ Info | Lihat status koneksi |
| 🔌 Keluar | Putus dari room |

---

## ⚠️ Persyaratan

- **HTTPS wajib** untuk kamera/mikrofon di HP (gunakan ngrok atau deploy ke cloud yang punya SSL)
- Browser modern: Chrome 80+, Firefox 78+, Safari 14+
- Izinkan kamera, mikrofon, dan notifikasi saat diminta

---

## 🔒 Keamanan

- Setiap room diakses dengan Room ID unik
- Tidak ada rekaman tersimpan — semua streaming langsung P2P
- Gunakan Room ID yang tidak mudah ditebak

---

## 📦 Ukuran & Performa

- `server.js` + dependensi `ws`: ~300 KB
- `index.html`: ~25 KB (all-in-one, tanpa CDN eksternal)
- `sw.js`: ~2 KB
- Total upload ke server: < 1 MB
