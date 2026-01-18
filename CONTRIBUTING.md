# Contributing to adaptive-bloom-filter

First off, thanks for taking the time to contribute! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project adheres to a simple code of conduct: **be respectful and constructive**. We're all here to build something useful together.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**Great bug reports include:**
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (Node.js version, browser, OS)
- Minimal code example that reproduces the issue

### 💡 Suggesting Features

Feature requests are welcome! Please include:
- Clear description of the feature
- Use case / problem it solves
- Proposed API (if applicable)
- Whether you're willing to implement it

### 🔧 Pull Requests

We love pull requests! Here's what makes a great PR:

1. **Performance improvements** - We're always looking to be faster
2. **Bug fixes** - With tests that prove the fix
3. **Documentation** - Clearer docs help everyone
4. **New features** - Discussed in an issue first

## Development Setup

```bash
# Clone the repository
git clone https://github.com/leonkalema/bloom.git
cd bloom

# No dependencies to install! Zero-dependency library.

# Run tests
npm test

# Run benchmarks
npm run benchmark

# Run comparison benchmarks (optional)
npm install bloom-filters bloomfilter --save-dev
node benchmark/comparison.js
```

### Project Structure

```
bloom/
├── src/
│   ├── core/           # Core bloom filter implementation
│   │   ├── bloom-filter.js
│   │   ├── bit-array.js
│   │   └── hash-functions.js
│   ├── features/       # Optional features
│   │   ├── auto-scaling.js
│   │   ├── serialization.js
│   │   ├── set-operations.js
│   │   └── ttl-manager.js
│   ├── utils/          # Utilities
│   │   ├── batch-operations.js
│   │   ├── memory-pool.js
│   │   └── metrics.js
│   └── index.js        # Main entry point
├── benchmark/          # Performance benchmarks
├── test-bloom-filter.js
├── index.d.ts          # TypeScript definitions
└── README.md
```

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with clear, focused commits
4. **Add tests** for any new functionality
5. **Run tests** to ensure nothing is broken (`npm test`)
6. **Update documentation** if needed
7. **Submit a PR** with a clear description

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Benchmark shows no regression (`npm run benchmark`)
- [ ] Code follows existing style
- [ ] Documentation updated (if applicable)
- [ ] TypeScript types updated (if API changed)
- [ ] CHANGELOG.md updated

## Style Guidelines

### JavaScript

- **No dependencies** - This is a zero-dependency library
- **ES6+** syntax (but compatible with Node 6+)
- **Descriptive variable names** - `expectedItems` not `n`
- **JSDoc comments** for public APIs
- **Error handling** - Validate inputs, throw descriptive errors

### Code Example

```javascript
/**
 * Brief description of function
 * @param {string} item - Description of parameter
 * @returns {boolean} Description of return value
 */
function exampleFunction(item) {
  if (typeof item !== 'string') {
    throw new Error('Item must be a string');
  }
  
  // Implementation
  return true;
}
```

### Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep first line under 72 characters
- Reference issues when applicable

**Good examples:**
```
Add TTL support for automatic item expiration
Fix false positive rate calculation in edge cases
Improve compression ratio for sparse filters
```

## Performance Guidelines

This library prioritizes performance. When contributing:

1. **Benchmark your changes** - Use `npm run benchmark`
2. **Avoid allocations in hot paths** - Reuse objects where possible
3. **Prefer bitwise operations** - They're faster than arithmetic
4. **Test with large datasets** - 100k+ items

### Running Benchmarks

```bash
# Quick benchmark
npm run benchmark

# Detailed comparison
node benchmark/comparison.js
```

## Questions?

- Open an issue for questions about contributing
- Tag it with `question` label

Thank you for contributing! 🙏
