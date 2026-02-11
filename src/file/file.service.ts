import { Injectable, BadRequestException } from '@nestjs/common';
import { supabase } from '../lib/supabase';
import { randomUUID } from 'crypto';

@Injectable()
export class FileService {
  async uploadToSupabase(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
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
