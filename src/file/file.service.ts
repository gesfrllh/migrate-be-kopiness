import { Injectable, BadRequestException } from '@nestjs/common';
import { supabase } from '../lib/supabase';
import { randomUUID } from 'crypto';

const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function verifyImageMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = IMAGE_MAGIC_BYTES[mimetype];
  if (!signatures) return false;
  return signatures.some((bytes) =>
    bytes.every((byte, i) => buffer[i] === byte),
  );
}

@Injectable()
export class FileService {
  async uploadToSupabase(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!verifyImageMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException('Invalid or corrupted image file');
    }

    const ext = file.originalname.split('.').pop();
    const fileName = `${randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('s3') // NAMA BUCKET
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // kalau bucket PUBLIC
    const { data: publicUrl } = supabase.storage
      .from('s3')
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: publicUrl.publicUrl,
    };
  }
}
