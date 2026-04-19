import multer from "multer";
import path from "path";
import { Request } from "express";

const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed"));
  }
};

//Profile picture upload
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
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Message image upload — memory storage so the buffer is encoded as a base64
export const uploadMessageImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Audio message upload — memory storage for the same reason as images
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

export const uploadMessageAudio = multer({
  storage: multer.memoryStorage(),
  fileFilter: audioFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Video message upload — memory storage, stored as base64 data URI in DB
const videoFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExt = /mp4|webm|ogg|mov|avi/;
  const allowedMime = /video\/(mp4|webm|ogg|quicktime|x-msvideo)/;
  const extOk = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedMime.test(file.mimetype);
  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only video files (mp4, webm, ogg, mov, avi) are allowed"));
  }
};

export const uploadMessageVideo = multer({
  storage: multer.memoryStorage(),
  fileFilter: videoFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});