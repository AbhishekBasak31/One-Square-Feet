import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const LedgerEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  particulars: { type: String, required: true },
  refInvoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  debit: { type: Number, default: 0 }, 
  credit: { type: Number, default: 0 },
  balance: { type: Number, required: true }
});

const LedgerSchema = new SCHEMA({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  financialYear: { type: String, required: true },
  entries: [LedgerEntrySchema],
  closingBalance: { type: Number, default: 0 }
}, { timestamps: true });
LedgerSchema.index({ tenant: 1, property: 1, financialYear: 1 }, { unique: true });
export const Ledger = mongoose.model("Ledger", LedgerSchema);
export default Ledger;