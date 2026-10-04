export type Language = "de" | "en";

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ProjectEntry {
  title: string;
  context: string;
  date: string;
  link?: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface LanguageEntry {
  name: string;
  level: string;
}

export interface Profile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  photo: string;
  summary: string;
  skills: SkillGroup[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  languages: LanguageEntry[];
}

export interface CvOverrides {
  summary?: string;
  skills?: SkillGroup[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
}

export interface CoverLetterText {
  opening: string;
  body: string;
  closing: string;
}

export interface BuildRequest {
  jobId: string;
  company: string;
  position: string;
  hiringManager?: string;
  language: Language;
  coverLetter: CoverLetterText;
  cv?: CvOverrides;
}

export interface BuildResponse {
  cvPath: string;
  coverLetterPath: string;
}
