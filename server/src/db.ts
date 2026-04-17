import mongoose from "mongoose";

// establishes the mongoose connection and enables strict queries
export async function connectDB(uri: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
