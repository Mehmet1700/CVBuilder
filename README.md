# CV Builder

A local, template-based CV & Cover Letter builder. One fixed design for each document — only
the text content changes per application. Export to print-ready A4 PDFs via headless Chrome
(Puppeteer). No AI involved; it's a pure template engine (Handlebars).

## Stack

- **Frontend**: React + Vite + TypeScript (`frontend/`)
- **Backend**: Node.js + Express + TypeScript (`backend/`)
- **Templates**: Handlebars HTML/CSS (`templates/`)
- **PDF export**: Puppeteer (headless Chrome)
- **Storage**: JSON files on disk (`backend/data/`) — no database

## Project structure

```
CVBuilder/
├── frontend/         # React (Vite) dashboard UI
├── backend/          # Express API + PDF export + JSON storage
│   └── data/
│       ├── profiles/cv/            # saved CV profiles (*.json)
│       ├── profiles/cover-letter/  # saved cover letter profiles (*.json)
│       └── applications.json       # applications tracker
└── templates/
    ├── cv/               # template.html + style.css
    └── cover-letter/     # template.html + style.css
```

## Setup

Requires Node.js 18+.

```bash
npm run install:all
```

This installs dependencies for the root, `backend/`, and `frontend/` workspaces (Puppeteer will
also download a bundled Chromium on first install).

## Development

```bash
npm run dev
```

Runs both servers concurrently:
- Backend API: http://localhost:3010
- Frontend dashboard: http://localhost:5173 (open this in your browser)

The Vite dev server proxies `/api/*` requests to the backend, so no CORS configuration is
needed while developing.

## Using the app

1. **CV Editor** — fill in your details (contact info, summary, skills, experience, education,
   languages). The live preview on the right re-renders as you type.
2. **Cover Letter Editor** — fill in company/position and the three paragraphs. You can pull
   your name/contact details from an existing saved CV profile with the "Load from CV profile"
   dropdown.
3. **Save as Template** — save the current CV or cover letter content as a named profile (e.g.
   "Data Science DE", "Data Science EN"). Saved profiles can be reloaded and edited any time.
4. **Export PDF** — renders the current form data through the template and downloads a
   print-ready A4 PDF.
5. **Applications** — track job applications (title, company, date, status) and record which
   CV/cover-letter profile was used for each one.

## Building for production

```bash
npm run build
```

Compiles the backend (`backend/dist`) and builds the frontend (`frontend/dist`).

## Exporting from the command line

You can generate PDFs directly from saved profiles without running the servers:

```bash
npm run export -- --cv "Data Science EN" --cl "TechCorp DE" --out-dir ./exports
```

Both `--cv` and `--cl` are optional (pass either or both); profile names must match a saved
profile exactly. PDFs are written to `--out-dir` (defaults to `./exports`).

## Editing the design

The CV and cover letter layouts are fixed templates — edit `templates/cv/template.html` /
`style.css` or `templates/cover-letter/template.html` / `style.css` to change the design. Both
the live preview and PDF export use the same templates, so changes apply everywhere
immediately (no restart needed in dev).
