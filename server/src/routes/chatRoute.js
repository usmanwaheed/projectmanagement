import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { ROLES } from "../config/roles.js";
import { ChatRoom } from "../models/chatRoomModel.js";
import { User } from "../models/userModel.js";

const router = express.Router();

// Create chat room ensuring at least one QC admin
router.post(
    "/rooms",
    verifyUser([ROLES.COMPANY, ROLES.USER, ROLES.QCADMIN]),
    async (req, res) => {
        try {
            const { name, members = [] } = req.body;
            const uniqueMembers = [...new Set([...members, req.user._id.toString()])];
            const users = await User.find({ _id: { $in: uniqueMembers } });
            const hasQc = users.some((u) => u.role === ROLES.QCADMIN);
            if (!hasQc) {
                return res.status(400).json({ message: "Chat room requires a QC admin" });
            }
            const room = await ChatRoom.create({ name, members: uniqueMembers });
            res.status(201).json({ data: room });
        } catch (error) {
            res.status(500).json({ message: "Failed to create room" });
        }
    }
);

// Get rooms for current user
router.get(
    "/rooms",
    verifyUser([ROLES.COMPANY, ROLES.USER, ROLES.QCADMIN]),
    async (req, res) => {
        const rooms = await ChatRoom.find({ members: req.user._id });
        res.json({ data: rooms });
    }
);

// Get messages for a room
router.get(
    "/rooms/:id/messages",
    verifyUser([ROLES.COMPANY, ROLES.USER, ROLES.QCADMIN]),
    async (req, res) => {
        const room = await ChatRoom.findById(req.params.id).populate("messages.sender", "name");
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (!room.members.some((m) => m.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: "Not a member" });
        }
        res.json({ data: room.messages });
    }
);

// Send message to room
router.post(
    "/rooms/:id/messages",
    verifyUser([ROLES.COMPANY, ROLES.USER, ROLES.QCADMIN]),
    async (req, res) => {
        try {
            const { content, type = "text" } = req.body;
            const room = await ChatRoom.findById(req.params.id);
            if (!room) return res.status(404).json({ message: "Room not found" });
            if (!room.members.some((m) => m.toString() === req.user._id.toString())) {
                return res.status(403).json({ message: "Not a member" });
            }
            const message = { sender: req.user._id, content, type };
            room.messages.push(message);
            await room.save();

            const io = req.app.get("io");
            if (io) {
                io.to(room._id.toString()).emit("newMessage", {
                    ...message,
                    roomId: room._id,
                });
            }
            res.status(201).json({ data: message });
        } catch (error) {
            res.status(500).json({ message: "Failed to send message" });
        }
    }
);

export default router;
