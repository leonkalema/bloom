/**
 * Serialization Module
 * Provides state persistence and restoration for bloom filters
 */

class Serializer {
  static serialize(filter) {
    const data = {
      version: '1.1.0',
      expectedItems: filter.expectedItems,
      falsePositiveRate: filter.falsePositiveRate,
      size: filter.size,
      hashFunctions: filter.hashFunctions,
      itemCount: filter.itemCount,
      bitArray: {
        array: Array.from(filter.bitArray.array),
        size: filter.bitArray.size,
        compressed: filter.bitArray.compressed,
        compressionRatio: filter.bitArray.compressionRatio
      },
      knownItems: filter.knownItems ? Array.from(filter.knownItems) : [],
      options: {
        autoScale: filter.autoScaler?.enabled || false,
        maxSize: filter.autoScaler?.maxSize || 1000000,
        ttl: filter.ttlManager?.ttl || null
      },
      timestamp: Date.now()
    };
    
    return JSON.stringify(data);
  }

  static deserialize(serializedData) {
    if (typeof serializedData !== 'string') {
      throw new Error('Serialized data must be a string');
    }
    
    let data;
    try {
      data = JSON.parse(serializedData);
    } catch (error) {
      throw new Error('Invalid JSON in serialized data');
    }
    
    if (!data.version) {
      throw new Error('Missing version in serialized data');
    }
    
    const AdaptiveBloomFilter = require('../core/bloom-filter');
    const filter = new AdaptiveBloomFilter(
      data.expectedItems,
      data.falsePositiveRate,
      data.options
    );
    
    filter.bitArray = {
      array: new Uint8Array(data.bitArray.array),
      size: data.bitArray.size,
      compressed: data.bitArray.compressed,
      compressionRatio: data.bitArray.compressionRatio
    };
    
    filter.itemCount = data.itemCount;
    
    if (data.knownItems && Array.isArray(data.knownItems)) {
      filter.knownItems = new Set(data.knownItems);
    }
    
    return filter;
  }

  static isCompatible(serializedData) {
    try {
      const data = JSON.parse(serializedData);
      return data.version && typeof data.expectedItems === 'number';
    } catch {
      return false;
    }
  }
}

module.exports = Serializer;
