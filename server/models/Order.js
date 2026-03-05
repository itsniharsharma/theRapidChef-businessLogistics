import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    tableNumber: { type: Number, required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Completed'],
      default: 'Pending',
    },
  },
  { timestamps: true },
)

orderSchema.index({ restaurantId: 1, createdAt: -1 })
orderSchema.index({ restaurantId: 1, orderStatus: 1, createdAt: -1 })
orderSchema.index({ restaurantId: 1, tableNumber: 1, createdAt: -1 })
orderSchema.index({ restaurantId: 1, paymentStatus: 1, createdAt: -1 })
orderSchema.index({ restaurantId: 1, paymentStatus: 1, orderStatus: 1, createdAt: -1 })

export default mongoose.model('Order', orderSchema)
