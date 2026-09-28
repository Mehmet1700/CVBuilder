import { randomUUID } from "node:crypto";
import { Router } from "express";
import { readApplications, writeApplications } from "../lib/store.js";
import type { Application } from "../types.js";

export const applicationsRouter = Router();

applicationsRouter.get("/", (_req, res) => {
  res.json(readApplications<Application>());
});

applicationsRouter.post("/", (req, res) => {
  const body = req.body as Omit<Application, "id">;
  if (!body.jobTitle || !body.company) {
    res.status(400).json({ error: "jobTitle and company are required" });
    return;
  }
  const applications = readApplications<Application>();
  const application: Application = { id: randomUUID(), ...body };
  applications.push(application);
  writeApplications(applications);
  res.status(201).json(application);
});

applicationsRouter.put("/:id", (req, res) => {
  const applications = readApplications<Application>();
  const index = applications.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  applications[index] = { ...applications[index], ...req.body, id: req.params.id };
  writeApplications(applications);
  res.json(applications[index]);
});

applicationsRouter.delete("/:id", (req, res) => {
  const applications = readApplications<Application>().filter((a) => a.id !== req.params.id);
  writeApplications(applications);
  res.status(204).end();
});
