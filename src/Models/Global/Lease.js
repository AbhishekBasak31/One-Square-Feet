import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const LeaseSchema = new SCHEMA(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'TERMINATED'], default: 'ACTIVE' },
    
    tenurestart: { type: Date, required: true },
    tenureend: { type: Date, required: true },
    stepuptenure: { type: String, required: true },
    gst: { type: String, default: "N/A" },
    
    agreedRent: { type: Number, required: true },
    agreedMaintenance: { type: Number, required: true },
    depositAmount: { type: Number, required: true }, // 🟢 NEW: Deposit tracking
    
    rentAgreementUrl: { type: String, required: true } // Cloudinary URL
  },
  { timestamps: true }
);

export const Lease = mongoose.model("Lease", LeaseSchema);
export default Lease;