import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        sender: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String, required: true },
        type: {
            type: String,
            enum: ["text", "link", "image", "project"],
            default: "text",
        },
    },
    { timestamps: true }
);

const chatRoomSchema = new Schema(
    {
        name: { type: String, required: true },
        members: [{ type: Schema.Types.ObjectId, ref: "User" }],
        messages: [messageSchema],
    },
    { timestamps: true }
);

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
