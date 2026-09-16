// Generated from src/react/phone-provider.tsx. Run npm run package:build; do not edit.
"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { PhoneClient } from "../core/phone-client.ts";
import { jsx as _jsx } from "react/jsx-runtime";
import type { PhoneToneOptions } from "../core/tones.ts";
import type { PhoneCallbacks, PhoneSnapshot, PreviewOptions, SipConfig } from "../core/types.ts";

/** Provides one shared SIP line to any number of visual controls. */
export interface PhoneProviderProps extends PhoneCallbacks {
  children: ReactNode;
  config?: SipConfig;
  /** Defaults to false. Auto-registration never auto-answers or captures the mic. */
  autoConnect?: boolean;
  preview?: PreviewOptions;
  /** Externally owned clients are not disposed by the provider. */
  client?: PhoneClient;
  tones?: PhoneToneOptions | false;
}
export interface PhoneContextValue {
  state: PhoneSnapshot;
  client: PhoneClient;
  preview: boolean;
}
const PhoneContext = createContext<PhoneContextValue | null>(null);

/** Mount above presets or your own controls; unmounting an owned client ends calls. */
export function PhoneProvider({
  children,
  config,
  autoConnect = false,
  preview,
  client: suppliedClient,
  tones,
  ...callbacks
}: PhoneProviderProps): ReactElement {
  const [ownedClient] = useState(() => new PhoneClient({
    preview
  }));
  const client = suppliedClient ?? ownedClient;
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);
  useEffect(() => {
    client.setCallbacks(callbacks);
  });
  useEffect(() => {
    if (tones !== undefined) client.setTones(tones);
  }, [client, tones]);
  useEffect(() => {
    if (preview && !suppliedClient) client.startPreview();
    return () => {
      if (!suppliedClient) client.dispose();
    };
  }, [client, suppliedClient, preview]);
  useEffect(() => {
    if (autoConnect && config && !preview) void client.connect(config).catch(() => {});
    // A new config identity intentionally re-registers. Memoize it in your host app.
  }, [autoConnect, config, client, preview]);
  return /*#__PURE__*/_jsx(PhoneContext.Provider, {
    value: {
      state,
      client,
      preview: Boolean(preview)
    },
    children: children
  });
}

/** Use call state and actions in your own React UI. Requires PhoneProvider. */
export function usePhone(): PhoneContextValue {
  const value = useContext(PhoneContext);
  if (!value) throw new Error("usePhone must be used inside a PhoneProvider.");
  return value;
}
