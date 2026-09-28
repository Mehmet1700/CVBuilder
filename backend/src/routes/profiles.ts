import { Router } from "express";
import { CL_PROFILES_DIR, CV_PROFILES_DIR, deleteProfile, getProfile, listProfiles, saveProfile } from "../lib/store.js";
import type { CoverLetterData, CvData } from "../types.js";

function buildProfileRouter<T>(dir: string) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(listProfiles<T>(dir));
  });

  router.get("/:name", (req, res) => {
    const profile = getProfile<T>(dir, req.params.name);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(profile);
  });

  router.post("/", (req, res) => {
    const { name, data } = req.body as { name?: string; data?: T };
    if (!name || !data) {
      res.status(400).json({ error: "name and data are required" });
      return;
    }
    try {
      res.json(saveProfile<T>(dir, name, data));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.delete("/:name", (req, res) => {
    deleteProfile(dir, req.params.name);
    res.status(204).end();
  });

  return router;
}

export const cvProfilesRouter = buildProfileRouter<CvData>(CV_PROFILES_DIR);
export const coverLetterProfilesRouter = buildProfileRouter<CoverLetterData>(CL_PROFILES_DIR);
