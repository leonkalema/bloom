/**
 * TTL Manager Module
 * Provides time-based expiration for bloom filter items
 */

class TTLManager {
  constructor(ttl = null) {
    this.ttl = ttl;
    this.itemTimestamps = ttl ? new Map() : null;
  }

  addItem(item) {
    if (!this.ttl || !this.itemTimestamps) return;
    
    this.itemTimestamps.set(item, Date.now());
  }

  isExpired(item) {
    if (!this.ttl || !this.itemTimestamps) return false;
    
    const timestamp = this.itemTimestamps.get(item);
    if (!timestamp) return false;
    
    return Date.now() - timestamp > this.ttl;
  }

  checkItem(item) {
    if (!this.ttl) return true;
    
    return !this.isExpired(item);
  }

  cleanup() {
    if (!this.ttl || !this.itemTimestamps) return;
    
    const now = Date.now();
    const expiredItems = [];
    
    for (const [item, timestamp] of this.itemTimestamps.entries()) {
      if (now - timestamp > this.ttl) {
        expiredItems.push(item);
      }
    }
    
    for (const item of expiredItems) {
      this.itemTimestamps.delete(item);
    }
    
    return expiredItems.length;
  }

  clear() {
    if (this.itemTimestamps) {
      this.itemTimestamps.clear();
    }
  }

  getStats() {
    if (!this.itemTimestamps) return null;
    
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const timestamp of this.itemTimestamps.values()) {
      if (now - timestamp > this.ttl) {
        expired++;
      } else {
        active++;
      }
    }
    
    return { active, expired, total: this.itemTimestamps.size };
  }
}

module.exports = TTLManager;
