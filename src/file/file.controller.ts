import { Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
 } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileService } from "./file.service";
import { JwtGuard } from "src/common/guards/jwt.guard";
import { multerConfig } from "src/common/multer/multer.config";
import { imageFileFilter } from "src/common/multer/file-filter";

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService){}

  @Post('upload')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('file', {
    ...multerConfig,
    fileFilter: imageFileFilter
  }))
  upload(@UploadedFile() file: Express.Multer.File){
    return this.fileService.uploadToSupabase(file)
  }
}