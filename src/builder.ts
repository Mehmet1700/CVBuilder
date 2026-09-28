import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";
import puppeteer, { Browser } from "puppeteer";
import type { BuildRequest, BuildResponse, Language, Profile } from "./types.js";

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

function loadProfile(): Profile {
  if (!fs.existsSync(PROFILE_FILE)) {
    throw new Error(`Profile not found at ${PROFILE_FILE}. Fill in profile/profile.json first.`);
  }
  return JSON.parse(fs.readFileSync(PROFILE_FILE, "utf-8"));
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
}

export async function buildDocuments(request: BuildRequest): Promise<BuildResponse> {
  validateRequest(request);

  const profile = loadProfile();
  const photo = loadPhotoDataUri(profile.photo);
  const today = new Date();
  const jobFolder = slugify(request.jobId);
  const nameSlug = profile.name.trim().replace(/\s+/g, "_");

  const cvHtml = renderTemplate("cv", request.language, { ...profile, photo });

  const coverLetterHtml = renderTemplate("cover-letter", request.language, {
    ...profile,
    photo,
    company: request.company,
    position: request.position,
    hiringManager: request.hiringManager,
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
