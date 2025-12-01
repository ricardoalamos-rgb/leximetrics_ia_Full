import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import 'multer';

@Injectable()
export class StorageService {
  private readonly uploadDir = 'uploads';

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ... inside class
  async upload(file: Express.Multer.File, tenantId: string): Promise<string> {

    const fileExtension = path.extname(file.originalname);
    const fileName = `${tenantId}/${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    await fs.promises.writeFile(filePath, file.buffer);

    return fileName; // Return relative path or key
  }

  async getFileBuffer(fileKey: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, fileKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileKey}`);
    }
    return fs.promises.readFile(filePath);
  }

}
