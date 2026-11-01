// sources.js - data source priority and management for Balans
// Health Connect > BLE > Manual > Demo

const SOURCE_PRIORITY = {
  healthConnect: 1,
  ble: 2,
  manual: 3,
  demo: 4
};

function getActiveSources() {
  // Returns ordered list of available sources
  return Object.keys(SOURCE_PRIORITY).sort((a, b) => SOURCE_PRIORITY[a] - SOURCE_PRIORITY[b]);
}

function resolveMetric(metricKey, sourcesData) {
  // Pick highest priority available value for a metric
  const ordered = getActiveSources();
  for (const src of ordered) {
    if (sourcesData[src] && sourcesData[src][metricKey] != null) {
      return { value: sourcesData[src][metricKey], source: src };
    }
  }
  return null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SOURCE_PRIORITY, getActiveSources, resolveMetric };
}
