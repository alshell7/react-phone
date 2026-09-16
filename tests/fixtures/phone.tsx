import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  PhoneClient,
  PhoneProvider,
  PhoneWidget,
  PhoneIsland,
  LiveWaveform,
  type PhoneWidgetProps,
  type PhoneIslandProps,
  type PhoneEvent,
} from "../../src/index.ts";

const query = new URLSearchParams(location.search);
const preview = query.has("live")
  ? undefined
  : { enabled: true as const, answerDelayMs: 50 };
const client = new PhoneClient({ preview });
const events: PhoneEvent[] = [];

declare global {
  interface Window {
    phoneHarness: {
      client: PhoneClient;
      events: PhoneEvent[];
      update: (patch: Partial<PhoneWidgetProps & PhoneIslandProps>) => void;
      visual: (stream: MediaStream | null) => void;
      unmount: () => void;
    };
  }
}

function Fixture() {
  const [props, setProps] = useState<PhoneWidgetProps & PhoneIslandProps>({
    defaultNumber: query.get("number") ?? "7003",
    autoDial: query.has("auto"),
    visualization: { type: "both" },
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    if (preview) client.startPreview();
    return () => client.dispose();
  }, []);
  useEffect(() => {
    window.phoneHarness = {
      client,
      events,
      update: (patch) => setProps((current) => ({ ...current, ...patch })),
      visual: setStream,
      unmount: () => root.unmount(),
    };
  }, []);
  return (
    <PhoneProvider
      client={client}
      preview={preview}
      onEvent={(event) => events.push(event)}
    >
      <main
        style={{
          width: 360,
          maxWidth: "100%",
          margin: "auto",
          position: "relative",
          ...(query.has("island") ? { height: 650 } : {}),
        }}
      >
        {query.has("island") ? (
          <PhoneIsland {...props} />
        ) : (
          <PhoneWidget {...props} />
        )}
        {stream && (
          <LiveWaveform
            data-testid="borrowed-waveform"
            stream={stream}
            active
            height={64}
          />
        )}
      </main>
    </PhoneProvider>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
