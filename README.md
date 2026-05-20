# ArtistHub — Premium Portfolio & Studio CMS

ArtistHub is a high-end, modern, local-first portfolio and Content Management System (CMS) tailored specifically for professional visual artists and sculptors. Designed with minimalist gallery aesthetics, it provides a seamless visitor experience alongside a secure, browser-local private dashboard to manage the artist's CV, biography, gallery collection, and incoming customer inquiries.

---

## 🏛️ Purpose & Design Philosophy
The platform is crafted to match the sophisticated, tactile nature of physical art spaces. Drawing inspiration from fine art institutions, it features:
* **Rich Aesthetics**: Vibrant yet neutral palettes, soft brushed champagne gold accents (`#A88D65`), premium typography (`Cormorant Garamond` & `Inter`), and delicate dividers.
* **Responsive Sophistication**: Clean transitions, glassmorphic blurred overlays, smooth image zoom transitions, and light/dark theme synchronization.
* **Serverless & Local-First**: Zero databases to configure externally. The artist's entire gallery remains safely within their browser, enabling them to customize their portfolio and export files on the go.

---

## 🛠️ Technical Architecture

### 1. The Core Stack
* **Vite + React 19 + TypeScript**: A blazing-fast modern builder supplying type safety and Hot Module Replacement (HMR).
* **Tailwind CSS v4**: Utile and elegant layouts using high-fidelity spacing, fluid grids, and dark-mode directives.
* **Framer Motion**: Smooth page transitions, fade-in animations, and haptic feedback.
* **Lucide React**: Clean, lightweight geometric vector icons.

### 2. Private Client-Side Database (IndexedDB)
* Located in `src/db.ts`, the application manages a client-side database called `ArtistHubDB` via standard browser IndexedDB APIs.
* **Auto-Seeding**: Upon initial launch, the system automatically seeds default profile info (representing the sculptor **Eleonora Vance**), collections list, and sample high-definition artworks.
* **Base64 Storage**: Supports uploading high-quality images directly from the local disk, converting them into optimized Base64 data strings stored safely inside the browser's storage sandbox.

### 3. Secure Studio Access Gate (Hybrid Security)
Because the CMS is built into the frontend bundle, access to `/studio` is secured through a hybrid approach:
* **Hashed Passcode Gate**: Access to the Studio is restricted by a passcode check screen. The passcode is cryptographically validated using the browser's native `crypto.subtle` SHA-256 API, meaning the plaintext passcode is never exposed in the source code or javascript chunks.
  * *Default Passcode*: `1988` (the artist's birth year).
  * *Session Persistence*: Supports temporary tabs-only sessions (`sessionStorage`) or persistent authorization (`localStorage`) with a 30-day "Remember Me" option.
* **Hidden Entrances**:
  * *Keyboard Shortcut*: Pressing `Ctrl + Shift + S` from any page redirects the user to `/studio`.
  * *Triple-Click trigger*: Triple-clicking the copyright text in the website `Footer` opens the gate.
  * The link is entirely hidden from normal site navigation to maintain professional presentation.

---

## 📂 Component Directory & Page Breakdown

```
src/
├── components/
│   ├── Navbar.tsx         # Sticky navigation with fluid theme toggle (Sun/Moon icons) and responsive drawer
│   └── Footer.tsx         # Minimalist credits, social indicators, and hidden triple-click copyright trigger
├── pages/
│   ├── LandingPage.tsx    # High-impact split hero page showing philosophy and featured pieces grid
│   ├── GalleryPage.tsx    # Fully filterable archive (by collection type/availability) with rich Lightbox modals
│   ├── AboutPage.tsx      # Comprehensive biography alongside a beautifully structured, dynamic academic CV
│   └── StudioPage.tsx     # The admin dashboard featuring overview statistics, catalog editors, and inbox managers
├── db.ts                  # Local-first IndexedDB manager handling CRUD transactions and initial seed records
├── types.ts               # Rigid TypeScript interfaces for Artworks, Profiles, Inquiries, and CV structures
└── main.tsx & App.tsx     # Application router setup with global keyboard shortcuts and Framer Motion wrappers
```

---

## 🚀 Setup & Local Development

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or similar package managers

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd artisthub
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Run the development server locally:
   ```bash
   npm run dev
   ```
4. Access the site in your browser (typically `http://localhost:5175`).

---

## 🎨 Advanced Configurations

### Custom Passcode Hash
To change the default passcode (`1988`), generate a SHA-256 hash of your chosen passcode and provide it as an environment variable in a `.env` file at the root of the project:
```env
VITE_STUDIO_PASSCODE_HASH="your_sha256_hash_here"
```

### Production Bundling
Compile the application into optimized static assets ready to be served on platforms like Netlify, Vercel, or GitHub Pages:
```bash
npm run build
```
The compiled output will be generated inside the `/dist` directory.
