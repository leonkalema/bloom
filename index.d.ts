/**
 * TypeScript definitions for adaptive-bloom-filter
 * @packageDocumentation
 */

/// <reference lib="es2015" />

export interface BloomFilterOptions {
  /** Enable performance metrics tracking (default: true) */
  readonly metricsEnabled?: boolean;
  /** Enable auto-scaling when filter reaches capacity (default: false) */
  readonly autoScale?: boolean;
  /** Maximum size for auto-scaling (default: 1000000) */
  readonly maxSize?: number;
  /** Scale threshold as percentage of capacity (default: 0.8) */
  readonly scaleThreshold?: number;
  /** Scale factor when auto-scaling triggers (default: 2) */
  readonly scaleFactor?: number;
  /** Time-to-live in milliseconds for items (default: null) */
  readonly ttl?: number | null;
  /** Batch size for async operations (default: 100) */
  readonly batchSize?: number;
}

export interface BloomFilterMetrics {
  readonly addOperations: number;
  readonly checkOperations: number;
  readonly falsePositives: number;
  readonly compressionAttempts: number;
  readonly averageAddTime: number;
  readonly averageCheckTime: number;
  readonly compressionRatio: number;
  readonly autoScaleEvents: number;
}

export interface BitArray {
  readonly array: Uint8Array;
  readonly size: number;
  readonly compressed: boolean;
  readonly compressionRatio: number;
}

export interface PoolStats {
  readonly poolSize: number;
  readonly available: number;
  readonly used: number;
  readonly memoryEfficiency: number;
}

export interface TTLStats {
  readonly active: number;
  readonly expired: number;
  readonly total: number;
}

export interface OptimalParameters {
  readonly size: number;
  readonly hashFunctions: number;
}

/**
 * Adaptive Bloom Filter with compression, async operations, and auto-scaling
 */
export class AdaptiveBloomFilter {
  /** Expected number of items */
  readonly expectedItems: number;
  /** Target false positive rate */
  readonly falsePositiveRate: number;
  /** Bit array size */
  readonly size: number;
  /** Number of hash functions */
  readonly hashFunctions: number;
  /** Current item count */
  readonly itemCount: number;

  /**
   * Create a new bloom filter
   * @param expectedItems - Expected number of items to store
   * @param falsePositiveRate - Target false positive rate (0-1)
   * @param options - Optional configuration
   */
  constructor(
    expectedItems: number,
    falsePositiveRate?: number,
    options?: BloomFilterOptions
  );

  /**
   * Add an item to the filter
   * @param item - String item to add
   * @returns true if added successfully
   */
  add(item: string): boolean;

  /**
   * Check if an item might exist in the filter
   * @param item - String item to check
   * @returns true if item might exist, false if definitely not
   */
  check(item: string): boolean;

  /**
   * Add an item asynchronously (non-blocking)
   * @param item - String item to add
   */
  addAsync(item: string): Promise<boolean>;

  /**
   * Check an item asynchronously (non-blocking)
   * @param item - String item to check
   */
  checkAsync(item: string): Promise<boolean>;

  /**
   * Add multiple items at once
   * @param items - Array of string items
   * @returns Number of items added
   */
  addBatch(items: readonly string[]): number;

  /**
   * Check multiple items at once
   * @param items - Array of string items
   * @returns Array of boolean results
   */
  checkBatch(items: readonly string[]): boolean[];

  /**
   * Add multiple items asynchronously
   * @param items - Array of string items
   */
  addBatchAsync(items: readonly string[]): Promise<number>;

  /**
   * Check multiple items asynchronously
   * @param items - Array of string items
   */
  checkBatchAsync(items: readonly string[]): Promise<boolean[]>;

  /**
   * Force compression of the bit array
   * @returns true if compression was applied
   */
  compress(): boolean;

  /**
   * Reset the filter to empty state
   */
  reset(): void;

  /**
   * Get performance metrics
   * @returns Metrics object or null if disabled
   */
  getMetrics(): BloomFilterMetrics | null;

  /**
   * Estimate unique item count using bit density
   */
  estimateUniqueCount(): number;

  /**
   * Create union of two filters (items in either)
   * @param otherFilter - Filter to union with
   */
  union(otherFilter: AdaptiveBloomFilter): AdaptiveBloomFilter;

  /**
   * Create intersection of two filters (items in both)
   * @param otherFilter - Filter to intersect with
   */
  intersect(otherFilter: AdaptiveBloomFilter): AdaptiveBloomFilter;

  /**
   * Serialize filter to JSON string
   */
  serialize(): string;

  /**
   * Deserialize filter from JSON string
   * @param serializedData - JSON string from serialize()
   */
  static deserialize(serializedData: string): AdaptiveBloomFilter;
}

/**
 * Memory pool for efficient filter reuse
 */
export class BloomFilterPool {
  /**
   * Create a new filter pool
   * @param poolSize - Maximum number of filters to pool (default: 10)
   */
  constructor(poolSize?: number);

  /**
   * Get or create a filter from the pool
   * @param expectedItems - Expected number of items
   * @param falsePositiveRate - Target false positive rate
   * @param options - Optional configuration
   */
  createFilter(
    expectedItems: number,
    falsePositiveRate: number,
    options?: BloomFilterOptions
  ): AdaptiveBloomFilter;

  /**
   * Return a filter to the pool for reuse
   * @param filter - Filter to release
   */
  releaseFilter(filter: AdaptiveBloomFilter): void;

  /**
   * Get pool statistics
   */
  getPoolStats(): PoolStats;

  /**
   * Clear all pooled filters
   */
  clear(): void;
}

/**
 * Hash functions for bloom filter
 */
export const HashFunctions: {
  /**
   * Murmur3 hash function
   * @param key - String to hash
   * @param seed - Optional seed value
   */
  murmur3(key: string, seed?: number): number;

  /**
   * Generate multiple hash values for bloom filter
   * @param item - String to hash
   * @param numHashes - Number of hashes to generate
   * @param size - Size of bit array
   */
  generateHashes(item: string, numHashes: number, size: number): number[];
};

/**
 * Compressible bit array with RLE compression
 */
export const CompressibleBitArray: {
  /**
   * Create a new bit array
   * @param size - Number of bits
   */
  create(size: number): BitArray;

  /**
   * Set a bit to 1
   * @param bitArray - Bit array to modify
   * @param index - Bit index to set
   */
  setBit(bitArray: BitArray, index: number): void;

  /**
   * Get a bit value
   * @param bitArray - Bit array to read
   * @param index - Bit index to get
   */
  getBit(bitArray: BitArray, index: number): boolean;

  /**
   * Compress bit array using RLE
   * @param bitArray - Bit array to compress
   */
  compress(bitArray: BitArray): BitArray;

  /**
   * Expand compressed bit array
   * @param bitArray - Compressed bit array
   */
  expand(bitArray: BitArray): BitArray;

  /**
   * Check if compression would be beneficial
   * @param bitArray - Bit array to check
   */
  shouldCompress(bitArray: BitArray): boolean;
};

/**
 * Performance metrics tracker
 */
export class MetricsTracker {
  readonly enabled: boolean;

  constructor(enabled?: boolean);

  reset(): void;
  recordAdd(duration: number): void;
  recordCheck(duration: number, isFalsePositive?: boolean): void;
  recordCompression(ratio: number): void;
  recordAutoScale(): void;
  getMetrics(): BloomFilterMetrics | null;
  getFalsePositiveRate(): number;
}

/**
 * Auto-scaling manager
 */
export class AutoScaler {
  readonly enabled: boolean;
  readonly maxSize: number;
  readonly scaleThreshold: number;
  readonly scaleFactor: number;

  constructor(options?: BloomFilterOptions);

  shouldScale(currentItems: number, expectedItems: number): boolean;
  calculateNewSize(currentExpectedItems: number): number;
  calculateOptimalParameters(
    expectedItems: number,
    falsePositiveRate: number
  ): OptimalParameters;
  migrateItems(
    oldFilter: AdaptiveBloomFilter,
    newFilter: AdaptiveBloomFilter,
    knownItems: Set<string>
  ): void;
}

/**
 * TTL (Time-To-Live) manager for item expiration
 */
export class TTLManager {
  readonly ttl: number | null;

  constructor(ttl?: number | null);

  addItem(item: string): void;
  isExpired(item: string): boolean;
  checkItem(item: string): boolean;
  cleanup(): number;
  clear(): void;
  getStats(): TTLStats | null;
}

/**
 * Set operations for bloom filters
 */
export const SetOperations: {
  /**
   * Create union of two filters
   * @param filter1 - First filter
   * @param filter2 - Second filter
   */
  union(
    filter1: AdaptiveBloomFilter,
    filter2: AdaptiveBloomFilter
  ): AdaptiveBloomFilter;

  /**
   * Create intersection of two filters
   * @param filter1 - First filter
   * @param filter2 - Second filter
   */
  intersect(
    filter1: AdaptiveBloomFilter,
    filter2: AdaptiveBloomFilter
  ): AdaptiveBloomFilter;
};

/**
 * Serialization utilities
 */
export const Serializer: {
  /**
   * Serialize filter to JSON string
   * @param filter - Filter to serialize
   */
  serialize(filter: AdaptiveBloomFilter): string;

  /**
   * Deserialize filter from JSON string
   * @param serializedData - JSON string
   */
  deserialize(serializedData: string): AdaptiveBloomFilter;

  /**
   * Check if serialized data is compatible
   * @param serializedData - JSON string to check
   */
  isCompatible(serializedData: string): boolean;
};

/**
 * Batch operations processor
 */
export class BatchProcessor {
  readonly batchSize: number;

  constructor(batchSize?: number);

  addBatch(filter: AdaptiveBloomFilter, items: readonly string[]): number;
  checkBatch(filter: AdaptiveBloomFilter, items: readonly string[]): boolean[];
  addBatchAsync(
    filter: AdaptiveBloomFilter,
    items: readonly string[]
  ): Promise<number>;
  checkBatchAsync(
    filter: AdaptiveBloomFilter,
    items: readonly string[]
  ): Promise<boolean[]>;
}
