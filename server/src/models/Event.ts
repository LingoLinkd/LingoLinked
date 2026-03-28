import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  organizer: Types.ObjectId;
  attendees: Types.ObjectId[];
  language: string;
  maxAttendees: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    language: { type: String, default: "" },
    maxAttendees: { type: Number, default: 0 }, // 0 = unlimited
  },
  { timestamps: true }
);

EventSchema.index({ date: 1 });
EventSchema.index({ organizer: 1 });

export default mongoose.model<IEvent>("Event", EventSchema);
