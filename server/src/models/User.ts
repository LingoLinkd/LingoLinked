import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// single language entry with proficiency level
export interface ILanguage {
  language: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "fluent" | "native";
}

// full user document type including all profile fields
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  bio: string;
  profilePicture: string;
  knownLanguages: ILanguage[];
  learningLanguages: ILanguage[];
  interests: string[];
  university: string;
  major: string;
  yearOfStudy: string;
  accountStatus: "active" | "inactive";
  role: "learner" | "tutor" | "both";
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// reusable sub-schema for language and proficiency pairs
const LanguageSchema = new Schema<ILanguage>(
  {
    language: { type: String, required: true },
    proficiency: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "fluent", "native"],
      required: true,
    },
  },
  { _id: false }
);

// main user document schema with all profile and language fields
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8 },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    bio: { type: String, default: "", maxlength: 500 },
    profilePicture: { type: String, default: "" },
    knownLanguages: { type: [LanguageSchema], default: [] },
    learningLanguages: { type: [LanguageSchema], default: [] },
    interests: { type: [String], default: [] },
    university: { type: String, default: "Rensselaer Polytechnic Institute" },
    major: { type: String, default: "" },
    yearOfStudy: { type: String, default: "" },
    accountStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    role: {
      type: String,
      enum: ["learner", "tutor", "both"],
      default: "both",
    },
  },
  { timestamps: true }
);

// hashes the password before saving when modified
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// compares a plaintext password against the stored bcrypt hash
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// strips password from serialized json output
UserSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model<IUser>("User", UserSchema);
