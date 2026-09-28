# CV Builder

A local PDF generation engine for job applications. It takes your static profile data plus
per-job details (company, position, cover letter text, language) and produces a matching CV and
cover letter as print-ready A4 PDFs — no AI, no database, just Handlebars templates rendered
through headless Chrome (Puppeteer).

## How it works

1. You fill in `profile/profile.json` once with your personal data (name, contact info, skills,
   experience, education, languages).
2. For each job you apply to, you call `POST /api/build` with the job-specific details (company,
   position, hiring manager, language, and the three cover letter paragraphs).
3. The server renders your profile + job data through the fixed templates in `templates/`,
   converts them to PDF, and writes them to `output/{jobId}/`.

## Project structure

```
CVBuilder/
├── templates/
│   ├── cv/
│   │   ├── de/            # German CV template (template.html + style.css)
│   │   └── en/            # English CV template
│   └── cover-letter/
│       ├── de/            # German cover letter (DIN 5008 style)
│       └── en/             # English cover letter
├── profile/
│   ├── profile.json       # Your static personal data (fill in once)
│   └── photo.jpg          # Optional profile photo (gitignored — add your own)
├── output/                 # Generated PDFs land here, one folder per job (gitignored)
├── src/
│   ├── server.ts           # Express API
│   ├── builder.ts          # Core: profile + job JSON → rendered PDF via Puppeteer
│   └── types.ts
├── package.json
└── README.md
```

## Setup

Requires Node.js 18+.

```bash
npm install
```

Puppeteer downloads a bundled Chromium on first install.

### Fill in your profile

Edit `profile/profile.json`:

```json
{
  "name": "Mehmet Karaca",
  "title": "Data Scientist",
  "email": "you@example.com",
  "phone": "",
  "location": "Lisbon, Portugal",
  "linkedin": "",
  "github": "github.com/Mehmet1700",
  "photo": "./profile/photo.jpg",
  "summary": "",
  "skills": [
    { "category": "Programming", "items": ["Python", "SQL", "R"] }
  ],
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": ["", "", ""]
    }
  ],
  "education": [ ... ],
  "languages": [ ... ]
}
```

Notes:
- `skills` is grouped by category (each group renders as its own block in the sidebar).
- `experience` and `education` are arrays — add as many entries as you need. An entry with only
  empty strings still renders as a (blank) block, so remove the placeholder entry or fill it in
  before generating a real application.
- `photo` should point at an image file relative to the project root. If the file doesn't exist,
  the templates simply omit the photo — it's optional.
- `photo.jpg` is gitignored, since it's personal data. Add your own file at that path; it never
  gets committed.

## Development

```bash
npm run dev
```

Starts the API on **http://localhost:3010** with auto-reload on file changes.

## Building for production

```bash
npm run build   # compiles to dist/
npm start       # runs the compiled server
```

## API

### `GET /api/health`

```json
{ "status": "ok" }
```

### `POST /api/build`

Request body:

```json
{
  "jobId": "2026-09-28_Siemens_DataScientist",
  "company": "Siemens",
  "position": "Data Scientist",
  "hiringManager": "Dr. Müller",
  "language": "de",
  "coverLetter": {
    "opening": "...",
    "body": "...",
    "closing": "..."
  }
}
```

- `language` is `"de"` or `"en"` and selects which template set to render.
- `hiringManager` is optional — the German template falls back to "Sehr geehrte Damen und
  Herren," and the English one to "Dear Hiring Manager," if omitted.
- `jobId` is used as the output folder name; it's sanitized to safe filename characters.

Response:

```json
{
  "cvPath": "/output/2026-09-28_Siemens_DataScientist/CV_Mehmet_Karaca.pdf",
  "coverLetterPath": "/output/2026-09-28_Siemens_DataScientist/CoverLetter_Mehmet_Karaca.pdf"
}
```

The returned paths are also served statically, so you can fetch the PDFs directly at
`http://localhost:3010{cvPath}`.

### Example

```bash
curl -X POST http://localhost:3010/api/build \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "2026-09-28_Siemens_DataScientist",
    "company": "Siemens",
    "position": "Data Scientist",
    "hiringManager": "Dr. Müller",
    "language": "de",
    "coverLetter": {
      "opening": "mit großem Interesse habe ich Ihre Stellenanzeige gelesen.",
      "body": "In meinem Masterstudium habe ich fundierte Kenntnisse in Python und SQL erworben.",
      "closing": "Über die Einladung zu einem persönlichen Gespräch würde ich mich sehr freuen."
    }
  }'
```

## Output folder structure

```
output/
└── {jobId}/
    ├── CV_Mehmet_Karaca.pdf
    └── CoverLetter_Mehmet_Karaca.pdf
```

Each call to `/api/build` creates (or overwrites) one folder per `jobId`, containing both PDFs.

## Editing the design

Each language has its own fixed template — edit the `template.html` / `style.css` pair under
`templates/cv/{de,en}/` or `templates/cover-letter/{de,en}/` to change the design. Changes apply
immediately on the next `/api/build` call, no restart needed.
