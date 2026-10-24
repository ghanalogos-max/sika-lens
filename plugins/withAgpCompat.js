const { withGradleProperties } = require('expo/config-plugins');

/**
 * SDK 58 ships AGP 9. Some RN libraries still set targetSdk in the old DSL.
 * Expo's template includes these opt-outs; keep them explicit for EAS prebuild.
 */
function withAgpCompat(config) {
  return withGradleProperties(config, (cfg) => {
    const keys = {
      'android.newDsl': 'false',
      'android.builtInKotlin': 'false',
    };
    for (const [key, value] of Object.entries(keys)) {
      const existing = cfg.modResults.find((item) => item.type === 'property' && item.key === key);
      if (existing) existing.value = value;
      else cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });
}

module.exports = withAgpCompat;
