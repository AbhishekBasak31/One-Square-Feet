import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const InvoiceSchema = new SCHEMA({
  invoiceNo: { type: String, required: true, unique: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  billType: { type: String, enum: ["RENT", "MAINTENANCE", "ELECTRICITY"], required: true },
  billingMonth: { type: String, required: true }, 
  financialYear: { type: String, required: true }, 
  invoiceDate: { type: Date, default: Date.now },
  
  baseAmount: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // 🟢 NEW: Balance Tracking
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, required: true },
  
  electricDetails: { units: { type: Number, default: 0 }, rate: { type: Number, default: 0 } },
  // 🟢 UPDATED: Added "PARTIAL"
  status: { type: String, enum: ["UNPAID", "PARTIAL", "PAID"], default: "UNPAID" }
}, { timestamps: true });

export const Invoice = mongoose.model("Invoice", InvoiceSchema);
export default Invoice;