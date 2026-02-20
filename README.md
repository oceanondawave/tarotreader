# 🔮 Mystical Tarot Reader

A beautiful, modern React web app that provides AI-powered tarot readings using Chutes.ai API. Features a complete 78-card Tarot deck with fluid animations, system dark mode support, and Google Drive integration for automatic reading storage.

## ✨ Features

- **Complete 78-Card Deck**: All 22 Major Arcana + 56 Minor Arcana cards (Wands, Cups, Swords, Pentacles)
- **Real Tarot Card Images**: Authentic Rider-Waite tarot card images for each card
- **Vietnamese Language**: Vietnamese as default language with English toggle
- **Shuffled Mystery Selection**: Cards are shuffled and hidden - you won't know which cards you're choosing until revealed
- **Interactive Card Selection**: Choose 3 face-down cards with fluid spring animations and hover effects
- **Auto-Reveal Modal**: After selecting 3 cards, a modal automatically appears with beautiful card images and question input
- **Puter.js (Gemini)**: Free AI-powered reading generation using Google's Gemini-2.0-Flash model (No API Key required)
- **Google Drive Integration**: Sign in with Google to automatically save readings to your Drive as Excel files
- **System Dark Mode**: Automatically syncs with your system's light/dark theme preference
- **Fluid UI Animations**: Spring physics-based animations for buttery smooth interactions
- **Enhanced Thinking Animation**: Mesmerizing AI thinking animation with glowing orb and radiating particles
- **Responsive Design**: Fully responsive, works beautifully on all devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- No API key required for AI readings (uses Puter.js)
- A Google Cloud Console project with Drive and Sheets APIs enabled (optional, for Google Drive integration)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

3. Add your API keys to the `.env` file:

```

VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Note**: The Google Client ID is optional and only needed for Google Drive integration. If you don't provide it, the app will work without auto-save functionality.

## 🔧 Google Drive Setup (Optional)

To enable automatic saving of readings to Google Drive:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Drive API
   - Google Sheets API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add your domain to authorized origins (for production)
6. Copy the Client ID and add it to your `.env` file as `VITE_GOOGLE_CLIENT_ID`

**Free Tier**: Google provides 1,000 Drive API requests per day for free, which is sufficient for most personal tarot apps.

### Running the App

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎴 How to Use

1. **Select 3 Cards**: Browse 78 shuffled, face-down cards and choose 3 that call to you intuitively
2. **Modal Appears**: Once you've selected 3 cards, a beautiful modal automatically appears showing your chosen cards revealed!
3. **Ask Your Question**: Enter your question directly in the modal text area
4. **Reveal The Reading**: Click "Reveal The Reading" to proceed
5. **Witness the Magic**: Watch the enhanced thinking animation as the AI consults the cards
6. **Receive Your Reading**: Get a personalized interpretation of your cards in context of your question
7. **New Reading**: Start fresh anytime with the "New Reading" button

## 🎨 Design Features

- **Vietnamese/English Support**: Full bilingual support with Vietnamese as default, easy language toggle
- **Authentic Card Images**: Real Rider-Waite tarot card images with elegant presentation
- **Vietnamese-Optimized Fonts**: Uses Noto Sans (body) and Playfair Display (headers) for excellent Vietnamese support
- **Mystery Card Backs**: All cards display face-down with mystical symbols for true intuitive selection
- **Shuffled Every Time**: Cards are randomly shuffled on each new reading
- **Elegant Modal with Images**: Cards revealed with beautiful images in 3-column grid layout
- **Adaptive Theming**: Automatically switches between light and dark mode based on system preferences
- **Spring Physics Animations**: Smooth, natural-feeling animations using Framer Motion spring transitions
- **Enhanced Particle System**: 30+ floating particles with varied timing and scales for depth
- **Staggered Card Animations**: Cards animate in with cascading effect for visual impact
- **Fluid Interactions**: Spring-based hover and tap animations on all interactive elements
- **Glowing Effects**: Dynamic pulsing glows on the AI orb and text elements
- **3D Card Reveals**: Cards flip in 3D when revealed in the reading
- **Responsive Layout**: Seamlessly adapts to all screen sizes and orientations

## 🔧 Technologies Used

- **React 18**: Modern React with hooks
- **Icons**: [Lucide React](https://lucide.dev)
- **State Management**: React Context API for language management
- **Vite**: Lightning-fast build tool and HMR
- **Framer Motion 11**: Advanced spring physics animations and gesture handling
- **Puter.js**: Bridge to access Gemini models for free (via CDN)
- **Google Drive API**: Automatic saving of readings to Google Drive as Excel files
- **Google Sheets API**: Creating and managing Excel spreadsheets with reading data
- **Rider-Waite Tarot Deck**: Authentic tarot card images
- **Noto Sans & Playfair Display**: Google Fonts optimized for Vietnamese
- **CSS Custom Properties**: Modern styling with CSS variables and system theme detection
- **CSS Media Queries**: `prefers-color-scheme` for automatic dark/light mode switching

## 📝 License

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

- ✅ Free to use for personal and non-commercial purposes
- ✅ Free to share and adapt with attribution
- ❌ Commercial use is prohibited
- ❌ Selling or monetizing this app or any derivative is not allowed

If you share or build on this project, please credit the original author: **Nguyen Minh** ([github.com/oceanondawave](https://github.com/oceanondawave)).  
For commercial licensing inquiries: **minh.ngntri@gmail.com**

## 🌟 Tips

- **Language Toggle**: Click the language button (top-right) to switch between Vietnamese and English
- **Trust Your Intuition**: Since cards are face-down, let your intuition guide your selection
- **Clear Your Mind**: Breathe deeply before selecting your 3 cards
- **No Peeking**: The mystery is part of the experience - you won't know your cards until the modal reveals them
- **Beautiful Card Images**: After selection, view authentic Rider-Waite tarot card images in the modal
- **Enter Your Question**: Type your question in Vietnamese or English in the modal
- **Theme Preference**: The app automatically matches your system's light/dark mode preference
- **Be Open**: Tarot is a tool for reflection, self-discovery, and gaining new perspectives

## 🎴 Card Deck

The app includes a complete 78-card Tarot deck:

- **22 Major Arcana**: The Fool through The World
- **14 Wands** (Fire): Energy, creativity, action
- **14 Cups** (Water): Emotions, relationships, feelings
- **14 Swords** (Air): Thoughts, conflict, intellect
- **14 Pentacles** (Earth): Material matters, money, practical concerns

---

Made with ✨ and magic
