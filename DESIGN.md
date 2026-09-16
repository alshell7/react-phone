# Azeer Phone design

The user pinned ElevenLabs UI as the component reference. This is an operating interface with a developer playground around it.

- Warm off-white workspace, white controls, forest-green default actions, subtle neutral dividers.
- Geist for the demo; the library inherits the host's font by default.
- The primary phone stays in a spacious central stage. The right inspector changes presets, colors, and caller identity. The left rail provides clear destination navigation.
- Caller visuals are selectable: avatar, ElevenLabs Orb, live waveform, or stateful bars. Orb follows the theme and moves only during an active conversation; bars express connecting, initializing, speaking, listening, and hold states from SIP and WebRTC audio.
- Short control feedback and interruptible panel resizing maintain continuity. Duration is configurable; reduced-motion settings take precedence. A drag grip supports pointer and keyboard positioning. Optional bottom attribution stays visually secondary.
- Keyboard-visible focus, named icon buttons, 44px call targets, reduced-motion support, mobile stacking, and local status announcements.
- Empty states describe the next action. Preview mode and SIP mode are clearly distinguished.
- Tokens are scoped to each phone instance. Accent, surface, foreground, muted text, border, radius, font, and dark appearance are developer-controlled.

## Dynamic island

The docked phone inherits the host-selected theme. Its persistent capsule pairs a concise call label with SIP connection status. Expansion preserves the mounted calling interface; width, height, and corner transitions form one motion. The nonmodal phone supports six window/container anchors, three incoming presentations, opt-in focus, Escape, and reduced motion.

## Documentation

The user specified Astro Starlight with a shadcn-like dark theme and Vercel-like restraint. This is a Read surface: persistent sidebar, search, on-page navigation, compact reference tables, and examples. Near-black neutral surfaces, Geist typography, thin separators, modest corner radii, and emerald links preserve connection to the phone's identity. The generated banner provides the expressive moment; working UI screenshots and static Mermaid diagrams provide concrete evidence. Desktop and mobile layouts retain the same navigation and content.
