# Employee Attendance Scanner (Static Frontend)

A production-ready static frontend for a QR Attendance and Timekeeping System that connects to an existing Google Apps Script backend and can be deployed directly to GitHub Pages.

## Overview

This project includes:
- **QR Scanner page** using webcam input (via CDN QR library)
- **Dashboard page** for today's attendance records and live refresh
- **Reports page** for per-employee summaries with CSV export and print support
- Shared, reusable **API utility** and **configuration** layer

Backend base URL used by all pages:

`https://script.google.com/macros/s/AKfycbxvvUbLPMztKa-i7AnDTbtODDIUgAhf8xh3TWZNB4JLNRFbrTslN7t0r-fBbVNy9P8/exec`

## File structure

```text
.
├── index.html
├── scanner.html
├── dashboard.html
├── reports.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   ├── api.js
│   ├── scanner.js
│   ├── dashboard.js
│   └── reports.js
└── README.md
```

## Why `html5-qrcode` (CDN)

The scanner uses `html5-qrcode` from CDN because it is:
- lightweight and mature for static frontends
- easy to integrate without a build process
- compatible with webcam-based scanning workflows

## Deployment to GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Repo Settings → Pages**.
3. Set source to your branch (for example `main`) and root (`/`).
4. Save, then open your published GitHub Pages URL.

No additional build step is required.

## Backend URL configuration

Edit `js/config.js` and update `API_BASE_URL` if backend URL changes.

Optional config values there:
- `DEVICE_NAME`
- `LOCAL_SCAN_COOLDOWN_MS`
- `DASHBOARD_REFRESH_MS`

## Notes / known limitations

- Camera access requires HTTPS (GitHub Pages provides HTTPS).
- Browser camera permission must be granted for scanner usage.
- Actual response payload keys from Apps Script may vary; frontend includes defensive fallback mapping.
- Browser autoplay policies may affect scan feedback sounds until user interacts with the page.
