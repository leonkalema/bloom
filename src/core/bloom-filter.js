/**
 * Core Bloom Filter Module
 * Main bloom filter implementation with all features
 */

const HashFunctions = require('./hash-functions');
const CompressibleBitArray = require('./bit-array');
const MetricsTracker = require('../utils/metrics');
const AutoScaler = require('../features/auto-scaling');
const TTLManager = require('../features/ttl-manager');
const SetOperations = require('../features/set-operations');
const Serializer = require('../features/serialization');
const BatchProcessor = require('../utils/batch-operations');

class AdaptiveBloomFilter {
  constructor(expectedItems, falsePositiveRate = 0.01, options = {}) {
    if (!Number.isInteger(expectedItems) || expectedItems <= 0) {
      throw new Error('Expected items must be a positive integer');
    }
    if (typeof falsePositiveRate !== 'number' || falsePositiveRate <= 0 || falsePositiveRate >= 1) {
      throw new Error('False positive rate must be between 0 and 1');
    }

    this.expectedItems = expectedItems;
    this.falsePositiveRate = falsePositiveRate;
    
    const m = Math.ceil((-expectedItems * Math.log(falsePositiveRate)) / (Math.log(2) * Math.log(2)));
    const k = Math.round((m / expectedItems) * Math.log(2));
    
    this.size = m;
    this.hashFunctions = Math.max(1, k);
    this.bitArray = CompressibleBitArray.create(this.size);
    this.itemCount = 0;
    
    this.metricsTracker = new MetricsTracker(options.metricsEnabled !== false);
    this.knownItems = this.metricsTracker.enabled ? new Set() : null;
    
    this.autoScaler = new AutoScaler(options);
    this.ttlManager = new TTLManager(options.ttl);
    this.batchProcessor = new BatchProcessor(options.batchSize);
    
    this.workQueue = [];
    this.processingQueue = false;
    this.compressionTimer = null;
  }

  add(item) {
    if (typeof item !== 'string') {
      throw new Error('Item must be a string');
    }

    const startTime = performance.now();
    
    if (this.ttlManager) {
      this.ttlManager.addItem(item);
    }

    const hashes = HashFunctions.generateHashes(item, this.hashFunctions, this.size);
    
    for (const hash of hashes) {
      CompressibleBitArray.setBit(this.bitArray, hash);
    }
    
    this.itemCount++;
    
    if (this.knownItems) {
      this.knownItems.add(item);
    }
    
    if (this.metricsTracker) {
      this.metricsTracker.recordAdd(performance.now() - startTime);
    }
    
    this.scheduleCompression();
    this.checkAutoScale();
    
    return true;
  }

  check(item) {
    if (typeof item !== 'string') {
      throw new Error('Item must be a string');
    }

    const startTime = performance.now();
    
    if (this.ttlManager && !this.ttlManager.checkItem(item)) {
      if (this.metricsTracker) {
        this.metricsTracker.recordCheck(performance.now() - startTime, false);
      }
      return false;
    }

    const hashes = HashFunctions.generateHashes(item, this.hashFunctions, this.size);
    
    for (const hash of hashes) {
      if (!CompressibleBitArray.getBit(this.bitArray, hash)) {
        if (this.metricsTracker) {
          this.metricsTracker.recordCheck(performance.now() - startTime, false);
        }
        return false;
      }
    }
    
    const isFalsePositive = this.knownItems && !this.knownItems.has(item);
    
    if (this.metricsTracker) {
      this.metricsTracker.recordCheck(performance.now() - startTime, isFalsePositive);
    }
    
    return true;
  }

  addAsync(item) {
    return new Promise((resolve) => {
      this.workQueue.push({ type: 'add', item, resolve });
      this.processQueue();
    });
  }

  checkAsync(item) {
    return new Promise((resolve) => {
      this.workQueue.push({ type: 'check', item, resolve });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processingQueue || this.workQueue.length === 0) {
      return;
    }

    this.processingQueue = true;
    
    while (this.workQueue.length > 0) {
      const batch = this.workQueue.splice(0, 10);
      
      await new Promise(resolve => {
        setTimeout(() => {
          for (const { type, item, resolve: itemResolve } of batch) {
            try {
              const result = type === 'add' ? this.add(item) : this.check(item);
              itemResolve(result);
            } catch (error) {
              itemResolve(false);
            }
          }
          resolve();
        }, 0);
      });
    }
    
    this.processingQueue = false;
  }

  scheduleCompression() {
    if (this.compressionTimer) {
      return;
    }
    
    this.compressionTimer = setTimeout(() => {
      try {
        this.compress();
      } catch (error) {
        console.warn('Compression failed:', error.message);
      } finally {
        this.compressionTimer = null;
      }
    }, 1000);
  }

  compress() {
    if (!CompressibleBitArray.shouldCompress(this.bitArray)) {
      return false;
    }
    
    try {
      const compressed = CompressibleBitArray.compress(this.bitArray);
      this.bitArray = compressed;
      
      if (this.metricsTracker) {
        this.metricsTracker.recordCompression(compressed.compressionRatio);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Compression failed: ${error.message}`);
    }
  }

  checkAutoScale() {
    if (!this.autoScaler.shouldScale(this.itemCount, this.expectedItems)) {
      return false;
    }

    const newExpectedItems = this.autoScaler.calculateNewSize(this.expectedItems);
    const newParams = this.autoScaler.calculateOptimalParameters(newExpectedItems, this.falsePositiveRate);
    
    this.expectedItems = newExpectedItems;
    this.size = newParams.size;
    this.hashFunctions = newParams.hashFunctions;
    
    const oldBitArray = this.bitArray;
    this.bitArray = CompressibleBitArray.create(this.size);
    
    if (this.knownItems) {
      this.autoScaler.migrateItems(this, this, this.knownItems);
    }
    
    if (this.metricsTracker) {
      this.metricsTracker.recordAutoScale();
    }
    
    return true;
  }

  addBatch(items) {
    return this.batchProcessor.addBatch(this, items);
  }

  checkBatch(items) {
    return this.batchProcessor.checkBatch(this, items);
  }

  addBatchAsync(items) {
    return this.batchProcessor.addBatchAsync(this, items);
  }

  checkBatchAsync(items) {
    return this.batchProcessor.checkBatchAsync(this, items);
  }

  union(otherFilter) {
    return SetOperations.union(this, otherFilter);
  }

  intersect(otherFilter) {
    return SetOperations.intersect(this, otherFilter);
  }

  serialize() {
    return Serializer.serialize(this);
  }

  static deserialize(serializedData) {
    return Serializer.deserialize(serializedData);
  }

  estimateUniqueCount() {
    if (this.knownItems) {
      return this.knownItems.size;
    }
    
    const bitArray = this.bitArray.compressed ? 
      CompressibleBitArray.expand(this.bitArray) : this.bitArray;
    
    let setBits = 0;
    for (let i = 0; i < bitArray.array.length; i++) {
      for (let j = 0; j < 8; j++) {
        if (bitArray.array[i] & (1 << j)) {
          setBits++;
        }
      }
    }
    
    if (setBits === 0) return 0;
    if (setBits === this.size) return this.expectedItems;
    
    return Math.round(-this.size * Math.log(1 - setBits / this.size) / this.hashFunctions);
  }

  getMetrics() {
    return this.metricsTracker ? this.metricsTracker.getMetrics() : null;
  }

  reset() {
    if (this.compressionTimer) {
      clearTimeout(this.compressionTimer);
      this.compressionTimer = null;
    }
    
    this.bitArray = CompressibleBitArray.create(this.size);
    this.itemCount = 0;
    
    if (this.knownItems) {
      this.knownItems.clear();
    }
    
    if (this.ttlManager) {
      this.ttlManager.clear();
    }
    
    this.workQueue = [];
    this.processingQueue = false;
    
    if (this.metricsTracker) {
      this.metricsTracker.reset();
    }
  }
}

module.exports = AdaptiveBloomFilter;
