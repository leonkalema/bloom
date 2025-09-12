/**
 * Metrics Module
 * Provides performance tracking and monitoring
 */

class MetricsTracker {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.reset();
  }

  reset() {
    if (this.enabled) {
      this.metrics = {
        addOperations: 0,
        checkOperations: 0,
        falsePositives: 0,
        compressionAttempts: 0,
        averageAddTime: 0,
        averageCheckTime: 0,
        compressionRatio: 1,
        autoScaleEvents: 0
      };
      this.addTimes = [];
      this.checkTimes = [];
    }
  }

  recordAdd(duration) {
    if (!this.enabled) return;
    
    this.metrics.addOperations++;
    this.addTimes.push(duration);
    this.metrics.averageAddTime = this.addTimes.reduce((a, b) => a + b, 0) / this.addTimes.length;
    
    if (this.addTimes.length > 1000) {
      this.addTimes = this.addTimes.slice(-500);
    }
  }

  recordCheck(duration, isFalsePositive = false) {
    if (!this.enabled) return;
    
    this.metrics.checkOperations++;
    this.checkTimes.push(duration);
    this.metrics.averageCheckTime = this.checkTimes.reduce((a, b) => a + b, 0) / this.checkTimes.length;
    
    if (isFalsePositive) {
      this.metrics.falsePositives++;
    }
    
    if (this.checkTimes.length > 1000) {
      this.checkTimes = this.checkTimes.slice(-500);
    }
  }

  recordCompression(ratio) {
    if (!this.enabled) return;
    
    this.metrics.compressionAttempts++;
    this.metrics.compressionRatio = ratio;
  }

  recordAutoScale() {
    if (!this.enabled) return;
    
    this.metrics.autoScaleEvents++;
  }

  getMetrics() {
    return this.enabled ? { ...this.metrics } : null;
  }

  getFalsePositiveRate() {
    if (!this.enabled || this.metrics.checkOperations === 0) return 0;
    return this.metrics.falsePositives / this.metrics.checkOperations;
  }
}

module.exports = MetricsTracker;
