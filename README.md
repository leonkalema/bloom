# Fast Bloom Filter for JavaScript

[![npm version](https://badge.fury.io/js/adaptive-bloom-filter.svg)](https://www.npmjs.com/package/adaptive-bloom-filter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/leonkalema/bloom.svg)](https://github.com/leonkalema/bloom/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/leonkalema/bloom.svg)](https://github.com/leonkalema/bloom/issues)
[![Tests](https://github.com/leonkalema/bloom/actions/workflows/test.yml/badge.svg)](https://github.com/leonkalema/bloom/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/leonkalema/bloom/branch/main/graph/badge.svg)](https://codecov.io/gh/leonkalema/bloom)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/adaptive-bloom-filter)

Stop wasting memory on massive lookup tables. This bloom filter tells you instantly if something is **definitely not there** or **might be there**. Perfect for web apps, databases, and real-time systems.

## Why Use This?

**Save 90% memory** compared to storing full datasets. Check millions of items in microseconds.

Real companies use bloom filters for:
- **Google**: Web crawling and Chrome ad blocking
- **Netflix**: Recommendation systems  
- **Cloudflare**: DDoS protection
- **Bitcoin**: Transaction validation

## Quick Start

```bash
# Install via npm
npm install adaptive-bloom-filter
```

### Browser (CDN)

```html
<!-- Minified bundle (6.7KB, ~2KB gzipped) -->
<script src="https://cdn.jsdelivr.net/gh/leonkalema/bloom@main/dist/bloom-filter.min.js"></script>
```

```javascript
// Create filter for 10,000 items with 1% false positive rate
const filter = new AdaptiveBloomFilter(10000, 0.01);

// Add items
filter.add("user-123");
filter.add("session-abc");

// Check items (instant response)
filter.check("user-123");    // true - might be there
filter.check("user-999");    // false - definitely not there
```

## Real-World Examples

### Block Malicious IPs
```javascript
const ipFilter = new AdaptiveBloomFilter(1000000, 0.001);

// Add known bad IPs
badIPs.forEach(ip => ipFilter.add(ip));

// Check incoming requests (microsecond response)
if (ipFilter.check(requestIP)) {
  // Might be malicious - check database
  const isBad = await database.checkIP(requestIP);
} else {
  // Definitely safe - skip database check
  allowRequest();
}
```

### Avoid Duplicate Processing
```javascript
const processedFilter = new AdaptiveBloomFilter(50000, 0.01);

async function processFile(filename) {
  if (processedFilter.check(filename)) {
    return; // Already processed or check database
  }
  
  // Definitely not processed - safe to proceed
  await doExpensiveProcessing(filename);
  processedFilter.add(filename);
}
```

### Cache Hit Prediction
```javascript
const cacheFilter = new AdaptiveBloomFilter(100000, 0.05);

// Track cached items
cache.on('set', (key) => cacheFilter.add(key));

// Fast cache check
function getData(key) {
  if (!cacheFilter.check(key)) {
    // Definitely not cached - skip cache lookup
    return database.get(key);
  }
  
  // Might be cached - check cache first
  return cache.get(key) || database.get(key);
}
```

## Advanced Features

### Memory Compression
Automatically compresses when beneficial. Saves 20-80% memory on sparse data.

```javascript
const filter = new AdaptiveBloomFilter(1000000, 0.01);

// Add 100k items
for (let i = 0; i < 100000; i++) {
  filter.add(`item-${i}`);
}

// Check compression stats
const stats = filter.getMetrics();
console.log(`Memory saved: ${stats.estimatedMemorySavings} bytes`);
```

### Async Operations
Prevent UI blocking during heavy operations.

```javascript
// Add 10k items without blocking
const promises = [];
for (let i = 0; i < 10000; i++) {
  promises.push(filter.addAsync(`item-${i}`));
}
await Promise.all(promises);

// Check items asynchronously
const exists = await filter.checkAsync("item-5000");
```

### Performance Monitoring
Track real performance metrics.

```javascript
const metrics = filter.getMetrics();
console.log({
  operations: metrics.addOperations + metrics.checkOperations,
  avgSpeed: metrics.averageCheckTime,
  memoryUsage: metrics.estimatedMemoryUsage,
  falsePositiveRate: metrics.currentFalsePositiveRate
});
```

## Configuration

```javascript
new AdaptiveBloomFilter(expectedItems, falsePositiveRate)
```

**expectedItems**: How many items you plan to add
**falsePositiveRate**: Acceptable false positive rate (0.01 = 1%)

### Choosing Parameters

| Use Case | Items | False Positive Rate | Memory Usage |
|----------|-------|-------------------|--------------|
| IP blocking | 1M | 0.001 (0.1%) | ~1.8 MB |
| Cache checking | 100K | 0.05 (5%) | ~95 KB |
| Duplicate detection | 10K | 0.01 (1%) | ~12 KB |

## Browser Support

Works in all modern browsers and Node.js. Zero dependencies.

- Chrome 45+
- Firefox 40+  
- Safari 10+
- Edge 12+
- Node.js 6+

## Performance

**Speed**: 1-5 microseconds per operation
**Memory**: 10-15 bits per item (vs 32+ bytes for hash tables)
**Accuracy**: Configurable false positive rate, zero false negatives

Tested with:
- ✅ 10 million items
- ✅ 1000 operations per second
- ✅ Mobile devices
- ✅ Web workers

## API Reference

### Constructor
```javascript
new AdaptiveBloomFilter(expectedItems, falsePositiveRate)
```

### Methods
```javascript
filter.add(item)           // Add item to filter
filter.check(item)         // Check if item exists
filter.addAsync(item)      // Add item asynchronously  
filter.checkAsync(item)    // Check item asynchronously
filter.compress()          // Force compression
filter.reset()             // Clear all data
filter.getMetrics()        // Get performance stats
```

## Common Questions

**Q: What happens if I add more items than expected?**
A: False positive rate increases. The filter still works but becomes less accurate.

**Q: Can I remove items?**
A: No. Bloom filters only support add and check operations. Use a counting bloom filter for removals.

**Q: How accurate is it?**
A: Zero false negatives. False positives match your configured rate (1% default).

**Q: Does it work with objects?**
A: Only strings. Convert objects to JSON strings first.

## License

MIT License. Use anywhere, including commercial projects.

## Contributing

Found a bug? Want a feature? Open an issue or submit a pull request.

**Performance improvements welcome** - this filter is used in production systems.