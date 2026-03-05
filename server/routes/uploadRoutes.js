import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { uploadImage } from '../controllers/uploadController.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image uploads are allowed'))
    }
  },
})

router.post('/image', requireAuth, upload.single('image'), uploadImage)

export default router
