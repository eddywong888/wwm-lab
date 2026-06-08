import { useEffect, useState } from 'react';
import './VisitorCount.css';

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/visits')
      .then(r => r.json())
      .then((d: { visits: number }) => setCount(d.visits))
      .catch(() => setError(true));
  }, []);

  const display = error ? '—' : count === null ? '…' : count.toLocaleString();

  return (
    <span className="visitor-count" title="Total visitors">
      <span className={`visitor-count__dot ${count !== null && !error ? 'visitor-count__dot--live' : ''}`} />
      <span className="visitor-count__num">{display}</span>
      <span className="visitor-count__label"> visitors</span>
    </span>
  );
}
