# VoidFetch

An enterprise-grade real-time network tracking and Data Loss Prevention (DLP) browser extension. VoidFetch provides deep visibility into browser network activity, utilizing Manifest V3 APIs to monitor, intercept, and secure data directly at the edge.

## 🚀 Features

- **Real-Time Network Tracking**: Deep inspection of all incoming and outgoing browser requests.
- **Data Loss Prevention (DLP)**: Enforce security policies and block unauthorized data exfiltration.
- **Side Panel Dashboard**: A rich, persistent React-based UI housed within the Chrome Side Panel for real-time monitoring and analytics.
- **Main World Script Injection**: Overrides and hooks into native browser APIs (`fetch`, `XMLHttpRequest`, `WebSockets`) directly in the page's main execution environment to capture obfuscated or dynamic requests.
- **Declarative Net Request**: Utilizes Chrome's MV3 highly efficient rulesets for proxying, blocking, and modifying network requests without compromising browser performance.

## 🏗️ Architecture

VoidFetch employs a modern Chrome Extension (Manifest V3) architecture:

1. **Background Service Worker (`background.js`)**:
   - Manages extension lifecycle.
   - Handles `declarativeNetRequest` dynamic rules.
   - Manages Proxy API configurations.
   - Coordinates state between content scripts and the Side Panel UI.

2. **UI Layer (React + Vite + Tailwind CSS)**:
   - Hosted in the Chrome Side Panel (`index.html`).
   - Built with React 19, styled using Tailwind CSS 4, and features animated visualizations using Recharts and Motion.

3. **Content Scripts**:
   - **Isolated World (`content_script.js`)**: Secure communication bridge between the background worker and the DOM.
   - **Main World (`injected.js`)**: Injected directly into the host page context (`world: "MAIN"`) at `document_start` to strictly instrument native JavaScript network APIs before any other scripts run.

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Animations/Charts**: Motion, Recharts
- **Language**: TypeScript / JavaScript
- **Extension API**: Chrome Manifest V3

## 💻 Development & Build Instructions

### Prerequisites
- Node.js (v20+ recommended)
- npm

### Setup
```bash
# Install dependencies
npm install
```

### Build Commands

- **Development Build**:
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  ```
- **Pack Extension**:
  Compiles the production build and creates a deployable ZIP archive (`voidfetch-extension.zip`).
  ```bash
  npm run pack
  ```

## 📦 Installation (Chrome / Edge)

To install VoidFetch locally for development or testing:

1. Build the extension using `npm run build`.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the `extension_ready` directory from this project.
   - *Alternatively, run `npm run pack` and you can distribute the resulting `voidfetch-extension.zip` file.*

## 🔒 Permissions Justification

VoidFetch requests the following permissions to function:
- `sidePanel`: To render the persistent analytics dashboard.
- `declarativeNetRequest`: To enforce DLP rules and block malicious/unauthorized network traffic dynamically.
- `proxy`: To route specific traffic through secure channels if required.
- `scripting` & `tabs`: To inject Main World trackers and communicate with active web pages.
- `storage`: To persist user settings, DLP policies, and local logs.
- `host_permissions` (`<all_urls>`): Required to monitor and protect data across all websites globally.

## 📄 License

Proprietary / Enterprise. All rights reserved.
