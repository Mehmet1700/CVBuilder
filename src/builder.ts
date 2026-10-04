import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";
import puppeteer, { Browser } from "puppeteer";
import type { BuildRequest, BuildResponse, CvOverrides, Language, Profile } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const TEMPLATES_DIR = path.join(ROOT_DIR, "templates");
const PROFILE_DIR = path.join(ROOT_DIR, "profile");
const PROFILE_FILE = path.join(PROFILE_DIR, "profile.json");
export const OUTPUT_DIR = path.join(ROOT_DIR, "output");

Handlebars.registerHelper("join", (items: string[] | undefined, sep: string) =>
  Array.isArray(items) ? items.join(sep) : ""
);

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function loadProfile(language: Language): Profile {
  const languageFile = path.join(PROFILE_DIR, `profile.${language}.json`);
  const file = fs.existsSync(languageFile) ? languageFile : PROFILE_FILE;
  if (!fs.existsSync(file)) {
    throw new Error(`Profile not found at ${PROFILE_FILE}. Fill in profile/profile.json first.`);
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function applyCvOverrides(profile: Profile, cv: CvOverrides | undefined): Profile {
  if (!cv) return profile;
  return {
    ...profile,
    summary: cv.summary ?? profile.summary,
    skills: cv.skills ?? profile.skills,
    experience: cv.experience ?? profile.experience,
    projects: cv.projects ?? profile.projects,
  };
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
  return value.map((v: string) => v.trim()).filter(Boolean);
}

const hasText = (value: string | undefined): boolean => Boolean(value?.trim());

// Drops blank placeholder entries (such as the empty ones in profile.json) so they never render.
function cleanProfile(profile: Profile): Profile {
  return {
    ...profile,
    skills: (profile.skills ?? [])
      .map((group) => ({ category: group.category?.trim() ?? "", items: stringList(group.items, "skills[].items") }))
      .filter((group) => group.category && group.items.length > 0),
    experience: (profile.experience ?? [])
      .filter((entry) => hasText(entry.title) || hasText(entry.company))
      .map((entry) => ({ ...entry, bullets: stringList(entry.bullets ?? [], "experience[].bullets") })),
    projects: (profile.projects ?? [])
      .filter((entry) => hasText(entry.title))
      .map((entry) => ({ ...entry, bullets: stringList(entry.bullets ?? [], "projects[].bullets") })),
    education: (profile.education ?? []).filter((entry) => hasText(entry.degree) || hasText(entry.institution)),
    languages: (profile.languages ?? []).filter((entry) => hasText(entry.name)),
  };
}

function loadPhotoDataUri(photoRef: string | undefined): string | undefined {
  if (!photoRef) return undefined;
  const photoPath = path.resolve(ROOT_DIR, photoRef);
  if (!fs.existsSync(photoPath)) return undefined;
  const ext = path.extname(photoPath).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return undefined;
  const base64 = fs.readFileSync(photoPath).toString("base64");
  return `data:${mime};base64,${base64}`;
}

function renderTemplate(kind: "cv" | "cover-letter", language: Language, context: Record<string, unknown>): string {
  const templateDir = path.join(TEMPLATES_DIR, kind, language);
  const html = fs.readFileSync(path.join(templateDir, "template.html"), "utf-8");
  const css = fs.readFileSync(path.join(templateDir, "style.css"), "utf-8");
  const compiled = Handlebars.compile(html);
  return compiled({ ...context, css });
}

function formatDate(language: Language, date: Date): string {
  return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildSalutation(language: Language, hiringManager?: string): string {
  const name = hiringManager?.trim();
  if (language === "en") return name ? `Dear ${name},` : "Dear Hiring Manager,";
  if (!name) return "Sehr geehrte Damen und Herren,";
  if (/^Herr\b/.test(name)) return `Sehr geehrter ${name},`;
  if (/^Frau\b/.test(name)) return `Sehr geehrte ${name},`;
  return `Sehr geehrte/r ${name},`;
}

function slugify(value: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "-");
  if (!cleaned) throw new Error("Invalid jobId");
  return cleaned;
}

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ headless: true });
  }
  return browserPromise;
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

function validateRequest(request: BuildRequest): void {
  const required: (keyof BuildRequest)[] = ["jobId", "company", "position", "language", "coverLetter"];
  for (const field of required) {
    if (!request[field]) throw new Error(`Missing required field: ${field}`);
  }
  if (request.language !== "de" && request.language !== "en") {
    throw new Error(`Unsupported language: ${request.language}`);
  }
  for (const field of ["opening", "body", "closing"] as const) {
    if (!request.coverLetter[field]) throw new Error(`Missing required field: coverLetter.${field}`);
  }
  if (request.cv !== undefined) {
    if (typeof request.cv !== "object" || request.cv === null) throw new Error("cv must be an object");
    if (request.cv.summary !== undefined && typeof request.cv.summary !== "string") {
      throw new Error("cv.summary must be a string");
    }
    for (const field of ["skills", "experience", "projects"] as const) {
      if (request.cv[field] !== undefined && !Array.isArray(request.cv[field])) {
        throw new Error(`cv.${field} must be an array`);
      }
    }
  }
}

export async function buildDocuments(request: BuildRequest): Promise<BuildResponse> {
  validateRequest(request);

  const profile = cleanProfile(applyCvOverrides(loadProfile(request.language), request.cv));
  const photo = request.language === "de" ? loadPhotoDataUri(profile.photo) : undefined;
  const today = new Date();
  const jobFolder = slugify(request.jobId);
  const nameSlug = profile.name.trim().replace(/\s+/g, "_");

  const cvHtml = renderTemplate("cv", request.language, { ...profile, photo });

  const coverLetterHtml = renderTemplate("cover-letter", request.language, {
    ...profile,
    company: request.company,
    position: request.position,
    salutation: buildSalutation(request.language, request.hiringManager),
    date: formatDate(request.language, today),
    opening_paragraph: request.coverLetter.opening,
    body_paragraph: request.coverLetter.body,
    closing_paragraph: request.coverLetter.closing,
  });

  const [cvPdf, coverLetterPdf] = await Promise.all([htmlToPdf(cvHtml), htmlToPdf(coverLetterHtml)]);

  const outputDir = path.join(OUTPUT_DIR, jobFolder);
  fs.mkdirSync(outputDir, { recursive: true });

  const cvFileName = `CV_${nameSlug}.pdf`;
  const coverLetterFileName = `CoverLetter_${nameSlug}.pdf`;

  fs.writeFileSync(path.join(outputDir, cvFileName), cvPdf);
  fs.writeFileSync(path.join(outputDir, coverLetterFileName), coverLetterPdf);

  return {
    cvPath: `/output/${jobFolder}/${cvFileName}`,
    coverLetterPath: `/output/${jobFolder}/${coverLetterFileName}`,
  };
}
