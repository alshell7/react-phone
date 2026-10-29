import type { AudioSessionAdapter } from "@azeer-ui-widget/react-native-phone";

/**
 * Speaker routing for native builds. Kept optional so the web playground and Expo Go
 * load without native modules. To enable the Speaker button on devices:
 *
 *   npx expo install react-native-incall-manager
 *   import InCallManager from "react-native-incall-manager";
 *   export const audioSession = createInCallManagerAudioSession(InCallManager);
 */
export const audioSession: AudioSessionAdapter | undefined = undefined;
