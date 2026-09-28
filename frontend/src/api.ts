import type { Application, CoverLetterData, CvData, Profile } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  cvProfiles: {
    list: () => request<Profile<CvData>[]>('/api/profiles/cv'),
    save: (name: string, data: CvData) =>
      request<Profile<CvData>>('/api/profiles/cv', {
        method: 'POST',
        body: JSON.stringify({ name, data }),
      }),
    remove: (name: string) =>
      request<void>(`/api/profiles/cv/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  },
  coverLetterProfiles: {
    list: () => request<Profile<CoverLetterData>[]>('/api/profiles/cover-letter'),
    save: (name: string, data: CoverLetterData) =>
      request<Profile<CoverLetterData>>('/api/profiles/cover-letter', {
        method: 'POST',
        body: JSON.stringify({ name, data }),
      }),
    remove: (name: string) =>
      request<void>(`/api/profiles/cover-letter/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  },
  applications: {
    list: () => request<Application[]>('/api/applications'),
    create: (application: Omit<Application, 'id'>) =>
      request<Application>('/api/applications', {
        method: 'POST',
        body: JSON.stringify(application),
      }),
    update: (id: string, application: Partial<Application>) =>
      request<Application>(`/api/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(application),
      }),
    remove: (id: string) => request<void>(`/api/applications/${id}`, { method: 'DELETE' }),
  },
  render: {
    cv: (data: CvData) =>
      fetch('/api/render/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.text()),
    coverLetter: (data: CoverLetterData) =>
      fetch('/api/render/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.text()),
  },
  export: {
    cv: async (data: CvData) => {
      const res = await fetch('/api/export/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to export CV PDF');
      return res.blob();
    },
    coverLetter: async (data: CoverLetterData) => {
      const res = await fetch('/api/export/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to export Cover Letter PDF');
      return res.blob();
    },
  },
};

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
