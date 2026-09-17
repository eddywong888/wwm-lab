# wwm-lab Roadmap

This roadmap describes the current direction of wwm-lab.

wwm-lab is an experimental project, so priorities may change as experiments succeed, fail, or produce new ideas.

The roadmap is intended to make the development direction visible and give contributors useful areas to explore.

## Phase 1 — Open Source Foundation

### Repository Documentation

- [x] Add an open-source license
- [x] Improve the main README
- [x] Add contribution guidelines
- [x] Publish a project roadmap
- [ ] Document individual experiments
- [ ] Add architecture documentation
- [ ] Add troubleshooting documentation

### Repository Organization

- [ ] Review the current directory structure
- [ ] Clearly separate standalone applications from shared components
- [ ] Create a consistent structure for new experiments
- [ ] Identify reusable code that can be moved into shared modules
- [ ] Remove or archive obsolete experimental code

## Phase 2 — Developer Experience

- [ ] Improve first-time setup
- [ ] Add example environment configuration
- [ ] Document Cloudflare configuration
- [ ] Add development scripts for common tasks
- [ ] Improve error handling during local development
- [ ] Document deployment workflows

### Quality Checks

- [ ] Add automated lint checks
- [ ] Add automated build checks
- [ ] Introduce unit tests for reusable modules
- [ ] Add integration tests where appropriate
- [ ] Run quality checks automatically with GitHub Actions

## Phase 3 — Experiment Documentation

Each significant experiment should eventually include:

- [ ] Purpose
- [ ] Problem being explored
- [ ] Architecture
- [ ] Setup instructions
- [ ] Deployment instructions
- [ ] Known limitations
- [ ] Results or lessons learned
- [ ] Potential reusable components

The goal is to make experiments useful even when they do not become standalone projects.

## Phase 4 — Reusable Components

Identify parts of successful experiments that may be useful outside wwm-lab.

Potential areas include:

- [ ] React utilities
- [ ] TypeScript helpers
- [ ] Cloudflare Worker patterns
- [ ] Cloudflare KV utilities
- [ ] API helpers
- [ ] Browser application components
- [ ] Deployment templates
- [ ] SEO and metadata utilities

Components with sufficient independent value may eventually be moved into dedicated repositories or packages.

## Phase 5 — Web and Discovery Experiments

Continue research and experimentation involving:

- [ ] Technical SEO
- [ ] Structured data
- [ ] Web performance
- [ ] Search engine discovery
- [ ] AI / GEO discovery
- [ ] Accessibility
- [ ] Metadata architecture
- [ ] Content delivery and caching

Results should be documented whenever they produce reusable lessons.

## Phase 6 — Automation and AI-Assisted Development

Explore practical developer automation such as:

- [ ] Automated project checks
- [ ] Documentation generation workflows
- [ ] Repository maintenance tools
- [ ] AI-assisted code review experiments
- [ ] Test generation workflows
- [ ] Issue triage experiments
- [ ] Repeatable development-agent workflows

Any automation published here should include documentation explaining how it works and its limitations.

## Longer-Term Direction

The long-term goal of wwm-lab is to become a collection of understandable and reproducible web engineering experiments rather than simply a collection of prototypes.

Successful experiments may evolve into:

- Standalone open-source repositories
- Reusable libraries
- Developer utilities
- Deployment templates
- Educational examples
- Documented reference architectures

## Contributing to the Roadmap

Suggestions are welcome.

If there is an experiment or improvement you would like to propose, please open a GitHub issue describing:

1. The problem
2. The proposed experiment or solution
3. Why it could be useful to other developers