# Contributing to NASCON Event Management

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate when interacting with other contributors.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in the issue tracker
2. Use a clear and descriptive title
3. Provide as much detail as possible:
   - Steps to reproduce the issue
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node.js version, MySQL version)

### Submitting Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies:** `npm install`
3. **Make your changes** following the code style guidelines below
4. **Test your changes** locally with a MySQL database
5. **Commit your changes** with a descriptive commit message
6. **Push to your fork** and submit a pull request

### Code Style Guidelines

- Use 4 spaces for indentation
- Use single quotes for strings in JavaScript
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions focused and concise

### Commit Message Format

Use clear, descriptive commit messages:

```
type: brief description

Longer description if needed
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Guidelines

- Reference any related issues
- Provide a clear description of changes
- Ensure all tests pass
- Update documentation if needed
- Keep PRs focused on a single concern

## Development Setup

1. Clone your fork
2. Install dependencies: `npm install`
3. Set up MySQL database using `NASCON.sql`
4. Copy `.env.example` to `.env` and configure
5. Run development server: `npm run dev`

## Questions?

If you have questions, feel free to open an issue for discussion.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
