import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SCHEMA } from "../../Utils/Constant.js"; // Adjust path if needed

const Saltround = Number(process.env.SALT_ROUNDS) || 10;

const OwnerSchema = new SCHEMA(
  {
     ownerType: { type: String, enum: ['Individual', 'Company'] }, 
      companyName: { type: String }, 
    name: { type: String, required: true }, 
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true }, 
    password: { type: String, required: true },
    address: { type: String, required: true },
    contactPersonName: { type: String },
    contactPersonPhone: { type: String },
    keyPersonName: { type: String },
    keyPersonPhone: { type: String },
    // --- PAYWALL & ADMIN CONTROL ---
    planType: { 
        type: String, 
        enum: ['FREE', 'PREMIUM'], 
        default: 'FREE' 
    },
    planExpiryDate: { type: Date },
    
    // --- VERIFICATION & DOCUMENTS ---
    verifyStatus: {
        type: Boolean,  
        default: false
    },
    pancard: {
        type: String, 
    },
    aadhar: {
        type: String, 
    },
    profilephoto:{
        type: String, 
    },
    // Admin selects which brokers this owner is allowed to see
    assignedBrokers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Broker"
    }],

    lastLoginAt: { type: Date },
  },
  { timestamps: true } 
);

OwnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, Saltround);
    next();
  } catch (err) {
    next(err);
  }
});

OwnerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

OwnerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: "OWNER",
      planType: this.planType
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EXPIRY_TIME || "1d" }
  );
};

export const PropertyOwner = mongoose.model("PropertyOwner", OwnerSchema);
export default PropertyOwner;