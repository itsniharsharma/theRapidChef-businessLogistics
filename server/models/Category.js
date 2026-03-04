import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true },
)

categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true })

export default mongoose.model('Category', categorySchema)
