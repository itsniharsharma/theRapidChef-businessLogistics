import { getCloudinary } from '../config/cloudinary.js'

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' })
    }

    const cloudinary = getCloudinary()
    const folder = process.env.CLOUDINARY_FOLDER || 'chefs-bud'

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, response) => {
          if (error) return reject(error)
          return resolve(response)
        },
      )

      uploadStream.end(req.file.buffer)
    })

    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    next(error)
  }
}
