import { Module } from "@nestjs/common";
import { FileController } from "./file.controller";
import { FileService } from "./file.service";
import { AuthModule } from "src/auth/auth.module";

@Module({
  controllers: [FileController],
  providers: [FileService],
  imports: [
    AuthModule
  ]
})

export class FileModule {}