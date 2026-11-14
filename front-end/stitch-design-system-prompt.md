# PROMPT FOR STITCH: S.O.L.O. DESIGN SYSTEM & COMPLETE UI/UX SCREENS SPECIFICATION

Copy and paste the prompt below into Stitch:

```markdown
You are an elite Lead UI/UX Designer and Frontend Design System Architect specializing in mission-critical Agri-Tech, Space Science applications, and Google Material 3 / Tailwind CSS design languages.

I need you to generate a comprehensive, modern, high-contrast, production-grade Design System and the full screen-by-screen UI specifications for a web application named "S.O.L.O." (Smart Observation Land Optimization), built for the NASA International Space Apps Challenge 2026 ("Field Shift: Adapting Farms with NASA Data").

---

### 1. PROJECT BACKGROUND & MISSION
- **Application Name:** S.O.L.O. (Smart Observation Land Optimization)
- **Challenge:** NASA International Space Apps Challenge — "Field Shift: Adapting Farms with NASA Data"
- **Mission:** Bridge the "Data Gap" between complex NASA Earth Observation satellite datasets (NASA POWER, SMAP soil moisture, ECOSTRESS thermal stress, GPM precipitation) and everyday farmers. The platform empowers rural growers to adapt their plots to extreme climate volatility, droughts, and soil degradation through an intuitive, visual, predictive crop-rotation simulation and decision-support tool.
- **Target Audience:** Family farmers, agronomists, and rural cooperatives. Most users access this platform outdoors in bright sunlight on mobile devices, often with low-bandwidth connectivity.
- **Frontend Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Leaflet/MapLibre, Chart.js/Recharts, Lucide React.

---

### 2. DESIGN SYSTEM SPECIFICATION ("AERO-AGRONOMY")

#### A. Color Palette (Space Observation meets Regenerative Agriculture)
1. **Primary Backgrounds & Surfaces (Deep Space Navy):**
   - Background Base: `#080E1A` (Deep Space Obsidian)
   - Surface / Card Base: `#0F1A2E` (Deep Orbit Navy)
   - Elevated Card / Hover: `#15243E` (Starlight Surface)
   - Border & Dividers: `#1E3256` (Subtle Orbital Ring)
2. **Agricultural Accent Colors (Earth & Growth):**
   - Earth Emerald (Primary Action & Positive Health): `#10B981` (Hover: `#059669`)
   - Foliage Light: `#34D399`
3. **Orbital & Hydrological Accents (Satellite & Water Data):**
   - Satellite Cyan (Water / Rainfall / SMAP Moisture): `#06B6D4`
   - Sky Radiance (Interactive Links & Secondary Actions): `#38BDF8`
   - NASA Mission Navy (Badges & Headers): `#0B3D91`
4. **Warning, Heat & Drought Alerts:**
   - Harvest Gold / Thermal Stress: `#F59E0B`
   - Drought / Extreme Risk Red: `#EF4444` (or NASA Red `#FC3D21`)
5. **Neutral Typography & Text Hierarchy:**
   - Heading Text: `#FFFFFF` (100% Contrast)
   - Primary Body Text: `#E2E8F0` (Slate-200)
   - Secondary / Helper Text: `#94A3B8` (Slate-400)
   - Disabled / Muted Text: `#64748B` (Slate-500)

#### B. Solar Contrast & Outdoor Readability Rules
- Strict adherence to **WCAG 2.1 AA** (minimum 4.5:1 text-to-background contrast ratio; 3:1 for large graphical UI elements).
- Dark mode default with high-luminance primary accents to prevent glare while ensuring crystal-clear visibility outdoors under direct sunlight.

#### C. Typography
- **Display / Headers:** `Space Grotesk` (clean, technical, modern aerospace feel, weights 600 & 700).
- **Body & Interface:** `Plus Jakarta Sans` or `Inter` (neutral, legible at small sizes on mobile, weights 400, 500, 600).
- **Data, Numbers & Coordinates:** `JetBrains Mono` or tabular `Roboto Mono` (fixed-width tabular numbers for meteorological metrics, lat/long coordinates, and percentages).

#### D. Component Design Patterns & Tokens
- **Borders & Radii:** Rounded modern geometry (`rounded-xl` for cards, `rounded-lg` for inputs/buttons, `rounded-full` for badges/chips).
- **Glassmorphism & Elevation:** Subtle dark glass backdrop blur (`backdrop-blur-md bg-[#0F1A2E]/90 border border-[#1E3256]`).
- **Touch-Friendly Hit Targets:** Minimum 48x48px tap targets for mobile field operation (designed for farmers wearing gloves or operating with dirty hands).
- **Status Semaphores:** Triple-tier visual badges (Green: Optimal Resilience, Yellow: Water Deficit Attention, Red: Severe Crop Failure Risk).
- **Dial Gauges & Radar Charts:** Circular progress meters for single-metric scores (WUE, Nitrogen fix, Thermal margin).

---

### 3. FUNCTIONAL REQUIREMENTS (FR)
- **FR-01 (Farm Plot Geolocation):** Users must be able to specify plot coordinates via GPS geolocation, address search, or interactive map pin/polygon drawing.
- **FR-02 (NASA Data Ingestion):** Automated pulling of NASA POWER agrometeorological parameters (T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, ALLSKY_SFC_SW_DWN) and SMAP root-zone soil moisture for the selected coordinates.
- **FR-03 (Soil Profile Customization):** Input of local soil texture (Sandy, Loamy, Clayey) and historical irrigation access.
- **FR-04 (Crop Rotation Multi-Cycle Builder):** Visual builder supporting at least 3 seasonal cycles (Main Rainy Season, Second Season/Safrinha, and Dry Cover/Fallow Season).
- **FR-05 (Farmer Priority Weighting):** Toggleable priority selector: Maximum Water Conservation, Soil Nitrogen Regeneration, Immediate Financial Yield, or Extreme Drought Resilience.
- **FR-06 (Real-Time Sustainability Scoring):** Algorithmic real-time computation of:
  - Water Use Efficiency (WUE %)
  - Biological Nitrogen Fixation & Soil Organic Matter Score (%)
  - Thermal Adaptation / Drought Margin Score (%)
  - Overall S.O.L.O. Composite Resilience Index (0–100%)
- **FR-07 (Natural Language Agronomic Translator):** Instant conversion of satellite metrics into plain-language actionable advice (e.g., "Delay planting by 8 days to avoid predicted dry spell during flowering").
- **FR-08 (Side-by-Side Scenario Comparison):** Comparison matrix contrasting conventional monoculture vs. the planned S.O.L.O. resilient rotation.
- **FR-09 (Offline-First Storage & Local Sync):** Cache farm plots, crop matrices, and previously downloaded NASA forecasts in client-side storage for disconnected field use.
- **FR-10 (Report Generation & Export):** Export simulation results and agronomic plans to printable/shareable PDF summaries for cooperatives and bank financing.

---

### 4. NON-FUNCTIONAL REQUIREMENTS (NFR)
- **NFR-01 (Performance & Speed):** Sub-second recalculation of rotation scores upon user input changes; initial page load under 1.8s over 3G rural mobile connections.
- **NFR-02 (Accessibility):** WCAG 2.1 AA certified; semantic HTML5 markup, screen-reader compatibility, keyboard navigation, and visible focus rings.
- **NFR-03 (Zero-Friction Onboarding):** The simulator must be fully usable without mandatory account registration or login walls.
- **NFR-04 (Mobile-First Responsiveness):** Flawless presentation across viewport breakpoints from 360px (compact budget smartphones) to 4K desktop displays.
- **NFR-05 (Bandwidth Conservation):** Satellite datasets cached via Next.js route handlers (`revalidate: 86400`) to minimize cellular data consumption on rural plans.
- **NFR-06 (Data Transparency):** Clear visual disclaimers stating tool assumptions, confidence margins, and that recommendations serve as decision-support rather than guaranteed meteorological forecasts.

---

### 5. COMPLETE SCREEN-BY-SCREEN SPECIFICATION (NO SCREENS OMITTED)

Please generate detailed UI layouts, wireframe structures, visual hierarchy, and component trees for ALL the following 9 screens:

#### SCREEN 1: LANDING & HERO ONBOARDING
- **Purpose:** Introduce the S.O.L.O. platform, communicate value proposition to rural growers, and provide a 1-click start.
- **Key Elements:**
  - Sticky Navigation Bar: S.O.L.O. brand logo with satellite icon, NASA Space Apps 2026 badge, quick navigation anchors, and "Launch Simulator" CTA button.
  - Hero Section: High-impact headline ("From Orbit to Harvest: Resilient Crop Rotation Powered by NASA Earth Data"), animated satellite-orbit background graphic.
  - Quick KPI Highlights: 4 metric pill cards (NASA Satellite Missions, Water Savings Potential, Soil Restoration Impact, 100% Free & Open-Source).
  - 1-Click Demo Sandbox: Instant interactive preview widget right on the hero banner.

#### SCREEN 2: FARM PROFILE & GIS PLOT MAPPING
- **Purpose:** Pinpoint the farm's geographic location and configure basic soil attributes.
- **Key Elements:**
  - Interactive Map Canvas (Leaflet/MapLibre): Satellite base layer with toggleable NDVI and precipitation radar overlays.
  - Location Selector Bar: "Use Current GPS Location" button, municipality/coordinate search input, and Polygon Boundary Drawing tool.
  - Soil & Plot Parameter Drawer:
    - Soil Texture selector: Sandy / Loamy / Clayey (with graphical soil texture previews).
    - Water Access toggle: Rainfed (Dryland) vs. Irrigated.
    - Farm Size input (Hectares / Acres).
  - "Fetch NASA Agro-Climate Data" primary action button with loading spinner.

#### SCREEN 3: AGROCLIMATIC DASHBOARD (NASA OBSERVATION HUB)
- **Purpose:** Present current and upcoming meteorological/soil conditions for the selected coordinates in plain, intuitive formats.
- **Key Elements:**
  - Top Summary Bar: Active coordinates, municipality name, last satellite pass timestamp.
  - Key Indicator Metric Cards (3-column grid):
    - NASA POWER Weather: Max/Min Temperature (°C), Daily Solar Radiation.
    - SMAP Root-Zone Soil Moisture: Visual circular gauge showing percentage of field capacity (Deficit / Optimal / Waterlogged).
    - GPM Precipitation Radar: 15-day cumulative rainfall projection vs. 30-year historical average.
    - ECOSTRESS Heat Stress Alert: Canopy temperature and plant evaporative stress indicator.
  - Agricultural Alert Banner: Yellow/Red contextual warning (e.g., "Moderate Drought Warning: Root-zone moisture 22% below seasonal median").

#### SCREEN 4: INTERACTIVE CROP ROTATION SIMULATOR (CORE SCREEN)
- **Purpose:** The primary workspace where farmers build, simulate, and adjust their crop rotation plans.
- **Key Elements:**
  - Farmer Priority Bar: 4 interactive tabs (💧 Max Water Conservation | 🌱 Soil Nitrogen & Health | 💰 Yield & Profit | 🛡️ Climate Drought Shield).
  - 3-Stage Rotation Timeline Builder:
    - Cycle 1 Card (Main Rainy Season): Crop dropdown selector (e.g., Maize, Soybean, Rice, Cassava), sowing month picker, expected duration.
    - Cycle 2 Card (Second Season / Safrinha): Crop dropdown selector (e.g., Cowpea, Grain Sorghum, Sesame, Sunflower).
    - Cycle 3 Card (Dry Season / Cover Crop): Crop dropdown selector (e.g., Brachiaria, Crotalaria, Green Manure, Fallow).
  - Real-Time Sustainability Scoreboard (Instant reactivity):
    - Circular Composite S.O.L.O. Score Meter (0–100%) with glowing status ring.
    - Water Use Efficiency (WUE) horizontal bar with liter/m² savings estimate.
    - Nitrogen Fixation & Soil Carbon regeneration bar (kg N/ha returned).
    - Thermal & Drought Resilience margin bar.
  - Practical Recommendation Box: Formatted in natural language quoting exact benefits and agronomic trade-offs.

#### SCREEN 5: SCENARIO COMPARISON & ADAPTATION MARGIN
- **Purpose:** Enable the farmer to directly compare their current conventional practice against the S.O.L.O. recommended rotation.
- **Key Elements:**
  - Split-Screen / Side-by-Side Card Layout:
    - Left Card: "Baseline Practice" (e.g., Continuous Maize Monoculture + Bare Fallow).
    - Right Card: "S.O.L.O. Climate-Adapted Plan" (e.g., Maize ➔ Cowpea ➔ Brachiaria Cover).
  - Delta Comparison Table:
    - Annual Water Saved (e.g., +38% Water Conserved).
    - Soil Degradation Risk (e.g., 65% reduction in erosion & nematode index).
    - Climate Vulnerability Score (High Risk vs. Low Risk).
  - Visual Water Balance Chart: Two contrasting curve lines showing soil water depletion over 12 months.

#### SCREEN 6: HISTORICAL CLIMATE ANALYTICS & SATELLITE ARCHIVE
- **Purpose:** Provide deeper analytical backing for agronomists, extension officers, and analytical farmers.
- **Key Elements:**
  - Time-Range Filter: Last 12 Months, 5-Year Trends, 30-Year NASA POWER Agro-Climatology Normals.
  - Interactive Dual-Axis Chart: Monthly Rainfall bars (mm) combined with Temperature Max/Min curves (°C) and Reference Evapotranspiration ($ET_0$).
  - Growing Degree Days (GDD) Accumulation Chart: Showing crop maturity pacing under recent temperature shifts.
  - NASA Data Source Attribution Drawer: Mission badges (POWER, SMAP, ECOSTRESS, GPM) with API latency, spatial resolution, and last sync timestamp.

#### SCREEN 7: FARMER DECISION ASSISTANT & ACTIONABLE ALERTS
- **Purpose:** Translate scientific data into an operational farm calendar with day-to-day guidance.
- **Key Elements:**
  - Seasonal Action Timeline: Chronological feed of agronomic triggers:
    - "Optimal Sowing Window: Open in 6 days based on forecasted soil moisture."
    - "Fertilizer Application Alert: Delay application due to 85% probability of heavy runoff."
    - "Cover Crop Termination Date: Terminate 14 days prior to planting Cycle 1 to preserve subsoil moisture."
  - Agronomic Glossary Modal: Tap-to-read cards explaining technical terms (NDVI, ETa, field capacity) in simple farming analogies.

#### SCREEN 8: OFFLINE DATA SYNC & EXPORTABLE FARM REPORT
- **Purpose:** Manage offline storage for remote fieldwork and generate shareable documentation for banks and cooperatives.
- **Key Elements:**
  - Offline Sync Status Card: Network status badge (Online / Working Offline), last synced timestamp, cached plot count, and manual "Force Sync" button.
  - Export Center:
    - Download 2-Page Executive Summary (PDF): Designed for agricultural credit applications, demonstrating climate resilience to lenders.
    - Export CSV / JSON: Raw NASA meteorological observations and rotation timeline for farm management software.
  - Saved Farm Plots List: Switch between multiple fields and family properties.

#### SCREEN 9: MOBILE FIELD MODE (HIGH-SUNLIGHT OUTDOOR VIEW)
- **Purpose:** Dedicated ultra-high-contrast viewport layout designed for one-handed operation on low-cost smartphones in the middle of a sunlit field.
- **Key Elements:**
  - Extra-Large Bottom Navigation Bar (Thumb Zone): 4 large icons (Farm, Clima, Simulador, Alertas).
  - Monochromatic / High-Contrast Switch: Pure black background (`#000000`) with high-luminance neon green (`#10B981`) and white typography for zero sun-glare reflection.
  - Simplified Quick-Read Metrics: Giant percentage badges and straightforward traffic-light status icons.
  - Offline Banner: Floating discreet indicator confirming that all inputs and calculations remain active without cellular signal.

---

### 6. DELIVERABLES REQUESTED FROM STITCH
1. **Design Tokens & Theme Definition:** Complete Tailwind CSS color palette variables, typography classes, spacing scale, and container styles.
2. **Component Library Specifications:** Detailed anatomy, states (default, hover, active, disabled), and accessibility notes for:
   - Metric Badges & Status Semaphores
   - Crop Selector Carousel / Dropdown
   - Sustainability Circular Gauge & Linear Progress Bars
   - Interactive GIS Map Container
   - Dual-Axis Agroclimatic Chart Container
3. **Screen Layouts:** Complete UI wireframe structure, component placement, responsive breakpoint behaviors (Mobile: 375px, Tablet: 768px, Desktop: 1280px+), and clear visual annotations for all 9 screens described above.
```
