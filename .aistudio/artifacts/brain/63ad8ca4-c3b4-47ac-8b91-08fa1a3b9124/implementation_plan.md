# FolioCraft — Offline-First Ebook & Print Book Publisher

An offline-first desktop book formatting and publishing studio inspired by Atticus and Vellum. Enables authors to write, organize front/body/back matter, apply ornamental chapter presets, preview across simulated devices and print trim sizes, and export publication-ready EPUB 3, Print PDF, HTML, and Markdown entirely in the browser without server dependencies.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the interactive interview:
> - **Export Formats**: EPUB 3 (Kindle, Apple Books, Kobo), Print-ready PDF (Amazon KDP & IngramSpark trim sizes with bleeds and gutters), and clean HTML/Markdown exports.
> - **Design Presets**: Multi-genre suite featuring Classic Literary, Modern Minimalist, Fantasy/Romance Flourishes (with vector fleurons & drop caps), and Contemporary Non-Fiction.
> - **Persistence Architecture**: 100% offline-first IndexedDB storage with automatic draft saving, JSON archive backup/restore, and EPUB/DOCX/Markdown file ingestion.

---

### 1. Overview & Core Concept

**FolioCraft** brings professional book design, typesetting, and publishing capabilities into a zero-latency, hermetic offline web application. 

- **Target Persona**: Independent authors, self-publishers, indie presses, and editors seeking an accessible, beautiful alternative to Vellum (Mac-only) and Atticus without subscription lock-in or cloud upload risks.
- **Key Value**: Write or paste manuscripts; manage parts, chapters, and front/back matter; customize typography and ornamental headers with real-time feedback; preview in Kindle, iPad, and physical print book layouts; and export pristine files ready for KDP, IngramSpark, and Apple Books.

---

### 2. User Experience & Visual Design

#### A. Studio Workspace Layout (3-Pane Interface)
Following SaaS desktop productivity standards (1440px optimized desktop baseline with responsive collapse):

1. **Left Navigation Rail (Book Structure & Matter)**
   - **Front Matter**: Title Page, Copyright & Legal, Dedication, Epigraph, Table of Contents.
   - **Manuscript Body**: Parts, Chapters, Interludes, and Prologs with reordering, active word counters, and status badges (Draft, Revised, Final).
   - **Back Matter**: Epilogue, Acknowledgments, About the Author, Also By / Catalog, Newsletter CTA.
   - Actions to add chapters, import `.docx`/`.md`/`.txt` files, and reorder sections.

2. **Center Pane (Distraction-Free Manuscript Editor)**
   - Rich typographic editing area with generous margins and measure ($65\text{ch}–75\text{ch}$).
   - Contextual formatting bar: H1/H2, Bold, Italic, Small Caps, Blockquote, Verse/Poetry, Footnotes, Images with captions, and Ornamental Scene Breaks.
   - Per-chapter controls: Chapter number toggle, subtitle, drop cap enable/disable, and custom epigraphs.

3. **Right Pane (Dynamic Device & Print Previewer)**
   - Interactive toggle between:
     - **E-Reader**: Kindle Paperwhite 6.8" (monochrome E-ink aesthetic, font scale slider, line height, Bookerly/Baskerville font simulation).
     - **Tablet / Phone**: iPad Air & iPhone 15 Pro (Apple Books styling, Light / Sepia / Dark mode simulation).
     - **Print Book Spread**: Amazon KDP / IngramSpark specifications (5"×8", 5.5"×8.5", 6"×9", custom trim), two-page recto/verso layout with inner gutter margin, running header (Title on verso, Chapter/Author on recto), and bottom folio page numbers.

4. **Dedicated Publishing & Theme Inspector**
   - **Styles & Themes**: 4 pre-crafted genre presets + custom style builder (drop cap depth, ornamental fleurons/dividers, chapter title fonts, body serif choices).
   - **Book Details & Metadata**: Title, Subtitle, Author, Series Name/Number, ISBN-13 (eBook & Print), Publisher, Description, Category tags.
   - **Export Center**: One-click generation of EPUB 3, Print PDF, HTML, Markdown, and Full Project JSON.

#### B. Visual Identity & Design System
- **Color Discipline (60-30-10)**:
  - 60% Neutral Canvas: Deep dark slate workspace (`#090D16` / `#0F172A`) or crisp editorial light mode (`#F8F9FA` / `#FFFFFF`).
  - 30% Structural Surfaces: Hairline dividers (`border-neutral-200 dark:border-neutral-800`), book paper tones (Cream `#FDFBF7`, Pure White `#FFFFFF`, Dark Slate `#18181B`).
  - 10% High-Intent Accent: Warm bronze/amber (`#D97706` / `#F59E0B`) reminiscent of fine leather bookbinding and foil stamping.
- **Typography**:
  - Studio UI: `Plus Jakarta Sans` for clean, high-density menus and controls.
  - Book Typography Presets: Classic Garamond (`EB Garamond` / `Source Serif 4`), Elegant Literary (`Playfair Display` / `Merriweather`), Modern Sans (`Manrope` / `Outfit`), and Monospace for technical callouts.

---

### 3. Key Product Decisions & Trade-Offs

- **Pure Client-Side EPUB 3 Packaging**:
  - *Approach*: Generates standards-compliant EPUB 3 files using in-memory zip packaging (container.xml, content.opf, toc.ncx, nav.xhtml, CSS stylesheet, XHTML chapter files, embedded fonts and cover image).
  - *Why*: Guarantees instant offline exports without cloud latency, zero external API costs, and 100% privacy for unpublished manuscripts.
  
- **Print-Ready PDF via CSS Paged Media & Formatted Print View**:
  - *Approach*: Implements high-precision `@media print` CSS rules with `@page` declarations (`size`, `margin`, `@top-left`, `@top-right`, `@bottom-center`, page break controls: `break-before: right` for recto starts). In addition, provides direct downloadable printable HTML and canvas/PDF generation for direct file saving.
  - *Why*: Matches professional publishing standards where odd pages start on the right and margins account for binding gutter depth.

- **Offline-First Persistence (IndexedDB + Service Worker)**:
  - *Approach*: Built-in IndexedDB repository storing books, chapters, images, and user themes, backed by Vite PWA service worker caching all web assets.
  - *Why*: Ensures the author can write and format on airplanes, trains, or off-grid cabins without connectivity.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FolioCraft Studio App                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Left Rail        │      │ Central Editor   │      │ Right Inspector  │
│ - Front Matter   │      │ - WYSIWYG Editor │      │ - Device Preview │
│ - Parts & Chap.  │ ───► │ - Chapter Props  │ ───► │   (Kindle/Print) │
│ - Back Matter    │      │ - Drop Caps      │      │ - Style Theme    │
│ - Import DOCX/MD │      │ - Scene Breaks   │      │ - Export Center  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                           │                        │
        └───────────────────────────┼────────────────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │ Central State & IndexedDB    │
                     │ - Projects & Active Book     │
                     │ - Auto-Save Engine (500ms)   │
                     │ - Undo/Redo History          │
                     └──────────────┬───────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ EPUB 3 Compiler  │      │ Print Engine     │      │ PWA & Storage    │
│ - content.opf    │      │ - Paged Media    │      │ - IndexedDB DB   │
│ - nav.xhtml      │      │ - Trim Sizes     │      │ - Service Worker │
│ - Chapter XHTML  │      │ - Gutter/Margins │      │ - JSON Backup    │
│ - CSS & Images   │      │ - PDF Export     │      │ - Install Hook   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

#### Key Data Models
- **BookProject**: `id`, `title`, `subtitle`, `author`, `publisher`, `isbn`, `language`, `coverImage`, `themeId`, `customStyles`, `trimSize`, `updatedAt`.
- **BookSection**: `id`, `bookId`, `type` (`'front'` | `'body'` | `'back'`), `subtype` (`'title-page'` | `'copyright'` | `'dedication'` | `'chapter'` | `'part'` | `'about-author'` | etc.), `title`, `subtitle`, `content` (HTML/rich text), `order`, `includeInToc`, `dropCap`, `ornamentStyle`.
- **BookTheme**: `id`, `name`, `headingFont`, `bodyFont`, `ornamentSvg`, `dropCapStyle`, `pageNumberStyle`, `chapterNumberFormat` (`Roman`, `Arabic`, `Worded`, `None`).

---

### 5. Execution Steps Plan

1. **Project Infrastructure & Dependencies**:
   - Install required packages: `jszip` (for standard client-side EPUB packaging), `lucide-react` (already present), and `vite-plugin-pwa` for offline PWA compliance.
   - Configure Tailwind v4 font imports, custom variants, and print media rules.

2. **Offline Data Persistence Layer**:
   - Implement `src/services/storage.ts` using IndexedDB for seamless storage of books, chapters, custom covers, and settings.
   - Provide pre-populated starter classic book (e.g., "The Time Machine" or a complete demo novel) so users can immediately experience formatting and exports on first launch.

3. **Core Publisher Modules**:
   - `BookNavPane`: Drag-and-drop / reordering list of Front Matter, Parts, Chapters, and Back Matter with word count stats.
   - `ManuscriptEditor`: WYSIWYG book editor with formatting toolbar (headers, blockquotes, verse, footnotes, scene breaks with decorative fleurons, drop caps).
   - `DevicePreviewer`: Authentic simulator for Kindle Paperwhite (E-ink), iPad/iPhone (Apple Books), and Two-Page Print Spreads with trim sizes (5"x8", 5.5"x8.5", 6"x9").
   - `StyleThemeInspector`: Preset switcher (Literary, Modern, Fantasy, Non-Fiction) with deep customization for fonts, fleurons, and running headers.
   - `ExportCenter`: Instant client-side packaging for EPUB 3 (`.epub`), Print PDF generation, clean HTML, Markdown, and JSON project backup.
   - `PWAInstallButton` & `OfflineIndicator`: Complete PWA install and offline status integration.

4. **Verification & Testing**:
   - Compile and lint applet without errors.
   - Validate EPUB packaging structure against standard EPUB 3 specs.
   - Verify print layout styles, trim size geometry, and device simulator toggles.
