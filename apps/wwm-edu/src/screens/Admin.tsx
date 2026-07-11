import { useEffect, useState } from 'react';
import './Admin.css';
import { validatePack, type QuestionPack } from '../content/schema';
import { refreshEnglishContent } from '../engine/english';

interface AdminProps {
  onBackHome: () => void;
}

/**
 * Hidden admin page for KV content overrides — reachable only via #admin
 * (never linked from any UI). Plain utilitarian styling on purpose: this
 * is a dev/owner tool, not part of the kid-facing app.
 */
export default function Admin({ onBackHome }: AdminProps) {
  const [adminKey, setAdminKey] = useState('');
  const [packJson, setPackJson] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [deleteId, setDeleteId] = useState('');

  async function loadPacks() {
    try {
      const res = await fetch('/api/edu/content');
      if (!res.ok) {
        setStatus(`Failed to load packs: HTTP ${res.status}`);
        return;
      }
      const body = (await res.json()) as { packs?: unknown[] };
      const valid: QuestionPack[] = [];
      for (const raw of body.packs ?? []) {
        const result = validatePack(raw);
        if (result.ok) valid.push(result.pack);
      }
      setPacks(valid);
    } catch (err) {
      setStatus(`Failed to load packs: ${String(err)}`);
    }
  }

  useEffect(() => {
    void loadPacks();
  }, []);

  function handleValidate(): QuestionPack | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(packJson);
    } catch (err) {
      setValidationErrors([`Invalid JSON: ${String(err)}`]);
      return null;
    }
    const result = validatePack(parsed);
    if (!result.ok) {
      setValidationErrors(result.errors);
      return null;
    }
    setValidationErrors([]);
    return result.pack;
  }

  async function handleUpload() {
    setStatus(null);
    const pack = handleValidate();
    if (!pack) return;
    try {
      const res = await fetch('/api/edu/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify(pack),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(`Upload failed: HTTP ${res.status} — ${JSON.stringify(body)}`);
        return;
      }
      setStatus(`Uploaded pack "${pack.id}" successfully.`);
      await loadPacks();
      void refreshEnglishContent();
    } catch (err) {
      setStatus(`Upload failed: ${String(err)}`);
    }
  }

  async function handleDelete(id: string) {
    setStatus(null);
    try {
      const res = await fetch(`/api/edu/content?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': adminKey },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(`Delete failed: HTTP ${res.status} — ${JSON.stringify(body)}`);
        return;
      }
      setStatus(`Deleted pack "${id}".`);
      await loadPacks();
      void refreshEnglishContent();
    } catch (err) {
      setStatus(`Delete failed: ${String(err)}`);
    }
  }

  return (
    <div className="admin">
      <button type="button" className="admin__back" onClick={onBackHome}>← Back</button>
      <h1>wwm-edu content admin</h1>
      <p className="admin__warning">
        Hidden page (#admin), not linked anywhere. Requires the EDU_ADMIN_KEY env var to be set
        server-side (CF dashboard in production, .dev.vars locally).
      </p>

      <section>
        <label className="admin__field">
          <span>Admin key</span>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="X-Admin-Key"
          />
        </label>
      </section>

      <section>
        <h2>Upload / replace a pack</h2>
        <textarea
          className="admin__textarea"
          value={packJson}
          onChange={(e) => setPackJson(e.target.value)}
          placeholder='{"id": "grammar-2", "subject": "english", "topic": "grammar", "title": {"en":"...","zh":"..."}, "version": 1, "questions": [...]}'
          rows={14}
        />
        <div className="admin__actions">
          <button type="button" onClick={handleValidate}>Validate</button>
          <button type="button" onClick={handleUpload}>Upload</button>
        </div>
        {validationErrors.length > 0 && (
          <ul className="admin__errors">
            {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
      </section>

      <section>
        <h2>Delete a pack by id</h2>
        <div className="admin__actions">
          <input type="text" value={deleteId} onChange={(e) => setDeleteId(e.target.value)} placeholder="pack id" />
          <button type="button" onClick={() => handleDelete(deleteId)} disabled={!deleteId}>Delete</button>
        </div>
      </section>

      {status && <p className="admin__status">{status}</p>}

      <section>
        <h2>Current KV packs ({packs.length})</h2>
        <ul className="admin__pack-list">
          {packs.map((p) => (
            <li key={p.id}>
              <code>{p.id}</code> — {p.topic} — v{p.version} — {p.questions.length} question(s)
              <button type="button" onClick={() => handleDelete(p.id)}>Delete</button>
            </li>
          ))}
          {packs.length === 0 && <li>No override packs stored yet.</li>}
        </ul>
      </section>
    </div>
  );
}
