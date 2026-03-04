# Daawat-e-Ramzaan 2026 — Official App

<p align="center">
  <img src="public/der-logo.svg" alt="Daawat-e-Ramzaan Logo" width="180" />
</p>

<p align="center">
  <strong>Season 5 · Hyderabad</strong><br/>
  <em>Shop. Indulge. Immerse.</em>
</p>

---

## About

**Daawat-e-Ramzaan** is Hyderabad's grandest Ramzaan cultural festival experience — a 15-day celebration combining food, arts, culture, shopping, and immersive experiences across 3 venues.

This is the official Progressive Web App (PWA) built for the 2026 edition, designed to be the single digital touchpoint for attendees: from real-time Iftar/Suhoor countdowns to vendor discovery and event tickets.

---

## Features

| Feature | Status |
|---|---|
| Animated splash screen with sponsors | ✅ |
| Live Ramadan Timetable (Suhoor & Iftar countdown) | ✅ |
| Announcements / Updates feed | ✅ |
| Admin panel for announcements | ✅ |
| Crescent Bazaar vendor directory | ✅ |
| Venue map & wayfinder | ✅ |
| Uber partner deep-link (50% off offer) | ✅ |
| Ticket booking (Shaan-E-Ramzan Immersive Zones) | ✅ |
| Sponsor showcase | ✅ |
| Instagram community link | ✅ |

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: JAFHerb (custom), Outfit, Playball (Google Fonts)
- **Deployment**: AWS EC2 + PM2 + Nginx (standalone output)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
```

The build output is `standalone` — optimised for EC2 deployment.

---

## Deployment (AWS EC2)

1. SSH into your EC2 instance
2. Clone this repository
3. Run the deploy script:

```bash
chmod +x deploy.sh
./deploy.sh
```

This will install dependencies, build the app, and start/reload it via **PM2** on port 3000.

4. Point Nginx to port 3000:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ADMIN_PASSWORD` | `ramzaan2026` | Password for the `/admin` announcements panel |
| `PORT` | `3000` | Port for PM2 to bind to |

Set these in `ecosystem.config.js` or as system environment variables before running.

---

## Admin Panel

Navigate to `/admin` and enter the admin password to:
- Add new announcements (with type, venue, time, priority)
- Delete existing announcements
- Changes are immediately reflected on the `/updates` page

---

## Ramadan Timetable

Timetable data for all 29 days of Ramadan 1447 (Feb–Mar 2026) is stored in `data/timetable.json`.  
The homepage widget auto-detects today's day and shows a live countdown to the next Suhoor or Iftar.

> Times are based on **Hyderabad (Hanafi)** calculation method.

---

## Sponsors

| Tier | Sponsor |
|---|---|
| Title Sponsor | Ahmed Al Maghribi |
| Powered By | Priya Foods, Telangana Tourism |
| Associate Sponsors | SBI, Farmaan, Gold Drop |
| Jewellery Partner | Heerabhai |
| Mobility Partner | Uber |

---

## Project Structure

```
der-2026/
├── app/
│   ├── page.tsx              # Homepage
│   ├── updates/page.tsx      # Announcements feed
│   ├── bazaar/page.tsx       # Vendor directory
│   ├── map/page.tsx          # Venue map
│   ├── tickets/page.tsx      # Ticket booking
│   ├── admin/page.tsx        # Admin panel
│   └── api/announcements/    # Announcements API
├── components/
│   ├── brand-elements.tsx    # Splash screen, icons, decorations
│   ├── layout-components.tsx # Navbar, BottomNav, PageContainer
│   ├── timetable-card.tsx    # Suhoor/Iftar countdown widget
│   └── feature-cards.tsx     # Vendor & Event cards
├── data/
│   ├── announcements.json    # Live announcements store
│   ├── timetable.json        # Ramadan 1447 prayer times
│   └── vendors.json          # Bazaar vendor data
├── public/
│   ├── der-logo.svg          # Official DER logo
│   ├── fonts/                # JAFHerb custom font
│   └── *.svg / *.png         # Sponsor logos
├── ecosystem.config.js       # PM2 config for EC2
└── deploy.sh                 # EC2 deployment script
```

---

## License

Private — Extraa Media Events LLP. All rights reserved.
