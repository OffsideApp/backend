// src/cloudinary/cloudinary.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('audio')
  @UseInterceptors(FileInterceptor('file')) // "file" is the field name the frontend will use
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    // Uploads to Cloudinary and gets the secure URL
    const url = await this.cloudinaryService.uploadAudio(file);

    return { url };
  }
}
