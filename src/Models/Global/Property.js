import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

// Helper function: Checks if the property is residential
function isResidential() {
  const commercialTypes = ['Commercial', 'Office', 'Shop', 'Land'];
  return !commercialTypes.includes(this.type);
}

const PropertySchema = new SCHEMA(
  {
    type: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    
    // 🟢 MEDIA FIELDS
    img: [{ type: String, required: true }],
    video: [{ type: String }], // 🟢 NEW: Array to store multiple video URLs
    
    address: {
        houseno: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
    },
    
    rera: { type: String, required: true },
    cc: { type: Boolean, required: true },
    mutation: { type: Boolean, required: true },
    furnished: { type: Boolean, required: true },
    carpetarea: { type: String, required: true },
    superbuilderarea: { type: String, required: true },
    landarea: { type: String, required: true },
    verified: { type: Boolean, default: false },
    noofbedrooms: { type: String, required: isResidential },
    noofbathrooms: { type: String, required: isResidential },  
    noofhalls: { type: String, required: isResidential },
    noofkitchens: { type: String, required: isResidential },
    noofdrawingrooms: { type: String, required: isResidential },
    noofbalcony: { type: String, required: isResidential },
    noofparking: { type: String, required: isResidential },

    description: { type: String, required: true },
    amenities: [{ type: String, required: true }],
    
    // ==========================================
    // 🟢 PRICING & LISTING TYPE FIELDS
    // ==========================================
    price: { type: String }, // Can represent total price or monthly rent
    maintenanceCost: { type: String }, 
    rental: { type: Boolean, default: false },
    selling: { type: Boolean, default: false },
    propertyAge: { type: String }, // 🟢 NEW: Age of property in years
    
    // 🟢 Connects to the currently active lease contract
    activeLease: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Lease", 
        default: null 
    },
    // ==========================================
    // 🟢 OWNER TRACKING
    // ==========================================
    Floor:{
    type: String,
    },
    // 1. Registered Platform Owner (If the owner has an account on your app)
    ownedby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyOwner"
    },

    // 2. Offline Owner Details (Manually typed by Broker during property addition)
    brokerOwnerDetails: {
        ownerType: { type: String, enum: ['Individual', 'Company'] }, // Determines if Company Name is needed
        companyName: { type: String }, // Only filled if ownerType is 'Company'
        ownerName: { type: String },
        ownerPhone: { type: String },
        contactPersonName: { type: String },
        contactPersonPhone: { type: String },
        keyPersonName: { type: String },
        keyPersonPhone: { type: String }
    },

    assignedBrokers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Broker" 
    }],

    // Tracks which broker actually created this property listing
    addedByBroker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Broker"
    },
    
    propertypapers: [{type:String}],
    visibilitySettings: {
        showAddressToFreeBrokers: { type: Boolean, default: false },
        showOwnerDetailsToFreeBrokers: { type: Boolean, default: false },
        showReraToFreeBrokers: { type: Boolean, default: false },
    }
  },
  { timestamps: true }
);

// Custom method securely packages ONLY the data allowed for the free scheme.
PropertySchema.methods.toFreeTierJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    type: this.type,
    carpetarea: this.carpetarea,
    furnished: this.furnished,
    amenities: this.amenities,
    price: this.price,         // Exposing pricing to free tier so they can see the cost
    rental: this.rental,
    selling: this.selling,
    address: {
      city: this.address?.city,
      state: this.address?.state
    }
  };
};

export const Property = mongoose.model("Property", PropertySchema);
export default Property;