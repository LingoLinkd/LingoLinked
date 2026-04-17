import mongoose, { Schema, Document, Types } from "mongoose";

// single chat message supporting text image or audio content
export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  image: string;
  audio: string;
  read: boolean;
  createdAt: Date;
}

// schema for messages stored within a conversation thread
const MessageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "", maxlength: 2000 },
    image: { type: String, default: "" },
    audio: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// indexed by conversation and time for ordered message fetching
MessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model<IMessage>("Message", MessageSchema);
