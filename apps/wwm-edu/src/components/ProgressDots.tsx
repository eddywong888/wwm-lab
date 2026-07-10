import './ProgressDots.css';

interface ProgressDotsProps {
  total: number;
  current: number;
  results: (boolean | null)[];
}

export default function ProgressDots({ total, current, results }: ProgressDotsProps) {
  return (
    <div className="progress-dots" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => {
        const result = results[i];
        let cls = 'progress-dots__dot';
        if (i === current) cls += ' progress-dots__dot--current';
        else if (result === true) cls += ' progress-dots__dot--correct';
        else if (result === false) cls += ' progress-dots__dot--wrong';
        return <span key={i} className={cls} />;
      })}
    </div>
  );
}
