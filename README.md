# wwm-lab

**wwm-lab** is an open-source web engineering laboratory for building, testing, and documenting browser applications, reusable web patterns, deployment workflows, and experiments with modern web technologies.

The repository is used to turn small ideas into working public experiments while documenting the code, architecture, deployment process, and lessons learned.

## Goals

wwm-lab exists to:

- Build and publish small browser applications and interactive experiments
- Explore reusable React and TypeScript patterns
- Test Cloudflare Pages, Workers, and KV architectures
- Experiment with SEO, GEO, web discovery, and performance
- Explore automation and developer workflows
- Document experiments so other developers can reproduce or adapt them
- Turn successful experiments into standalone open-source projects

The project is intentionally experimental. Some components are prototypes, while others may eventually become reusable packages or independent repositories.

## Tech Stack

Current technologies include:

- React
- TypeScript
- Vite
- Cloudflare Pages
- Cloudflare Workers
- Cloudflare KV
- JavaScript / Node.js
- GitHub Actions and development automation

The stack may evolve as new experiments are added.

## Repository Structure

```text
wwm-lab/
├── apps/         # Individual applications and experiments
├── functions/    # Cloudflare Pages Functions
├── public/       # Static public assets
├── scripts/      # Development and automation scripts
├── src/          # Main application source code
├── worker/       # Cloudflare Worker code
├── .claude/      # Claude Code project configuration
└── docs/         # Project and experiment documentation
```

Some directories may change as experiments are reorganized.

## Getting Started

### Requirements

You will need:

- Node.js
- npm
- Git

Clone the repository:

```bash
git clone https://github.com/eddywong888/wwm-lab.git
cd wwm-lab
```

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Vite will display the local development URL in your terminal.

## Building

Create a production build with:

```bash
npm run build
```

## Deployment

The project is designed to work with Cloudflare Pages.

The current deployment workflow connects Cloudflare Pages to the GitHub repository.

Updates pushed to the main branch can be automatically deployed by Cloudflare Pages.

Some experiments may also use:

- Cloudflare Workers
- Cloudflare KV
- Cloudflare Pages Functions

Individual experiments that require additional configuration should document those requirements separately.

## Experiments

wwm-lab contains multiple categories of experiments, including:

### Browser Applications

Small interactive applications and browser-based projects built primarily with React and TypeScript.

### Web Infrastructure

Experiments involving Cloudflare Pages, Pages Functions, Workers, KV storage, APIs, caching, and deployment architecture.

### SEO and Web Discovery

Experiments involving:

- Technical SEO
- Structured content
- Search visibility
- GEO / AI discovery
- Page performance
- Content architecture

### Automation

Experiments involving development automation, AI-assisted development workflows, scripts, and tooling.

## Project Philosophy

The goal of wwm-lab is not to present every experiment as production-ready software.

Instead, the project follows a simple process:

**Idea → Prototype → Test → Document → Improve → Reuse**

Experiments that prove useful may eventually be extracted into standalone open-source projects.

## Contributing

Contributions, bug reports, suggestions, and discussions are welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

If you find an experiment useful, you are welcome to:

- Fork the repository
- Adapt the code
- Open an issue
- Suggest an improvement
- Submit a pull request

## Roadmap

See [ROADMAP.md](ROADMAP.md) for current development priorities and planned improvements.

## Status

wwm-lab is under active development.

APIs, folder structures, experiments, and implementation details may change as the project evolves.

## License

This project is released under the [MIT License](LICENSE).

You are free to use, modify, and distribute the code in accordance with the license.

## Maintainer

Maintained by [Eddy Wong](https://github.com/eddywong888).

The project is developed publicly as an ongoing open-source engineering and experimentation lab.