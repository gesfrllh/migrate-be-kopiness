import { extname } from 'path'
import {diskStorage} from 'multer'

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (_, file, cb ) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
      cb(null, `${unique}${extname(file.originalname)}`)
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}