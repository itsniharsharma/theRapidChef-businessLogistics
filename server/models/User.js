import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['owner'], default: 'owner' },
    billing: {
      planType: { type: String, enum: ['none', 'lifetime', 'hybrid'], default: 'none' },
      status: {
        type: String,
        enum: ['pending', 'setup_paid', 'active', 'failed'],
        default: 'pending',
      },
      razorpayCustomerId: { type: String, default: '' },
      razorpaySubscriptionId: { type: String, default: '' },
      lifetimePaymentId: { type: String, default: '' },
      setupPaymentId: { type: String, default: '' },
      activatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
