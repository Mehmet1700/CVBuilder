import fs from "node:fs";
import path from "node:path";
import { CL_PROFILES_DIR, CV_PROFILES_DIR, getProfile } from "./lib/store.js";
import { renderTemplate } from "./lib/templateEngine.js";
import { htmlToPdf, closeBrowser } from "./lib/pdf.js";
import type { CoverLetterData, CvData } from "./types.js";

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[key] = value;
    }
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const baseDir = process.env.EXPORT_CWD || process.cwd();
  const outDir = path.resolve(baseDir, args["out-dir"] ?? "./exports");
  fs.mkdirSync(outDir, { recursive: true });

  if (!args.cv && !args.cl) {
    console.log(
      "Usage: npm run export -- --cv <cvProfileName> [--cl <coverLetterProfileName>] [--out-dir ./exports]"
    );
    process.exit(1);
  }

  if (args.cv) {
    const profile = getProfile<CvData>(CV_PROFILES_DIR, args.cv);
    if (!profile) {
      console.error(`CV profile "${args.cv}" not found.`);
    } else {
      const html = renderTemplate("cv", profile.data as unknown as Record<string, unknown>);
      const pdf = await htmlToPdf(html);
      const outFile = path.join(outDir, `CV-${args.cv}.pdf`);
      fs.writeFileSync(outFile, pdf);
      console.log(`Wrote ${outFile}`);
    }
  }

  if (args.cl) {
    const profile = getProfile<CoverLetterData>(CL_PROFILES_DIR, args.cl);
    if (!profile) {
      console.error(`Cover letter profile "${args.cl}" not found.`);
    } else {
      const html = renderTemplate("cover-letter", profile.data as unknown as Record<string, unknown>);
      const pdf = await htmlToPdf(html);
      const outFile = path.join(outDir, `Cover-Letter-${args.cl}.pdf`);
      fs.writeFileSync(outFile, pdf);
      console.log(`Wrote ${outFile}`);
    }
  }

  await closeBrowser();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
