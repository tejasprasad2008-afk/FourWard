# @fourward/mobile 🏥

The FourWard patient and hospital companion mobile application, built with **Expo SDK 54**, **React Native 0.81**, and **TypeScript**.

## Quick Start with Expo Go

1. Install dependencies from monorepo root:
   ```bash
   npm install
   ```

2. Start the Metro bundler:
   ```bash
   npx expo start
   ```

3. Scan the terminal **QR Code**:
   - **Android**: Use the **Scan QR code** feature inside the [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) app.
   - **iOS**: Scan using the native **Camera** app, then tap **"Open in Expo Go"**.

For non-shared or restrictive networks, run:
```bash
npx expo start --tunnel
```

## Structure

- `src/app/`: Expo Router file-based route hierarchy and tab navigation.
- `src/features/`: Feature modules matching backend cells (`doctors`, `records`, `medicines`, `diet`, `maternal`, `family`, `consent`).
- `src/components/`: Design system primitives (`Text`, `Button`, `Tag`, `Sheet`, `SearchBar`) and semantic Lucide icons.
- `src/services/`: Client-side data layers, notification managers, and resilient storage.
- `src/theme/`: Design tokens, Hanken Grotesk & Bricolage Grotesque typography, and Senior UI scaling.

For complete documentation and monorepo details, see the root [README.md](../../README.md).
