import mongoose, { Schema, Document, Types } from "mongoose";

// conversation thread tying two participants with a last message preview
export interface IConversation extends Document {
  participants: Types.ObjectId[];
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// stores participants and metadata for direct message threads
const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// indexed for fast participant lookup
ConversationSchema.index({ participants: 1 });

export default mongoose.model<IConversation>("Conversation", ConversationSchema);
