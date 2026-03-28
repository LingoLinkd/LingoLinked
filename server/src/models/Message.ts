import mongoose, { Schema, Document, Types } from "mongoose";

//Message will extend document, create fields
export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  image: string;
  audio: string;
  read: boolean;
  createdAt: Date;
}

//Create schema for a message
const MessageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },

    //Defines different types of messages, and whether a message is read for future use
    text: { type: String, default: "", maxlength: 2000 },
    image: { type: String, default: "" },
    audio: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//Index conversation
MessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model<IMessage>("Message", MessageSchema);