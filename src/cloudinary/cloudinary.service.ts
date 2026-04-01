// src/cloudinary/cloudinary.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import 'multer';

@Injectable()
export class CloudinaryService {
  constructor() {
    // Configure Cloudinary with your environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // A helper function to upload an audio file to Cloudinary
  async uploadAudio(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video', // Cloudinary treats audio as 'video'
          folder: 'offside_rants', // Keeps your cloud storage organized
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Audio Upload Error:', error);
            // Replaces your AppError(..., 500)
            return reject(new InternalServerErrorException('Failed to upload audio file'));
          }
          if (result) {
            resolve(result.secure_url); // This is the final https://... link!
          }
        },
      );

      // Feed the buffer into the stream

      uploadStream.end(file.buffer);
    });
  }

  // A helper function to upload an image to Cloudinary
  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image', // Explicitly tell Cloudinary it's an image
          folder: 'offside_images', // Keep images in a separate folder
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Image Upload Error:', error);
            // Replaces your AppError(..., 500)
            return reject(new InternalServerErrorException('Failed to upload image file'));
          }
          if (result) {
            resolve(result.secure_url);
          }
        },
      );

      // Feed the buffer into the stream

      uploadStream.end(file.buffer);
    });
  }
}
