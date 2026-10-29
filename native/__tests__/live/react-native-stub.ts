// The headless core only needs Platform from react-native; adapters are injected.
export const Platform = { OS: "web" };
export const Linking = { openSettings: async () => {} };
export const Vibration = { vibrate: () => {}, cancel: () => {} };
export const PermissionsAndroid = {};
