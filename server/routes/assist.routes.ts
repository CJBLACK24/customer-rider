import { Router } from "express";
import AssistRequest from "../modals/AssistRequest";
import { auth } from "../middleware/auth";
import Conversation from "../modals/Conversation";
import ConversationMeta from "../modals/ConversationMeta";

const router = Router();

/** List pending requests (for operator dashboard) */
router.get("/pending", auth, async (_req, res) => {
  const list = await AssistRequest.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate({ path: "userId", select: "name avatar email" })
    .lean();
  res.json({ success: true, data: list });
});

/** Accept a request (HTTP alt to the socket) */
router.post("/:id/accept", auth, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const operatorId = String(req.user?.id || "");
    const doc = await AssistRequest.findById(id);
    if (!doc) return res.status(404).json({ success: false, msg: "Not found" });
    if (doc.status !== "pending")
      return res.status(400).json({ success: false, msg: "Already processed" });

    doc.status = "accepted";
    doc.assignedTo = operatorId as any;
    await doc.save();

    // Ensure ConversationMeta rows exist
    const existing = await Conversation.findOne({
      type: "direct",
      participants: { $all: [doc.userId, operatorId], $size: 2 },
    }).lean();

    if (!existing) {
      const created = await Conversation.create({
        type: "direct",
        participants: [doc.userId, operatorId],
        createdBy: operatorId,
      });
      await Promise.all(
        [doc.userId, operatorId].map((uid) =>
          ConversationMeta.findOneAndUpdate(
            { conversationId: created._id, userId: uid },
            { $setOnInsert: { unreadCount: 0 } },
            { upsert: true, new: true }
          )
        )
      );
    }

    res.json({ success: true });
  } catch (e) {
    console.error("accept route error:", e);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
});

export default router;
