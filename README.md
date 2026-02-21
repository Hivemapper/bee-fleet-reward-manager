# Bee Fleet Rewards Dashboard

A web dashboard for Hivemapper fleet managers to monitor their dashcam fleet, track HONEY token rewards, and view driver locations.

## Features

- **Fleet Overview** — View all devices in your fleet with driver names, locations, device IDs, current week's HONEY rewards, and mount ratings
- **Driver Detail** — Click any driver to see their 12-week HONEY rewards history with weekly breakdowns
- **Location Tracking** — GPS coordinates are automatically reverse-geocoded to city/state for readability
- **Device ID Privacy** — Device serial numbers are masked by default with a toggle to reveal
- **Mount Rating Badges** — Color-coded badges indicate dashcam mount quality (green = good, yellow = fair, red = poor)
- **API Key Management** — Configure your Bee Maps API key through the Settings page, stored securely server-side

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A Bee Maps API key (see below)

## Getting Your API Key

1. Go to [beemaps.com/login](https://beemaps.com/login) and sign in to your fleet account
2. Navigate to [beemaps.com/settings/fleets/integrations](https://beemaps.com/settings/fleets/integrations)
3. Click **Generate Key** to create a new API key
4. Copy the key — you'll enter it in the dashboard Settings page

## Setup

```bash
# Install dependencies
npm install

# Start the development server (runs both backend and frontend)
npm run dev
```

This starts:
- **Backend API proxy** on `http://localhost:3001`
- **Vite dev server** on `http://localhost:5173`

Open `http://localhost:5173` in your browser. On first launch you'll be prompted to enter your API key in Settings.

## Production Build

```bash
npm run build
npm run preview
```

## Architecture

```
├── server/
│   └── index.js          # Express API proxy to Bee Maps API
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx  # Fleet table with driver list
│   │   ├── DriverDetail.jsx # 12-week rewards history per driver
│   │   └── Settings.jsx   # API key configuration
│   ├── components/ui/     # UI components (Button, Card, Table, etc.)
│   ├── App.jsx            # App shell with navigation
│   └── main.jsx           # Entry point
└── public/
    └── logo.png           # App logo
```

The backend server proxies requests to the [Bee Maps API](https://api.trybeekeeper.ai/v1) so that your API key is never exposed to the browser. Location coordinates are reverse-geocoded via OpenStreetMap Nominatim.
