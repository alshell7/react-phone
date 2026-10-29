import { defineConfig, devices } from "@playwright/test";

/** Browser tests run the exported web playground (react-native-web). */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 2,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      testIgnore: ["**/live-sip.spec.ts", "**/sip-wire.spec.ts"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 960 } },
    },
    {
      name: "mobile",
      testIgnore: ["**/live-sip.spec.ts", "**/sip-wire.spec.ts"],
      use: { ...devices["Pixel 7"] },
    },
    {
      // Two phones on a local registrar with real JsSIP and WebRTC (fake microphone).
      name: "sip-wire",
      testMatch: "**/sip-wire.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
    // Contacts your real PBX, so it only runs on request (SIP_LIVE=1) to avoid lockouts.
    ...(process.env.SIP_LIVE === "1"
      ? [
          {
            name: "live-sip",
            testMatch: "**/live-sip.spec.ts",
            use: {
              ...devices["Desktop Chrome"],
              permissions: ["microphone"],
              launchOptions: {
                args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
              },
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: "node scripts/serve.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
