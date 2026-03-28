import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const PaymentSchema = new SCHEMA({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  
  paymentMethod: { type: String, enum: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "RAZORPAY"], required: true },
  
  // 🟢 DEDICATED FIELDS FOR EACH PAYMENT TYPE
  transactionId: { type: String },      // For UPI, Bank Transfer, or Razorpay
  chequeNumber: { type: String },       // For Cheque
  chequeDepositDate: { type: Date },    // For Cheque
  cashDepositDate: { type: Date },      // For Cash (Handover Date)

  notes: { type: String }
}, { timestamps: true });

export const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;