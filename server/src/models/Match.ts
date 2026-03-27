import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMatch extends Document {
  users: Types.ObjectId[];
  score: number;
  sharedLanguages: string[];
  status: "pending" | "accepted" | "declined";
  initiator: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

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
