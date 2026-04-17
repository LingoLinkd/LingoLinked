import mongoose, { Schema, Document, Types } from "mongoose";

// match request between two users with a computed compatibility score
export interface IMatch extends Document {
  users: Types.ObjectId[];
  score: number;
  sharedLanguages: string[];
  status: "pending" | "accepted" | "declined";
  initiator: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// schema for connection requests tracking status and shared languages
const MatchSchema = new Schema<IMatch>(
  {
    users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    score: { type: Number, required: true },
    sharedLanguages: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    initiator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MatchSchema.index({ users: 1 });
MatchSchema.index({ status: 1 });

export default mongoose.model<IMatch>("Match", MatchSchema);
