import multer from "multer";
import path from "path";
import { Request } from "express";

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed"));
  }
};

// Profile picture upload
const profileStorage = multer.diskStorage({
  destination(_req: Request, _file, cb) {
    cb(null, path.join(__dirname, "../../uploads/profiles"));
  },
  filename(_req: Request, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const uploadProfilePic = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Message image upload
const messageStorage = multer.diskStorage({
  destination(_req: Request, _file, cb) {
    cb(null, path.join(__dirname, "../../uploads/messages"));
  },
  filename(_req: Request, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const uploadMessageImage = multer({
  storage: messageStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Audio message upload
const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExt = /wav|mp3|webm|ogg|m4a/;
  const allowedMime = /audio\/(wav|mpeg|webm|ogg|mp4|x-m4a|mp3)/;
  const extOk = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedMime.test(file.mimetype);
  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files (wav, mp3, webm, ogg, m4a) are allowed"));
  }
};

const audioStorage = multer.diskStorage({
  destination(_req: Request, _file, cb) {
    cb(null, path.join(__dirname, "../../uploads/audio"));
  },
  filename(_req: Request, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const uploadMessageAudio = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});