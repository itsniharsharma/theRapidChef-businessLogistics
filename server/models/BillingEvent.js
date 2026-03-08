import mongoose from 'mongoose'

const billingEventSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['razorpay'], required: true },
    providerEventId: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    subscriptionId: { type: String, default: '', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    processingStatus: {
      type: String,
      enum: ['received', 'processed', 'ignored', 'failed'],
      default: 'received',
      index: true,
    },
    receivedAt: { type: Date, default: Date.now, index: true },
    processedAt: { type: Date, default: null },
    failureReason: { type: String, default: '' },
    metadata: {
      createdAtEpoch: { type: Number, default: null },
      entityStatus: { type: String, default: '' },
    },
  },
  { timestamps: true },
)

billingEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true })

export default mongoose.model('BillingEvent', billingEventSchema)