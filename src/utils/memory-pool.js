/**
 * Memory Pool Module
 * Provides efficient filter reuse and memory management
 */

class BloomFilterPool {
  constructor(poolSize = 10) {
    this.poolSize = poolSize;
    this.availableFilters = [];
    this.usedFilters = new Set();
  }

  createFilter(expectedItems, falsePositiveRate, options = {}) {
    const reusableFilter = this.availableFilters.find(filter => 
      filter.expectedItems >= expectedItems && 
      filter.falsePositiveRate <= falsePositiveRate
    );

    if (reusableFilter) {
      this.availableFilters.splice(this.availableFilters.indexOf(reusableFilter), 1);
      reusableFilter.reset();
      this.usedFilters.add(reusableFilter);
      return reusableFilter;
    }

    if (this.usedFilters.size < this.poolSize) {
      const AdaptiveBloomFilter = require('../core/bloom-filter');
      const newFilter = new AdaptiveBloomFilter(expectedItems, falsePositiveRate, options);
      this.usedFilters.add(newFilter);
      return newFilter;
    }

    const AdaptiveBloomFilter = require('../core/bloom-filter');
    return new AdaptiveBloomFilter(expectedItems, falsePositiveRate, options);
  }

  releaseFilter(filter) {
    if (this.usedFilters.has(filter)) {
      this.usedFilters.delete(filter);
      filter.reset();
      this.availableFilters.push(filter);
    }
  }

  getPoolStats() {
    return {
      poolSize: this.poolSize,
      available: this.availableFilters.length,
      used: this.usedFilters.size,
      memoryEfficiency: (this.availableFilters.length / this.poolSize) * 100
    };
  }

  clear() {
    this.availableFilters.length = 0;
    this.usedFilters.clear();
  }
}

module.exports = BloomFilterPool;
