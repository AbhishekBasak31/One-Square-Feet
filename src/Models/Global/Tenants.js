import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const TenantSchema = new SCHEMA({
  name: { type: String, required: true },
  email: { type: String, required: true },
  callNumber: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  permanentAddress: { type: String, required: true },
  adharNumber: { type: String, required: true },
  adharCardUrl: { type: String, required: true },
  panNumber: { type: String, required: true },
  panCardUrl: { type: String, required: true },
  gst:{type: String},
  bankDetails: {
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    bankName: { type: String, default: "" }
  },

  // 🟢 NEW: Ownership Tracking to prevent data leakage
  ownedby: { type: mongoose.Schema.Types.ObjectId, ref: "PropertyOwner"},
  addedByBroker: { type: mongoose.Schema.Types.ObjectId, ref: "Broker" }
}, { timestamps: true });

export const Tenant = mongoose.model("Tenant", TenantSchema);
export default Tenant;