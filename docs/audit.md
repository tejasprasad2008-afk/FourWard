# FourWard Codebase Audit

**Date**: 2026-10-18  
**Scope**: Normal mode (Senior UI untouched)  
**Standard**: AGENTS.md, docs/FourWard_v2.pdf, WCAG 2.1 AA  

---

## 1. REALITY CHECK

### Q1. Reality Matrix
| Feature | What is Real | What is Mocked | Status |
| :--- | :--- | :--- | :--- |
| **Doctors** | UI layout, SearchBar text state, Call 108 emergency card | 4 hardcoded doctor rows, queue wait times, toggle boolean for symptoms | Screen with mock data & dead actions |
| **Records** | FeatureErrorBoundary wrapper, header styling | 4 static list rows (Lipid Profile, Cardiac Echo, Discharge, Checklist), fake "Upload report" action | Screen with no behavior (FeatureScreenStub) |
| **Medicines** | SearchBar text state, Single Cart Summary linking to `/features/cart`, price text overflow protection | Next dose banner, 3 active prescription rows, cart items, static ₹284 amount | Screen with mock data & navigation only |
| **Hospital Status** | FeatureErrorBoundary wrapper, header styling | 4 static list rows (Cardiology OPD, Emergency Beds, General Ward, Blood Collection), fake "Ask hospital desk" action | Screen with no behavior (FeatureScreenStub) |
| **Diet** | FeatureErrorBoundary wrapper, header styling | 4 static list rows (Breakfast, Lunch, Snack, Daily target kcal), fake "Log meal" action | Screen with no behavior (FeatureScreenStub) |
| **Family** | FeatureErrorBoundary wrapper, header styling | 3 static list rows (Son, Spouse, Permissions), fake "Add member" action | Screen with no behavior (FeatureScreenStub) |
| **Maternal Care** | FeatureErrorBoundary wrapper, header styling | 4 static list rows (Trimester review, Tetanus, Newborn vaccines, Yellow card), fake "View schedule" action | Screen with no behavior (FeatureScreenStub) |
| **Check-in** | 6-digit PIN input with focus/paste/auto-submit, shake animation, success screen with spring checkmark and 24 confetti particles, contract attempt decrementing & lockout stub | Doctor and room text, client-side attempt tracking, fallback to local stub when API is offline | Partial (interactive frontend flow + local contract stub) |

- **Answer**: Only Check-in has real interactive state transitions (shake, PIN input, confetti, contract stub). Doctors and Medicines have interactive search/cart navigation but render static lists and dead buttons. Records, Hospital Status, Diet, Family, and Maternal Care are non-functional placeholder screens rendering a static stub.
- **Evidence**: [apps/mobile/src/features/registry.ts:33-141](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/registry.ts#L33-L141), [apps/mobile/src/features/common/FeatureScreenStub.tsx:70-241](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/common/FeatureScreenStub.tsx#L70-L241), [apps/mobile/src/features/consent/CheckInScreen.tsx:30-407](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L30-L407)
- **Rating**: Weak
- **Fix Size**: L

---

### Q2. Screens Rendering Through FeatureScreenStub
- **Answer**: Exactly 5 active production screens render through `FeatureScreenStub`. In addition, 3 unrouted legacy files still import and render it.
- **Evidence**: 
  1. `RecordsScreen` ([apps/mobile/src/features/records/RecordsScreen.tsx:12](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/records/RecordsScreen.tsx#L12))
  2. `AvailabilityScreen` ([apps/mobile/src/features/availability/AvailabilityScreen.tsx:12](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/availability/AvailabilityScreen.tsx#L12))
  3. `DietScreen` ([apps/mobile/src/features/diet/DietScreen.tsx:12](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/diet/DietScreen.tsx#L12))
  4. `FamilyAccessScreen` ([apps/mobile/src/features/family/FamilyAccessScreen.tsx:12](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/family/FamilyAccessScreen.tsx#L12))
  5. `MaternalCareScreen` ([apps/mobile/src/features/maternal/MaternalCareScreen.tsx:12](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/maternal/MaternalCareScreen.tsx#L12))  
  *(Legacy/orphan files: `PrescriptionsScreen.tsx:10`, `SymptomTriageScreen.tsx:7`, `ConsentSecurityScreen.tsx:7`)*
- **Rating**: Weak
- **Fix Size**: L

---

### Q3. Dead-End Buttons and Rows
- **Answer**: 7 distinct buttons and nearly every `ListRow` in the application do nothing when tapped. Action buttons in `FeatureScreenStub` fall back to empty closures `() => {}`, and `ListRow` components omit `onPress` entirely, disabling clickability.
- **Evidence**:
  - `DoctorsScreen.tsx:79`: `<Button variant="danger" label="Call 108" onPress={() => {}} />`
  - `DoctorsScreen.tsx:106`: `<Button onPress={() => setCheckingSymptoms(true)} />` (only flips label string)
  - `FeatureScreenStub.tsx:168`: `onPress={onActionButtonPress || (() => {})}` (Records, Hospital Status, Diet, Family, Maternal buttons)
  - `FeatureScreenStub.tsx:113`: `<Button label="Retry connection" onPress={() => {}} />`
  - `cart.tsx:132`: `<Button label="Proceed to Payment" onPress={() => console.log('Proceed to payment')} />`
  - `AccountScreen.tsx:158`: `<Button label="Call 108 Emergency Ambulance" onPress={() => console.log(...)} />`
  - `AssistantFloatingButton.tsx:29`: `<Button label="Accept" onPress={handleAccept} />` (navigates to doctors route without executing any action)
  - `ListRow` dead ends: all 4 rows in `DoctorsScreen.tsx:123-146`, all 3 rows in `MedicinesScreen.tsx:95-112`, all 2 rows in `cart.tsx:70-81`, rows 121 and 127 in `AccountScreen.tsx`, and all sample item rows in `FeatureScreenStub.tsx:228-236`.
- **Rating**: Weak
- **Fix Size**: M

---

### Q4. Login, Onboarding, ABHA Linking, Hospital Selection
- **Answer**: Not found. There is no login screen, onboarding flow, ABHA account linking, or hospital selection wizard in the repository. On first launch, Expo Router immediately mounts the root tab layout, presenting the Home screen pre-populated with a hardcoded user profile and pre-selected hospital.
- **Evidence**: [apps/mobile/src/app/_layout.tsx:42-60](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/_layout.tsx#L42-L60), [apps/mobile/src/features/account/AccountScreen.tsx:47-53](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/account/AccountScreen.tsx#L47-L53)
- **Rating**: Missing
- **Fix Size**: L

---

### Q5. Data Persistence Across App Restart
- **Answer**: Zero data survives an app restart. All application state is stored in React component `useState` hooks or an in-memory module variable (`let currentLocation`) in `locationStorage.ts`. Closing or reloading the app resets location to Gachibowli, wipes OTP attempt counts, resets theme mode to normal, and clears all searches.
- **Evidence**: [apps/mobile/src/services/locationStorage.ts:13](file:///Users/tejasprasad/FourWard/apps/mobile/src/services/locationStorage.ts#L13) (`let currentLocation: UserLocation = { ...DEFAULT_LOCATION };`), [apps/mobile/src/features/consent/CheckInScreen.tsx:35-45](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L35-L45)
- **Rating**: Missing
- **Fix Size**: M

---

## 2. FEATURES (vs docs/FourWard_v2.pdf)

### Q6. Doctors: Symptom Flow and Department Mapping
- **Answer**: There is no question flow or department mapping; only a static list of 4 hardcoded doctors is displayed. Tapping "Check symptoms" merely changes the button label to "Symptoms recorded" with zero routing logic. Making it work end to end requires a multi-step triage questionnaire, an algorithm mapping symptoms/red flags to clinical departments, a backend database of on-duty doctors, and a live queue booking API.
- **Evidence**: [apps/mobile/src/features/doctors/DoctorsScreen.tsx:103-147](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/doctors/DoctorsScreen.tsx#L103-L147)
- **Rating**: Weak
- **Fix Size**: L

---

### Q7. Records: Upload, Problem Grouping, Version Tracking
- **Answer**: None of these exist; the screen renders 4 static list rows inside `FeatureScreenStub` where "Upload report" is a dead end. Versus slide 7 of the deck, the screen lacks document uploading (camera/PDF file picker), categorization into problem-specific folders, latest-version tracking/badges, physical visit checklists with hard-copy tags, and federation across local hospitals.
- **Evidence**: [apps/mobile/src/features/records/RecordsScreen.tsx:12-40](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/records/RecordsScreen.tsx#L12-L40), [FourWard_v2.pdf: Slide 7](file:///Users/tejasprasad/.gemini/antigravity-ide/brain/d9e593ae-1f9d-4157-9ff8-d4296ea7acda/.user_uploaded/media_1792079158578.pdf)
- **Rating**: Missing
- **Fix Size**: L

---

### Q8. Medicines: Prescription -> Reminder -> Cart Wiring & Notifications
- **Answer**: The flow is completely unwired; active prescriptions, next dose banner, and cart summary are disconnected static cards on the screen. Local device notifications are not scheduled because `expo-notifications` is neither installed nor imported in the codebase. Tapping "Open cart" pushes to a static checkout mockup (`cart.tsx`) where payment logs to console.
- **Evidence**: [apps/mobile/src/features/medicines/MedicinesScreen.tsx:58-150](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/medicines/MedicinesScreen.tsx#L58-L150), [apps/mobile/src/app/features/cart.tsx:129-133](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/features/cart.tsx#L129-L133)
- **Rating**: Missing
- **Fix Size**: L

---

### Q9. Hospital Status: Live Data Production & Refresh
- **Answer**: Hospital occupancy and wait times are 100% hardcoded in JSX in both `AvailabilityScreen.tsx` and the Home screen banner. Data never refreshes because there are no API fetch calls, WebSocket listeners, background polling intervals, or pull-to-refresh (`RefreshControl`) handlers. The counts ("14 beds free", "8 min wait") are immutable text strings.
- **Evidence**: [apps/mobile/src/features/availability/AvailabilityScreen.tsx:19-39](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/availability/AvailabilityScreen.tsx#L19-L39), [apps/mobile/src/app/(tabs)/index.tsx:135-144](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/(tabs)/index.tsx#L135-L144)
- **Rating**: Missing
- **Fix Size**: M

---

### Q10. Diet: Region-Aware Plans & Doctor Restrictions
- **Answer**: Region-aware meal generation does not exist; the meals ("Jowar roti and methi dal", "Brown rice and palak paneer") are hardcoded strings in JSX. There is no region database, no urban vs rural dietary toggles, and doctor restrictions are neither modeled in types nor applied in logic.
- **Evidence**: [apps/mobile/src/features/diet/DietScreen.tsx:19-39](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/diet/DietScreen.tsx#L19-L39)
- **Rating**: Missing
- **Fix Size**: L

---

### Q11. Family: Member Access, Approval, and Revocation
- **Answer**: Family member access cannot be granted, approved, or revoked; the screen is a static stub displaying 3 hardcoded rows. The "Add member" button has no `onPress` handler and list items are unclickable. There is no phone number invite flow, consent delegation contract, or revocation mechanism.
- **Evidence**: [apps/mobile/src/features/family/FamilyAccessScreen.tsx:15-34](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/family/FamilyAccessScreen.tsx#L15-L34)
- **Rating**: Missing
- **Fix Size**: L

---

### Q12. Maternal Care: Vaccine Schedule Verification
- **Answer**: The vaccine schedule is purely static text hardcoded in JSX ("Tetanus vaccine • Due in 12 days at clinic", "Newborn vaccines • Scheduled after delivery"). It does not follow the National Immunization Schedule (NIS) or WHO clinical protocol. There is no dynamic timeline calculation based on LMP or birthdate, and no document storage for yellow cards.
- **Evidence**: [apps/mobile/src/features/maternal/MaternalCareScreen.tsx:19-39](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/maternal/MaternalCareScreen.tsx#L19-L39)
- **Rating**: Missing
- **Fix Size**: L

---

## 3. CHECK-IN AND SECURITY

### Q13. Enforcement of Attempts, Expiry, Lockout & Contract Imports
- **Answer**: Attempt counting and lockout are enforced in local React component state and inside the client-side contract stub. The mobile app directly imports `verifyCheckinStub` from `packages/contracts`, falling back to it whenever the local API fetch fails. A user can trivially bypass attempt limits and lockout by remounting the component or reopening the app since attempts are tracked in `useState(0)`.
- **Evidence**: [apps/mobile/src/services/checkinService.ts:3-38](file:///Users/tejasprasad/FourWard/apps/mobile/src/services/checkinService.ts#L3-L38), [apps/mobile/src/features/consent/CheckInScreen.tsx:45](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L45)
- **Rating**: Weak
- **Fix Size**: M

---

### Q14. Success Screen Room & Doctor Text Source
- **Answer**: The room and doctor text is hardcoded across both client and contract layers. Although `CheckInScreen.tsx` reads `result.room` and `result.doctorName`, both the contract stub (`packages/contracts/src/checkin.ts:30-31`) and the component's initial state/fallback default to `'Room 204'` and `'Dr. P. V. Ramana Rao'`. No database or dynamic visit lookup is involved.
- **Evidence**: [packages/contracts/src/checkin.ts:30-31](file:///Users/tejasprasad/FourWard/packages/contracts/src/checkin.ts#L30-L31), [apps/mobile/src/features/consent/CheckInScreen.tsx:41-44](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L41-L44), [apps/mobile/src/features/consent/CheckInScreen.tsx:122](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L122)
- **Rating**: Partial
- **Fix Size**: S

---

### Q15. Token/Session Storage and Personal Data Logging
- **Answer**: Token and session data storage is "not found" (no SecureStore, AsyncStorage, or session tokens exist). No personal data is written to console logs, but patient PII (full name, phone number, UHID, family members) is hardcoded in plain text directly in the client source file `AccountScreen.tsx`.
- **Evidence**: [apps/mobile/src/features/account/AccountScreen.tsx:47-51](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/account/AccountScreen.tsx#L47-L51), [apps/mobile/src/features/account/AccountScreen.tsx:108](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/account/AccountScreen.tsx#L108)
- **Rating**: Weak
- **Fix Size**: M

---

### Q16. App Switcher Privacy & Session Timeout
- **Answer**: Not found. Record screens do not hide content in the app switcher (no `expo-screen-capture` or `AppState` blur veil is configured). There is no session timeout, background lock, or inactivity timer anywhere in the app.
- **Evidence**: Entire `apps/mobile/src` codebase searched for `AppState`, `screen-capture`, `timeout` (zero matches).
- **Rating**: Missing
- **Fix Size**: S

---

## 4. ASSISTANT

### Q17. Assistant Implementation, Tool Registry & OTP Test
- **Answer**: Today, the assistant is merely a visual floating action button opening a static modal with a hardcoded proposal to book Dr. Ramana Rao. No tool registry, voice recognition, or AI agent runtime exists. The test in `scripts/test-checkin.js` is not meaningful because it only checks a static documentation string (`assistantSummary` in `registry.ts`), not an executable tool registry.
- **Evidence**: [apps/mobile/src/components/assistant/AssistantFloatingButton.tsx:17-35](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/assistant/AssistantFloatingButton.tsx#L17-L35), [scripts/test-checkin.js:52-61](file:///Users/tejasprasad/FourWard/scripts/test-checkin.js#L52-L61)
- **Rating**: Weak
- **Fix Size**: L

---

### Q18. Assistant Action Exposure (Cell Manifests) & Current Blockers
- **Answer**: AGENTS.md mandates that cells expose assistant tools through typed manifests (`manifest.ts`) executed with user permissions. This is blocked today because: (1) no cells or spine runtime exist in `apps/api` (only an isolated checkin stub exists), (2) `packages/contracts` defines zero assistant tool schemas, and (3) mobile lacks an agent orchestrator to discover tools, prompt confirmation, or dispatch calls.
- **Evidence**: [AGENTS.md:14-16](file:///Users/tejasprasad/FourWard/AGENTS.md#L14-L16), [AGENTS.md:25-27](file:///Users/tejasprasad/FourWard/AGENTS.md#L25-L27), [apps/api/src/checkin.ts:1-32](file:///Users/tejasprasad/FourWard/apps/api/src/checkin.ts#L1-L32)
- **Rating**: Missing
- **Fix Size**: L

---

## 5. NAVIGATION AND USABILITY

### Q19. Tap Count Benchmark
- **Answer**: 
  - **Find a doctor**: 1 tap (bottom tab or Home tile).
  - **Refill a medicine**: 2 taps to cart (`Medicines` tab -> `Open cart`), 3 taps to checkout button.
  - **Check in**: 1 tap (Home tile -> opens screen; auto-submits on 6th digit).
  - **See bed availability**: 0 taps (visible on Home banner) or 1 tap (tile).
  - **Open a report**: Unopenable (items in `RecordsScreen` have no `onPress` handlers).
  - **Change location**: 3 taps (open bar -> select locality -> confirm).
  - *Assessment*: Changing location takes too many taps (3 taps plus modal dismissal) for a basic filter, and reports cannot be opened at all due to unclickable rows.
- **Evidence**: [apps/mobile/src/app/(tabs)/index.tsx:90](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/(tabs)/index.tsx#L90), [apps/mobile/src/features/medicines/MedicinesScreen.tsx:147](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/medicines/MedicinesScreen.tsx#L147), [apps/mobile/src/features/records/RecordsScreen.tsx:18-39](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/records/RecordsScreen.tsx#L18-L39)
- **Rating**: Partial
- **Fix Size**: M

---

### Q20. Back Button Behavior & State Retention
- **Answer**: Pushed feature routes have back buttons calling `router.back()`, and Check-in uses `router.replace('/(tabs)')`. However, state does NOT survive navigating away: because state is held exclusively in local React `useState`, moving back or switching tabs unmounts components and resets search queries, triage toggles, and form inputs.
- **Evidence**: [apps/mobile/src/app/features/triage.tsx:33](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/features/triage.tsx#L33), [apps/mobile/src/features/consent/CheckInScreen.tsx:297](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L297), [apps/mobile/src/features/doctors/DoctorsScreen.tsx:17-18](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/doctors/DoctorsScreen.tsx#L17-L18)
- **Rating**: Partial
- **Fix Size**: M

---

### Q21. Loading, Empty and Error States
- **Answer**: Missing or faked across almost all screens. In `FeatureScreenStub.tsx:82`, `screenState` is hardcoded to `'content'` with no state setter, meaning its skeleton loader, empty view, and retry error states can never trigger. `DoctorsScreen`, `MedicinesScreen`, `AccountScreen`, and `Home` have zero loading or empty states. Only `CheckInScreen.tsx` implements real loading (`InlineWait`) and error (shake/messages) states.
- **Evidence**: [apps/mobile/src/features/common/FeatureScreenStub.tsx:82](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/common/FeatureScreenStub.tsx#L82), [apps/mobile/src/features/consent/CheckInScreen.tsx:381-397](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L381-L397)
- **Rating**: Weak
- **Fix Size**: M

---

### Q22. Keyboard Mishandling Forms
- **Answer**: `CheckInScreen.tsx:306-407` wraps its 6 digit inputs in a fixed `<View>` without a `ScrollView` or `KeyboardAvoidingView`, causing the bottom help text to be obscured or cropped on compact devices when the numeric keypad appears. `LocationPickerModal.tsx:189` contains a search input inside a modal that lacks `KeyboardAvoidingView`, causing the software keyboard to cover the locality search results list on smaller screens.
- **Evidence**: [apps/mobile/src/features/consent/CheckInScreen.tsx:306-326](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L306-L326), [apps/mobile/src/components/location/LocationPickerModal.tsx:189-216](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/location/LocationPickerModal.tsx#L189-L216)
- **Rating**: Weak
- **Fix Size**: S

---

### Q23. Assistant Button Thumb Reach & Covered Content
- **Answer**: The button is fixed at `bottom: 24, right: 18` (`AssistantFloatingButton.tsx:154`), placing it within comfortable reach of a right-handed thumb. However, on Home it hovers directly over the bottom-right feature tile ("Check-in") when scrolled to the bottom, and on other screens it obscures the right edge of list rows and bottom cards.
- **Evidence**: [apps/mobile/src/components/assistant/AssistantFloatingButton.tsx:152-161](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/assistant/AssistantFloatingButton.tsx#L152-L161), [docs/ux-backlog.md:28](file:///Users/tejasprasad/FourWard/docs/ux-backlog.md#L28)
- **Rating**: Weak
- **Fix Size**: S

---

## 6. DESIGN QUALITY

### Q24. Top 5 Weakest Screens Visually
- **Answer**:
  1. **Records (`RecordsScreen.tsx`)**: 100% generic `FeatureScreenStub`; no thumbnails, file icons, or category hierarchy; just 4 plain text rows in a white box.
  2. **Hospital Status (`AvailabilityScreen.tsx`)**: Identical stub layout; zero occupancy progress bars, capacity meters, or color-coded status badges.
  3. **Diet (`DietScreen.tsx`)**: Identical stub layout; no food imagery, calorie target ring, or macronutrient breakdown bars.
  4. **Family (`FamilyAccessScreen.tsx`)**: Identical stub layout; no profile avatars, relation tags, or permission toggles.
  5. **Maternal Care (`MaternalCareScreen.tsx`)**: Identical stub layout; no trimester timeline, vaccination calendar cards, or yellow card visuals.
- **Evidence**: [apps/mobile/src/features/records/RecordsScreen.tsx:12-40](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/records/RecordsScreen.tsx#L12-L40), [apps/mobile/src/features/availability/AvailabilityScreen.tsx:12-40](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/availability/AvailabilityScreen.tsx#L12-L40), [apps/mobile/src/features/diet/DietScreen.tsx:12-40](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/diet/DietScreen.tsx#L12-L40), [apps/mobile/src/features/family/FamilyAccessScreen.tsx:12-36](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/family/FamilyAccessScreen.tsx#L12-L36), [apps/mobile/src/features/maternal/MaternalCareScreen.tsx:12-40](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/maternal/MaternalCareScreen.tsx#L12-L40)
- **Rating**: Weak
- **Fix Size**: L

---

### Q25. Templated / Generic UI Occurrences
- **Answer**: 5 out of 8 feature screens (`Records`, `Hospital Status`, `Diet`, `Family`, `Maternal Care`) render the exact same component template (`FeatureScreenStub.tsx`): a top white card with a title and action button, followed by a second white card containing 3-4 text-only `ListRow` items. Even `DoctorsScreen` and `MedicinesScreen` copy the same template (Header -> Search -> Tinted Card -> White ListCard -> Button). There are no domain-specific UI patterns anywhere in the app.
- **Evidence**: [apps/mobile/src/features/common/FeatureScreenStub.tsx:134-239](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/common/FeatureScreenStub.tsx#L134-L239), [apps/mobile/src/features/doctors/DoctorsScreen.tsx:40-147](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/doctors/DoctorsScreen.tsx#L40-L147), [apps/mobile/src/features/medicines/MedicinesScreen.tsx:40-150](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/medicines/MedicinesScreen.tsx#L40-L150)
- **Rating**: Weak
- **Fix Size**: L

---

### Q26. Misused, Duplicated, or Missing Primitives
- **Answer**: 
  - **Missing**: `ScreenHeader` (reinvented ad-hoc in every screen), `StatBlock` (beds and wait times are jammed into `ListRow`), `EmptyState` (hardcoded only inside stub), `FormField` (raw `TextInput` styled ad-hoc).
  - **Misused**: `ListRow` is overused as a universal hammer for doctors, beds, meals, lab tests, vaccines, and cart items. `Button` is rendered on stubs even when bound to empty dead-end closures.
  - **Duplicated**: Top back-button navigation bars are duplicated across all 9 route wrappers in `apps/mobile/src/app/features/*.tsx`.
- **Evidence**: [apps/mobile/src/components/primitives/index.ts:1-12](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/primitives/index.ts#L1-L12), [apps/mobile/src/app/features/triage.tsx:17-41](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/features/triage.tsx#L17-L41), [apps/mobile/src/app/features/records.tsx:17-41](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/features/records.tsx#L17-L41)
- **Rating**: Weak
- **Fix Size**: M

---

### Q27. Accent Colour & Typography Hierarchy
- **Answer**: The accent color (`#E58F3A`) is used very sparingly, strictly limited to the floating assistant button and 1/4 of confetti particles. However, the typography scale creates poor visual hierarchy: screens heavily overuse `subhead` bold (17px) paired with `bodySmall` muted (13px) for nearly every element, making all cards and rows look uniformly weighted and visually flat.
- **Evidence**: [apps/mobile/src/theme/tokens.ts:24](file:///Users/tejasprasad/FourWard/apps/mobile/src/theme/tokens.ts#L24), [apps/mobile/src/components/assistant/AssistantFloatingButton.tsx:50](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/assistant/AssistantFloatingButton.tsx#L50), [apps/mobile/src/features/consent/CheckInScreen.tsx:201](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L201)
- **Rating**: Partial
- **Fix Size**: M

---

### Q28. Interactions Lacking Feedback
- **Answer**: 
  1. `ListRow.tsx:49`: Inactive rows provide zero press feedback (`onPress` is undefined, setting `disabled={true}`).
  2. `DoctorsScreen.tsx:79`: "Call 108" provides no feedback (does not invoke `Linking.openURL('tel:108')` or show a confirmation modal).
  3. `DoctorsScreen.tsx:106`: "Check symptoms" changes button label text without any transitional feedback or modal.
  4. `cart.tsx:132`: "Proceed to Payment" logs to console with zero visual confirmation.
  5. `CheckInScreen.tsx`: Individual digit entry has no audio or visual pulse feedback beyond cursor advancement.
- **Evidence**: [apps/mobile/src/components/primitives/ListRow.tsx:44-50](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/primitives/ListRow.tsx#L44-L50), [apps/mobile/src/features/doctors/DoctorsScreen.tsx:76-80](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/doctors/DoctorsScreen.tsx#L76-L80), [apps/mobile/src/app/features/cart.tsx:130-133](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/features/cart.tsx#L130-L133)
- **Rating**: Weak
- **Fix Size**: S

---

## 7. LOW-END PHONES AND ACCESSIBILITY

### Q29. Bundle Size, Assets, Virtualisation & Non-Native Animations
- **Answer**: Static assets total ~23MB, dominated by uncompressed raw tile PNGs taking 15MB (e.g. `diet_thali.png` is 1.8MB, `maternal_booties.png` is 1.4MB). Tile images were not sized to mobile dp, but full-resolution images scaled client-side in `expo-image`. Zero lists are virtualized (0 `FlatList` components; all screens use unvirtualized `.map()` inside `ScrollView`). All animations use `useNativeDriver: true`, but fall back to JS-based execution on web due to missing native modules.
- **Evidence**: [apps/mobile/assets/tiles](file:///Users/tejasprasad/FourWard/apps/mobile/assets/tiles), [apps/mobile/src/components/primitives/Tile.tsx:80-88](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/primitives/Tile.tsx#L80-L88), [apps/mobile/src/app/(tabs)/index.tsx:148-180](file:///Users/tejasprasad/FourWard/apps/mobile/src/app/(tabs)/index.tsx#L148-L180)
- **Rating**: Weak
- **Fix Size**: M

---

### Q30. react-native-maps Lazy Loading & Offline Handling
- **Answer**: `react-native-maps` is lazy-loaded via dynamic `require()` only when the location picker opens on native devices (`LocationPickerModal.tsx:63-71`). When offline, geocoding and reverse geocoding fail silently, native map tiles render as a blank grid, and no offline banner or recovery hint is presented to the user.
- **Evidence**: [apps/mobile/src/components/location/LocationPickerModal.tsx:62-71](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/location/LocationPickerModal.tsx#L62-L71), [apps/mobile/src/components/location/LocationPickerModal.tsx:74-85](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/location/LocationPickerModal.tsx#L74-L85)
- **Rating**: Partial
- **Fix Size**: S

---

### Q31. Touch Targets & Color Contrast Failures
- **Answer**: Contrast for `muted` text (`#5E6B66`) passes WCAG AA on `bg` (5.32:1), `surface` (5.57:1), `sageTint` (4.62:1), and `peachTint` (4.63:1). However, the `border` token (`#E4E4DE`) against `bg` (`#FAFAF6`) is only 1.22:1, failing non-text contrast guidelines. Touch targets fail the >=48dp mandate in multiple places: `digitBox` width is 46dp (`CheckInScreen.tsx:422`), SearchBar clear button is 32dp (`SearchBar.tsx:87`), and modal close button is 38dp (`LocationPickerModal.tsx:186`).
- **Evidence**: [apps/mobile/src/theme/tokens.ts:27](file:///Users/tejasprasad/FourWard/apps/mobile/src/theme/tokens.ts#L27), [apps/mobile/src/features/consent/CheckInScreen.tsx:422](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L422), [apps/mobile/src/components/primitives/SearchBar.tsx:87](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/primitives/SearchBar.tsx#L87)
- **Rating**: Weak
- **Fix Size**: S

---

### Q32. Screen Reader Accessibility Labels on Icon Controls
- **Answer**: Icon-only buttons are labelled for screen readers across the app. The floating mic button has `accessibilityLabel="Open FourWard voice and chat assistant"`, modal dismiss buttons have `"Close location picker"` and `"Dismiss sheet"`, and route headers have `"Go back"`. Individual Check-in digit boxes have `"Digit X of 6"`.
- **Evidence**: [apps/mobile/src/components/assistant/AssistantFloatingButton.tsx:45](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/assistant/AssistantFloatingButton.tsx#L45), [apps/mobile/src/components/location/LocationPickerModal.tsx:181](file:///Users/tejasprasad/FourWard/apps/mobile/src/components/location/LocationPickerModal.tsx#L181), [apps/mobile/src/features/consent/CheckInScreen.tsx:374](file:///Users/tejasprasad/FourWard/apps/mobile/src/features/consent/CheckInScreen.tsx#L374)
- **Rating**: Solid
- **Fix Size**: S

---

## 8. PROCESS

### Q33. Existing Tests, Coverage Gaps & CI Pipeline
- **Answer**: Exactly 1 test file exists (`scripts/test-checkin.js`), covering contract return types for `verifyCheckinStub` and checking a regex against feature summaries. 100% of UI components, user flows, navigation routes, location storage, accessibility attributes, and backend endpoints are untested. There is no CI pipeline (no `.github/workflows` or automated test runner on commit).
- **Evidence**: [scripts/test-checkin.js:1-63](file:///Users/tejasprasad/FourWard/scripts/test-checkin.js#L1-L63), root directory listing (no CI configuration).
- **Rating**: Weak
- **Fix Size**: M

---

### Q34. Spine-and-Cells Architecture Violations
- **Answer**: The backend completely violates the AGENTS.md spine-and-cells architecture: (1) `apps/api` has no NestJS setup, no `src/spine/` directory, and no `src/cells/` directory, (2) the `availability` feature was built as a client stub rather than a full backend cell with manifest/domain/db/tests, (3) `packages/contracts` only has checkin schemas, omitting the other 7 features, (4) no ESLint module boundary rules are configured, and (5) the mobile app bypasses API boundaries by directly importing contract stubs.
- **Evidence**: [AGENTS.md:1-29](file:///Users/tejasprasad/FourWard/AGENTS.md#L1-L29), [apps/api/src/checkin.ts:1-32](file:///Users/tejasprasad/FourWard/apps/api/src/checkin.ts#L1-L32), [apps/mobile/src/services/checkinService.ts:3-4](file:///Users/tejasprasad/FourWard/apps/mobile/src/services/checkinService.ts#L3-L4)
- **Rating**: Weak
- **Fix Size**: L

---

## AUDIT SYNTHESIS

### (a) The 10 Biggest Bottlenecks Ranked
1. **No Backend or Spine Architecture**: `apps/api` is an unbuilt skeleton without NestJS, auth, tenancy, event bus, audit ledger, or cells.
2. **5 Out of 8 Features Are Static Stubs**: Records, Hospital Status, Diet, Family, and Maternal Care render the same non-interactive `FeatureScreenStub`.
3. **No Data Persistence Across Restarts**: Zero local storage (`AsyncStorage`/`SecureStore`) or backend synchronization; every restart wipes user state.
4. **Client-Bypassable Security & OTP Logic**: PIN verification and attempt counting run client-side in React state, allowing trivial lockout bypass.
5. **No Authentication, Onboarding, or Hospital Selection**: The app has no user onboarding, ABHA linking, or facility selection.
6. **No Virtualized Lists (`FlatList`)**: All lists use unvirtualized `.map()` inside `ScrollView`, which will cause memory degradation on low-end devices.
7. **Bloated Asset Payload (23MB+)**: Uncompressed raw tile PNGs (some up to 1.8MB) inflate the bundle and slow down startup.
8. **Unimplemented Assistant Core**: Assistant is purely a visual button with a hardcoded card proposal; no tool registry, STT, or LLM runtime.
9. **No Automated CI Pipeline**: No GitHub Actions or CI pipeline exists to enforce tests, design token checks, or type safety on push.
10. **Dead-End Controls Across Features**: Emergency call buttons, triage triggers, upload buttons, and list rows execute empty closures or log to console.

---

### (b) Every Mocked or Hardcoded Thing
1. **User Profile**: "K. Tejas Prasad", UHID "FW-HYD-842901", phone "+91 98490 28143" (`AccountScreen.tsx:47-51`).
2. **Hospital & Facilities**: "Apollo Hospitals, Gachibowli, Hyderabad" (`AccountScreen.tsx:128`), "City Care Hospital", "Metro General Hospital", "Lotus Health Clinic", "City Care Pharmacy" (`DoctorsScreen.tsx`, `MedicinesScreen.tsx`, `index.tsx`).
3. **Doctors List**: Dr. P. V. Ramana Rao (Cardiology), Dr. K. Srinivas (Internal Medicine), Dr. S. Meenakshi (Pediatrics), Dr. Anita Sharma (Gynecology) (`DoctorsScreen.tsx:124-143`).
4. **Queue & Bed Counts**: "14 beds free", "37 min wait", "14 min wait", "Cardiology OPD open now with 9 patients ahead" (`index.tsx:139-142`, `DoctorsScreen.tsx:126-138`).
5. **Prescriptions**: "Telmisartan 40mg (16 days left)", "Metformin 500mg (4 days left)", "Atorvastatin 10mg (22 days left)" (`MedicinesScreen.tsx:96-110`).
6. **Cart & Pricing**: Atorvastatin 10mg (10 strips) • ₹284 (`MedicinesScreen.tsx:135-140`, `cart.tsx:71-124`).
7. **Lab Records**: "Lipid Profile", "Cardiac 2D Echo", "Discharge Summary", "Visit Checklist" (`RecordsScreen.tsx:20-38`).
8. **Diet Plan**: "Jowar roti and methi dal (380 kcal)", "Brown rice and palak paneer (520 kcal)", "Roasted chana and buttermilk (120 kcal)", "1,420 of 1,850 kcal" (`DietScreen.tsx:20-38`).
9. **Family Members**: Suresh Prasad (Son), Lakshmi Prasad (Spouse), Arjun Prasad (`FamilyAccessScreen.tsx:20-28`, `AccountScreen.tsx:108`).
10. **Maternal Care Milestones**: "Second trimester review (Week 26)", "Tetanus vaccine", "Newborn vaccines", "Hospital yellow card" (`MaternalCareScreen.tsx:20-38`).
11. **Check-in Results**: Doctor "Dr. P. V. Ramana Rao", Room "Room 204" (`checkin.ts:30-31`, `CheckInScreen.tsx:41-44`).
12. **Assistant Proposed Action**: "Book Consultation: Dr. P. V. Ramana Rao (Cardiology) • City Care Hospital • Estimated wait 35 min • Fee ₹450" (`AssistantFloatingButton.tsx:23-27`).

---

### (c) Screens That Look Generic
1. **`RecordsScreen`**: Generic white card layout with plain text list rows; lacks file icons, date sections, or report previews.
2. **`AvailabilityScreen`**: Generic white card layout with plain text list rows; lacks capacity progress bars, occupancy meters, or colored alerts.
3. **`DietScreen`**: Generic white card layout with plain text list rows; lacks meal photos, macro charts, or calorie progress rings.
4. **`FamilyAccessScreen`**: Generic white card layout with plain text list rows; lacks profile avatars, relation tags, or toggle switches.
5. **`MaternalCareScreen`**: Generic white card layout with plain text list rows; lacks pregnancy timeline steps, milestone badges, or document cards.
6. **`DoctorsScreen` & `MedicinesScreen`**: Visually repetitive clones following the exact same layout sequence (Header -> Search -> Tinted Banner -> White ListCard -> Button).

---

### (d) Everything That Could Not Be Verified
1. **Native Map Pan & Pin Drag**: `react-native-maps` cannot render on web. Real map tile streaming and smooth pin panning require a physical iOS or Android handset.
2. **Hardware Haptic Feedback**: `Haptics.notificationAsync` on error shake and success confirmation cannot be triggered or verified on web.
3. **SMS One-Time Code Autofill**: iOS `textContentType="oneTimeCode"` and Android SMS retrieval API require a real device receiving a carrier SMS.
4. **Native App Switcher Visuals**: Blur/snapshot concealment behavior in the OS task switcher cannot be observed in web dev server mode.
5. **Low-End Android Device Performance**: Frame rates and memory consumption during tile image decoding and unvirtualized list scrolling cannot be benchmarked in a local desktop browser.
