# Contributing to wwm-lab

Thank you for your interest in contributing to wwm-lab.

wwm-lab is an experimental open-source repository containing browser applications, web engineering experiments, infrastructure prototypes, automation, and related research.

Contributions of all sizes are welcome.

## Ways to Contribute

You can contribute by:

- Reporting bugs
- Suggesting new experiments
- Improving documentation
- Fixing issues
- Improving accessibility
- Improving performance
- Adding tests
- Refactoring reusable components
- Improving developer tooling
- Improving Cloudflare deployment examples
- Submitting new experimental ideas

## Before You Start

For significant changes, please consider opening an issue first.

This makes it easier to discuss:

- What problem the change solves
- Whether it fits the project
- Which part of the repository it should belong to
- Whether similar work is already planned

Small fixes such as documentation corrections do not require an issue first.

## Development Setup

Fork the repository and clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/wwm-lab.git
cd wwm-lab
```

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Before submitting a pull request, run the available project checks.

For example:

```bash
npm run build
```

If linting or tests are available for the area you changed, please run those as well.

## Branches

Create a separate branch for your change.

Examples:

```bash
git checkout -b fix/example-bug
```

or:

```bash
git checkout -b feature/new-experiment
```

## Commit Messages

Clear commit messages are preferred.

Examples:

```text
fix: handle missing visitor count

feat: add new browser experiment

docs: improve Cloudflare setup instructions

refactor: extract reusable API helper

test: add worker API tests
```

Perfect adherence to a particular commit convention is not required. The main goal is to make the history understandable.

## Pull Requests

A good pull request should explain:

1. What changed
2. Why the change is useful
3. How the change was tested
4. Whether additional configuration is required
5. Screenshots or examples when the change affects the UI

Please keep pull requests reasonably focused.

A pull request that changes one feature or experiment is easier to review than one containing many unrelated changes.

## Experimental Code

Because wwm-lab is an experimentation repository, not every component is production-ready.

When contributing experimental functionality, please clearly document:

- What is being tested
- Known limitations
- Required configuration
- How another developer can reproduce the experiment

## Documentation

Documentation improvements are especially welcome.

Useful additions include:

- Setup instructions
- Architecture explanations
- Experiment results
- Troubleshooting notes
- Deployment guides
- Code examples

## Security

Please do not commit:

- API keys
- Passwords
- Cloudflare tokens
- Private credentials
- Personal access tokens
- Production secrets

Use environment variables and example configuration files instead.

If you discover a security issue, avoid publishing sensitive exploitation details in a public issue.

## Code of Conduct

Please communicate respectfully and focus discussions on improving the project.

Harassment, personal attacks, or discriminatory behavior are not welcome.

## License

By contributing to wwm-lab, you agree that your contributions may be distributed under the project's MIT License.

## Questions

If you are unsure where your contribution belongs, open a GitHub issue and describe the idea.

Thank you for helping improve wwm-lab.