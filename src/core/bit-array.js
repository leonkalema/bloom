/**
 * Compressible Bit Array Module
 * Provides bit array operations with RLE compression
 */

const CompressibleBitArray = (() => {
  const createBitArray = (size) => {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('Size must be a positive integer');
    }
    
    const byteSize = Math.ceil(size / 8);
    return {
      array: new Uint8Array(byteSize),
      size: size,
      compressed: false,
      compressionRatio: 1
    };
  };

  const setBit = (bitArray, index) => {
    if (!bitArray || !bitArray.array) {
      throw new Error('Invalid bit array');
    }
    if (!Number.isInteger(index) || index < 0 || index >= bitArray.size) {
      throw new Error(`Bit index ${index} out of bounds for size ${bitArray.size}`);
    }
    
    if (bitArray.compressed) {
      const expanded = expandRLE(bitArray);
      bitArray.array = expanded.array;
      bitArray.compressed = false;
      bitArray.compressionRatio = 1;
    }
    
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    
    if (byteIndex >= bitArray.array.length) {
      throw new Error(`Byte index ${byteIndex} out of bounds for array length ${bitArray.array.length}`);
    }
    
    bitArray.array[byteIndex] |= (1 << bitIndex);
  };

  const getBit = (bitArray, index) => {
    if (!bitArray || !bitArray.array) {
      throw new Error('Invalid bit array');
    }
    if (!Number.isInteger(index) || index < 0 || index >= bitArray.size) {
      throw new Error(`Bit index ${index} out of bounds for size ${bitArray.size}`);
    }
    
    if (bitArray.compressed) {
      const expanded = expandRLE(bitArray);
      return getBit(expanded, index);
    }
    
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    
    if (byteIndex >= bitArray.array.length) {
      return false;
    }
    
    return (bitArray.array[byteIndex] & (1 << bitIndex)) !== 0;
  };

  const compressRLE = (bitArray) => {
    if (!bitArray || !bitArray.array) {
      throw new Error('Invalid bit array for compression');
    }
    
    if (bitArray.compressed) {
      return bitArray;
    }
    
    const compressed = [];
    let currentByte = bitArray.array[0];
    let count = 1;
    
    for (let i = 1; i < bitArray.array.length; i++) {
      if (bitArray.array[i] === currentByte && count < 255) {
        count++;
      } else {
        compressed.push(currentByte, count);
        currentByte = bitArray.array[i];
        count = 1;
      }
    }
    
    if (count > 0) {
      compressed.push(currentByte, count);
    }
    
    const compressedArray = new Uint8Array(compressed);
    const ratio = bitArray.array.length / compressedArray.length;
    
    return {
      array: compressedArray,
      size: bitArray.size,
      compressed: true,
      compressionRatio: ratio
    };
  };

  const expandRLE = (bitArray) => {
    if (!bitArray || !bitArray.array) {
      throw new Error('Invalid bit array for expansion');
    }
    
    if (!bitArray.compressed) {
      return bitArray;
    }
    
    const originalSize = Math.ceil(bitArray.size / 8);
    const expanded = new Uint8Array(originalSize);
    let expandedIndex = 0;
    
    for (let i = 0; i < bitArray.array.length; i += 2) {
      if (i + 1 >= bitArray.array.length) {
        throw new Error('Invalid RLE format: missing count byte');
      }
      
      const value = bitArray.array[i];
      const count = bitArray.array[i + 1];
      
      if (count === 0) {
        throw new Error('Invalid RLE format: zero count');
      }
      
      if (expandedIndex + count > originalSize) {
        throw new Error(`RLE expansion would exceed original size: ${expandedIndex + count} > ${originalSize}`);
      }
      
      for (let j = 0; j < count; j++) {
        expanded[expandedIndex++] = value;
      }
    }
    
    return {
      array: expanded,
      size: bitArray.size,
      compressed: false,
      compressionRatio: 1
    };
  };

  const shouldCompress = (bitArray) => {
    if (!bitArray || bitArray.compressed || bitArray.array.length < 100) {
      return false;
    }
    
    let runs = 0;
    let currentByte = bitArray.array[0];
    
    for (let i = 1; i < bitArray.array.length; i++) {
      if (bitArray.array[i] !== currentByte) {
        runs++;
        currentByte = bitArray.array[i];
      }
    }
    
    const estimatedCompressedSize = runs * 2;
    return estimatedCompressedSize < bitArray.array.length * 0.8;
  };

  return {
    create: createBitArray,
    setBit,
    getBit,
    compress: compressRLE,
    expand: expandRLE,
    shouldCompress
  };
})();

module.exports = CompressibleBitArray;
