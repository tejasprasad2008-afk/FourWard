<p align="center">
  <img src="assets/images/brand/logo-lockup.png" width="300" alt="FourWard Hospital App" />
</p>

<p align="center">
  <strong>Next-Generation Hospital OPD & Patient Companion for India</strong><br />
  <em>Modular Monolith Architecture · Offline-First · Bilingual & Senior Accessible</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-0E6B5C?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000000?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Architecture-Spine%20%26%20Cells-F0A202?style=flat-square" alt="Spine and Cells" />
  <img src="https://img.shields.io/badge/License-Proprietary-gray?style=flat-square" alt="License" />
</p>

---

## 📋 Table of Contents
- [About FourWard](#-about-fourward)
- [Key Features](#-key-features)
- [Quick Start: Run with Expo Go](#-quick-start-run-with-expo-go)
  - [Step 1: Download Expo Go](#step-1-download-expo-go-on-your-phone)
  - [Step 2: Install Project Dependencies](#step-2-install-project-dependencies)
  - [Step 3: Start the Development Server](#step-3-start-the-development-server)
  - [Step 4: Scan the QR Code](#step-4-scan-the-qr-code)
  - [Troubleshooting & Tunnel Mode](#troubleshooting--tunnel-mode)
- [Monorepo Architecture](#-monorepo-architecture)
- [Design System & Accessibility](#-design-system--accessibility)
- [Verification & Quality Checks](#-verification--quality-checks)

---

## 🏥 About FourWard

**FourWard** is a utility-first hospital mobile application tailored specifically for the Indian healthcare ecosystem. Built for patients, caregivers, and hospital OPD staff, FourWard prioritizes navigation density, swift appointment booking, transparent live token status, and complete offline resilience.

- **2-Tap Navigation**: Bottom navigation bar (5 primary tabs) + instant access tiles + unified global search.
- **Safety First**: Emergency triage routing with 108 ambulance prompt; never performs speculative medical diagnosis.
- **Privacy & Consent**: Spine-governed hash-chained audit logging and patient-controlled caregiver delegation.
- **Accessible by Default**: Built-in **Senior UI Mode** with enlarged touch targets ($\ge 56\text{dp}$), high contrast, clamped typography, and vernacular language readiness (Telugu, Hindi, and English).

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **Symptom Triage & OPD Matching** | Rule-driven symptom intake routing directly to relevant hospital departments with emergency triage filters. |
| **Doctor Consultations & Live Queue** | Doctor directory with government health scheme tags (`Aarogyasri`, `PM-JAY`, `CGHS`), live `"In clinic"` tags, and `"Now serving token #N"` queue counters. |
| **Records & Documents Locker** | Clinical records filed by problem folders with doctor sharing, instant review sheets, and offline storage. |
| **Prescriptions & Pharmacy Cart** | Per-medicine visual classification (`strip`, `bottle`, `syrup`, `inhaler`, `drops`), dosage reminders, and doorstep / hospital counter pickup cart. |
| **Regional Diet Tracker** | Regional Indian meal nutrition logs (South Indian, North Indian, Diabetic, Hypertensive) with calorie tracking and instant meal chips. |
| **Family & Caregiver Access** | Multi-profile patient switching with granular approval gates and revocation tracking. |
| **Maternal & Child Health** | National Immunization Schedule (NIS) milestone tracker and gestational health monitors. |
| **Floating Health Assistant** | Proposal-first chat assistant capable of searching doctors, prefilling appointments, logging meals, and refilling prescriptions—requiring explicit user acceptance before any action is executed. |
| **Consultation Check-in** | Secure 6-digit nurse consultation code validation with haptic feedback and smooth confirmation animations. |

---

## 📱 Quick Start: Run with Expo Go

You can run FourWard directly on your physical Android or iPhone device without installing Android Studio or Xcode.

### Step 1: Download Expo Go on Your Phone

Install the free **Expo Go** app from your device's official app store:

<table>
  <tr>
    <td align="center" width="50%">
      <a href="https://play.google.com/store/apps/details?id=host.exp.exponent">
        <strong>Android (Google Play Store)</strong><br />
        <img src="https://img.shields.io/badge/Google_Play-Download-0E6B5C?style=for-the-badge&logo=google-play&logoColor=white" alt="Download on Google Play" />
      </a>
    </td>
    <td align="center" width="50%">
      <a href="https://apps.apple.com/app/expo-go/id982107779">
        <strong>iOS (Apple App Store)</strong><br />
        <img src="https://img.shields.io/badge/App_Store-Download-0E6B5C?style=for-the-badge&logo=apple&logoColor=white" alt="Download on App Store" />
      </a>
    </td>
  </tr>
</table>

### Step 2: Install Project Dependencies

Make sure you have **Node.js (v20+)** installed on your computer. Clone this repository and install all workspace packages:

```bash
git clone git@github.com:tejasprasad2008-afk/FourWard.git
cd FourWard
npm install
```

### Step 3: Start the Development Server

Launch the Metro development server:

```bash
npm --workspace=@fourward/mobile start
```

*(Alternatively, change into the mobile directory: `cd apps/mobile && npx expo start`)*

This starts the Expo CLI and displays a large, interactive **QR code** directly inside your terminal window, alongside local keyboard shortcuts.

### Step 4: Scan the QR Code

Make sure your phone and computer are connected to the **same local Wi-Fi network**.

- **On Android**:
  1. Open the **Expo Go** app.
  2. Tap **"Scan QR code"** on the home screen.
  3. Point your camera at the QR code displayed in your computer terminal.

- **On iPhone (iOS)**:
  1. Open the native **Camera** app.
  2. Point your camera at the terminal QR code.
  3. Tap the yellow **"Open in Expo Go"** banner notification that appears on top.

The app bundle will download, build its cache, and open FourWard instantly on your phone with live Fast Refresh!

---

### 💡 Troubleshooting & Tunnel Mode

If the QR code fails to connect or your computer is on a restricted network / guest Wi-Fi:

1. **Use Tunnel Mode**:
   Run with the `--tunnel` flag, which exposes a secure tunnel that works across different networks and cellular data:
   ```bash
   cd apps/mobile && npx expo start --tunnel
   ```
2. **Clear Metro Cache**:
   If you make dependency or asset changes:
   ```bash
   cd apps/mobile && npx expo start -c
   ```
3. **Run on Web**:
   To preview directly in your browser:
   ```bash
   cd apps/mobile && npx expo start --web
   ```

---

## 🏛 Monorepo Architecture

FourWard follows a strict **"Spine & Cells"** modular monolith pattern:

```text
FourWard/
├── apps/
│   ├── mobile/              # Expo React Native mobile application
│   │   ├── assets/          # Compressed WebP tiles, brand logos & video assets
│   │   ├── src/
│   │   │   ├── app/         # Expo Router file-based routes & tabs
│   │   │   ├── components/  # Primitives (Text, Button, Tag, Sheet) & Lucide icons
│   │   │   ├── features/    # UI feature screens (doctors, records, medicines, diet)
│   │   │   ├── services/    # Storage resilience, family, notifications, and triage
│   │   │   └── theme/       # Central design tokens, scaling & Senior mode
│   └── api/                 # NestJS backend API
│       └── src/
│           ├── spine/       # Auth, tenancy, audit ledger, and assistant registry
│           └── cells/       # Isolated domain cells (doctors, medicines, records, etc.)
├── packages/
│   └── contracts/           # Shared TypeScript types and Zod boundary schemas
├── scripts/                 # Design verification & test suites
└── docs/                    # Architectural decision records (ADRs)
```

### Architectural Guardrails
1. **Cells never import other cells**: Communication happens exclusively through contracts or spine events.
2. **No hardcoded secrets**: Mobile app relies entirely on spine-governed session authentication.
3. **Storage Resilience**: Local data uses a robust memory fallback mechanism to ensure the app never crashes even if native storage fails.

---

## 🎨 Design System & Accessibility

FourWard adheres to strict clinical design principles defined in `src/theme/tokens.ts`:

- **Curated Palette**:
  - Warm Paper (`#F7F4EE` background)
  - Surface White (`#FFFFFF`)
  - Near-Black Green (`#17201E` ink)
  - Deep Teal (`#0E6B5C` primary brand)
  - Marigold (`#F0A202` highlights & assistant)
  - Deep Crimson (`#C2392B` danger/emergencies only)
- **Geometry**: Flat color blocks with 1px borders (`#E3DED3`). Max corner radius 12; buttons radius 8. No glassmorphism, no neon glows, and no pill buttons.
- **Typography**: `Bricolage Grotesque` for headings, `Hanken Grotesk` for body copy. Clamped font multipliers prevent visual overflow on accessibility devices.
- **Iconography**: Single semantic Lucide icon system (22dp standard, 26dp senior mode).

---

## 🧪 Verification & Quality Checks

Run the automated test and integrity suites before committing:

```bash
# 1. Verify strict design token and styling integrity
npm run check:design

# 2. Typecheck both mobile and API workspaces
npm run typecheck

# 3. Execute the 48-point system test suite
npm test

# 4. Test production bundling
cd apps/mobile && npx expo export --platform android
```

---

<p align="center">
  Crafted with care for Indian healthcare utility · <strong>FourWard</strong>
</p>
