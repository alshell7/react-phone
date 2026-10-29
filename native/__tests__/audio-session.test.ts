import { createInCallManagerAudioSession } from "../src/core/audio-session.ts";

const manager = () => ({
  start: jest.fn(),
  stop: jest.fn(),
  setForceSpeakerphoneOn: jest.fn(),
  startRingtone: jest.fn(),
  stopRingtone: jest.fn(),
});

describe("InCallManager audio session", () => {
  it("starts call audio once, routes the speaker, and resets on stop", () => {
    const icm = manager();
    const session = createInCallManagerAudioSession(icm);
    session.start?.("call");
    session.start?.("call");
    expect(icm.start).toHaveBeenCalledTimes(1);
    expect(icm.start).toHaveBeenCalledWith({ media: "audio" });
    session.setSpeaker?.(true);
    expect(icm.setForceSpeakerphoneOn).toHaveBeenCalledWith(true);
    session.stop?.();
    expect(icm.setForceSpeakerphoneOn).toHaveBeenLastCalledWith(null);
    expect(icm.stop).toHaveBeenCalledTimes(1);
    expect(icm.startRingtone).not.toHaveBeenCalled();
  });
  it("optionally plays the system ringtone and stops it when answered or declined", () => {
    const icm = manager();
    const session = createInCallManagerAudioSession(icm, {
      systemRingtone: true,
    });
    session.start?.("ringing");
    expect(icm.startRingtone).toHaveBeenCalledWith("_DEFAULT_");
    session.start?.("call");
    expect(icm.stopRingtone).toHaveBeenCalledTimes(1);
    session.stop?.();
    const declined = manager();
    const other = createInCallManagerAudioSession(declined, {
      systemRingtone: true,
    });
    other.start?.("ringing");
    other.stop?.();
    expect(declined.stopRingtone).toHaveBeenCalledTimes(1);
    expect(declined.stop).not.toHaveBeenCalled();
  });
});
