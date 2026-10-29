// EXPO_BASE_URL serves the web playground from a sub-path, e.g. GitHub Pages:
//   EXPO_BASE_URL=/react-phone/native/playground npm run build:web
// PHONE_PACKAGE=staged disables tsconfig paths so Metro bundles the staged JSR files.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
    ...(process.env.PHONE_PACKAGE === "staged" ? { tsconfigPaths: false } : {}),
  },
});
