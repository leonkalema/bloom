/**
 * Benchmark Comparison Script
 * Compares adaptive-bloom-filter against other popular bloom filter packages
 * 
 * Run: node benchmark/comparison.js
 * 
 * Note: Install comparison packages first:
 * npm install bloom-filters bloomfilter --save-dev
 */

const { AdaptiveBloomFilter } = require('../src/index.js');

const ITEM_COUNT = 100000;
const FALSE_POSITIVE_RATE = 0.01;
const CHECK_COUNT = 10000;

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatBytes = (bytes) => {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return bytes + ' bytes';
};

const generateItems = (count, prefix = 'item') => {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(`${prefix}-${i}-${Math.random().toString(36).substring(7)}`);
  }
  return items;
};

const measureMemory = () => {
  if (global.gc) global.gc();
  return process.memoryUsage().heapUsed;
};

const runBenchmark = (name, createFilter, addItem, checkItem, getSize) => {
  console.log(`\n📊 Benchmarking: ${name}`);
  console.log('─'.repeat(50));

  const items = generateItems(ITEM_COUNT);
  const checkItems = generateItems(CHECK_COUNT, 'check');

  const memBefore = measureMemory();
  const filter = createFilter(ITEM_COUNT, FALSE_POSITIVE_RATE);

  const addStart = performance.now();
  for (const item of items) {
    addItem(filter, item);
  }
  const addEnd = performance.now();
  const addTime = addEnd - addStart;

  const memAfter = measureMemory();
  const memUsed = memAfter - memBefore;

  const checkStart = performance.now();
  let falsePositives = 0;
  for (const item of checkItems) {
    if (checkItem(filter, item)) {
      falsePositives++;
    }
  }
  const checkEnd = performance.now();
  const checkTime = checkEnd - checkStart;

  const results = {
    name,
    addTime,
    addOpsPerSec: (ITEM_COUNT / addTime) * 1000,
    checkTime,
    checkOpsPerSec: (CHECK_COUNT / checkTime) * 1000,
    memoryUsed: memUsed > 0 ? memUsed : getSize ? getSize(filter) : 'N/A',
    falsePositiveRate: (falsePositives / CHECK_COUNT) * 100,
    falsePositives
  };

  console.log(`  Add ${formatNumber(ITEM_COUNT)} items: ${addTime.toFixed(2)}ms`);
  console.log(`  Add ops/sec: ${formatNumber(results.addOpsPerSec)}`);
  console.log(`  Check ${formatNumber(CHECK_COUNT)} items: ${checkTime.toFixed(2)}ms`);
  console.log(`  Check ops/sec: ${formatNumber(results.checkOpsPerSec)}`);
  console.log(`  Memory: ${typeof results.memoryUsed === 'number' ? formatBytes(results.memoryUsed) : results.memoryUsed}`);
  console.log(`  False positives: ${falsePositives}/${CHECK_COUNT} (${results.falsePositiveRate.toFixed(2)}%)`);

  return results;
};

const runAllBenchmarks = async () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       BLOOM FILTER BENCHMARK COMPARISON                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Items: ${formatNumber(ITEM_COUNT).padEnd(10)} Target FP Rate: ${(FALSE_POSITIVE_RATE * 100).toFixed(1)}%          ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = [];

  results.push(runBenchmark(
    'adaptive-bloom-filter (this package)',
    (n, fp) => new AdaptiveBloomFilter(n, fp),
    (f, item) => f.add(item),
    (f, item) => f.check(item),
    (f) => f.size / 8
  ));

  try {
    const { BloomFilter } = require('bloom-filters');
    results.push(runBenchmark(
      'bloom-filters',
      (n, fp) => BloomFilter.create(n, fp),
      (f, item) => f.add(item),
      (f, item) => f.has(item),
      null
    ));
  } catch {
    console.log('\n⚠️  bloom-filters not installed (npm install bloom-filters)');
  }

  try {
    const { BloomFilter } = require('bloomfilter');
    results.push(runBenchmark(
      'bloomfilter',
      (n, fp) => {
        const m = Math.ceil(-n * Math.log(fp) / (Math.log(2) ** 2));
        const k = Math.round((m / n) * Math.log(2));
        return new BloomFilter(m, k);
      },
      (f, item) => f.add(item),
      (f, item) => f.test(item),
      (f) => f.buckets.length * 4
    ));
  } catch {
    console.log('\n⚠️  bloomfilter not installed (npm install bloomfilter)');
  }

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPARISON SUMMARY                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  if (results.length > 1) {
    const baseline = results[0];
    console.log('Performance relative to adaptive-bloom-filter:');
    console.log('─'.repeat(60));
    
    for (const result of results) {
      const addSpeedup = (result.addOpsPerSec / baseline.addOpsPerSec).toFixed(2);
      const checkSpeedup = (result.checkOpsPerSec / baseline.checkOpsPerSec).toFixed(2);
      console.log(`\n${result.name}:`);
      console.log(`  Add speed:   ${addSpeedup}x ${parseFloat(addSpeedup) >= 1 ? '✅' : '⚠️'}`);
      console.log(`  Check speed: ${checkSpeedup}x ${parseFloat(checkSpeedup) >= 1 ? '✅' : '⚠️'}`);
      console.log(`  FP rate:     ${result.falsePositiveRate.toFixed(2)}% ${result.falsePositiveRate <= FALSE_POSITIVE_RATE * 100 * 1.5 ? '✅' : '⚠️'}`);
    }
  }

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              UNIQUE FEATURES COMPARISON                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Feature                    | adaptive-bloom-filter | Others');
  console.log('─'.repeat(60));
  console.log('Zero dependencies          |          ✅           |   ❌');
  console.log('Auto-compression           |          ✅           |   ❌');
  console.log('Async operations           |          ✅           |   ❌');
  console.log('Auto-scaling               |          ✅           |   ❌');
  console.log('TTL support                |          ✅           |   ❌');
  console.log('Batch operations           |          ✅           |   ❌');
  console.log('Union/Intersection         |          ✅           |   ✅');
  console.log('Serialization              |          ✅           |   ✅');
  console.log('Memory pool                |          ✅           |   ❌');
  console.log('Performance metrics        |          ✅           |   ❌');
  console.log('Browser support            |          ✅           |   ⚠️');
  console.log('TypeScript types           |          ✅           |   ✅');
  console.log('');

  return results;
};

runAllBenchmarks().catch(console.error);
