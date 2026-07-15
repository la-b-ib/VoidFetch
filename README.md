
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

| **Layer & Component** | **File(s)** | **Tech Stack** | **Role & Responsibilities** |
|------------------------|-------------|----------------------------|------------------------------|
| **Background Service Worker** | **background.js** | 1. **Extension API: Chrome Manifest V3**<br>2. **Networking: declarativeNetRequest**<br>3. **System APIs: Proxy API, Storage API** | 1. **Manages extension lifecycle**<br>2. **Handles declarativeNetRequest dynamic rules**<br>3. **Manages Proxy API configurations**<br>4. **Coordinates state between content scripts and Side Panel UI** |
| **UI Layer** | **index.html** | 1. **Framework: React 19**<br>2. **Build Tool: Vite 6**<br>3. **Styling: Tailwind CSS 4**<br>4. **Icons: Lucide React**<br>5. **Animations: Motion**<br>6. **Charts: Recharts**<br>7. **Language: TypeScript & JavaScript** | 1. **Hosted in Chrome Side Panel**<br>2. **Built with React 19 + Vite 6**<br>3. **Styled using Tailwind CSS 4**<br>4. **Icons via Lucide React**<br>5. **Animated visualizations with Motion + Recharts** |
| **Content Script** | **content_script.js** | <br>1. **Execution Context: Isolated World** | 1. **Secure communication bridge between background worker and DOM** |
| **Content Script (Main World)** | **injected.js** | 1. **Injection Timing: document_start** | 1. **Injected at document_start in host page**<br>2. **Runs in world: "MAIN" context**<br>3. **Strictly instruments native JS network APIs before other scripts execute** |



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
