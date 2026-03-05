import mongoose from 'mongoose'

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    businessHours: { type: String, default: '' },
    upiVpa: { type: String, default: '' },
    upiPayeeName: { type: String, default: '' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
)

export default mongoose.model('Restaurant', restaurantSchema)
