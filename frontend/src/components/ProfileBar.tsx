import { useState } from 'react';

interface ProfileBarProps {
  profileNames: string[];
  selected: string;
  onLoad: (name: string) => void;
  onSave: (name: string) => void;
  onDelete: (name: string) => void;
  onExport: () => void;
  exporting: boolean;
}

export function ProfileBar({
  profileNames,
  selected,
  onLoad,
  onSave,
  onDelete,
  onExport,
  exporting,
}: ProfileBarProps) {
  const [newName, setNewName] = useState('');

  return (
    <div className="profile-bar">
      <div className="profile-bar-group">
        <label htmlFor="profile-select">Profile</label>
        <select
          id="profile-select"
          value={selected}
          onChange={(e) => onLoad(e.target.value)}
        >
          <option value="">— New / unsaved —</option>
          {profileNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {selected && (
          <button
            type="button"
            className="btn btn-ghost btn-danger"
            onClick={() => onDelete(selected)}
          >
            Delete
          </button>
        )}
      </div>

      <div className="profile-bar-group">
        <input
          type="text"
          placeholder="Profile name (e.g. Data Science DE)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!newName.trim()}
          onClick={() => {
            onSave(newName.trim());
            setNewName('');
          }}
        >
          Save as Template
        </button>
      </div>

      <button type="button" className="btn btn-primary" onClick={onExport} disabled={exporting}>
        {exporting ? 'Exporting…' : 'Export PDF'}
      </button>
    </div>
  );
}
