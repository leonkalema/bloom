/**
 * Auto-scaling Module
 * Provides dynamic filter resizing capabilities
 */

class AutoScaler {
  constructor(options = {}) {
    this.enabled = options.autoScale || false;
    this.maxSize = options.maxSize || 1000000;
    this.scaleThreshold = options.scaleThreshold || 0.8;
    this.scaleFactor = options.scaleFactor || 2;
  }

  shouldScale(currentItems, expectedItems) {
    if (!this.enabled) return false;
    
    const loadFactor = currentItems / expectedItems;
    return loadFactor >= this.scaleThreshold && expectedItems * this.scaleFactor <= this.maxSize;
  }

  calculateNewSize(currentExpectedItems) {
    const newSize = Math.min(currentExpectedItems * this.scaleFactor, this.maxSize);
    return Math.floor(newSize);
  }

  calculateOptimalParameters(expectedItems, falsePositiveRate) {
    const m = Math.ceil((-expectedItems * Math.log(falsePositiveRate)) / (Math.log(2) * Math.log(2)));
    const k = Math.round((m / expectedItems) * Math.log(2));
    
    return {
      size: m,
      hashFunctions: Math.max(1, k)
    };
  }

  migrateItems(oldFilter, newFilter, knownItems) {
    if (!knownItems || knownItems.size === 0) {
      return;
    }

    for (const item of knownItems) {
      newFilter.add(item);
    }
  }
}

module.exports = AutoScaler;
