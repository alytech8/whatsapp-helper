# WhatsApp Helper PWA
### by Aly Tech · Mohamed Aly Radwan

> أداة الإرسال الذكي للواتساب — إرسال جماعي آمن مع مكافحة الحظر

---

## 📁 File Structure

```
/
├── public/
│   ├── icon.png          ← Main icon (512×512 — REQUIRED)
│   ├── icon-48.png
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-192.png
│   ├── icon-256.png
│   ├── icon-512.png
│   ├── manifest.json     ← PWA manifest
│   └── sw.js             ← Service Worker
├── src/
│   ├── main.jsx          ← React entry point
│   └── WhatsAppHelper.jsx ← Main app component
└── index.html
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm create vite@latest wa-helper -- --template react
cd wa-helper
npm install
```

### 2. Copy files
- Place `WhatsAppHelper.jsx` → `src/WhatsAppHelper.jsx`
- Place `manifest.json`     → `public/manifest.json`
- Place `sw.js`             → `public/sw.js`
- Place `index.html`        → `index.html` (root)

### 3. Update src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import WhatsAppHelper from './WhatsAppHelper'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WhatsAppHelper />
  </React.StrictMode>
)
```

### 4. Add your icon
Place a **512×512 PNG** icon at:
```
public/icon.png
public/icon-192.png
public/icon-512.png
```
All other sizes will be referenced from manifest.json.
Use [https://favicon.io](https://favicon.io) to generate all sizes from one image.

### 5. Run locally
```bash
npm run dev
```

### 6. Build for production
```bash
npm run build
```

---

## 🚀 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) for auto-deploy.

**Vercel config** (vercel.json):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" }
      ]
    }
  ]
}
```

---

## 🛡 Privacy & Security

- **100% local storage** via IndexedDB — no server, no cloud
- Works **offline** after first load (Service Worker)
- No external API calls — only WhatsApp deep links
- All data stays on the user's device

---

## 🔧 IndexedDB Stores

| Store       | Key      | Purpose                        |
|-------------|----------|--------------------------------|
| `contacts`  | `id`     | All contact records            |
| `lists`     | `id`     | Contact lists / groups         |
| `settings`  | `id`     | App preferences, message, theme|

---

## 📱 Features Summary

| Feature                    | Status |
|---------------------------|--------|
| IndexedDB persistent storage | ✅ |
| Dark / Light mode with persistence | ✅ |
| Create / Edit / Delete contacts | ✅ |
| Multiple contact lists | ✅ |
| Bulk CSV import | ✅ |
| Egypt phone sanitization (20) | ✅ |
| Spintax message rotation | ✅ |
| 3 message version alternates | ✅ |
| Random delay between sends | ✅ |
| Anti-ban break with countdown | ✅ |
| WhatsApp Basic + Clone support | ✅ |
| PWA installable (manifest + SW) | ✅ |
| Install prompt banner | ✅ |
| Ad banner area | ✅ |
| Offline-first Service Worker | ✅ |
| Arabic RTL UI | ✅ |
| Cairo font | ✅ |

---

## 👨‍💻 Developer

**Mohamed Aly Radwan**  
مطور ومصمم تطبيقات ويب  
📞 01227220268  
📧 mohammedaly502@yahoo.com

---

*صُنع بـ ❤️ في مصر · © 2026 Aly Tech*
