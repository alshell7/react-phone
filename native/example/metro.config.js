// Resolve @azeer-ui-widget/react-native-phone from ../src so edits hot-reload.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const root = path.resolve(__dirname, "..");
const config = getDefaultConfig(__dirname);

config.watchFolders = [root];
config.resolver.blockList = [/native\/\.jsr-stage\/node_modules\/.*/];
config.resolver.nodeModulesPaths = [
  path.join(__dirname, "node_modules"),
  path.join(root, "node_modules"),
];
// PHONE_PACKAGE=staged bundles the generated JSR files (native/.jsr-stage) instead of
// src/, verifying exactly what will be published.
config.resolver.extraNodeModules = {
  "@azeer-ui-widget/react-native-phone":
    process.env.PHONE_PACKAGE === "staged" ? path.join(root, ".jsr-stage") : root,
};

module.exports = config;
