import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, "../../../templates");

Handlebars.registerHelper("join", (items: string[] | undefined, sep: string) =>
  Array.isArray(items) ? items.join(sep) : ""
);

const compiledCache = new Map<string, Handlebars.TemplateDelegate>();

function readTemplateFiles(templateDir: string): { html: string; css: string } {
  const html = fs.readFileSync(path.join(templateDir, "template.html"), "utf-8");
  const css = fs.readFileSync(path.join(templateDir, "style.css"), "utf-8");
  return { html, css };
}

function getCompiledTemplate(templateName: "cv" | "cover-letter"): {
  template: Handlebars.TemplateDelegate;
  css: string;
} {
  const templateDir = path.join(TEMPLATES_ROOT, templateName);
  const cacheKey = templateName;

  if (!compiledCache.has(cacheKey)) {
    const { html } = readTemplateFiles(templateDir);
    compiledCache.set(cacheKey, Handlebars.compile(html));
  }

  // CSS is re-read (cheap) so edits are picked up without restarting in dev.
  const { css } = readTemplateFiles(templateDir);
  return { template: compiledCache.get(cacheKey)!, css };
}

export function renderTemplate(
  templateName: "cv" | "cover-letter",
  data: Record<string, unknown>
): string {
  const { template, css } = getCompiledTemplate(templateName);
  return template({ ...data, css });
}
