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
    img: [{ type: String, required: true }],
    
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
    verified:{ type: Boolean, default: false},
    noofbedrooms: { type: String, required: isResidential },
    noofbathrooms: { type: String, required: isResidential },  
    noofhalls: { type: String, required: isResidential },
    noofkitchens: { type: String, required: isResidential },
    noofdrawingrooms: { type: String, required: isResidential },
    noofbalcony: { type: String, required: isResidential },
    noofparking: { type: String, required: isResidential },

    description: { type: String, required: true },
    amenities: [{ type: String, required: true }],
    
    ownedby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyOwner",
        required: true
    },

    assignedBrokers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Broker" 
    }],
propertypapers:[{type:String},],
    visibilitySettings: {
        showAddressToFreeBrokers: { type: Boolean, default: false },
        showOwnerDetailsToFreeBrokers: { type: Boolean, default: false },
        showReraToFreeBrokers: { type: Boolean, default: false },
    }
  },
  { timestamps: true }
);

// ==========================================
// NEW: CUSTOM FILTER METHOD FOR FREE BROKERS
// ==========================================
// This method securely packages ONLY the data allowed for the free scheme.
PropertySchema.methods.toFreeTierJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    type: this.type,
    carpetarea: this.carpetarea,
    furnished: this.furnished,
    amenities: this.amenities,
    // Notice how we only extract city and state, completely ignoring houseno, street, etc.
    address: {
      city: this.address?.city,
      state: this.address?.state
    }
  };
};

export const Property = mongoose.model("Property", PropertySchema);
export default Property;