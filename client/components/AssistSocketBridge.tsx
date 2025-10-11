// client/components/AssistSocketBridge.tsx
import { useEffect } from "react";
import { onAssistApproved, onAssistStatus } from "@/socket/socketEvents";
import { getActivity, setActivity } from "@/utils/activityStore";

/**
 * Mount once (RootLayout). Keeps Activity items in sync with server pushes:
 *  - assist:approved  -> status = accepted
 *  - assist:status    -> completed/cancelled/rejected mapping
 */
export default function AssistSocketBridge() {
  useEffect(() => {
    const handleApproved = async (evt: any) => {
      if (!evt?.success || !evt?.data?.id) return;
      const srvId = String(evt.data.id);
      const list = await getActivity();
      const idx = list.findIndex((i) => i.meta?.assistId === srvId);
      if (idx >= 0) {
        list[idx].status = "accepted";
        await setActivity(list);
      } else {
        // Fallback: if no local item (e.g., app was restarted)
        list.unshift({
          id: `assist_${srvId}`,
          title: "Request assistance",
          placeName: "—",
          createdAt: new Date().toISOString(),
          status: "accepted",
          meta: { assistId: srvId },
        });
        await setActivity(list);
      }
    };

    const handleStatus = async (evt: any) => {
      if (!evt?.success || !evt?.data?.id) return;
      const srvId = String(evt.data.id);
      const raw = String(evt.data.status || "").toLowerCase();
      const map: Record<string, "done" | "canceled" | "pending" | "accepted"> = {
        completed: "done",
        cancelled: "canceled",
        canceled: "canceled",
        rejected: "canceled",
        pending: "pending",
        accepted: "accepted",
      };
      const local = map[raw] || "pending";

      const list = await getActivity();
      const idx = list.findIndex((i) => i.meta?.assistId === srvId);
      if (idx >= 0) {
        list[idx].status = local;
        await setActivity(list);
      }
    };

    onAssistApproved(handleApproved);
    onAssistStatus(handleStatus);

    return () => {
      onAssistApproved(handleApproved, true);
      onAssistStatus(handleStatus, true);
    };
  }, []);

  return null;
}
