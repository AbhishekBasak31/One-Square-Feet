import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SCHEMA } from "../../Utils/Constant.js";

const Saltround = Number(process.env.SALT_ROUNDS) || 10;

const AdminSchema = new SCHEMA(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// update timestamp (sync hook)
AdminSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// hash password (async hook) — do NOT call next()
AdminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, Saltround);
});

AdminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

AdminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      // remove username if not in schema
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EXPIRY_TIME || "1d" }
  );
};

export const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;
