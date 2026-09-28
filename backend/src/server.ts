import cors from "cors";
import express from "express";
import { cvProfilesRouter, coverLetterProfilesRouter } from "./routes/profiles.js";
import { applicationsRouter } from "./routes/applications.js";
import { renderRouter, exportRouter } from "./routes/render.js";
import { closeBrowser } from "./lib/pdf.js";

const app = express();
const PORT = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 3010;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/profiles/cv", cvProfilesRouter);
app.use("/api/profiles/cover-letter", coverLetterProfilesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/render", renderRouter);
app.use("/api/export", exportRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const server = app.listen(PORT, () => {
  console.log(`CV Builder backend listening on http://localhost:${PORT}`);
});

async function shutdown(): Promise<void> {
  await closeBrowser();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
