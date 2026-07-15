
# <samp> VoidFetch

<samP>
   
**VoidFetch is an enterprise grade MV3 extension engineered for zero-trust network observability and Data Loss Prevention (DLP). By leveraging declarativeNetRequest alongside main-world script injection, it securely hooks native transport layers (Fetch, XHR, WebSockets) to inspect dynamic payloads and block data exfiltration at the edge. Featuring a high-performance React-driven telemetry dashboard, it delivers granular, real-time traffic analysis and strict policy enforcement for modern web apps.**

<details>
  
**<summary>Project Details</summary>**

<details>

**<summary>VoidFetch Features</summary>**

- **Real-Time Network Tracking**: Deep inspection of all incoming and outgoing browser requests.
- **Data Loss Prevention (DLP)**: Enforce security policies and block unauthorized data exfiltration.
- **Side Panel Dashboard**: A rich, persistent React-based UI housed within the Chrome Side Panel for real-time monitoring and analytics.
- **Main World Script Injection**: Overrides and hooks into native browser APIs (`fetch`, `XMLHttpRequest`, `WebSockets`) directly in the page's main execution environment to capture obfuscated or dynamic requests.
- **Declarative Net Request**: Utilizes Chrome's MV3 highly efficient rulesets for proxying, blocking, and modifying network requests without compromising browser performance.

</details>

<details>

**<summary>System Architecture</summary>**


**VoidFetch employs a modern Chrome Extension (Manifest V3) architecture:**

1. **Background Service Worker (`background.js`)**:
   - Manages extension lifecycle.
   - Handles **`declarativeNetRequest`** dynamic rules.
   - Manages Proxy API configurations.
   - Coordinates state between content scripts and the Side Panel UI.

2. **UI Layer (React + Vite + Tailwind CSS)**:
   - Hosted in the Chrome Side Panel (`index.html`).
   - Built with React 19, styled using Tailwind CSS 4, and features animated visualizations using Recharts and Motion.

3. **Content Scripts**:
   - **Isolated World (`content_script.js`)**: Secure communication bridge between the background worker and the DOM.
   - **Main World (`injected.js`)**: Injected directly into the host page context (`world: "MAIN"`) at `document_start` to strictly instrument native JavaScript network APIs before any other scripts run.
  
</details>

<details>

**<summary>Tech Stack</summary>**

| **Framework** | **Build Tool** | **Styling** | **Icons** | **Animations / Charts** | **Language** | **Extension API** |
|---------------|----------------|-------------|-----------|--------------------------|--------------|-------------------|
| **React 19**      | **Vite 6**         | **Tailwind CSS 4** | **Lucide React** | **Motion, Recharts**        | **TypeScript / JavaScript** | **Chrome Manifest V3** |


</details>

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
