// app/(main)/call.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, spacingX, spacingY, radius } from "@/constants/theme";
import Typo from "@/components/Typo";
import * as Icons from "phosphor-react-native";
import CallMgr from "@/lib/agora/CallManager";
import { RtcSurfaceView, RenderModeType } from "react-native-agora";
import { newMessage } from "@/socket/socketEvents";

export default function CallScreen() {
  const router = useRouter();
  const { channel, name } = useLocalSearchParams<{
    channel: string;
    name?: string;
  }>();

  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const missedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable uid for this device
  const uid = useMemo(() => Math.floor(10000 + Math.random() * 80000), []);

  // Auto “missed call” if nobody answers in 20s
  useEffect(() => {
    if (missedTimerRef.current) clearTimeout(missedTimerRef.current);
    missedTimerRef.current = setTimeout(async () => {
      if (remoteUid == null) {
        try {
          // send a lightweight special text; MessageItem renders a “Call back” action
          newMessage({
            conversationId: String(channel),
            content: "__MISSED_VIDEO_CALL__",
          });
        } finally {
          await CallMgr.leave();
          CallMgr.destroy();
          router.back();
        }
      }
    }, 20000);
    return () => {
      if (missedTimerRef.current) clearTimeout(missedTimerRef.current);
    };
  }, [channel, remoteUid, router]);

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    StatusBar.setBackgroundColor("#000");

    CallMgr.ensureEngine();

    const onUserJoined = (_: any, u: number) => setRemoteUid(u);
    const onUserOffline = (_: any, u: number) => {
      if (u === remoteUid) setRemoteUid(null);
    };

    CallMgr.addListener("onUserJoined", onUserJoined);
    CallMgr.addListener("onUserOffline", onUserOffline);

    CallMgr.join(String(channel), uid).catch((e) =>
      console.warn("JOIN ERR", e)
    );

    return () => {
      CallMgr.removeAllListeners();
      // keep engine alive for background audio when user presses back
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, uid]);

  const onBack = () => {
    // minimize: turn camera off, keep audio on
    if (camOn) {
      CallMgr.setCameraOn(false);
      setCamOn(false);
    }
    router.back();
  };

  const toggleMic = () => {
    const next = !micMuted;
    setMicMuted(next);
    CallMgr.setMicMuted(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    CallMgr.setCameraOn(next);
  };

  const hangup = async () => {
    await CallMgr.leave();
    CallMgr.destroy();
    router.back();
  };

  const switchCamera = () => {
    CallMgr.switchCamera();
  };

  return (
    <View style={styles.container}>
      {/* Video layer */}
      <View style={styles.videoLayer}>
        {remoteUid != null ? (
          // Remote full-screen
          <RtcSurfaceView
            style={StyleSheet.absoluteFill}
            canvas={{
              uid: remoteUid,
              renderMode: RenderModeType.RenderModeHidden,
            }}
          />
        ) : (
          // Local full-screen until remote joins (👇 local preview uses uid = 0)
          <RtcSurfaceView
            style={StyleSheet.absoluteFill}
            canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
          />
        )}

        {/* small local preview if camera on & remote present */}
        {camOn && remoteUid != null && (
          <View style={styles.selfPip}>
            <RtcSurfaceView
              style={styles.selfPipInner}
              canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
            />
          </View>
        )}
      </View>

      {/* Header (lowered so status bar doesn’t overlap) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Icons.ArrowLeft size={24} color="#fff" weight="bold" />
        </TouchableOpacity>

        <Typo
          size={22}
          color="#fff"
          fontWeight="800"
          style={{ flex: 1, textAlign: "center" }}
        >
          {name || "Calling…"}
        </Typo>

        {/* Switch camera on the right */}
        <TouchableOpacity onPress={switchCamera} style={styles.headerBtn}>
          <Icons.CameraRotate size={24} color="#fff" weight="bold" />
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={toggleCam}>
          {camOn ? (
            <Icons.VideoCamera size={26} color={colors.white} weight="fill" />
          ) : (
            <Icons.VideoCameraSlash
              size={26}
              color={colors.white}
              weight="fill"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.hangBtn} onPress={hangup}>
          <Icons.PhoneDisconnect size={26} color="#fff" weight="fill" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn} onPress={toggleMic}>
          {micMuted ? (
            <Icons.MicrophoneSlash
              size={26}
              color={colors.white}
              weight="fill"
            />
          ) : (
            <Icons.Microphone size={26} color={colors.white} weight="fill" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PIP_W = 110;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  videoLayer: { flex: 1 },

  selfPip: {
    position: "absolute",
    right: spacingX._12,
    top: spacingY._12 + 56, // a bit lower to make room for header
    width: PIP_W,
    height: (PIP_W * 16) / 9,
    borderRadius: radius._15,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  selfPipInner: { width: "100%", height: "100%" },

  header: {
    position: "absolute",
    top: spacingY._12 + 8, // lowered
    left: 0,
    right: 0,
    paddingHorizontal: spacingX._12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  controls: {
    position: "absolute",
    bottom: spacingY._20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  ctrlBtn: {
    backgroundColor: "rgba(0,0,0,0.55)",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  hangBtn: {
    backgroundColor: "#E04040",
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
