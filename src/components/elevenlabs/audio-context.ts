/** Resume a visualizer's analyser after autoplay restrictions are lifted. */
export function resumeOnInteraction(context: AudioContext): () => void {
  const resume = () => {
    if (context.state === "suspended") void context.resume().catch(() => {});
  };
  resume();
  window.addEventListener("pointerdown", resume);
  window.addEventListener("keydown", resume);
  return () => {
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
  };
}
