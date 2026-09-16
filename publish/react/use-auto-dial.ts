// Generated from src/react/use-auto-dial.ts. Run npm run package:build; do not edit.
"use client";

import { useEffect, useRef } from "react";
import type { Caller } from "../core/types.ts";
import type { PhoneClient } from "../core/phone-client.ts";
import { usePhone } from "./phone-provider.ts";
export interface AutoDialOptions {
  /** A prefilled destination. No request is made for an empty number. */
  number?: string;
  enabled?: boolean;
  /** Change this to intentionally call the same number again. */
  requestId?: string;
  caller?: Caller;
}

/**
 * Starts one outbound attempt per destination/request ID and client while mounted.
 * Waits for registration. A busy line consumes the request instead of queuing a
 * surprise call. Failures, reconnects and rerenders never retry automatically.
 */
export function useAutoDial({
  number,
  enabled = false,
  requestId,
  caller
}: AutoDialOptions): void {
  const {
    client,
    state
  } = usePhone();
  const consumed = useRef(new WeakMap<PhoneClient, Set<string>>());
  const callerRef = useRef(caller);
  callerRef.current = caller;
  const target = number?.trim() ?? "";
  useEffect(() => {
    if (!enabled || !target) return;
    const key = JSON.stringify([target, requestId ?? "default"]);
    let requests = consumed.current.get(client);
    if (!requests) {
      requests = new Set();
      consumed.current.set(client, requests);
    }
    if (requests.has(key)) return;
    if (!["idle", "ended"].includes(state.status)) {
      requests.add(key);
      return;
    }
    if (state.connection !== "registered") return;
    // Defer until React commits its effect replay; StrictMode cannot double dial.
    const timer = setTimeout(() => {
      requests.add(key);
      const current = client.getSnapshot();
      if (current.connection !== "registered" || !["idle", "ended"].includes(current.status)) return;
      void client.call(target, callerRef.current).catch(() => {});
    }, 0);
    return () => clearTimeout(timer);
  }, [client, enabled, target, requestId, state.connection, state.status]);
}
