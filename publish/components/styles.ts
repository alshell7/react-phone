// Generated from src/components/styles.ts. Run npm run package:build; do not edit.
/** Scoped phone styles. Render PhoneStyles once or let PhoneRoot include them. */
export const phoneStyles: string = `
.az-phone {
  --az-accent: #2e5945;
  --az-accent-foreground: #fff;
  --az-background: #fff;
  --az-surface: #f6f7f5;
  --az-foreground: #252b27;
  --az-muted: #687169;
  --az-border: #e7eae5;
  --az-danger: #b9413e;
  --az-danger-foreground: #ffffff;
  --az-radius: 16px;
  --az-font-family: inherit;
  color: var(--az-foreground);
  font-family: var(--az-font-family);
  font-size: 14px;
  line-height: 1.5;
  color-scheme: light;
  box-sizing: border-box;
}
.az-phone[data-appearance="dark"] {
  --az-accent: #b8daa2;
  --az-accent-foreground: #17291e;
  --az-background: #202822;
  --az-surface: #2c352e;
  --az-foreground: #f2f4ef;
  --az-muted: #b4beb2;
  --az-border: #3e483e;
  --az-danger: #e48d88;
  --az-danger-foreground: #281914;
  color-scheme: dark;
}
.az-phone *,
.az-phone *:before,
.az-phone *:after {
  box-sizing: border-box;
}
.az-phone ::selection {
  background: var(--az-accent);
  color: var(--az-accent-foreground);
}
.az-phone button,
.az-phone input,
.az-phone select {
  font: inherit;
  color: inherit;
}
.az-phone button {
  cursor: pointer;
  touch-action: manipulation;
}
.az-phone button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}
.az-phone :focus-visible {
  outline: 2px solid var(--az-accent);
  outline-offset: 4px;
}
.az-phone input,
.az-phone select {
  border: 1px solid var(--az-border);
  background: var(--az-background);
  border-radius: 8px;
  padding: 11px 12px;
  min-width: 0;
  width: 100%;
  caret-color: var(--az-accent);
}
.az-phone input::placeholder {
  color: var(--az-muted);
  opacity: 1;
}
.az-phone input[type="range"] {
  accent-color: var(--az-accent);
  padding: 0;
  min-height: 32px;
}
.az-phone p,
.az-phone h3 {
  margin: 0;
}
.az-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.az-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.az-icon {
  border: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  background: transparent;
  border-radius: 8px;
  color: var(--az-muted);
}
.az-icon:hover:not(:disabled) {
  background: var(--az-surface);
  color: var(--az-foreground);
}
.az-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 44px;
  padding: 11px 17px;
  border: 0;
  border-radius: 10px;
  font-weight: 550;
  transition:
    filter 0.16s,
    transform 0.16s;
}
.az-button:hover:not(:disabled) {
  filter: brightness(0.95);
}
.az-button:active:not(:disabled) {
  transform: translateY(1px);
}
.az-primary {
  background: var(--az-accent);
  color: var(--az-accent-foreground) !important;
}
.az-secondary {
  background: var(--az-surface);
  color: var(--az-foreground);
}
.az-danger {
  background: var(--az-danger);
  color: var(--az-danger-foreground) !important;
  width: 100%;
  margin-top: 20px;
}
.az-decline {
  background: color-mix(in srgb, var(--az-danger) 12%, var(--az-background));
  color: var(--az-danger) !important;
}
.az-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--az-muted);
  white-space: nowrap;
}
.az-status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--az-muted);
  flex: none;
}
.az-status[data-status="registered"] {
  color: var(--az-accent);
}
.az-status[data-status="registered"] .az-status-dot,
.az-call-status .az-status-dot {
  background: var(--az-accent);
}
.az-status[data-status="error"] {
  color: var(--az-danger);
}
.az-widget {
  width: 100%;
  max-width: 372px;
  border-radius: var(--az-radius);
  background: var(--az-background);
  box-shadow:
    0 8px 36px -12px #172d222b,
    0 1px 4px #172d2210;
  overflow: hidden;
}
.az-widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 21px;
  border-bottom: 1px solid var(--az-border);
  min-height: 65px;
}
.az-widget-title {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  font-weight: 600;
}
.az-widget-title svg {
  color: var(--az-accent);
}
.az-widget-body {
  padding: 26px 28px 24px;
}
.az-caller {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
}
.az-avatar {
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--az-accent) 9%, var(--az-background));
  color: var(--az-accent);
  font-size: 24px;
  font-weight: 450;
  overflow: hidden;
  margin-bottom: 16px;
  flex: none;
}
.az-avatar img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}
.az-avatar[data-active="true"] {
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--az-accent) 7%, transparent);
}
.az-caller-copy {
  max-width: 100%;
}
.az-caller h3 {
  font-size: 21px;
  line-height: 1.3;
  letter-spacing: -0.025em;
  font-weight: 550;
  overflow-wrap: anywhere;
}
.az-caller p {
  margin-top: 5px;
  font-size: 12px;
  color: var(--az-muted);
  overflow-wrap: anywhere;
}
.az-tags {
  display: flex;
  justify-content: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.az-tags span {
  font-size: 10px;
  background: var(--az-surface);
  color: var(--az-muted);
  padding: 2px 7px;
  border-radius: 4px;
  overflow-wrap: anywhere;
  max-width: 100%;
}
.az-call-status {
  min-height: 22px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: var(--az-muted);
  margin-top: 12px;
}
.az-status-separator {
  opacity: 0.5;
}
.az-timer {
  font-variant-numeric: tabular-nums;
}
.az-waveform-wrap {
  margin: 8px 0 23px;
  text-align: center;
  color: var(--az-muted);
}
.az-waveform-wrap span {
  display: block;
  font-size: 10px;
  margin-top: -6px;
}
.az-number-form {
  display: flex;
  gap: 8px;
}
.az-number-input {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}
.az-number-input input {
  padding: 12px 37px 12px 12px;
  font-size: 16px;
  text-align: center;
  background: var(--az-surface);
  border-color: transparent;
}
.az-number-input .az-icon {
  position: absolute;
  right: 3px;
}
.az-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px 12px;
  margin: 17px 0 20px;
}
.az-keypad button {
  height: 51px;
  border: 0;
  background: transparent;
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.az-keypad button:hover:not(:disabled) {
  background: var(--az-surface);
}
.az-keypad button:active:not(:disabled) {
  background: color-mix(in srgb, var(--az-accent) 13%, var(--az-background));
}
.az-keypad button > span {
  font-size: 23px;
  font-weight: 400;
  line-height: 1.1;
}
.az-keypad small {
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.11em;
  min-height: 12px;
  color: var(--az-muted);
  margin-top: 3px;
}
.az-dial-button {
  width: 100%;
  position: relative;
}
.az-dial-button kbd {
  font: inherit;
  font-size: 13px;
  position: absolute;
  right: 13px;
  opacity: 0.65;
}
.az-control-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 23px;
}
.az-control {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 65px;
  padding: 9px 2px;
  border: 0;
  border-radius: 10px;
  background: var(--az-surface);
}
.az-control span {
  font-size: 10px;
  color: var(--az-muted);
}
.az-control[aria-pressed="true"],
.az-control[aria-expanded="true"] {
  background: color-mix(in srgb, var(--az-accent) 13%, var(--az-background));
  color: var(--az-accent);
}
.az-control:hover {
  filter: brightness(0.96);
}
.az-keypad-icon {
  display: grid;
  grid-template-columns: repeat(3, 3px);
  gap: 3px;
  height: 21px;
  padding: 2px;
}
.az-keypad-icon i {
  width: 3px;
  height: 3px;
  background: currentColor;
  border-radius: 50%;
}
.az-incoming-actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}
.az-incoming-actions .az-button {
  flex: 1;
}
.az-widget-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-top: 1px solid var(--az-border);
  padding: 12px 15px;
  color: var(--az-muted);
  font-size: 10px;
}
.az-notices {
  padding: 12px 16px 0;
}
.az-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 10px 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--az-danger) 9%, var(--az-background));
  color: var(--az-danger);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.az-error > span {
  flex: 1;
}
.az-error .az-icon {
  width: 24px;
  height: 24px;
  color: inherit;
}
.az-audio-recovery {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  width: 100%;
  border: 1px solid var(--az-border);
  border-radius: 8px;
  background: var(--az-surface);
  margin-top: 8px;
  font-size: 12px;
}
.az-transfer {
  padding: 15px 0;
  margin-top: 15px;
  border-top: 1px solid var(--az-border);
  border-bottom: 1px solid var(--az-border);
}
.az-transfer .az-row:first-child {
  justify-content: space-between;
}
.az-transfer label {
  font-weight: 600;
  font-size: 12px;
}
.az-transfer p {
  color: var(--az-muted);
  font-size: 11px;
  margin: 2px 0 10px;
}
.az-transfer .az-button {
  font-size: 12px;
  padding: 10px;
}
.az-transfer input {
  font-size: 12px;
}
.az-settings-body {
  padding: 24px;
}
.az-settings-body h3 {
  font-size: 17px;
  margin-bottom: 20px;
}
.az-audio-settings,
.az-connection-form,
.az-server-fields {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.az-audio-settings label,
.az-connection-form label {
  font-size: 12px;
  font-weight: 550;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 7px;
}
.az-audio-settings label span {
  margin-left: auto;
  color: var(--az-muted);
  font-weight: 400;
}
.az-audio-settings p,
.az-connection-form p {
  font-size: 11px;
  color: var(--az-muted);
}
.az-connection-form details {
  margin: 12px 0;
}
.az-connection-form summary {
  font-size: 12px;
  cursor: pointer;
  color: var(--az-muted);
  padding: 5px 0;
}
.az-server-fields {
  margin-top: 12px;
}
.az-server-fields p {
  margin-top: -3px;
}
.az-server-fields small {
  margin-left: auto;
  font-weight: 400;
  color: var(--az-muted);
}
.az-privacy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 5px !important;
}
.az-compact {
  max-width: 680px;
}
.az-compact .az-widget-body {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 20px;
}
.az-compact .az-caller {
  flex-direction: row;
  gap: 12px;
  text-align: left;
  flex: 1;
  flex-wrap: wrap;
}
.az-compact .az-avatar {
  width: 44px;
  height: 44px;
  font-size: 18px;
  margin: 0;
}
.az-compact .az-caller h3 {
  font-size: 15px;
}
.az-compact .az-caller .az-tags {
  display: none;
}
.az-compact .az-call-status {
  flex-basis: 100%;
  margin: 0;
}
.az-compact .az-dialer {
  flex: 1.2;
  min-width: 0;
}
.az-compact .az-number-input input {
  font-size: 13px;
}
.az-compact .az-call-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}
.az-compact .az-control-row {
  margin: 0;
}
.az-compact .az-control {
  padding: 8px;
  min-width: 48px;
  min-height: 52px;
  gap: 4px;
}
.az-compact .az-danger {
  margin: 0;
  width: auto;
  font-size: 0;
  padding: 13px;
}
.az-compact .az-danger svg {
  width: 19px;
}
.az-compact .az-incoming-actions {
  margin: 0;
}
.az-compact .az-widget-footer {
  display: none;
}
@media (max-width: 540px) {
  .az-compact .az-widget-body {
    flex-direction: column;
    align-items: stretch;
  }
  .az-compact .az-caller {
    justify-content: center;
    text-align: center;
  }
  .az-compact .az-call-status {
    justify-content: center;
  }
  .az-compact .az-call-controls {
    justify-content: center;
  }
  .az-widget-header {
    padding-inline: 16px;
  }
  .az-widget-body {
    padding-inline: 22px;
  }
  .az-status {
    font-size: 10px;
  }
}
.az-orb-wrap {
  display: flex;
  justify-content: center;
  margin: -10px 0 4px;
}
.az-compact .az-orb-wrap { margin: 0; }
.az-widget .az-caller[data-avatar="false"] { display: block; text-align: center; }
.az-widget .az-caller[data-avatar="false"] .az-caller-copy { width: 100%; }
.az-size-frame { overflow: hidden; border-radius: inherit; }
.az-island { display: flex; flex-direction: column; max-width: 100%; max-height: 100%; pointer-events: auto; min-width: 0; }
.az-island[data-motion="on"] { transition: width var(--az-motion-duration) cubic-bezier(0.16,1,0.3,1); }
.az-island-shell { background: var(--az-background); border-radius: 28px; min-height: 0; max-height: inherit; overflow-y: auto; overflow-x: hidden; box-shadow: 0 12px 45px #0003; scrollbar-width: thin; scrollbar-color: var(--az-border) transparent; }
.az-island-shell[data-expanded="true"] { border-radius: var(--az-radius); }
.az-island[data-motion="on"] .az-island-shell { transition: border-radius var(--az-motion-duration) cubic-bezier(0.16,1,0.3,1); }
.az-island-bar { display: flex; align-items: center; padding: 5px; gap: 4px; }
.az-island-trigger { display: flex; align-items: center; gap: 11px; flex: 1; min-width: 0; border: 0; border-radius: 24px; background: transparent; text-align: left; padding: 7px 10px; min-height: 48px; }
.az-island-trigger:hover { background: var(--az-surface); }
.az-island-trigger:focus-visible { outline-offset: -2px; }
.az-island-mark { display: grid; place-items: center; width: 30px; flex-shrink: 0; color: var(--az-accent); }
.az-island-copy { min-width: 0; flex: 1; display: grid; gap: 1px; }
.az-island-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; }
.az-island-copy .az-status { font-size: 10px; }
.az-island-chevron { display: grid; place-items: center; color: var(--az-muted); }
.az-island-bar > .az-timer { flex-shrink: 0; padding-right: 13px; font-size: 12px; }
.az-island-call-summary { padding: 0 19px 12px 56px; font-size: 12px; color: var(--az-muted); display: flex; justify-content: space-between; gap: 8px; }
.az-island-call-summary > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.az-island-notification { display: flex; gap: 8px; padding: 0 14px 14px; }
.az-island-notification .az-button { flex: 1; margin: 0; width: auto; }
.az-island .az-widget { box-shadow: none; border: 0; width: 100%; max-width: none; border-radius: 0; }
.az-island-panel { border-top: 1px solid var(--az-border); }
.az-island-panel[hidden] { display: none; }
.az-bars-wrap { margin: 18px 0; }
.az-drag-strip { display: flex; justify-content: center; background: var(--az-surface); border-bottom: 1px solid var(--az-border); }
.az-drag-handle { display: grid; place-items: center; width: 100%; min-height: 28px; border: 0; background: none; color: var(--az-muted); cursor: grab !important; touch-action: none !important; }
.az-drag-handle:active { cursor: grabbing !important; }
.az-powered-by { padding: 7px 12px 10px; text-align: center; font-size: 11px; color: var(--az-muted); }
.az-powered-by a { color: inherit; text-underline-offset: 3px; }
.az-powered-by span, .az-powered-by a { font-weight: 600; }
.az-phone[data-motion="on"] .az-control, .az-phone[data-motion="on"] .az-button, .az-phone[data-motion="on"] .az-keypad button {
  transition: background-color var(--az-motion-duration) ease, color var(--az-motion-duration) ease, transform 120ms cubic-bezier(0.16,1,0.3,1), opacity var(--az-motion-duration) ease;
}
.az-phone[data-motion="on"] .az-control:active, .az-phone[data-motion="on"] .az-button:active, .az-phone[data-motion="on"] .az-keypad button:active { transform: scale(0.96); }
.az-phone[data-motion="on"] .az-incoming-actions, .az-phone[data-motion="on"] .az-transfer, .az-phone[data-motion="on"] .az-settings-body { animation: az-reveal var(--az-motion-duration) cubic-bezier(0.16,1,0.3,1); }
@keyframes az-reveal { from { opacity: 0.45; clip-path: inset(0 0 15% 0); } to { opacity: 1; clip-path: inset(0); } }
.az-phone[data-motion="off"], .az-phone[data-motion="off"] *, .az-phone[data-motion="off"] *::before, .az-phone[data-motion="off"] *::after { transition: none !important; animation: none !important; }
@media (prefers-reduced-motion: reduce) {
  .az-phone, .az-phone * {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
}
`;
