import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WebPhoneIsland, type PhoneIslandProps } from "@azeer-ui-widget/react-phone";
import { PhoneClient } from "@azeer-ui-widget/react-phone/core";

// Exercise both public entry points and the host's own React runtime.
const client = new PhoneClient({ preview: { enabled: true, answerDelayMs: 50 } });
const props: PhoneIslandProps = {
  placement: "bottom-center", incomingBehavior: "notify",
  visualization: { type: "orb" }, defaultNumber: "7003", collapseDelayMs: 20,
};
// The published declarations must still reject invalid API values.
// @ts-expect-error This is not one of the six supported placements.
const invalid: PhoneIslandProps = { placement: "middle" };
void invalid;

declare global { interface Window { consumerEvents: string[] } }
window.consumerEvents = [];
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <button onClick={() => client.simulateIncoming()}>Simulate incoming</button>
    <WebPhoneIsland {...props} client={client}
      onAnswered={() => window.consumerEvents.push("answered")}
      onDisconnected={() => window.consumerEvents.push("disconnected")}
    />
  </StrictMode>,
);
