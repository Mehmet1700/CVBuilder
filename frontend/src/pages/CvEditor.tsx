import { useEffect, useState } from 'react';
import { api, downloadBlob } from '../api';
import { Field } from '../components/Field';
import { PreviewPane } from '../components/PreviewPane';
import { ProfileBar } from '../components/ProfileBar';
import { useDebouncedValue } from '../hooks';
import { removeAt, updateAt } from '../lib/arrayOps';
import { type CvData, type Profile, emptyCvData } from '../types';

export function CvEditor() {
  const [profiles, setProfiles] = useState<Profile<CvData>[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [data, setData] = useState<CvData>(emptyCvData);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const debouncedData = useDebouncedValue(data, 400);

  useEffect(() => {
    api.cvProfiles
      .list()
      .then(setProfiles)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    api.render
      .cv(debouncedData)
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
      setData(emptyCvData);
      return;
    }
    const profile = profiles.find((p) => p.name === name);
    if (profile) setData(profile.data);
  }

  async function saveProfile(name: string) {
    try {
      const saved = await api.cvProfiles.save(name, data);
      setProfiles((prev) => [...prev.filter((p) => p.name !== saved.name), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedProfile(saved.name);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function deleteProfile(name: string) {
    if (!confirm(`Delete profile "${name}"?`)) return;
    try {
      await api.cvProfiles.remove(name);
      setProfiles((prev) => prev.filter((p) => p.name !== name));
      setSelectedProfile('');
      setData(emptyCvData);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const blob = await api.export.cv(data);
      downloadBlob(blob, `CV-${data.name || 'export'}.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  const set = <K extends keyof CvData>(key: K, value: CvData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="editor-page">
      <div className="editor-form">
        <h1>CV Editor</h1>
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
          <h2>Basic Info</h2>
          <div className="field-grid">
            <Field label="Full Name">
              <input value={data.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Job Title">
              <input value={data.title} onChange={(e) => set('title', e.target.value)} />
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
            <Field label="GitHub">
              <input value={data.github} onChange={(e) => set('github', e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="form-section">
          <h2>Summary</h2>
          <textarea rows={4} value={data.summary} onChange={(e) => set('summary', e.target.value)} />
        </section>

        <section className="form-section">
          <div className="section-header">
            <h2>Skills</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => set('skills', [...data.skills, { category: '', items: [] }])}
            >
              + Add group
            </button>
          </div>
          {data.skills.map((group, i) => (
            <div className="repeat-card" key={i}>
              <div className="repeat-card-row">
                <Field label="Category">
                  <input
                    value={group.category}
                    onChange={(e) => set('skills', updateAt(data.skills, i, { category: e.target.value }))}
                  />
                </Field>
                <Field label="Skills (comma separated)">
                  <input
                    value={group.items.join(', ')}
                    onChange={(e) =>
                      set(
                        'skills',
                        updateAt(data.skills, i, {
                          items: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      )
                    }
                  />
                </Field>
                <button type="button" className="btn btn-ghost btn-danger" onClick={() => set('skills', removeAt(data.skills, i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="form-section">
          <div className="section-header">
            <h2>Experience</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                set('experience', [
                  ...data.experience,
                  { role: '', company: '', location: '', startDate: '', endDate: '', bullets: [] },
                ])
              }
            >
              + Add experience
            </button>
          </div>
          {data.experience.map((exp, i) => (
            <div className="repeat-card" key={i}>
              <div className="repeat-card-row">
                <Field label="Role">
                  <input value={exp.role} onChange={(e) => set('experience', updateAt(data.experience, i, { role: e.target.value }))} />
                </Field>
                <Field label="Company">
                  <input
                    value={exp.company}
                    onChange={(e) => set('experience', updateAt(data.experience, i, { company: e.target.value }))}
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={exp.location}
                    onChange={(e) => set('experience', updateAt(data.experience, i, { location: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="repeat-card-row">
                <Field label="Start Date">
                  <input
                    value={exp.startDate}
                    onChange={(e) => set('experience', updateAt(data.experience, i, { startDate: e.target.value }))}
                  />
                </Field>
                <Field label="End Date">
                  <input
                    value={exp.endDate}
                    onChange={(e) => set('experience', updateAt(data.experience, i, { endDate: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Bullet points (one per line)">
                <textarea
                  rows={3}
                  value={exp.bullets.join('\n')}
                  onChange={(e) =>
                    set('experience', updateAt(data.experience, i, { bullets: e.target.value.split('\n').filter(Boolean) }))
                  }
                />
              </Field>
              <button type="button" className="btn btn-ghost btn-danger" onClick={() => set('experience', removeAt(data.experience, i))}>
                Remove entry
              </button>
            </div>
          ))}
        </section>

        <section className="form-section">
          <div className="section-header">
            <h2>Education</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                set('education', [...data.education, { degree: '', institution: '', location: '', startDate: '', endDate: '' }])
              }
            >
              + Add education
            </button>
          </div>
          {data.education.map((edu, i) => (
            <div className="repeat-card" key={i}>
              <div className="repeat-card-row">
                <Field label="Degree">
                  <input value={edu.degree} onChange={(e) => set('education', updateAt(data.education, i, { degree: e.target.value }))} />
                </Field>
                <Field label="Institution">
                  <input
                    value={edu.institution}
                    onChange={(e) => set('education', updateAt(data.education, i, { institution: e.target.value }))}
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={edu.location}
                    onChange={(e) => set('education', updateAt(data.education, i, { location: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="repeat-card-row">
                <Field label="Start Date">
                  <input
                    value={edu.startDate}
                    onChange={(e) => set('education', updateAt(data.education, i, { startDate: e.target.value }))}
                  />
                </Field>
                <Field label="End Date">
                  <input
                    value={edu.endDate}
                    onChange={(e) => set('education', updateAt(data.education, i, { endDate: e.target.value }))}
                  />
                </Field>
                <button type="button" className="btn btn-ghost btn-danger" onClick={() => set('education', removeAt(data.education, i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="form-section">
          <div className="section-header">
            <h2>Languages</h2>
            <button type="button" className="btn btn-ghost" onClick={() => set('languages', [...data.languages, { name: '', level: '' }])}>
              + Add language
            </button>
          </div>
          {data.languages.map((lang, i) => (
            <div className="repeat-card" key={i}>
              <div className="repeat-card-row">
                <Field label="Language">
                  <input value={lang.name} onChange={(e) => set('languages', updateAt(data.languages, i, { name: e.target.value }))} />
                </Field>
                <Field label="Level">
                  <input value={lang.level} onChange={(e) => set('languages', updateAt(data.languages, i, { level: e.target.value }))} />
                </Field>
                <button type="button" className="btn btn-ghost btn-danger" onClick={() => set('languages', removeAt(data.languages, i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>

      <PreviewPane html={previewHtml} loading={previewLoading} />
    </div>
  );
}
