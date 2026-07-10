import './EduSection.css';

interface EduCard {
  title: string;
  description: string;
  tags: string[];
  liveUrl?: string;
  status?: 'live' | 'wip' | 'soon';
}

const EDU_CARDS: EduCard[] = [
  {
    title: 'WWM Edu — Standard 4 Math & English',
    description:
      'Daily bilingual practice exercises aligned to the Malaysian KSSR Standard 4 syllabus. Procedurally generated questions (never a fixed worksheet), English + Simplified Chinese toggle, standard and advanced difficulty tiers, streaks and sound effects to keep kids motivated.',
    tags: ['education', 'kssr', 'bilingual'],
    liveUrl: '/apps/wwm-edu/',
    status: 'wip',
  },
];

function StatusBadge({ status }: { status: EduCard['status'] }) {
  if (!status) return null;
  const labels = { live: 'live', wip: 'in progress', soon: 'coming soon' };
  return <span className={`project-card__status project-card__status--${status}`}>{labels[status]}</span>;
}

const ExternalIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M3 13L13 3M13 3H7.5M13 3V8.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function EduCardView({ card }: { card: EduCard }) {
  const isSoon = card.status === 'soon';
  return (
    <article className={`project-card edu-card ${isSoon ? 'project-card--dim' : ''}`}>
      <header className="project-card__header">
        <h3 className="project-card__title">{card.title}</h3>
        <StatusBadge status={card.status} />
      </header>

      <p className="project-card__desc">{card.description}</p>

      <div className="project-card__tags">
        {card.tags.map((tag) => (
          <span key={tag} className="project-card__tag">{tag}</span>
        ))}
      </div>

      {!isSoon && card.liveUrl && (
        <div className="project-card__links">
          <a href={card.liveUrl} className="project-card__link project-card__link--main" target="_blank" rel="noopener noreferrer">
            <ExternalIcon />
            <span>Live</span>
          </a>
        </div>
      )}
    </article>
  );
}

export default function EduSection() {
  return (
    <section id="education" className="edu-section" aria-label="Education Lab">
      <div className="container">
        <header className="edu-section__header">
          <span className="edu-section__eyebrow">// learn</span>
          <h2 className="edu-section__heading">Education Lab</h2>
          <p className="edu-section__sub">Practice exercises for primary school, built the same way as the games — small, fun, and always improving.</p>
        </header>

        <div className="edu-section__grid">
          {EDU_CARDS.map((card) => (
            <EduCardView key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
