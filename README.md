# Advanced Concurrent Bloom Filter with Adaptive Compression

A high-performance, memory-efficient implementation of a Bloom filter with adaptive RLE compression and non-blocking asynchronous operations.

## Features

- **Probabilistic Membership Testing**: Efficiently determine if an element is in a set with minimal memory usage
- **Adaptive Compression**: Automatically compresses the underlying bit array using run-length encoding when beneficial
- **Concurrent Processing**: Non-blocking asynchronous operations via intelligent work queue
- **Optimized Hashing**: Custom implementation of Murmur3 hash function for superior performance
- **Performance Metrics**: Built-in tracking of operations, timings, and memory usage
- **Zero Dependencies**: Pure vanilla JavaScript implementation

## Installation

Simply include the `adaptive-bloom-filter.js` file in your project:

```html
<script src="adaptive-bloom-filter.js"></script>
```

Or in Node.js:

```javascript
const AdaptiveBloomFilter = require('./adaptive-bloom-filter.js');
```

## Usage

### Basic Usage

```javascript
// Create a new bloom filter expecting 10,000 items with a 1% false positive rate
const filter = new AdaptiveBloomFilter(10000, 0.01);

// Add items to the filter
filter.add("test-item-1");
filter.add("test-item-2");

// Check for membership
const exists = filter.check("test-item-1"); // true
const missing = filter.check("not-in-filter"); // false
```

### Asynchronous Operations

```javascript
// Add items asynchronously
await filter.addAsync("test-item-3");

// Check membership asynchronously
const result = await filter.checkAsync("test-item-3"); // true
```

### Performance Metrics

```javascript
// Get comprehensive performance metrics
const metrics = filter.getMetrics();
console.log(metrics);
/*
{
  addOperations: 3,
  checkOperations: 2,
  falsePositives: 0,
  compressionAttempts: 0,
  averageAddTime: 0.12,
  averageCheckTime: 0.05,
  compressionRatio: 1,
  itemCount: 3,
  estimatedMemoryUsage: 12054,
  estimatedMemorySavings: 0,
  currentFalsePositiveRate: 0.0003
}
*/
```

### Reset Filter

```javascript
// Clear the filter and reset metrics
filter.reset();
```

## Configuration Options

When creating a new `AdaptiveBloomFilter`, you can configure:

- `expectedItems`: The expected number of items to be added to the filter
- `falsePositiveRate`: The acceptable false positive rate (default: 0.01 or 1%)

## Performance Considerations

- The bloom filter automatically compresses its internal bit array when the memory savings justify the computational cost
- Asynchronous operations prevent blocking the main thread during intensive operations
- The filter tracks actual false positive rates and provides real-time performance metrics

## Use Cases

- Network security tools for tracking malicious IPs/domains
- Cache optimization systems
- Duplicate detection in large datasets
- Real-time stream processing with memory constraints
- Web browser fingerprinting and tracking prevention
- Spell checkers and predictive text systems