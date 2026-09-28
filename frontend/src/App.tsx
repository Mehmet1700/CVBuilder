import { useState } from 'react';
import { Sidebar, type View } from './components/Sidebar';
import { CvEditor } from './pages/CvEditor';
import { CoverLetterEditor } from './pages/CoverLetterEditor';
import { Applications } from './pages/Applications';

function App() {
  const [view, setView] = useState<View>('cv');

  return (
    <div className="app-shell">
      <Sidebar active={view} onNavigate={setView} />
      <main className="app-main">
        {view === 'cv' && <CvEditor />}
        {view === 'cover-letter' && <CoverLetterEditor />}
        {view === 'applications' && <Applications />}
      </main>
    </div>
  );
}

export default App;
