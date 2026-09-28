import { Router } from "express";
import { renderTemplate } from "../lib/templateEngine.js";
import { htmlToPdf } from "../lib/pdf.js";

export const renderRouter = Router();
export const exportRouter = Router();

function safePdfName(base: string): string {
  const cleaned = (base || "document").trim().replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "-");
  return cleaned || "document";
}

renderRouter.post("/cv", (req, res) => {
  res.send(renderTemplate("cv", req.body ?? {}));
});

renderRouter.post("/cover-letter", (req, res) => {
  res.send(renderTemplate("cover-letter", req.body ?? {}));
});

exportRouter.post("/cv", async (req, res) => {
  try {
    const html = renderTemplate("cv", req.body ?? {});
    const pdf = await htmlToPdf(html);
    const fileName = safePdfName(req.body?.name ? `CV-${req.body.name}` : "CV");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

exportRouter.post("/cover-letter", async (req, res) => {
  try {
    const html = renderTemplate("cover-letter", req.body ?? {});
    const pdf = await htmlToPdf(html);
    const fileName = safePdfName(
      req.body?.company ? `Cover-Letter-${req.body.company}` : "Cover-Letter"
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});
