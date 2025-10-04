// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["module-resolver", { root: ["."], alias: { "@": "./" } }],
      // Use ONLY ONE: worklets already bundles Reanimated's plugin.
      "react-native-worklets/plugin", // keep this LAST
    ],
  };
};
