import { Request } from 'express';
import { FileFilterCallback } from 'multer';

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function checkMagicBytes(buffer: Buffer, expected: number[][]): boolean {
  return expected.some((bytes) =>
    bytes.every((byte, i) => buffer[i] === byte),
  );
}

export const imageFileFilter = (
  _: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  const allowedMimes = Object.keys(MAGIC_BYTES);
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed (jpeg, png, webp)'));
  }

  cb(null, true);
};
