// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  // keep Expo’s flat config first (unchanged)
  expoConfig,

  // your overrides (only additions: resolver + plugin to understand @/*)
  {
    ignores: ['dist/*'],

    // add the import plugin so resolver works in flat config
    plugins: {
      import: require('eslint-plugin-import'),
    },

    // teach ESLint how to resolve TS path aliases (uses your tsconfig.json)
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      },
    },

    // no new rules added — behavior unchanged
  },
]);
