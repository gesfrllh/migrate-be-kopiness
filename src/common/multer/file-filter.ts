import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { FileFilterCallback } from 'multer';

export const imageFileFilter = (
  _: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    throw new BadRequestException('Only image files allowed');
  }

  cb(null, true);
};
