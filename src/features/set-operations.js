/**
 * Set Operations Module
 * Provides union and intersection operations for bloom filters
 */

const CompressibleBitArray = require('../core/bit-array');

class SetOperations {
  static union(filter1, filter2) {
    if (filter1.size !== filter2.size || filter1.hashFunctions !== filter2.hashFunctions) {
      throw new Error('Filters must have same size and hash functions for union');
    }
    
    const AdaptiveBloomFilter = require('../core/bloom-filter');
    const combinedFilter = new AdaptiveBloomFilter(filter1.expectedItems, filter1.falsePositiveRate);
    
    const thisArray = filter1.bitArray.compressed ? 
      CompressibleBitArray.expand(filter1.bitArray) : filter1.bitArray;
    const otherArray = filter2.bitArray.compressed ? 
      CompressibleBitArray.expand(filter2.bitArray) : filter2.bitArray;
    
    for (let i = 0; i < Math.min(thisArray.array.length, otherArray.array.length); i++) {
      combinedFilter.bitArray.array[i] = thisArray.array[i] | otherArray.array[i];
    }
    
    if (filter1.metricsTracker?.enabled && filter2.metricsTracker?.enabled) {
      combinedFilter.knownItems = new Set([...filter1.knownItems, ...filter2.knownItems]);
      combinedFilter.itemCount = combinedFilter.knownItems.size;
    } else {
      combinedFilter.itemCount = filter1.itemCount + filter2.itemCount;
    }
    
    return combinedFilter;
  }

  static intersect(filter1, filter2) {
    if (filter1.size !== filter2.size || filter1.hashFunctions !== filter2.hashFunctions) {
      throw new Error('Filters must have same size and hash functions for intersection');
    }
    
    const AdaptiveBloomFilter = require('../core/bloom-filter');
    const intersectFilter = new AdaptiveBloomFilter(filter1.expectedItems, filter1.falsePositiveRate);
    
    const thisArray = filter1.bitArray.compressed ? 
      CompressibleBitArray.expand(filter1.bitArray) : filter1.bitArray;
    const otherArray = filter2.bitArray.compressed ? 
      CompressibleBitArray.expand(filter2.bitArray) : filter2.bitArray;
    
    for (let i = 0; i < Math.min(thisArray.array.length, otherArray.array.length); i++) {
      intersectFilter.bitArray.array[i] = thisArray.array[i] & otherArray.array[i];
    }
    
    if (filter1.metricsTracker?.enabled && filter2.metricsTracker?.enabled) {
      const intersection = new Set();
      for (const item of filter1.knownItems) {
        if (filter2.knownItems.has(item)) {
          intersection.add(item);
        }
      }
      intersectFilter.knownItems = intersection;
      intersectFilter.itemCount = intersection.size;
    } else {
      intersectFilter.itemCount = Math.min(filter1.itemCount, filter2.itemCount);
    }
    
    return intersectFilter;
  }
}

module.exports = SetOperations;
