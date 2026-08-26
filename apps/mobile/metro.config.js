// expo/metro-config already understands workspaces, so the old monorepo recipe
// (watchFolders + nodeModulesPaths + disableHierarchicalLookup) is not only
// unnecessary here, it is what `expo-doctor` flags. Everything below is the
// NativeWind wiring and nothing else.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

module.exports = withNativeWind(getDefaultConfig(__dirname), {
  input: "./global.css",
});
