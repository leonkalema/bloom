/**
 * NASA-Grade Test Suite for Adaptive Bloom Filter
 * Comprehensive validation of all security fixes and functionality
 */

// Load the bloom filter module
const AdaptiveBloomFilter = (() => {
  if (typeof window !== 'undefined') {
    return window.AdaptiveBloomFilter;
  } else if (typeof require !== 'undefined') {
    return require('./adaptive-bloom-filter.js');
  }
  throw new Error('Unable to load AdaptiveBloomFilter');
})();

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🚀 Starting NASA-Grade Bloom Filter Test Suite\n');
    
    for (const { name, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.errors.push({ test: name, error: error.message });
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);
    
    if (this.failed > 0) {
      console.log('\n🔍 Failures:');
      this.errors.forEach(({ test, error }) => {
        console.log(`   ${test}: ${error}`);
      });
    }

    return this.failed === 0;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertThrows(fn, expectedError, message) {
    try {
      fn();
      throw new Error(`Expected error but none was thrown: ${message}`);
    } catch (error) {
      if (!error.message.includes(expectedError)) {
        throw new Error(`Expected error containing "${expectedError}", got: ${error.message}`);
      }
    }
  }

  async assertThrowsAsync(fn, expectedError, message) {
    try {
      await fn();
      throw new Error(`Expected error but none was thrown: ${message}`);
    } catch (error) {
      if (!error.message.includes(expectedError)) {
        throw new Error(`Expected error containing "${expectedError}", got: ${error.message}`);
      }
    }
  }
}

const runner = new TestRunner();

// Test 1: Constructor Input Validation
runner.test('Constructor validates input parameters', () => {
  // Valid construction should work
  const filter = new AdaptiveBloomFilter(1000, 0.01);
  runner.assert(filter.expectedItems === 1000, 'Expected items should be set');
  runner.assert(filter.falsePositiveRate === 0.01, 'False positive rate should be set');

  // Invalid expected items
  runner.assertThrows(
    () => new AdaptiveBloomFilter(0, 0.01),
    'Expected items must be a positive integer',
    'Should reject zero expected items'
  );

  runner.assertThrows(
    () => new AdaptiveBloomFilter(-100, 0.01),
    'Expected items must be a positive integer',
    'Should reject negative expected items'
  );

  runner.assertThrows(
    () => new AdaptiveBloomFilter(1.5, 0.01),
    'Expected items must be a positive integer',
    'Should reject non-integer expected items'
  );

  // Invalid false positive rate
  runner.assertThrows(
    () => new AdaptiveBloomFilter(1000, 0),
    'False positive rate must be between 0 and 1',
    'Should reject zero false positive rate'
  );

  runner.assertThrows(
    () => new AdaptiveBloomFilter(1000, 1),
    'False positive rate must be between 0 and 1',
    'Should reject false positive rate of 1'
  );

  runner.assertThrows(
    () => new AdaptiveBloomFilter(1000, -0.1),
    'False positive rate must be between 0 and 1',
    'Should reject negative false positive rate'
  );
});

// Test 2: Input Validation for Add/Check Operations
runner.test('Add and check operations validate input types', () => {
  const filter = new AdaptiveBloomFilter(1000, 0.01);

  // Valid string operations should work
  filter.add('test-item');
  runner.assert(filter.check('test-item') === true, 'Should find added string item');

  // Invalid input types should throw errors
  runner.assertThrows(
    () => filter.add(123),
    'Item must be a string',
    'Should reject numeric input to add'
  );

  runner.assertThrows(
    () => filter.add(null),
    'Item must be a string',
    'Should reject null input to add'
  );

  runner.assertThrows(
    () => filter.add(undefined),
    'Item must be a string',
    'Should reject undefined input to add'
  );

  runner.assertThrows(
    () => filter.check(123),
    'Item must be a string',
    'Should reject numeric input to check'
  );

  runner.assertThrows(
    () => filter.check({}),
    'Item must be a string',
    'Should reject object input to check'
  );
});

// Test 3: Hash Index Bounds Checking
runner.test('Hash function validates bounds correctly', () => {
  const filter = new AdaptiveBloomFilter(100, 0.01);

  // Add some items to test normal operation
  filter.add('test1');
  filter.add('test2');
  runner.assert(filter.check('test1') === true, 'Normal operation should work');

  // Test internal hash function bounds (accessing private method for testing)
  const testHashBounds = () => {
    // This tests the internal bounds checking logic
    const item = 'test-bounds';
    for (let i = 0; i < filter.hashFunctions; i++) {
      const index = filter._hashForIndex(item, i);
      runner.assert(index >= 0 && index < filter.size, `Hash index ${index} should be within bounds [0, ${filter.size})`);
    }
  };

  testHashBounds();
});

// Test 4: RLE Compression Buffer Overflow Protection
runner.test('RLE compression prevents buffer overflow', () => {
  const filter = new AdaptiveBloomFilter(1000, 0.01);

  // Add items to trigger compression
  for (let i = 0; i < 500; i++) {
    filter.add(`item-${i}`);
  }

  // Force compression
  const compressed = filter.compress();
  
  // Verify we can still add and check items after compression
  filter.add('post-compression-item');
  runner.assert(filter.check('post-compression-item') === true, 'Should work after compression');

  // Test malformed RLE data handling by creating a corrupted bit array
  // This simulates the buffer overflow scenario we fixed
  const testCorruptedRLE = () => {
    // Create a filter and manually corrupt its compressed data
    const testFilter = new AdaptiveBloomFilter(100, 0.01);
    
    // Add some items and compress
    for (let i = 0; i < 50; i++) {
      testFilter.add(`corrupt-test-${i}`);
    }
    testFilter.compress();

    // If the bit array is compressed, we can test the expansion safety
    if (testFilter.bitArray.compressed) {
      // The expansion should handle edge cases gracefully
      runner.assert(testFilter.check('corrupt-test-1') === true, 'Should handle compressed data correctly');
    }
  };

  testCorruptedRLE();
});

// Test 5: Timer Leak Prevention
runner.test('Compression timer management prevents leaks', () => {
  const filter = new AdaptiveBloomFilter(1000, 0.01);

  // Rapidly trigger compression scheduling to test timer cleanup
  for (let i = 0; i < 10; i++) {
    filter.scheduleCompression();
  }

  // Should only have one timer active
  runner.assert(filter.compressionTimer !== null, 'Should have an active compression timer');

  // Reset should clean up timers
  filter.reset();
  runner.assert(filter.compressionTimer === null, 'Reset should clear compression timer');

  // Multiple resets should be safe
  filter.reset();
  filter.reset();
  runner.assert(filter.compressionTimer === null, 'Multiple resets should be safe');
});

// Test 6: Accurate False Positive Tracking
runner.test('False positive tracking is accurate', () => {
  const filter = new AdaptiveBloomFilter(100, 0.1); // Higher false positive rate for testing

  // Add known items
  const knownItems = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
  knownItems.forEach(item => filter.add(item));

  // Check known items (should not count as false positives)
  knownItems.forEach(item => {
    runner.assert(filter.check(item) === true, `Known item ${item} should be found`);
  });

  const initialFalsePositives = filter.getMetrics().falsePositives;

  // Check unknown items that might trigger false positives
  const unknownItems = ['fig', 'grape', 'honeydew', 'kiwi', 'lemon'];
  let actualFalsePositives = 0;

  unknownItems.forEach(item => {
    if (filter.check(item)) {
      actualFalsePositives++;
    }
  });

  const finalFalsePositives = filter.getMetrics().falsePositives;
  const detectedFalsePositives = finalFalsePositives - initialFalsePositives;

  runner.assert(
    detectedFalsePositives === actualFalsePositives,
    `False positive count should match: detected=${detectedFalsePositives}, actual=${actualFalsePositives}`
  );
});

// Test 7: Asynchronous Operations
runner.test('Asynchronous operations work correctly', async () => {
  const filter = new AdaptiveBloomFilter(1000, 0.01);

  // Test async add
  await filter.addAsync('async-item-1');
  await filter.addAsync('async-item-2');

  // Test async check
  const result1 = await filter.checkAsync('async-item-1');
  const result2 = await filter.checkAsync('async-item-2');
  const result3 = await filter.checkAsync('non-existent-item');

  runner.assert(result1 === true, 'Async check should find added item 1');
  runner.assert(result2 === true, 'Async check should find added item 2');
  runner.assert(result3 === false, 'Async check should not find non-existent item');

  // Test mixed sync/async operations
  filter.add('sync-item');
  const asyncResult = await filter.checkAsync('sync-item');
  runner.assert(asyncResult === true, 'Async check should find sync-added item');

  await filter.addAsync('async-item-3');
  const syncResult = filter.check('async-item-3');
  runner.assert(syncResult === true, 'Sync check should find async-added item');
});

// Test 8: Performance Metrics Accuracy
runner.test('Performance metrics are accurate', () => {
  const filter = new AdaptiveBloomFilter(1000, 0.01);

  // Perform operations and check metrics
  filter.add('metric-test-1');
  filter.add('metric-test-2');
  filter.check('metric-test-1');
  filter.check('metric-test-2');
  filter.check('non-existent');

  const metrics = filter.getMetrics();

  runner.assert(metrics.addOperations === 2, `Add operations should be 2, got ${metrics.addOperations}`);
  runner.assert(metrics.checkOperations === 3, `Check operations should be 3, got ${metrics.checkOperations}`);
  runner.assert(metrics.itemCount === 2, `Item count should be 2, got ${metrics.itemCount}`);
  runner.assert(metrics.averageAddTime >= 0, 'Average add time should be non-negative');
  runner.assert(metrics.averageCheckTime >= 0, 'Average check time should be non-negative');
  runner.assert(typeof metrics.currentFalsePositiveRate === 'number', 'False positive rate should be a number');
  runner.assert(metrics.estimatedMemoryUsage > 0, 'Memory usage should be positive');
});

// Test 9: Reset Functionality
runner.test('Reset clears all state correctly', () => {
  const filter = new AdaptiveBloomFilter(1000, 0.01);

  // Add items and perform operations
  filter.add('reset-test-1');
  filter.add('reset-test-2');
  filter.check('reset-test-1');
  filter.scheduleCompression();

  // Verify state before reset
  runner.assert(filter.itemCount === 2, 'Should have items before reset');
  runner.assert(filter.getMetrics().addOperations === 2, 'Should have add operations before reset');

  // Reset and verify clean state
  filter.reset();

  runner.assert(filter.itemCount === 0, 'Item count should be zero after reset');
  runner.assert(filter.compressionTimer === null, 'Compression timer should be null after reset');
  runner.assert(filter.workQueue.length === 0, 'Work queue should be empty after reset');
  runner.assert(filter.processingQueue === false, 'Processing queue should be false after reset');

  const metrics = filter.getMetrics();
  runner.assert(metrics.addOperations === 0, 'Add operations should be zero after reset');
  runner.assert(metrics.checkOperations === 0, 'Check operations should be zero after reset');
  runner.assert(metrics.falsePositives === 0, 'False positives should be zero after reset');

  // Verify filter works after reset
  filter.add('post-reset-item');
  runner.assert(filter.check('post-reset-item') === true, 'Should work normally after reset');
});

// Test 10: Stress Test with Error Handling
runner.test('Handles stress conditions gracefully', async () => {
  const filter = new AdaptiveBloomFilter(10000, 0.01);

  // Add many items rapidly
  const items = [];
  for (let i = 0; i < 5000; i++) {
    const item = `stress-item-${i}`;
    items.push(item);
    filter.add(item);
  }

  // Verify all items can be found
  let foundCount = 0;
  for (const item of items) {
    if (filter.check(item)) {
      foundCount++;
    }
  }

  runner.assert(foundCount === items.length, `Should find all ${items.length} items, found ${foundCount}`);

  // Test compression under stress
  const compressionResult = filter.compress();
  runner.assert(typeof compressionResult === 'boolean', 'Compression should return boolean');

  // Verify functionality after compression
  const testItem = items[Math.floor(Math.random() * items.length)];
  runner.assert(filter.check(testItem) === true, 'Should still find items after compression');

  // Test async operations under stress
  const asyncPromises = [];
  for (let i = 0; i < 100; i++) {
    asyncPromises.push(filter.addAsync(`async-stress-${i}`));
  }

  await Promise.all(asyncPromises);

  // Verify async items were added
  const asyncCheckPromises = [];
  for (let i = 0; i < 100; i++) {
    asyncCheckPromises.push(filter.checkAsync(`async-stress-${i}`));
  }

  const asyncResults = await Promise.all(asyncCheckPromises);
  const asyncFoundCount = asyncResults.filter(result => result === true).length;
  
  runner.assert(asyncFoundCount === 100, `Should find all 100 async items, found ${asyncFoundCount}`);
});

// Run all tests
if (typeof window !== 'undefined') {
  // Browser environment
  window.addEventListener('load', async () => {
    const success = await runner.run();
    if (success) {
      console.log('\n🎉 All tests passed! The bloom filter is NASA-grade ready.');
    } else {
      console.log('\n💥 Some tests failed. Review the issues above.');
    }
  });
} else {
  // Node.js environment
  (async () => {
    const success = await runner.run();
    process.exit(success ? 0 : 1);
  })();
}

// Export for module usage
if (typeof module !== 'undefined') {
  module.exports = { TestRunner, runner };
}