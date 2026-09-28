interface PreviewPaneProps {
  html: string;
  loading?: boolean;
}

export function PreviewPane({ html, loading }: PreviewPaneProps) {
  return (
    <div className="preview-pane">
      <div className="preview-pane-header">
        <span>Live Preview</span>
        {loading && <span className="preview-pane-status">updating…</span>}
      </div>
      <div className="preview-pane-sheet">
        <iframe title="preview" srcDoc={html} className="preview-iframe" />
      </div>
    </div>
  );
}
