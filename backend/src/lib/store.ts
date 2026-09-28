import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_ROOT = path.resolve(__dirname, "../../data");
export const CV_PROFILES_DIR = path.join(DATA_ROOT, "profiles", "cv");
export const CL_PROFILES_DIR = path.join(DATA_ROOT, "profiles", "cover-letter");
export const APPLICATIONS_FILE = path.join(DATA_ROOT, "applications.json");

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function safeFileName(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "-");
  if (!cleaned) throw new Error("Invalid profile name");
  return cleaned;
}

export function listProfiles<T>(dir: string): { name: string; updatedAt: string; data: T }[] {
  ensureDir(dir);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getProfile<T>(dir: string, name: string): { name: string; updatedAt: string; data: T } | null {
  ensureDir(dir);
  const file = path.join(dir, `${safeFileName(name)}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function saveProfile<T>(dir: string, name: string, data: T): { name: string; updatedAt: string; data: T } {
  ensureDir(dir);
  const record = { name, updatedAt: new Date().toISOString(), data };
  fs.writeFileSync(path.join(dir, `${safeFileName(name)}.json`), JSON.stringify(record, null, 2));
  return record;
}

export function deleteProfile(dir: string, name: string): void {
  ensureDir(dir);
  const file = path.join(dir, `${safeFileName(name)}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function readApplications<T>(): T[] {
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    ensureDir(DATA_ROOT);
    fs.writeFileSync(APPLICATIONS_FILE, "[]");
    return [];
  }
  return JSON.parse(fs.readFileSync(APPLICATIONS_FILE, "utf-8"));
}

export function writeApplications<T>(applications: T[]): void {
  ensureDir(DATA_ROOT);
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(applications, null, 2));
}
