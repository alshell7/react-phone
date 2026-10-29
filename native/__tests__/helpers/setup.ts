// The native adapter loads react-native-webrtc lazily; tests inject adapters instead.
jest.mock("react-native-webrtc", () => ({}), { virtual: true });
