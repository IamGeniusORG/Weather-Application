# 🌤️ Modern Weather Dashboard

A premium, fully-responsive weather application built with **React** and **Vite**. This project focuses on high-performance data fetching, beautiful UI/UX design, and accurate global weather forecasting.

## ✨ Features

- **Hyper-Local Forecasting**: Powered by the Open-Meteo API, pulling from world-class meteorological models (NOAA, ECMWF) without needing personal API keys.
- **Dynamic Glassmorphic UI**: Beautiful, frosted-glass design that dynamically changes its gradients based on whether it is day or night in the selected location.
- **24-Hour Interactive Chart**: A custom-built Recharts area chart that seamlessly visualizes exactly 24 hours of temperature data with weather icons embedded directly into the timeline.
- **"Time-Travel" 7-Day Forecast**: Click on any upcoming day to instantly view its exact predicted stats, including intelligent averages for wind, humidity, and "feels like" temperatures.
- **Global Search & GPS Integration**: Search for any city in the world or use your browser's Geolocation API to find the exact weather wherever you are.
- **Smart Memory System**: Recent searches are securely stored in local memory with interactive UI chips and animated smart-toast notifications upon deletion.
- **Zero Refresh Auto-Updates**: A silent background worker automatically fetches fresh data every hour so your dashboard is never out of date.

## 🚀 Technologies Used

- **React.js** (Hooks, State Management)
- **Vite** (Next-generation frontend tooling)
- **CSS Grid & Flexbox** (Fully responsive layout)
- **Recharts** (Custom interactive data visualization)
- **Lucide React** (Beautiful, crisp SVG icons)
- **Open-Meteo API** (Geocoding and Forecasting)

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/IamGeniusORG/Weather-Application.git
   ```
2. **Navigate into the directory:**
   ```bash
   cd "Weather-Application"
   ```
3. **Install the dependencies:**
   ```bash
   npm install
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔒 Privacy & Security
This application prioritizes user privacy. It does not utilize personal tracking, and does not require or store any sensitive API keys. Location memory is stored purely locally in your browser's storage and can be easily cleared.

---
*Built with simplicity, accurate logic, and professional design.*
