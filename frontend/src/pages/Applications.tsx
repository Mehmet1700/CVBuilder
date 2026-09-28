import { useEffect, useState } from 'react';
import { api } from '../api';
import { Field } from '../components/Field';
import type { Application, ApplicationStatus, CoverLetterData, CvData, Profile } from '../types';

const STATUSES: ApplicationStatus[] = ['Draft', 'Applied', 'Interview', 'Offer', 'Rejected'];

const emptyForm = {
  jobTitle: '',
  company: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'Draft' as ApplicationStatus,
  cvProfile: '',
  clProfile: '',
};

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvProfiles, setCvProfiles] = useState<Profile<CvData>[]>([]);
  const [clProfiles, setClProfiles] = useState<Profile<CoverLetterData>[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  function refresh() {
    api.applications.list().then(setApplications).catch((e: Error) => setError(e.message));
    api.cvProfiles.list().then(setCvProfiles).catch((e: Error) => setError(e.message));
    api.coverLetterProfiles.list().then(setClProfiles).catch((e: Error) => setError(e.message));
  }

  useEffect(refresh, []);

  async function addApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!form.jobTitle.trim() || !form.company.trim()) return;
    try {
      await api.applications.create(form);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function updateStatus(id: string, status: ApplicationStatus) {
    try {
      await api.applications.update(id, { status });
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeApplication(id: string) {
    if (!confirm('Delete this application?')) return;
    try {
      await api.applications.remove(id);
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="applications-page">
      <h1>Applications</h1>
      {error && (
        <div className="error-banner" onClick={() => setError('')}>
          {error}
        </div>
      )}

      <form className="form-section application-form" onSubmit={addApplication}>
        <h2>New Application</h2>
        <div className="field-grid">
          <Field label="Job Title">
            <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} required />
          </Field>
          <Field label="Company">
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="CV Profile">
            <select value={form.cvProfile} onChange={(e) => setForm({ ...form, cvProfile: e.target.value })}>
              <option value="">— none —</option>
              {cvProfiles.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cover Letter Profile">
            <select value={form.clProfile} onChange={(e) => setForm({ ...form, clProfile: e.target.value })}>
              <option value="">— none —</option>
              {clProfiles.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <button type="submit" className="btn btn-primary">
          Add Application
        </button>
      </form>

      <table className="applications-table">
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Company</th>
            <th>Date</th>
            <th>Status</th>
            <th>CV Profile</th>
            <th>Cover Letter Profile</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {applications.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-row">
                No applications yet.
              </td>
            </tr>
          )}
          {applications.map((app) => (
            <tr key={app.id}>
              <td>{app.jobTitle}</td>
              <td>{app.company}</td>
              <td>{app.date}</td>
              <td>
                <select value={app.status} onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td>{app.cvProfile || '—'}</td>
              <td>{app.clProfile || '—'}</td>
              <td>
                <button type="button" className="btn btn-ghost btn-danger" onClick={() => removeApplication(app.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
