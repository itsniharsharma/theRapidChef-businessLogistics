import mongoose from 'mongoose'

const offerSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Percentage Discount', 'Flat Discount', 'Combo Offer', 'Buy X Get Y'],
      required: true,
    },
    discountValue: { type: String, default: '' },
    conditions: { type: String, default: '' },
    active: { type: Boolean, default: true },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
  },
  { timestamps: true },
)

offerSchema.index({ restaurantId: 1, active: 1 })

export default mongoose.model('Offer', offerSchema)
