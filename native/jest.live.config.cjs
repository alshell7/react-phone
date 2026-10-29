/**
 * Live SIP tests against a real PBX: real JsSIP over Node's WebSocket. Reads
 * .env.local (git-ignored) and skips when credentials are absent.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/live/**/*.live.ts"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },
  moduleNameMapper: { "^react-native$": "<rootDir>/__tests__/live/react-native-stub.ts" },
  testTimeout: 60000,
};
