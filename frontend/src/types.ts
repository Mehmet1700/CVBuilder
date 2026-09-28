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

export type ApplicationStatus = 'Draft' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  status: ApplicationStatus;
  cvProfile: string;
  clProfile: string;
}

export const emptyCvData: CvData = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  languages: [],
};

export const emptyCoverLetterData: CoverLetterData = {
  name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  date: new Date().toISOString().slice(0, 10),
  company: '',
  companyAddress: '',
  position: '',
  hiringManager: '',
  opening_paragraph: '',
  body_paragraph: '',
  closing_paragraph: '',
};
