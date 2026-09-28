import cors from "cors";
import express from "express";
import { buildDocuments, closeBrowser, OUTPUT_DIR } from "./builder.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3010;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/output", express.static(OUTPUT_DIR));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/build", async (req, res) => {
  try {
    const result = await buildDocuments(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: (err as Error).message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`CV Builder API listening on http://localhost:${PORT}`);
});

async function shutdown(): Promise<void> {
  await closeBrowser();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
