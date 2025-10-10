// babel.config.js (at project root)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'] // for bare RN
    // Temporarily removing nativewind plugin to fix babel error
    // plugins: ['nativewind/babel'],
  };
};
