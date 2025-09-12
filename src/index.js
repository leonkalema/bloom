/**
 * Main Export Module
 * Exports all bloom filter classes and utilities
 */

const AdaptiveBloomFilter = require('./core/bloom-filter');
const BloomFilterPool = require('./utils/memory-pool');
const HashFunctions = require('./core/hash-functions');
const CompressibleBitArray = require('./core/bit-array');
const MetricsTracker = require('./utils/metrics');
const AutoScaler = require('./features/auto-scaling');
const TTLManager = require('./features/ttl-manager');
const SetOperations = require('./features/set-operations');
const Serializer = require('./features/serialization');
const BatchProcessor = require('./utils/batch-operations');

module.exports = {
  AdaptiveBloomFilter,
  BloomFilterPool,
  
  // Core components
  HashFunctions,
  CompressibleBitArray,
  
  // Utilities
  MetricsTracker,
  BatchProcessor,
  
  // Features
  AutoScaler,
  TTLManager,
  SetOperations,
  Serializer
};
