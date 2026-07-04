import './ProjectGrid.css';

interface Project {
  title: string;
  description: string;
  tags: string[];
  liveUrl?: string;
  sourceUrl?: string;
  downloadUrl?: string;
  status?: 'live' | 'wip' | 'soon';
}

const PROJECTS: Project[] = [
  {
    title: 'wwm-lab',
    description: 'This site — personal lab for experiments, games, and ideas. Built with React + Vite, deployed on Cloudflare Pages.',
    tags: ['meta', 'react', 'cloudflare'],
    liveUrl: '#',
    sourceUrl: 'https://github.com/eddywong888/wwm-lab',
    status: 'live',
  },
  {
    title: 'Memory Card Match',
    description: 'A classic card matching game. Play solo or with up to 4 players. Features multiple difficulty levels, default country flags theme, custom image uploads (persisted via IndexedDB), and procedural sound effects.',
    tags: ['game', 'react', 'indexeddb', 'webaudio'],
    liveUrl: '/apps/memory-card/',
    sourceUrl: 'https://github.com/eddywong888/wwm-lab/tree/main/apps/memory-card',
    status: 'live',
  },
  {
    title: 'Thane War: Shadow of the Horde',
    description:
      'A retro real-time strategy game in the spirit of the 1994 classics. Gather gold and lumber, lay roads, raise farms and barracks, and crush the Gharok Horde. Canvas engine with A* pathfinding, fog of war, minimap, and procedural chiptune sound. Play in the browser, or download the single-file version to play offline.',
    tags: ['game', 'rts', 'canvas', 'webaudio'],
    liveUrl: '/apps/thane-war/',
    downloadUrl: '/downloads/thane-war',
    status: 'live',
  },
  {
    title: 'Experiment #1',
    description: 'Testing an idea around SEO + interactivity. Details soon.',
    tags: ['seo', 'experiment'],
    status: 'soon',
  },
];

const ExternalIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M3 13L13 3M13 3H7.5M13 3V8.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

function StatusBadge({ status }: { status: Project['status'] }) {
  if (!status) return null;
  const labels = { live: 'live', wip: 'in progress', soon: 'coming soon' };
  return <span className={`project-card__status project-card__status--${status}`}>{labels[status]}</span>;
}

function ProjectCard({ project }: { project: Project }) {
  const isSoon = project.status === 'soon';
  return (
    <article className={`project-card ${isSoon ? 'project-card--dim' : ''}`}>
      <header className="project-card__header">
        <h3 className="project-card__title">{project.title}</h3>
        <StatusBadge status={project.status} />
      </header>

      <p className="project-card__desc">{project.description}</p>

      <div className="project-card__tags">
        {project.tags.map(tag => (
          <span key={tag} className="project-card__tag">{tag}</span>
        ))}
      </div>

      {!isSoon && (
        <div className="project-card__links">
          {project.liveUrl && (
            <a href={project.liveUrl} className="project-card__link project-card__link--main" target="_blank" rel="noopener noreferrer">
              <ExternalIcon />
              <span>Live</span>
            </a>
          )}
          {project.sourceUrl && (
            <a href={project.sourceUrl} className="project-card__link" target="_blank" rel="noopener noreferrer">
              <GithubIcon />
              <span>Source</span>
            </a>
          )}
          {project.downloadUrl && (
            <a href={project.downloadUrl} className="project-card__link" download>
              <DownloadIcon />
              <span>Download</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export default function ProjectGrid() {
  return (
    <section id="projects" className="projects" aria-label="Lab Experiments">
      <div className="container">
        <header className="projects__header">
          <span className="projects__eyebrow">// experiments</span>
          <h2 className="projects__heading">Lab Experiments</h2>
          <p className="projects__sub">Small things I build, ship, and learn from.</p>
        </header>

        <div className="projects__grid">
          {PROJECTS.map(p => (
            <ProjectCard key={p.title} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
