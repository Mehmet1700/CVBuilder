import { useEffect, useState } from 'react';
import { api, downloadBlob } from '../api';
import { Field } from '../components/Field';
import { PreviewPane } from '../components/PreviewPane';
import { ProfileBar } from '../components/ProfileBar';
import { useDebouncedValue } from '../hooks';
import { type CoverLetterData, type CvData, type Profile, emptyCoverLetterData } from '../types';

export function CoverLetterEditor() {
  const [profiles, setProfiles] = useState<Profile<CoverLetterData>[]>([]);
  const [cvProfiles, setCvProfiles] = useState<Profile<CvData>[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedCvProfile, setSelectedCvProfile] = useState('');
  const [data, setData] = useState<CoverLetterData>(emptyCoverLetterData);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const debouncedData = useDebouncedValue(data, 400);

  useEffect(() => {
    api.coverLetterProfiles
      .list()
      .then(setProfiles)
      .catch((e: Error) => setError(e.message));
    api.cvProfiles
      .list()
      .then(setCvProfiles)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    api.render
      .coverLetter(debouncedData)
      .then((html) => {
        if (!cancelled) setPreviewHtml(html);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedData]);

  function loadProfile(name: string) {
    setSelectedProfile(name);
    if (!name) {
      setData(emptyCoverLetterData);
      return;
    }
    const profile = profiles.find((p) => p.name === name);
    if (profile) setData(profile.data);
  }

  function loadFromCv(name: string) {
    setSelectedCvProfile(name);
    if (!name) return;
    const cv = cvProfiles.find((p) => p.name === name);
    if (!cv) return;
    setData((prev) => ({
      ...prev,
      name: cv.data.name,
      email: cv.data.email,
      phone: cv.data.phone,
      location: cv.data.location,
      linkedin: cv.data.linkedin,
    }));
  }

  async function saveProfile(name: string) {
    try {
      const saved = await api.coverLetterProfiles.save(name, data);
      setProfiles((prev) => [...prev.filter((p) => p.name !== saved.name), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedProfile(saved.name);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function deleteProfile(name: string) {
    if (!confirm(`Delete profile "${name}"?`)) return;
    try {
      await api.coverLetterProfiles.remove(name);
      setProfiles((prev) => prev.filter((p) => p.name !== name));
      setSelectedProfile('');
      setData(emptyCoverLetterData);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const blob = await api.export.coverLetter(data);
      downloadBlob(blob, `Cover-Letter-${data.company || 'export'}.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  const set = <K extends keyof CoverLetterData>(key: K, value: CoverLetterData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="editor-page">
      <div className="editor-form">
        <h1>Cover Letter Editor</h1>
        {error && (
          <div className="error-banner" onClick={() => setError('')}>
            {error}
          </div>
        )}

        <ProfileBar
          profileNames={profiles.map((p) => p.name)}
          selected={selectedProfile}
          onLoad={loadProfile}
          onSave={saveProfile}
          onDelete={deleteProfile}
          onExport={exportPdf}
          exporting={exporting}
        />

        <section className="form-section">
          <div className="section-header">
            <h2>Your Details</h2>
            <div className="inline-load">
              <label htmlFor="cv-source">Load from CV profile</label>
              <select id="cv-source" value={selectedCvProfile} onChange={(e) => loadFromCv(e.target.value)}>
                <option value="">— select —</option>
                {cvProfiles.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field-grid">
            <Field label="Full Name">
              <input value={data.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Email">
              <input value={data.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input value={data.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Location">
              <input value={data.location} onChange={(e) => set('location', e.target.value)} />
            </Field>
            <Field label="LinkedIn">
              <input value={data.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
            </Field>
            <Field label="Date">
              <input type="date" value={data.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="form-section">
          <h2>Job Details</h2>
          <div className="field-grid">
            <Field label="Company">
              <input value={data.company} onChange={(e) => set('company', e.target.value)} />
            </Field>
            <Field label="Position">
              <input value={data.position} onChange={(e) => set('position', e.target.value)} />
            </Field>
            <Field label="Hiring Manager">
              <input value={data.hiringManager} onChange={(e) => set('hiringManager', e.target.value)} />
            </Field>
            <Field label="Company Address">
              <input value={data.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="form-section">
          <h2>Letter Text</h2>
          <Field label="Opening Paragraph">
            <textarea rows={4} value={data.opening_paragraph} onChange={(e) => set('opening_paragraph', e.target.value)} />
          </Field>
          <Field label="Body Paragraph">
            <textarea rows={6} value={data.body_paragraph} onChange={(e) => set('body_paragraph', e.target.value)} />
          </Field>
          <Field label="Closing Paragraph">
            <textarea rows={4} value={data.closing_paragraph} onChange={(e) => set('closing_paragraph', e.target.value)} />
          </Field>
        </section>
      </div>

      <PreviewPane html={previewHtml} loading={previewLoading} />
    </div>
  );
}
