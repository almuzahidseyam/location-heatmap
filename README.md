# Timeline Heatmap 🌍

A 100% client-side, privacy-focused visualizer for your Google Location History (Timeline). Built with Next.js, Deck.gl, and MapLibre.

![Timeline Heatmap Banner](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue.svg) ![Open Source](https://img.shields.io/badge/Open_Source-%E2%9D%A4-red.svg)

## ✨ Features

- **100% Privacy Focused:** Files are processed entirely inside your browser. No data is ever uploaded to a server.
- **Multiple Formats Supported:** 
  - Raw `Records.json`
  - Semantic Location History JSONs
  - iOS & Android on-device exports
  - Full `.zip` file from Google Takeout (drag and drop the whole ZIP!)
- **Advanced Visualizations:** 
  - Heatmap layers for visits
  - Frequency-colored path lines for routes
  - Dynamic clustering and size-scaling for popular places
- **Interactive Dashboard:** 
  - Click any "Top Place" to fly to it on the map
  - Edit place names and save them locally in your browser
  - Bar charts for Weekly & Hourly arrival patterns
- **Export:** Save your generated beautiful map as a high-quality image (`.png`).
- **Dark & Light Mode:** Seamlessly switch between themes.

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 How to Use with Your Data

1. Go to [Google Takeout](https://takeout.google.com/).
2. Deselect all, and select only **Location History (Timeline)**.
3. Export and download the `.zip` file.
4. Drag and drop the downloaded `.zip` file directly into the application! 

Alternatively, if you have a standalone `.json` timeline export, you can drop that directly too.

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Map Renderer:** [Deck.gl](https://deck.gl/) (WebGL-powered)
- **Base Map:** [MapLibre GL JS](https://maplibre.org/)
- **Charts:** [Recharts](https://recharts.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---
*Created by [Muhammad Al-Muzahid](https://github.com/almuzahidseyam).*
