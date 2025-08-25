# WBR Weekly Metrics App (Static, GitHub Pages + Firebase)

A simple static web app for employees to enter **weekly actuals** and view **side-by-side progress** against **hard-coded targets** taken from your deck. Data is **isolated by month** (YYYY-MM), so each new month is a fresh sheet without manual deletion.

## Features
- Location + Week selector (Week 1–4)
- Fixed **Targets** sourced from the deck (yellow column)
- Enter **Actuals** per week
- **Side-by-side** table: Target | Week 1 | Week 2 | Week 3 | Week 4
- Monthly soft reset: app writes to `entries_YYYY-MM` collection per month
- Runs on **GitHub Pages** (no bundler). Uses Firebase via CDN.
- **Two visualization tables** matching your deck:  
    - "Performance / Forms / Commitments"
    - "Health Metrics"
- **Focus & Commitments** section as a separate data entry form

## One-time Setup
1. Create a Firebase project → Firestore database.
2. In **Project Settings → General**, copy the web app config and paste into `main.js`:
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
3. In Firestore, start in **test mode** (or add rules permitting reads/writes for your team).
   - Recommended rule for internal testing only:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if true; // tighten before production
         }
       }
     }
     ```

## Deploy on GitHub Pages
1. Create a repo, e.g., `wbr-weekly-app`.
2. Add these files to the repo root:
   - `index.html`
   - `main.js`
   - `targets.js`
   - `README.md`
3. Commit and push.
4. In **Settings → Pages**, set **Branch: main**, **Folder: /(root)**.
5. Open your Pages URL to use the app.

## Monthly Reset
The app uses `monthKey = YYYY-MM` and writes to a collection named `entries_YYYY-MM`. On a new month, it writes to a new collection, effectively clearing prior data from the current UI without deleting history. If you want hard deletes, you can add an admin page or a scheduled function later.

## Adjusting Targets & Sections
Targets and metric groupings are defined in `targets.js` to match your slides.  
To add/remove metrics or adjust groupings/sections, edit `SLIDE1_SECTIONS`, `SLIDE2_SECTIONS`, `FOCUS_COMMITMENTS_ROWS`, and `TARGET_METRICS` directly.

## Notes
- This app is intentionally simple: no auth, no backend. Add Firebase Auth if you need sign-ins.
- Concurrent edits are merged per week per location (last write wins per metric).
- **Your Firebase config must be set in `main.js` for the app to work.**

---

© You