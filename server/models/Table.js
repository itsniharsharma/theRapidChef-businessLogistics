import mongoose from 'mongoose'

const tableSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    tableNumber: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true })

export default mongoose.model('Table', tableSchema)
