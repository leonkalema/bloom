/**
 * Hash Functions Module
 * Provides Murmur3 hash implementation for bloom filter
 */

const HashFunctions = (() => {
  const murmur3 = (key, seed = 0) => {
    if (typeof key !== 'string') {
      throw new Error('Hash key must be a string');
    }
    
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
      h1 = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
      h1 = (((h1 & 0xffff) + 0x6b64) + ((((h1 >>> 16) + 0xe654) & 0xffff) << 16));
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
  };

  const generateHashes = (item, numHashes, size) => {
    if (typeof item !== 'string') {
      throw new Error('Item must be a string');
    }
    if (!Number.isInteger(numHashes) || numHashes <= 0) {
      throw new Error('Number of hashes must be a positive integer');
    }
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('Size must be a positive integer');
    }

    const hashes = [];
    const hash1 = murmur3(item, 0);
    const hash2 = murmur3(item, hash1);
    
    for (let i = 0; i < numHashes; i++) {
      const hash = Math.abs((hash1 + i * hash2) % size);
      if (hash >= 0 && hash < size) {
        hashes.push(hash);
      } else {
        throw new Error(`Hash index ${hash} out of bounds for size ${size}`);
      }
    }
    
    return hashes;
  };

  return {
    murmur3,
    generateHashes
  };
})();

module.exports = HashFunctions;
