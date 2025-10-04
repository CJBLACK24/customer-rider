// client/lib/agora/CallManager.ts
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RenderModeType,
} from "react-native-agora";
import { PermissionsAndroid, Platform } from "react-native";

async function ensureAndroidMediaPermissions() {
  if (Platform.OS !== "android") return true;
  const hasCam = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.CAMERA
  );
  const hasMic = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
  if (hasCam && hasMic) return true;

  const res = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]);

  const granted =
    res[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED &&
    res[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED;

  return granted;
}

class CallManager {
  private static _inst: CallManager;
  private engine?: IRtcEngine;
  private _joined = false;

  private appId = process.env.EXPO_PUBLIC_AGORA_APP_ID || "YOUR_AGORA_APP_ID";

  static get i() {
    if (!this._inst) this._inst = new CallManager();
    return this._inst;
  }

  ensureEngine() {
    if (this.engine) return this.engine;

    const e = createAgoraRtcEngine();
    e.initialize({
      appId: this.appId,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
    });

    // enable A/V
    e.enableAudio();
    e.enableVideo();

    // route to loud speaker by default (Android)
    // @ts-ignore
    e.setDefaultAudioRouteToSpeakerphone?.(true);

    // Attach local canvas to uid=0 and start preview so your local view is visible
    try {
      // @ts-ignore
      e.setupLocalVideo?.({
        uid: 0,
        renderMode: RenderModeType.RenderModeHidden,
      });
    } catch {}
    e.startPreview();

    this.engine = e;
    return e;
  }

  addListener(event: string, cb: any) {
    this.engine?.addListener(event as any, cb);
  }
  removeAllListeners() {
    this.engine?.removeAllListeners();
  }

  async join(channel: string, uid: number, token?: string) {
    const ok = await ensureAndroidMediaPermissions();
    if (!ok) throw new Error("CAMERA/MIC permissions denied");

    const e = this.ensureEngine();
    e.setClientRole(ClientRoleType.ClientRoleBroadcaster);

    // (Redundant safety) make sure local canvas is set before join
    try {
      // @ts-ignore
      e.setupLocalVideo?.({
        uid: 0,
        renderMode: RenderModeType.RenderModeHidden,
      });
    } catch {}

    e.joinChannel(token ?? "", channel, uid, {} as any);
    this._joined = true;
  }

  async leave() {
    if (!this.engine) return;
    try {
      this.engine.stopPreview();
      this.engine.leaveChannel();
    } finally {
      this._joined = false;
    }
  }

  destroy() {
    if (!this.engine) return;
    try {
      this.engine.stopPreview();
      this.engine.release();
    } finally {
      this.engine = undefined;
      this._joined = false;
    }
  }

  setMicMuted(muted: boolean) {
    this.engine?.muteLocalAudioStream(muted);
  }
  setCameraOn(on: boolean) {
    this.engine?.enableLocalVideo(on);
    if (on) this.engine?.startPreview();
    else this.engine?.stopPreview();
  }
  switchCamera() {
    // @ts-ignore RN wrapper exposes this on Android/iOS
    this.engine?.switchCamera?.();
  }
}

export default CallManager.i;
