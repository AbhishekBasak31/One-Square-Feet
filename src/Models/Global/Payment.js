import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const PaymentSchema = new SCHEMA({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  
  // Method can be manual or via Razorpay
  paymentMethod: { type: String, enum: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "RAZORPAY"], required: true },
  
  // To store Razorpay payment ID or Bank UTR number
  transactionId: { type: String }, 
  notes: { type: String }
}, { timestamps: true });

export const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;