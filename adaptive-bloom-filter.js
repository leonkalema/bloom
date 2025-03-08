(() => {
    const Murmur3 = (() => {
      const c1 = 0xcc9e2d51;
      const c2 = 0x1b873593;
      const r1 = 15;
      const r2 = 13;
      const m = 5;
      const n = 0xe6546b64;
  
      return (key, seed = 0) => {
        let hash = seed;
        let k = 0;
        const remainder = key.length & 3;
        const bytes = key.length - remainder;
  
        for (let i = 0; i < bytes; i += 4) {
          k = ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(i + 1) & 0xff) << 8) |
            ((key.charCodeAt(i + 2) & 0xff) << 16) |
            ((key.charCodeAt(i + 3) & 0xff) << 24);
  
          k = Math.imul(k, c1);
          k = (k << r1) | (k >>> (32 - r1));
          k = Math.imul(k, c2);
  
          hash ^= k;
          hash = (hash << r2) | (hash >>> (32 - r2));
          hash = Math.imul(hash, m) + n;
        }
  
        k = 0;
        switch (remainder) {
          case 3: k ^= (key.charCodeAt(bytes + 2) & 0xff) << 16;
          case 2: k ^= (key.charCodeAt(bytes + 1) & 0xff) << 8;
          case 1: k ^= (key.charCodeAt(bytes) & 0xff);
            k = Math.imul(k, c1);
            k = (k << r1) | (k >>> (32 - r1));
            k = Math.imul(k, c2);
            hash ^= k;
        }
  
        hash ^= key.length;
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x85ebca6b);
        hash ^= hash >>> 13;
        hash = Math.imul(hash, 0xc2b2ae35);
        hash ^= hash >>> 16;
  
        return hash >>> 0;
      };
    })();
  
    const CompressibleBitArray = (() => {
      const createBitArray = size => {
        const byteLength = Math.ceil(size / 8);
        return {
          array: new Uint8Array(byteLength),
          size,
          byteLength,
          compressionRatio: 1
        };
      };
  
      const setBit = (bitArray, index) => {
        const byteIndex = Math.floor(index / 8);
        const bitOffset = index % 8;
        bitArray.array[byteIndex] |= (1 << bitOffset);
        return bitArray;
      };
  
      const getBit = (bitArray, index) => {
        const byteIndex = Math.floor(index / 8);
        const bitOffset = index % 8;
        return (bitArray.array[byteIndex] & (1 << bitOffset)) !== 0;
      };
  
      const compressRLE = bitArray => {
        const { array, size } = bitArray;
        const compressed = [];
        let count = 1;
        let current = array[0];
  
        for (let i = 1; i < array.length; i++) {
          if (array[i] === current && count < 255) {
            count++;
          } else {
            compressed.push(count, current);
            current = array[i];
            count = 1;
          }
        }
        compressed.push(count, current);
  
        const compressedArray = new Uint8Array(compressed);
        const newRatio = compressedArray.length / array.length;
  
        return newRatio < 0.8 ? {
          array: compressedArray,
          size,
          byteLength: compressedArray.length,
          compressionRatio: newRatio,
          compressed: true
        } : bitArray;
      };
  
      const expandRLE = bitArray => {
        if (!bitArray.compressed) return bitArray;
  
        const { array, size } = bitArray;
        const byteLength = Math.ceil(size / 8);
        const expanded = new Uint8Array(byteLength);
  
        let expandedIndex = 0;
        for (let i = 0; i < array.length; i += 2) {
          const count = array[i];
          const value = array[i + 1];
          for (let j = 0; j < count; j++) {
            if (expandedIndex < byteLength) {
              expanded[expandedIndex++] = value;
            }
          }
        }
  
        return {
          array: expanded,
          size,
          byteLength,
          compressionRatio: 1,
          compressed: false
        };
      };
  
      return { 
        create: createBitArray, 
        setBit, 
        getBit, 
        compress: compressRLE, 
        expand: expandRLE 
      };
    })();
  
    class AdaptiveBloomFilter {
      constructor(expectedItems, falsePositiveRate = 0.01) {
        this.expectedItems = expectedItems;
        this.falsePositiveRate = falsePositiveRate;
        
        const bitsPerElement = Math.ceil(-Math.log2(falsePositiveRate) / Math.log(2));
        this.size = expectedItems * bitsPerElement;
        this.hashFunctions = Math.ceil(Math.log(2) * bitsPerElement);
        
        this.bitArray = CompressibleBitArray.create(this.size);
        this.itemCount = 0;
        this.compressionThreshold = Math.ceil(expectedItems * 0.3);
        this.compressionEnabled = true;
        this.compressionTimer = null;
        this.workQueue = [];
        this.processingQueue = false;
  
        this.metricsEnabled = true;
        this.metrics = {
          addOperations: 0,
          checkOperations: 0,
          falsePositives: 0,
          compressionAttempts: 0,
          averageAddTime: 0,
          averageCheckTime: 0,
          compressionRatio: 1
        };
      }
  
      _hashForIndex(item, index) {
        const hashValue = Murmur3(item, index);
        return hashValue % this.size;
      }
  
      add(item) {
        if (this.metricsEnabled) {
          const startTime = performance.now();
          this._addImpl(item);
          const endTime = performance.now();
          this.metrics.addOperations++;
          this.metrics.averageAddTime = ((this.metrics.averageAddTime * (this.metrics.addOperations - 1)) 
            + (endTime - startTime)) / this.metrics.addOperations;
        } else {
          this._addImpl(item);
        }
  
        if (this.compressionEnabled && !this.compressionTimer && this.itemCount % this.compressionThreshold === 0) {
          this.scheduleCompression();
        }
      }
  
      _addImpl(item) {
        if (this.bitArray.compressed) {
          this.bitArray = CompressibleBitArray.expand(this.bitArray);
        }
        
        for (let i = 0; i < this.hashFunctions; i++) {
          const index = this._hashForIndex(item, i);
          CompressibleBitArray.setBit(this.bitArray, index);
        }
        
        this.itemCount++;
      }
  
      addAsync(item) {
        return new Promise(resolve => {
          this.workQueue.push({ type: 'add', item, resolve });
          if (!this.processingQueue) {
            this._processQueue();
          }
        });
      }
  
      check(item) {
        if (this.metricsEnabled) {
          const startTime = performance.now();
          const result = this._checkImpl(item);
          const endTime = performance.now();
          this.metrics.checkOperations++;
          this.metrics.averageCheckTime = ((this.metrics.averageCheckTime * (this.metrics.checkOperations - 1)) 
            + (endTime - startTime)) / this.metrics.checkOperations;
          return result;
        } else {
          return this._checkImpl(item);
        }
      }
  
      _checkImpl(item) {
        if (this.bitArray.compressed) {
          this.bitArray = CompressibleBitArray.expand(this.bitArray);
        }
        
        for (let i = 0; i < this.hashFunctions; i++) {
          const index = this._hashForIndex(item, i);
          if (!CompressibleBitArray.getBit(this.bitArray, index)) {
            return false;
          }
        }
        
        if (this.metricsEnabled) {
          const randomValue = Math.random();
          if (randomValue < this.falsePositiveRate) {
            this.metrics.falsePositives++;
          }
        }
        
        return true;
      }
  
      checkAsync(item) {
        return new Promise(resolve => {
          this.workQueue.push({ type: 'check', item, resolve });
          if (!this.processingQueue) {
            this._processQueue();
          }
        });
      }
  
      _processQueue() {
        this.processingQueue = true;
        
        setTimeout(() => {
          const startTime = performance.now();
          const maxTime = 10;
          
          while (this.workQueue.length > 0 && performance.now() - startTime < maxTime) {
            const task = this.workQueue.shift();
            
            if (task.type === 'add') {
              this.add(task.item);
              task.resolve();
            } else if (task.type === 'check') {
              const result = this.check(task.item);
              task.resolve(result);
            }
          }
          
          if (this.workQueue.length > 0) {
            this._processQueue();
          } else {
            this.processingQueue = false;
          }
        }, 0);
      }
  
      scheduleCompression() {
        if (this.compressionTimer) {
          clearTimeout(this.compressionTimer);
        }
        
        this.compressionTimer = setTimeout(() => {
          this.compress();
          this.compressionTimer = null;
        }, 100);
      }
  
      compress() {
        if (this.metricsEnabled) {
          this.metrics.compressionAttempts++;
        }
        
        const previousByteLength = this.bitArray.byteLength;
        const compressedBitArray = CompressibleBitArray.compress(this.bitArray);
        
        if (compressedBitArray.compressed) {
          this.bitArray = compressedBitArray;
          if (this.metricsEnabled) {
            this.metrics.compressionRatio = this.bitArray.compressionRatio;
          }
        }
        
        return this.bitArray.byteLength < previousByteLength;
      }
  
      getMetrics() {
        if (!this.metricsEnabled) return null;
        
        const currentMemoryUsage = this.bitArray.byteLength;
        const estimatedSavings = this.bitArray.compressed ? 
          Math.ceil(this.size / 8) - currentMemoryUsage : 0;
        
        return {
          ...this.metrics,
          itemCount: this.itemCount,
          estimatedMemoryUsage: currentMemoryUsage,
          estimatedMemorySavings: estimatedSavings,
          currentFalsePositiveRate: this.getFalsePositiveRate()
        };
      }
  
      getFalsePositiveRate() {
        return Math.pow(1 - Math.exp(-this.hashFunctions * this.itemCount / this.size), this.hashFunctions);
      }
  
      reset() {
        this.bitArray = CompressibleBitArray.create(this.size);
        this.itemCount = 0;
        
        if (this.metricsEnabled) {
          this.metrics = {
            addOperations: 0,
            checkOperations: 0,
            falsePositives: 0,
            compressionAttempts: 0,
            averageAddTime: 0,
            averageCheckTime: 0,
            compressionRatio: 1
          };
        }
      }
    }
  
    if (typeof window !== 'undefined') {
      window.AdaptiveBloomFilter = AdaptiveBloomFilter;
    } else if (typeof module !== 'undefined') {
      module.exports = AdaptiveBloomFilter;
    }
  
    return AdaptiveBloomFilter;
  })();