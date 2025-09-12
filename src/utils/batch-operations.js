/**
 * Batch Operations Module
 * Provides high-performance bulk processing for bloom filters
 */

class BatchProcessor {
  constructor(batchSize = 100) {
    this.batchSize = batchSize;
  }

  addBatch(filter, items) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    for (const item of items) {
      filter.add(item);
    }

    return items.length;
  }

  checkBatch(filter, items) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    return items.map(item => filter.check(item));
  }

  async addBatchAsync(filter, items) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    const promises = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      promises.push(this.processBatchAsync(filter, batch, 'add'));
    }

    await Promise.all(promises);
    return items.length;
  }

  async checkBatchAsync(filter, items) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    const promises = [];
    const results = [];

    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      promises.push(this.processBatchAsync(filter, batch, 'check'));
    }

    const batchResults = await Promise.all(promises);
    return batchResults.flat();
  }

  async processBatchAsync(filter, batch, operation) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = [];
        for (const item of batch) {
          if (operation === 'add') {
            filter.add(item);
            results.push(true);
          } else {
            results.push(filter.check(item));
          }
        }
        resolve(results);
      }, 0);
    });
  }
}

module.exports = BatchProcessor;
