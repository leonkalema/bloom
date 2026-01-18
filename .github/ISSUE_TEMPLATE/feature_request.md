---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Problem Statement

A clear description of the problem you're trying to solve.

Example: "I need to remove items from the filter, but bloom filters don't support deletion..."

## Proposed Solution

Describe the solution you'd like.

Example: "Add a counting bloom filter variant that supports deletion..."

## Proposed API

If applicable, show how you'd like to use this feature:

```javascript
const filter = new CountingBloomFilter(1000, 0.01);
filter.add('item');
filter.remove('item'); // New feature
```

## Alternatives Considered

Describe any alternative solutions or features you've considered.

## Use Case

Describe your use case. This helps us understand the priority and design.

- What are you building?
- How would this feature help?
- How many users would benefit?

## Additional Context

Add any other context, screenshots, or examples.

## Willing to Contribute?

- [ ] I'm willing to submit a PR for this feature
- [ ] I can help with testing
- [ ] I can help with documentation
