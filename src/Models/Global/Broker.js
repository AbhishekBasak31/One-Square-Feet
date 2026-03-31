import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SCHEMA } from "../../Utils/Constant.js";
import Property from "./Property.js";

const Saltround = Number(process.env.SALT_ROUNDS) || 10;

const BrokerSchema = new SCHEMA(
  {
    // ==========================================
    // 1. INITIAL REGISTRATION (Mandatory)
    // ==========================================
    // Brokers provide these themselves via the signup page.
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    profilepic:{type: String},
    // ==========================================
    // 2. ADMIN VERIFIED KYC DOCUMENTS (Optional at Signup)
    // ==========================================
    // Admin collects these offline/manually, verifies them, and uploads them via CMS.
    rera: { type: String }, 
    pancard: { type: String }, 
    aadhar: { type: String }, 
    panno:{
    type: String, 
    },
    aadharno:{
    type: String, 
    },
    gstno:{
    type: String, 
    },
    rerano:{
    type: String,
    },
    digitalSignature:{
  type: String, 
    },
    // ==========================================
    // 3. ADMIN VERIFIED BUSINESS DOCUMENTS (Optional at Signup)
    // ==========================================
    gst: { type: String }, 
    
    businessType: { 
        type: String, 
        enum: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'Freelance'],
    },
    bankDetails: {
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    bankName: { type: String, default: "" }
  },
    businessregistration: { type: String },
    localtradelicense: { type: String },
    
    // Signed agreement uploaded by admin
    brokerageagreement: { type: String }, 
     myclients: [{
      name: { type: String },
      Propertyquery: { type: String },
      deadline: { type: Date },
      status: { type: Boolean, default: false },
      assigneddate: { 
        type: Date, 
        default: Date.now // 🟢 FIX: Automatically sets to the current date & time
      },
      email: { type: String },
      phone: { type: String },
      remark: { type: String }
    }],
    // ==========================================
    // 4. PLATFORM CONTROL & PAYWALL LOGIC
    // ==========================================
    
    // Admin turns this to `true` ONLY after filling in the documents above.
    // Brokers cannot access properties if this is false.
    isVerified: { type: Boolean, default: false },

    // Subscription plan dictating property visibility
    planType: { 
        type: String, 
        enum: ['FREE', 'PREMIUM'], 
        default: 'FREE' 
    },
    planExpiryDate: { type: Date },

    lastLoginAt: { type: Date },
  },
  { timestamps: true } // Automatically handles createdAt and updatedAt
);

// Hash password before saving (async hook)
BrokerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, Saltround);
    next();
  } catch (error) {
    next(error);
  }
});

BrokerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

BrokerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      planType: this.planType, 
      isVerified: this.isVerified // Frontend can use this to show a "Pending Verification" screen
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EXPIRY_TIME || "1d" }
  );
};

export const Broker = mongoose.model("Broker", BrokerSchema);
export default Broker;