import {
  PhoneTones,
  type PhoneToneOptions,
  type PhoneToneEvent,
} from "./tones.ts";
/** Translate browser exceptions without leaking implementation or device details. */
export function microphoneMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Microphone access was blocked. Allow the microphone in your browser’s site settings, then try again.";
  if (name === "NotFoundError")
    return "No microphone found. Connect a microphone, then try again.";
  if (name === "NotReadableError" || name === "AbortError")
    return "The microphone is busy or disconnected. Check your device and close other apps using it.";
  if (name === "OverconstrainedError")
    return "The selected microphone is unavailable. Choose the default microphone and try again.";
  if (name === "TimeoutError")
    return "Microphone permission is still pending. Respond to your browser’s prompt, then try again.";
  return "Could not access the microphone. Check your browser permissions and audio device.";
}

/** Stop only streams acquired by this phone, never host-owned media. */
export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/** Audio lifetime is owned by PhoneClient, not by whichever visual preset is mounted. */
export class PhoneAudio {
  private element: HTMLAudioElement | null = null;
  private tones = new PhoneTones();

  configureTones(options: PhoneToneOptions | false): void {
    this.tones.configure(options);
  }
  unlock(): void {
    this.tones.unlock();
    if (typeof Audio === "undefined") return;
    this.element ??= new Audio();
    this.element.autoplay = true;
  }
  cue(event: PhoneToneEvent, digit?: string): boolean {
    return this.tones.start(event, digit);
  }
  previewCue(event: PhoneToneEvent): void {
    this.tones.start(event, "5", false);
  }
  async resumeTones(): Promise<void> {
    await this.tones.resume();
  }

  async play(
    stream: MediaStream,
    volume: number,
    sinkId: string,
  ): Promise<void> {
    this.element ??= new Audio();
    this.element.volume = volume;
    this.element.srcObject = stream;
    if (sinkId && "setSinkId" in this.element)
      await this.element.setSinkId(sinkId);
    await this.element.play();
  }

  setVolume(volume: number): void {
    if (this.element) this.element.volume = volume;
  }

  async setOutputDevice(id: string): Promise<void> {
    this.element ??= new Audio();
    if (!("setSinkId" in this.element)) {
      if (id)
        throw new Error(
          "Audio output selection is not supported by this browser.",
        );
      return;
    }
    await this.element.setSinkId(id);
  }

  ring(event: "incoming" | "outgoing" | "ringing" = "incoming"): boolean {
    return this.tones.start(event);
  }
  stopRinging(): void {
    this.tones.stop();
  }

  stop(): void {
    this.stopRinging();
    if (this.element) {
      this.element.pause();
      this.element.srcObject = null;
    }
  }

  dispose(): void {
    this.stop();
    this.element = null;
    this.tones.dispose();
  }
}
