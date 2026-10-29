// Generated from src/components/connection-form.tsx. Run npm run package:build; do not edit.
import { useState } from "react";
import type { ReactElement } from "../react-types.d.ts";
import { View } from "react-native";
import { ChevronDown, ChevronUp, Eye, EyeOff, Phone, ShieldCheck } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.ts";
import type { SipConfig } from "../core/types.ts";
import { usePhoneTheme } from "./theme.ts";
import { usePhoneLabels } from "./locale.ts";
import { Button, Field, IconButton, PhoneText, PressableScale } from "./primitives.ts";
import { action } from "./status.ts";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export interface ConnectionFormProps {
  /** Non-secret defaults. Passwords are never prefilled from here. */
  defaultValues?: Partial<Omit<SipConfig, "password">>;
  onConnected?: () => void;
}

/** Credentials are never persisted. The password is cleared after registration. */
export function ConnectionForm({
  defaultValues = {},
  onConnected
}: ConnectionFormProps): ReactElement {
  const {
    state,
    client
  } = usePhone();
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const [username, setUsername] = useState(defaultValues.authorizationUsername ?? "");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [uri, setUri] = useState(defaultValues.uri ?? "");
  const [server, setServer] = useState(defaultValues.websocketUrl ?? "");
  const [iceUrl, setIceUrl] = useState("");
  const [turnUsername, setTurnUsername] = useState("");
  const [turnPassword, setTurnPassword] = useState("");
  const [advanced, setAdvanced] = useState(!defaultValues.uri || !defaultValues.websocketUrl);
  const pending = ["connecting", "reconnecting"].includes(state.connection);
  // Account problems belong next to the fields that fix them.
  const accountError = state.error && ["configuration", "connection", "registration", "unsupported"].includes(state.error.code) ? state.error.message : null;
  const text = {
    autoCapitalize: "none" as const,
    autoCorrect: false,
    spellCheck: false,
    editable: !pending
  };
  const submit = () => action(async () => {
    await client.connect({
      ...defaultValues,
      websocketUrl: server.trim(),
      uri: uri.trim(),
      authorizationUsername: username.trim() || undefined,
      password,
      iceServers: iceUrl.trim() ? [{
        urls: iceUrl.trim(),
        ...(turnUsername ? {
          username: turnUsername,
          credential: turnPassword
        } : {})
      }] : defaultValues.iceServers
    });
    if (client.getSnapshot().connection === "registered") {
      setPassword("");
      setTurnPassword("");
      onConnected?.();
    }
  });
  return /*#__PURE__*/_jsxs(View, {
    style: {
      gap: 14,
      alignSelf: "stretch"
    },
    children: [/*#__PURE__*/_jsx(Field, {
      ...text,
      label: labels.username,
      value: username,
      onChangeText: setUsername,
      placeholder: labels.usernamePlaceholder,
      autoComplete: "username",
      textContentType: "username",
      testID: "sip-username"
    }), /*#__PURE__*/_jsx(Field, {
      ...text,
      label: labels.password,
      value: password,
      onChangeText: setPassword,
      placeholder: labels.passwordPlaceholder,
      secureTextEntry: !reveal,
      autoComplete: "password",
      textContentType: "password",
      returnKeyType: "go",
      onSubmitEditing: submit,
      testID: "sip-password",
      trailing: /*#__PURE__*/_jsx(IconButton, {
        icon: reveal ? EyeOff : Eye,
        accessibilityLabel: reveal ? labels.hidePassword : labels.showPassword,
        onPress: () => setReveal(!reveal)
      })
    }), /*#__PURE__*/_jsxs(PressableScale, {
      onPress: () => setAdvanced(!advanced),
      accessibilityLabel: labels.serverSettings,
      accessibilityState: {
        expanded: advanced
      },
      scaleTo: 0.98,
      style: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        minHeight: 40
      },
      children: [/*#__PURE__*/_jsx(PhoneText, {
        size: 14,
        weight: "600",
        color: theme.accent,
        children: labels.serverSettings
      }), advanced ? /*#__PURE__*/_jsx(ChevronUp, {
        size: 16,
        color: theme.accent
      }) : /*#__PURE__*/_jsx(ChevronDown, {
        size: 16,
        color: theme.accent
      })]
    }), advanced ? /*#__PURE__*/_jsxs(View, {
      style: {
        gap: 14
      },
      children: [/*#__PURE__*/_jsx(Field, {
        ...text,
        label: labels.sipAddress,
        value: uri,
        onChangeText: setUri,
        placeholder: "sip:1001@pbx.example.com",
        keyboardType: "email-address",
        hint: labels.sipAddressHint,
        testID: "sip-uri"
      }), /*#__PURE__*/_jsx(Field, {
        ...text,
        label: labels.websocketServer,
        value: server,
        onChangeText: setServer,
        placeholder: "wss://pbx.example.com/ws",
        keyboardType: "url",
        testID: "sip-server"
      }), /*#__PURE__*/_jsx(Field, {
        ...text,
        label: labels.iceServer,
        value: iceUrl,
        onChangeText: setIceUrl,
        placeholder: "turn:relay.example.com:3478",
        keyboardType: "url"
      }), iceUrl.startsWith("turn") ? /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx(Field, {
          ...text,
          label: labels.turnUsername,
          value: turnUsername,
          onChangeText: setTurnUsername
        }), /*#__PURE__*/_jsx(Field, {
          ...text,
          label: labels.turnPassword,
          value: turnPassword,
          onChangeText: setTurnPassword,
          secureTextEntry: true
        })]
      }) : null]
    }) : null, accountError ? /*#__PURE__*/_jsx(PhoneText, {
      size: 14,
      weight: "500",
      color: theme.danger,
      accessibilityRole: "alert",
      accessibilityLiveRegion: "assertive",
      style: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: theme.dangerSoft
      },
      children: accountError
    }) : null, /*#__PURE__*/_jsx(Button, {
      label: pending ? labels.connectingAccount : labels.connectAccount,
      icon: Phone,
      disabled: pending,
      onPress: submit,
      testID: "sip-connect"
    }), pending ? /*#__PURE__*/_jsx(Button, {
      label: labels.cancelConnection,
      tone: "secondary",
      onPress: () => client.disconnect()
    }) : null, /*#__PURE__*/_jsxs(View, {
      style: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        justifyContent: "center"
      },
      children: [/*#__PURE__*/_jsx(ShieldCheck, {
        size: 14,
        color: theme.muted
      }), /*#__PURE__*/_jsx(PhoneText, {
        size: 12,
        color: theme.muted,
        children: labels.credentialsNote
      })]
    })]
  });
}
