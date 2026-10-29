// Generated from src/core/audio.ts. Run npm run package:build; do not edit.
import type { HapticsAdapter, MediaAdapter, PhoneMediaStream, RemoteAudioPlayer } from "./media.ts";
import { PhoneTones, type PhoneToneEvent, type PhoneToneOptions } from "./tones.ts";

/** Audio lifetime is owned by PhoneClient, not by whichever visual preset is mounted. */
export class PhoneAudio {
  private player: RemoteAudioPlayer | null = null;
  private readonly tones: PhoneTones;
  constructor(private readonly media: MediaAdapter, haptics: HapticsAdapter) {
    this.tones = new PhoneTones(haptics, media.platform === "ios" || media.platform === "android");
  }
  private get remote(): RemoteAudioPlayer {
    this.player ??= this.media.createPlayer();
    return this.player;
  }
  configureTones(options: PhoneToneOptions | false): void {
    this.tones.configure(options);
  }
  unlock(): void {
    this.tones.unlock();
  }
  cue(event: PhoneToneEvent, digit?: string): boolean {
    return this.tones.start(event, digit, false);
  }
  previewCue(event: PhoneToneEvent): void {
    this.tones.start(event, "5", false);
  }
  async resumeTones(): Promise<void> {
    await this.tones.resume();
  }
  async play(stream: PhoneMediaStream, volume: number, sinkId: string): Promise<void> {
    await this.remote.play(stream, volume, sinkId);
  }
  setVolume(volume: number): void {
    this.player?.setVolume(volume);
  }
  async setOutputDevice(id: string): Promise<void> {
    await this.remote.setOutputDevice(id);
  }
  ring(event: "incoming" | "outgoing" | "ringing" = "incoming"): boolean {
    return this.tones.start(event);
  }
  stopRinging(): void {
    this.tones.stop();
  }
  stop(): void {
    this.stopRinging();
    this.player?.stop();
  }
  dispose(): void {
    this.stop();
    this.player?.dispose();
    this.player = null;
    this.tones.dispose();
  }
}
