import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://alshell7.github.io",
  base: "/react-phone",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "Azeer / Phone",
      description:
        "An embeddable SIP phone for React and React Native. Presets, dynamic islands, live audio visuals, and a headless client.",
      favicon: "/favicon.svg",
      customCss: ["@fontsource-variable/geist", "./src/styles/custom.css"],
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
      SocialIcons: "./src/components/SocialIcons.astro",
      Footer: "./src/components/Footer.astro",
      },
      editLink: {
        baseUrl: "https://github.com/alshell7/react-phone/edit/main/docs/",
      },
      expressiveCode: {
        themes: ["github-dark"],
        styleOverrides: {
          borderRadius: "8px",
          codeFontSize: "0.8125rem",
          codeBackground: "#111111",
          borderColor: "#262626",
        },
      },
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Introduction", slug: "index" },
            { label: "Quick start", slug: "quick-start" },
            { label: "Playground", slug: "playground-guide" },
          ],
        },
        {
          label: "React Native",
          items: [
            { label: "Introduction", slug: "native", badge: "New" },
            { label: "Quick start", slug: "native/quick-start" },
            { label: "Phone surfaces", slug: "native/surfaces" },
            { label: "Dynamic island", slug: "native/dynamic-island" },
            { label: "Calling & lifecycle", slug: "native/calling" },
            { label: "Audio, tones & haptics", slug: "native/audio" },
            { label: "Orb, waveforms & bars", slug: "native/visuals" },
            { label: "Themes, identity & motion", slug: "native/customization" },
            { label: "Compose your own", slug: "native/components" },
            { label: "Platforms & recovery", slug: "native/platforms" },
            { label: "Playground", slug: "native/playground-guide" },
            { label: "Develop, test & publish", slug: "native/development" },
          ],
        },
        {
          label: "Build your phone",
          items: [
            { label: "Dynamic island", slug: "dynamic-island", badge: "New" },
            { label: "Dialing & incoming calls", slug: "calling" },
            { label: "Orb, waveforms & bars", slug: "visuals" },
            { label: "Themes & caller identity", slug: "customization" },
            { label: "Sound & motion", slug: "sound-and-motion" },
            { label: "Compose your own UI", slug: "components" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "SIP configuration", slug: "sip-configuration" },
            { label: "Events & lifecycle", slug: "events" },
            { label: "Permissions & recovery", slug: "recovery" },
            { label: "Development & releases", slug: "development" },
          ],
        },
      ],
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content:
              "https://alshell7.github.io/react-phone/media/repository-banner.png",
          },
        },
        { tag: "meta", attrs: { name: "theme-color", content: "#090909" } },
      ],
    }),
  ],
});
