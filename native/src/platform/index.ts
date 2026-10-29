import { Platform } from "react-native";
import type { HapticsAdapter, MediaAdapter } from "../core/media.ts";
import { createNativeHaptics, createNativeMediaAdapter } from "./native.ts";
import { createWebHaptics, createWebMediaAdapter } from "./web.ts";

// JSR publishes explicit-extension imports, so Metro's .native.ts resolution cannot
// apply; select the platform at runtime instead.
export function defaultMediaAdapter(): MediaAdapter {
  return Platform.OS === "web"
    ? createWebMediaAdapter()
    : createNativeMediaAdapter();
}

export function defaultHaptics(): HapticsAdapter {
  return Platform.OS === "web" ? createWebHaptics() : createNativeHaptics();
}

export {
  createNativeHaptics,
  createNativeMediaAdapter,
  createWebHaptics,
  createWebMediaAdapter,
};
