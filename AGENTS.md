ARCHITECTURE: modular monolith, "spine and cells". TypeScript strict everywhere.

Monorepo:
  apps/mobile            Expo app; features/<cell>/ mirrors backend cells
  apps/api               NestJS; src/spine/ and src/cells/<cell>/
  packages/contracts     Zod schemas + shared types (the only thing cells share)
  services/ml            Python (anomaly detection, diet) behind internal API
  docs/adr/              one short decision record per architectural choice

Spine (src/spine): auth, tenancy (hospital_id + Postgres RLS), consent engine,
audit ledger (hash-chained, append-only), event bus, assistant + tool registry,
cell registry, health/kill-switch.

Cell template (src/cells/<name>): manifest.ts (routes, permissions, events,
assistant tools), api/, domain/, db/ (own tables/schema), tests/, README.md.

RULES
- A cell never imports another cell. It talks via spine events or contracts.
- Cells never read other cells' tables.
- Every request passes spine authorisation; no client-side-only checks.
- Assistant tools come only from cell manifests and run with the calling
  user's permissions, never a service account.
- Every cell exposes /health and writes logs tagged with its name.
- Contract-first: change packages/contracts, then the cell, then the app.
- Work on one cell per task. Add tests (contract + permission) with each cell.
- Vendor/lab integrations live in adapter cells that map to FHIR R4.
- Enforce boundaries with lint (eslint-plugin-boundaries or Nx module rules).

First task: scaffold this structure, the cell template, one example cell
(availability) end to end, and the lint boundary rule. Don't build other cells yet.

You are building FourWard, a hospital mobile app for India (patients + hospital staff).
Stack: Expo (React Native) + TypeScript, Expo Router, Zustand, TanStack Query.
Backend (separate repo): FastAPI + PostgreSQL. No secrets in the app.

PRODUCT PRIORITIES (from our review panel):
1. Navigation first. Every feature must be reachable within 2 taps from anywhere.
   Bottom tab bar (5 tabs) + a Home screen showing all features as tiles + a
   global search bar.
2. A floating assistant (chat + voice) that can operate the whole app for the
   user. It proposes actions; the user must Accept or Dismiss, or edit by typing
   or speaking. Only after Accept does anything happen.

FEATURES (9): symptom triage + doctor match, records & documents, prescriptions/
reminders/medicine cart, live hospital availability, diet tracker, family access,
maternal care, security/audit, OTP-gated consultation access. Also an Elderly UI
mode (large text, simpler navigation).

DESIGN RULES (non-negotiable):
- All colours, fonts, spacing, radii live in src/theme/tokens.ts. Never hardcode.
- Flat colour blocks and 1px borders. No gradients, no glow, no blur/glass,
  no translucent text backgrounds, no neon, no purple/blue-violet anywhere.
- Max corner radius 12. Buttons radius 8. No pill buttons. Only the assistant
  button is a circle.
- No cards inside cards. No icon-in-rounded-square above headings. No emoji as
  icons (use one icon set, Lucide). No pulsing dots or decorative badges.
- Fonts: Hanken Grotesk (body), Bricolage Grotesque (headings). Never Inter.
- Left-aligned, uneven, content-driven layouts. Dense like a real utility app.
- Every screen needs loading, empty, and error states.
- Copy: plain, specific, short. Never "streamline/empower/seamless/supercharge".
- Sample data: realistic Indian names, doctors, hospitals, uneven numbers
  (e.g. 14 beds, 37 min wait). No "John Doe", no round numbers.
- Touch targets >= 48dp (>= 56dp in Elderly mode). Support Telugu/Hindi fonts.

COPY RULES:
- Users never see how the app works inside. Never show: sorted, tracked,
  version, ledger, hash, audit, anomaly, enforced, immutable, time-boxed,
  OTP-gated, "smart", "auto-", "AI-powered".
- Each screen: header = the feature name, then at most ONE short line, or none.
  Buttons are 1 to 3 word verbs. Sentences up to 8 words, plain words,
  sentence case, no ALL CAPS labels, no "▪" separators inside titles.
- No badges that advertise features (remove "Smart Match", "Auto-Sorted",
  "OTP Gated" and any like them). Tags only for real status.
- Never claim what the app can't prove. Remove "Zero unauthorized access
  attempts", "Auto-Revocation Guarantee" and similar.
- Mock data: use fictional hospital, pharmacy and doctor names.

SAFETY RULES:
- The app never diagnoses. Triage only routes to a department.
- If symptoms suggest an emergency, show an emergency message (call 108) first.
- Access to patient records only through the consent flow; no client-side-only checks.

Work in small steps, run the app, and show me what changed after each step.

Colour scheme:



Background
warm paper #F7F4EE
Surface
white #FFFFFF
Text
near-black green #17201E
Muted text
#5C6663
Primary
deep teal-green #0E6B5C
Assistant button and highlights
marigold #F0A202
Danger only
#C2392B
Borders
#E3DED3

