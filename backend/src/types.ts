export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ExperienceEntry {
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
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

export interface CvData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: SkillGroup[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  languages: LanguageEntry[];
}

export interface CoverLetterData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  date: string;
  company: string;
  companyAddress: string;
  position: string;
  hiringManager: string;
  opening_paragraph: string;
  body_paragraph: string;
  closing_paragraph: string;
}

export interface Profile<T> {
  name: string;
  updatedAt: string;
  data: T;
}

export type ApplicationStatus = "Draft" | "Applied" | "Interview" | "Offer" | "Rejected";

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  status: ApplicationStatus;
  cvProfile: string;
  clProfile: string;
}
