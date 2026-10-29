/** Unit and component tests. Live SIP tests use jest.live.config.cjs. */
module.exports = {
  preset: "@react-native/jest-preset",
  testMatch: ["<rootDir>/__tests__/**/*.test.ts?(x)"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|lucide-react-native|react-native-svg)/)",
  ],
  setupFiles: ["<rootDir>/__tests__/helpers/setup.ts"],
  modulePathIgnorePatterns: ["<rootDir>/example/", "<rootDir>/publish/"],
};
