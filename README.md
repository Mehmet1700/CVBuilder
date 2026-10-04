# CV Builder

A local PDF generation engine for job applications. It takes your profile data plus per-job
details (company, position, cover letter text, language, optional CV tailoring) and produces a
matching CV and cover letter as print-ready A4 PDFs. The engine itself uses no AI and no
database: it renders Handlebars templates through headless Chrome (Puppeteer). An optional LLM
prompt for writing the text is included (see below).

## How it works

1. You fill in the profile files in `profile/` once (name, contact info, skills, experience,
   projects, education, languages).
2. For each job you apply to, you call `POST /api/build` with the job-specific details: company,
   position, hiring manager, language, the three cover letter paragraphs and, optionally, a CV
   tailored to the posting.
3. The server renders your profile and the job data through the fixed templates in `templates/`,
   converts them to PDF, and writes them to `output/{jobId}/`.

## Project structure

```
CVBuilder/
├── templates/
│   ├── cv/
│   │   ├── de/             # German CV template (template.html + style.css)
│   │   └── en/             # English CV template
│   └── cover-letter/
│       ├── de/             # German cover letter (DIN 5008 style)
│       └── en/             # English cover letter
├── profile/
│   ├── profile.json        # Your data in English (also the fallback for any language)
│   ├── profile.de.json     # Your data in German, used for German applications
│   ├── photo.jpg           # Optional profile photo (gitignored, add your own)
│   └── facts.md            # Optional fact pool for the LLM prompt (gitignored)
├── prompts/
│   └── application.md      # LLM prompt that writes the letter and tailors the CV as /api/build JSON
├── output/                 # Generated PDFs land here, one folder per job (gitignored)
├── src/
│   ├── server.ts           # Express API
│   ├── builder.ts          # Core: profile + job JSON, rendered to PDF via Puppeteer
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

Edit `profile/profile.json` (English) and `profile/profile.de.json` (German):

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
  "projects": [
    {
      "title": "",
      "context": "",
      "date": "",
      "link": "",
      "bullets": ["", ""]
    }
  ],
  "education": [ ... ],
  "languages": [ ... ]
}
```

Notes:
- **Languages:** a German application uses `profile.de.json` if it exists, so the German CV shows
  German skill categories, language names and levels. Any other language uses `profile.json`. If
  `profile.de.json` is missing, `profile.json` is used for everything.
- `skills` is grouped by category (each group renders as its own block in the sidebar).
- `experience`, `projects` and `education` are arrays, so add as many entries as you need. Blank
  entries (such as the empty placeholders above) are dropped automatically, and a section with no
  entries is hidden.
- `photo` points at an image file relative to the project root. The photo appears on the German CV
  only, in the top right. The English CV never shows a photo. If the file doesn't exist, the
  photo is simply omitted.
- `photo.jpg` is gitignored, since it's personal data. Add your own file at that path.
- The German template crops the photo to head and shoulders with `object-view-box` in
  `templates/cv/de/style.css`. If your photo is framed differently, adjust that line; the
  original file is never modified.

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
  },
  "cv": {
    "summary": "...",
    "skills": [{ "category": "Programmierung", "items": ["Python", "SQL"] }],
    "experience": [],
    "projects": []
  }
}
```

- `language` is `"de"` or `"en"` and selects the template set and the profile file.
- `hiringManager` is optional. If omitted, the German letter opens with "Sehr geehrte Damen und
  Herren," and the English one with "Dear Hiring Manager,". In German, pass it with the form of
  address: `"Frau Dr. Schmidt"` gives "Sehr geehrte Frau Dr. Schmidt,", `"Herr Müller"` gives
  "Sehr geehrter Herr Müller,", and a bare `"Dr. Weber"` gives "Sehr geehrte/r Dr. Weber,".
- `cv` is optional and tailors the CV to one job. Each key is optional and replaces the matching
  section from the profile: `summary` (string), `skills`, `experience` and `projects` (arrays with
  the same entry shape as in the profile files). An empty array hides that section. Name, contact
  details, education and languages always come from the profile.
- Any extra keys in the body (for example the `report` and `facts` the LLM prompt returns) are
  ignored.
- `jobId` is used as the output folder name; it's sanitized to safe filename characters.
- Invalid input returns HTTP 400 with `{ "error": "..." }`.

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
      "opening": "ich möchte bei Siemens an der Prognose von Energiedaten arbeiten.",
      "body": "In meinem Masterstudium habe ich Prognosemodelle mit Python und SQL gebaut.",
      "closing": "Über ein Gespräch, in dem ich die Projekte zeige, würde ich mich freuen."
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

## Page limits

Both documents are meant to fit one A4 page, and anything longer is not trimmed for you:

- **Cover letter:** overflows at about 2,300 characters of text in total.
- **CV:** with two-line bullets, 3 entries with 9 bullets or 4 entries with 8 bullets fit
  (entries are experience and projects together). A longer CV continues on a second page.

## Writing the text with an LLM

`prompts/application.md` contains a ready-to-use prompt for DeepSeek (or any chat model). Give it a
job posting and your fact pool, and it returns the exact JSON body for `POST /api/build`: the
three letter paragraphs and a CV tailored to the posting. It also returns a short report with
matched requirements, gaps and things to verify before sending. The prompt enforces the page
limits above, and every CV entry cites the facts it was built from so you can check each claim.

## Editing the design

Each language has its own fixed template. Edit the `template.html` and `style.css` pair under
`templates/cv/{de,en}/` or `templates/cover-letter/{de,en}/` to change the design. Changes apply
on the next `/api/build` call, no restart needed.
