// Browser-compatible bundle for Adaptive Bloom Filter Demo
// This file combines all modules into a single browser-ready script

// Hash Functions Module
class HashFunctions {
    static murmur3(key, seed = 0) {
        const remainder = key.length & 3;
        const bytes = key.length - remainder;
        let h1 = seed;
        const c1 = 0xcc9e2d51;
        const c2 = 0x1b873593;
        let i = 0;

        while (i < bytes) {
            let k1 = 
                ((key.charCodeAt(i) & 0xff)) |
                ((key.charCodeAt(++i) & 0xff) << 8) |
                ((key.charCodeAt(++i) & 0xff) << 16) |
                ((key.charCodeAt(++i) & 0xff) << 24);
            ++i;

            k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

            h1 ^= k1;
            h1 = (h1 << 13) | (h1 >>> 19);
            const h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
            h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
        }

        let k1 = 0;
        switch (remainder) {
            case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
            case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
            case 1: k1 ^= (key.charCodeAt(i) & 0xff);
                k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
                k1 = (k1 << 15) | (k1 >>> 17);
                k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
                h1 ^= k1;
        }

        h1 ^= key.length;
        h1 ^= h1 >>> 16;
        h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
        h1 ^= h1 >>> 13;
        h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
        h1 ^= h1 >>> 16;

        return h1 >>> 0;
    }

    static generateHashes(item, numHashes, bitArraySize) {
        const hashes = [];
        const hash1 = this.murmur3(item, 0);
        const hash2 = this.murmur3(item, hash1);
        
        for (let i = 0; i < numHashes; i++) {
            const hash = (hash1 + i * hash2) % bitArraySize;
            hashes.push(Math.abs(hash));
        }
        
        return hashes;
    }
}

// Bit Array Module
class BitArray {
    static createCompressibleBitArray(size) {
        return {
            bits: new Uint8Array(Math.ceil(size / 8)),
            size: size,
            setBitsCount: 0
        };
    }

    static setBit(bitArray, index) {
        if (index < 0 || index >= bitArray.size) {
            throw new Error(`Bit index ${index} out of bounds for size ${bitArray.size}`);
        }
        
        const byteIndex = Math.floor(index / 8);
        const bitIndex = index % 8;
        const mask = 1 << bitIndex;
        
        if (!(bitArray.bits[byteIndex] & mask)) {
            bitArray.bits[byteIndex] |= mask;
            bitArray.setBitsCount++;
        }
    }

    static getBit(bitArray, index) {
        if (index < 0 || index >= bitArray.size) {
            return false;
        }
        
        const byteIndex = Math.floor(index / 8);
        const bitIndex = index % 8;
        const mask = 1 << bitIndex;
        
        return !!(bitArray.bits[byteIndex] & mask);
    }

    static compressRLE(bitArray) {
        const compressed = [];
        let currentBit = 0;
        let count = 0;
        
        for (let i = 0; i < bitArray.size; i++) {
            const bit = this.getBit(bitArray, i) ? 1 : 0;
            
            if (bit === currentBit) {
                count++;
                if (count >= 255) {
                    compressed.push(count);
                    compressed.push(currentBit);
                    count = 0;
                }
            } else {
                if (count > 0) {
                    compressed.push(count);
                    compressed.push(currentBit);
                }
                currentBit = bit;
                count = 1;
            }
        }
        
        if (count > 0) {
            compressed.push(count);
            compressed.push(currentBit);
        }
        
        return new Uint8Array(compressed);
    }
}

// Metrics Module
class Metrics {
    constructor() {
        this.data = {
            totalAdds: 0,
            totalChecks: 0,
            falsePositives: 0,
            compressionRatio: 1.0,
            averageAddTime: 0,
            averageCheckTime: 0,
            memoryUsage: 0,
            lastOperationTime: Date.now()
        };
        this.addTimes = [];
        this.checkTimes = [];
    }

    recordAdd(duration) {
        this.data.totalAdds++;
        this.addTimes.push(duration);
        if (this.addTimes.length > 1000) this.addTimes.shift();
        this.data.averageAddTime = this.addTimes.reduce((a, b) => a + b, 0) / this.addTimes.length;
        this.data.lastOperationTime = Date.now();
    }

    recordCheck(duration, result) {
        this.data.totalChecks++;
        this.checkTimes.push(duration);
        if (this.checkTimes.length > 1000) this.checkTimes.shift();
        this.data.averageCheckTime = this.checkTimes.reduce((a, b) => a + b, 0) / this.checkTimes.length;
        this.data.lastOperationTime = Date.now();
    }

    updateMemoryUsage(bytes) {
        this.data.memoryUsage = bytes;
    }

    updateCompressionRatio(ratio) {
        this.data.compressionRatio = ratio;
    }

    getMetrics() {
        return { ...this.data };
    }

    reset() {
        this.data = {
            totalAdds: 0,
            totalChecks: 0,
            falsePositives: 0,
            compressionRatio: 1.0,
            averageAddTime: 0,
            averageCheckTime: 0,
            memoryUsage: 0,
            lastOperationTime: Date.now()
        };
        this.addTimes = [];
        this.checkTimes = [];
    }
}

// TTL Manager Module
class TTLManager {
    constructor(ttl) {
        this.ttl = ttl;
        this.itemTimestamps = new Map();
        this.cleanupInterval = null;
        
        if (ttl > 0) {
            this.startCleanup();
        }
    }

    addItem(item) {
        if (this.ttl > 0) {
            this.itemTimestamps.set(item, Date.now());
        }
    }

    isExpired(item) {
        if (this.ttl <= 0) return false;
        
        const timestamp = this.itemTimestamps.get(item);
        if (!timestamp) return false;
        
        return (Date.now() - timestamp) > this.ttl;
    }

    cleanup() {
        if (this.ttl <= 0) return [];
        
        const now = Date.now();
        const expired = [];
        
        for (const [item, timestamp] of this.itemTimestamps.entries()) {
            if ((now - timestamp) > this.ttl) {
                expired.push(item);
                this.itemTimestamps.delete(item);
            }
        }
        
        return expired;
    }

    startCleanup() {
        if (this.cleanupInterval) return;
        
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, Math.min(this.ttl / 10, 60000));
    }

    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    reset() {
        this.itemTimestamps.clear();
    }
}

// Main Adaptive Bloom Filter Class
class AdaptiveBloomFilter {
    constructor(expectedItems, falsePositiveRate = 0.01, options = {}) {
        if (!Number.isInteger(expectedItems) || expectedItems <= 0) {
            throw new Error('Expected items must be a positive integer');
        }
        
        if (falsePositiveRate <= 0 || falsePositiveRate >= 1) {
            throw new Error('False positive rate must be between 0 and 1');
        }

        this.expectedItems = expectedItems;
        this.falsePositiveRate = falsePositiveRate;
        this.options = {
            autoScale: options.autoScale || false,
            maxSize: options.maxSize || expectedItems * 10,
            ttl: options.ttl || 0,
            batchSize: options.batchSize || 1000,
            metricsEnabled: options.metricsEnabled !== false,
            ...options
        };

        // Calculate optimal parameters
        this.bitArraySize = Math.ceil((-expectedItems * Math.log(falsePositiveRate)) / (Math.log(2) ** 2));
        this.numHashes = Math.ceil((this.bitArraySize / expectedItems) * Math.log(2));
        
        // Initialize components
        this.bitArray = BitArray.createCompressibleBitArray(this.bitArraySize);
        this.itemCount = 0;
        this.metrics = this.options.metricsEnabled ? new Metrics() : null;
        this.ttlManager = new TTLManager(this.options.ttl);
        
        if (this.metrics) {
            this.metrics.updateMemoryUsage(this.bitArray.bits.length);
        }
    }

    add(item) {
        const startTime = performance.now();
        
        if (typeof item !== 'string') {
            item = String(item);
        }

        // Check for auto-scaling
        if (this.options.autoScale && this.shouldScale()) {
            this.scale();
        }

        // Add to TTL manager
        this.ttlManager.addItem(item);

        // Generate hashes and set bits
        const hashes = HashFunctions.generateHashes(item, this.numHashes, this.bitArraySize);
        
        for (const hash of hashes) {
            BitArray.setBit(this.bitArray, hash);
        }
        
        this.itemCount++;
        
        if (this.metrics) {
            const duration = performance.now() - startTime;
            this.metrics.recordAdd(duration);
            this.metrics.updateMemoryUsage(this.bitArray.bits.length);
        }
    }

    check(item) {
        const startTime = performance.now();
        
        if (typeof item !== 'string') {
            item = String(item);
        }

        // Check if expired
        if (this.ttlManager.isExpired(item)) {
            if (this.metrics) {
                const duration = performance.now() - startTime;
                this.metrics.recordCheck(duration, false);
            }
            return false;
        }

        // Generate hashes and check bits
        const hashes = HashFunctions.generateHashes(item, this.numHashes, this.bitArraySize);
        
        for (const hash of hashes) {
            if (!BitArray.getBit(this.bitArray, hash)) {
                if (this.metrics) {
                    const duration = performance.now() - startTime;
                    this.metrics.recordCheck(duration, false);
                }
                return false;
            }
        }
        
        if (this.metrics) {
            const duration = performance.now() - startTime;
            this.metrics.recordCheck(duration, true);
        }
        
        return true;
    }

    shouldScale() {
        const loadFactor = this.itemCount / this.expectedItems;
        return loadFactor > 0.8 && this.bitArraySize < this.options.maxSize;
    }

    scale() {
        const newExpectedItems = Math.min(this.expectedItems * 2, this.options.maxSize);
        const newBitArraySize = Math.ceil((-newExpectedItems * Math.log(this.falsePositiveRate)) / (Math.log(2) ** 2));
        
        if (newBitArraySize > this.bitArraySize) {
            const newBitArray = BitArray.createCompressibleBitArray(newBitArraySize);
            
            // Rehash existing items (simplified - in practice you'd need to track items)
            this.bitArray = newBitArray;
            this.bitArraySize = newBitArraySize;
            this.expectedItems = newExpectedItems;
            this.numHashes = Math.ceil((this.bitArraySize / this.expectedItems) * Math.log(2));
        }
    }

    addBatch(items) {
        const startTime = performance.now();
        
        for (const item of items) {
            this.add(item);
        }
        
        return performance.now() - startTime;
    }

    checkBatch(items) {
        const startTime = performance.now();
        const results = [];
        
        for (const item of items) {
            results.push(this.check(item));
        }
        
        return {
            results,
            duration: performance.now() - startTime
        };
    }

    compress() {
        const compressed = BitArray.compressRLE(this.bitArray);
        const ratio = compressed.length / this.bitArray.bits.length;
        
        if (this.metrics) {
            this.metrics.updateCompressionRatio(ratio);
        }
        
        return {
            compressed,
            originalSize: this.bitArray.bits.length,
            compressedSize: compressed.length,
            ratio
        };
    }

    getMetrics() {
        if (!this.metrics) return null;
        
        const metrics = this.metrics.getMetrics();
        return {
            ...metrics,
            itemCount: this.itemCount,
            bitArraySize: this.bitArraySize,
            expectedItems: this.expectedItems,
            loadFactor: this.itemCount / this.expectedItems,
            setBits: this.bitArray.setBitsCount,
            fillRatio: this.bitArray.setBitsCount / this.bitArraySize
        };
    }

    reset() {
        this.bitArray = BitArray.createCompressibleBitArray(this.bitArraySize);
        this.itemCount = 0;
        
        if (this.metrics) {
            this.metrics.reset();
            this.metrics.updateMemoryUsage(this.bitArray.bits.length);
        }
        
        this.ttlManager.reset();
    }

    // Utility methods for unique count estimation
    estimateUniqueCount() {
        const setBits = this.bitArray.setBitsCount;
        const totalBits = this.bitArraySize;
        const numHashes = this.numHashes;
        
        if (setBits === 0) return 0;
        if (setBits === totalBits) return Infinity;
        
        return -totalBits * Math.log(1 - setBits / totalBits) / numHashes;
    }
}

// Memory Pool for managing multiple filters
class BloomFilterPool {
    constructor(maxSize = 10) {
        this.pool = [];
        this.maxSize = maxSize;
        this.inUse = new Set();
    }

    acquire(expectedItems, falsePositiveRate, options) {
        let filter = this.pool.find(f => 
            f.expectedItems === expectedItems && 
            f.falsePositiveRate === falsePositiveRate &&
            !this.inUse.has(f)
        );

        if (!filter) {
            filter = new AdaptiveBloomFilter(expectedItems, falsePositiveRate, options);
        } else {
            filter.reset();
            this.pool = this.pool.filter(f => f !== filter);
        }

        this.inUse.add(filter);
        return filter;
    }

    release(filter) {
        if (this.inUse.has(filter)) {
            this.inUse.delete(filter);
            
            if (this.pool.length < this.maxSize) {
                filter.reset();
                this.pool.push(filter);
            }
        }
    }

    clear() {
        this.pool = [];
        this.inUse.clear();
    }

    getStats() {
        return {
            poolSize: this.pool.length,
            inUse: this.inUse.size,
            maxSize: this.maxSize
        };
    }
}

// Export for browser use
window.AdaptiveBloomFilter = AdaptiveBloomFilter;
window.BloomFilterPool = BloomFilterPool;
