import jwt from "jsonwebtoken";
import Broker from "../../Models/Global/Broker.js";
import PropertyOwner from "../../Models/Global/Owner.js";
import Property from "../../Models/Global/Property.js";
import Admin from "../../Models/Global/User.js";

const getOwnerIdFromCookie = (context) => {
  const token = context.req?.cookies?.OwnerToken;
  if (!token) throw new Error("Unauthorized: No token found in cookies.");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded._id; 
  } catch (err) {
    throw new Error("Unauthorized: Invalid or expired token.");
  }
};

const getBrokerIdFromCookie = (context) => {
  const token = context.req?.cookies?.BrokerToken;
  if (!token) throw new Error("Unauthorized: No token found in cookies.");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded._id; 
  } catch (err) {
    throw new Error("Unauthorized: Invalid or expired token.");
  }
};

export const resolvers = {
  Query: {
    getBrokers: async (_, __, context) => {
      if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized");
      return await Broker.find().sort({ createdAt: -1 });
    },
    getBrokerById: async (_, { id }, context) => {
      if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized");
      return await Broker.findById(id);
    },
    getMyBrokerProfile: async (_, __, context) => {
      if (!context.user || context.user.role !== "BROKER") {
         throw new Error("Unauthorized: Broker access only.");
      }
      return await Broker.findById(context.user.id);
    },
    getOwners: async (_, __, context) => {
      if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized");
      return await PropertyOwner.find().sort({ createdAt: -1 }).populate("assignedBrokers");
    },
    getMyOwnerProfile: async (_, __, context) => {
      if (!context.user || context.user.role !== "OWNER") {
         throw new Error("Unauthorized: Owner access only.");
      }
      return await PropertyOwner.findById(context.user.id);
    },
    getOwnerById: async (_, { id }, context) => {
      if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized");
      return await PropertyOwner.findById(id).populate("assignedBrokers");
    },
    getProperties: async (_, __, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) {
        throw new Error("Unauthorized");
      }
      let filter = {};
      if (context.user.role === "OWNER") {
        filter.ownedby = getOwnerIdFromCookie(context); 
      } 
      else if (context.user.role === "BROKER") {
        filter.addedByBroker = getBrokerIdFromCookie(context); 
      }
      return await Property.find(filter).sort({ createdAt: -1 }).populate("ownedby").populate("assignedBrokers");
    },

    // 🟢 UPDATED: Checks if broker was assigned OR if they created it
    getPropertyById: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) {
        throw new Error("Unauthorized: You do not have permission to view this.");
      }
      const property = await Property.findById(id).populate("ownedby").populate("assignedBrokers");
      if (!property) throw new Error("Property not found");

      if (context.user.role === "OWNER") {
        const currentOwnerId = getOwnerIdFromCookie(context);
        if (!property.ownedby) {
           throw new Error("Data Error: This property has no owner assigned.");
        }
        const propertyOwnerId = property.ownedby._id ? property.ownedby._id.toString() : property.ownedby.toString();
        if (propertyOwnerId !== currentOwnerId.toString()) {
           throw new Error("Unauthorized: You can only view your own property details.");
        }
      }
      else if (context.user.role === "BROKER") {
        const currentBrokerId = getBrokerIdFromCookie(context);
        const isAssigned = property.assignedBrokers.some(b => 
          (b._id ? b._id.toString() : b.toString()) === currentBrokerId.toString()
        );
        const isCreator = property.addedByBroker?.toString() === currentBrokerId.toString();

        if (!isAssigned && !isCreator) {
           throw new Error("Unauthorized: You can only view details of properties assigned to you or created by you.");
        }
      }
      return property;
    },
    getMyAssignedProperties: async (_, __, context) => {
      if (!context.user || context.user.role !== "BROKER") throw new Error("Unauthorized Broker.");
      const broker = await Broker.findById(context.user.id);
      if (!broker) throw new Error("Broker not found.");
      if (!broker.isVerified) throw new Error("Your account is pending admin verification.");
      const properties = await Property.find({ assignedBrokers: broker._id }).populate("ownedby");
      const isPremium = broker.planType === 'PREMIUM' && (!broker.planExpiryDate || new Date(broker.planExpiryDate) > new Date());
      if (!isPremium) return properties.map(prop => prop.toFreeTierJSON());
      return properties; 
    },
    getMyAssignedBrokers: async (_, __, context) => {
      if (!context.user || context.user.role !== "OWNER") throw new Error("Unauthorized Owner.");
      const owner = await PropertyOwner.findById(context.user.id);
      if (!owner) throw new Error("Owner not found.");
      const brokers = await Broker.find({ _id: { $in: owner.assignedBrokers } });
      const isPremium = owner.planType === 'PREMIUM' && (!owner.planExpiryDate || new Date(owner.planExpiryDate) > new Date());
      if (!isPremium) {
        return brokers.map(b => ({ _id: b._id, name: b.name, businessType: b.businessType || "Not Specified", profilepic: b.profilepic }));
      }
      return brokers; 
    }
  },
  Mutation: {
    registerAdmin: async (_, args) => {
      const existing = await Admin.findOne({ email: args.email });
      if (existing) throw new Error("Admin already exists with this email");
      const admin = await new Admin(args).save();
      return { message: "Admin registered successfully.", admin };
    },
    loginAdmin: async (_, { email, password }, context) => {
      const admin = await Admin.findOne({ email });
      if (!admin || !(await admin.comparePassword(password))) throw new Error("Invalid credentials");
      const token = admin.generateAccessToken();
      admin.lastLoginAt = new Date();
      await admin.save();
      const isProd = process.env.NODE_ENV === "production";
      context.res.cookie("AdminToken", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/", maxAge: 24 * 60 * 60 * 1000 });
      return { message: "Admin login successful", admin, token };
    },
    logoutAdmin: async (_, __, context) => {
      const isProd = process.env.NODE_ENV === "production";
      context.res.clearCookie("AdminToken", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" });
      return "Admin logged out successfully";
    },
    registerBroker: async (_, args) => {
      const existing = await Broker.findOne({ email: args.email });
      if (existing) throw new Error("Broker already exists");
      const broker = await new Broker(args).save();
      return { message: "Broker registered successfully.", broker };
    },
    loginBroker: async (_, { email, password }, context) => {
      const broker = await Broker.findOne({ email });
      if (!broker || !(await broker.comparePassword(password))) throw new Error("Invalid credentials");
      const token = broker.generateAccessToken();
      broker.lastLoginAt = new Date();
      await broker.save();
      const isProd = process.env.NODE_ENV === "production";
      context.res.cookie("BrokerToken", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/", maxAge: 24 * 60 * 60 * 1000 });
      return { message: "Broker login successful", broker, token };
    },
    logoutBroker: async (_, __, context) => {
      const isProd = process.env.NODE_ENV === "production";
      context.res.clearCookie("BrokerToken", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" });
      return "Broker logged out successfully";
    },
    updateBroker: async (_, { id, ...updates }) => await Broker.findByIdAndUpdate(id, { $set: updates }, { new: true }),
    deleteBroker: async (_, { id }) => {
      await Broker.findByIdAndDelete(id);
      await Property.updateMany({ assignedBrokers: id }, { $pull: { assignedBrokers: id } });
      await PropertyOwner.updateMany({ assignedBrokers: id }, { $pull: { assignedBrokers: id } });
      return "Broker deleted";
    },

    addBrokerClient: async (_, { clientData }, context) => {
      if (!context.user || context.user.role !== "BROKER") {
        throw new Error("Unauthorized: Only brokers can add clients.");
      }
      const brokerId = getBrokerIdFromCookie(context);
      const updatedBroker = await Broker.findByIdAndUpdate(
        brokerId,
        { $push: { myclients: clientData } },
        { new: true }
      );
      return updatedBroker;
    },
    updateBrokerClientStatus: async (_, { clientId, status }, context) => {
      if (!context.user || context.user.role !== "BROKER") {
        throw new Error("Unauthorized: Only brokers can update clients.");
      }
      const brokerId = getBrokerIdFromCookie(context);
      const updatedBroker = await Broker.findOneAndUpdate(
        { _id: brokerId, "myclients._id": clientId },
        { $set: { "myclients.$.status": status } },
        { new: true }
      );
      if (!updatedBroker) throw new Error("Client not found or unauthorized.");
      return updatedBroker;
    },
    deleteBrokerClient: async (_, { clientId }, context) => {
      if (!context.user || context.user.role !== "BROKER") {
        throw new Error("Unauthorized: Only brokers can delete clients.");
      }
      const brokerId = getBrokerIdFromCookie(context);
      const updatedBroker = await Broker.findByIdAndUpdate(
        brokerId,
        { $pull: { myclients: { _id: clientId } } },
        { new: true }
      );
      if (!updatedBroker) throw new Error("Broker not found or unauthorized.");
      return updatedBroker;
    },

    registerOwner: async (_, args) => {
      const existing = await PropertyOwner.findOne({ email: args.email });
      if (existing) throw new Error("Owner already exists");
      const owner = await new PropertyOwner(args).save();
      return { message: "Owner registered successfully", owner };
    },
    loginOwner: async (_, { email, password }, context) => {
      const owner = await PropertyOwner.findOne({ email });
      if (!owner || !(await owner.comparePassword(password))) throw new Error("Invalid credentials");
      const token = owner.generateAccessToken();
      owner.lastLoginAt = new Date();
      await owner.save();
      const isProd = process.env.NODE_ENV === "production";
      context.res.cookie("OwnerToken", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/", maxAge: 24 * 60 * 60 * 1000 });
      return { message: "Owner login successful", owner, token };
    },
    logoutOwner: async (_, __, context) => {
      const isProd = process.env.NODE_ENV === "production";
      context.res.clearCookie("OwnerToken", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" });
      return "Owner logged out successfully";
    },
    updateMyOwnerProfile: async (_, updates, context) => {
      if (!context.user || context.user.role !== "OWNER") throw new Error("Unauthorized");
      updates.verifyStatus = false; 
      return await PropertyOwner.findByIdAndUpdate(context.user.id, { $set: updates }, { new: true }).populate("assignedBrokers");
    },
    updateOwner: async (_, { id, ...updates }, context) => {
      if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized");
      return await PropertyOwner.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate("assignedBrokers");
    },
    deleteOwner: async (_, { id }, context) => {
      if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized");
      await PropertyOwner.findByIdAndDelete(id);
      return "Owner deleted";
    },
    
    // 🟢 UPDATED: CREATE PROPERTY (Strict separation of mapping vs creation)
    createProperty: async (_, args, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) {
        throw new Error("Unauthorized: Only Admins, Owners, and Brokers can create properties.");
      }

      if (context.user.role === "OWNER") {
        const ownerId = getOwnerIdFromCookie(context); 
        const ownerDoc = await PropertyOwner.findById(ownerId);
        if (!ownerDoc || !ownerDoc.verifyStatus) {
           throw new Error("Action Restricted: Your account must be verified by an admin before you can add properties.");
        }
        args.ownedby = ownerId;
      } 
      else if (context.user.role === "BROKER") {
        const brokerId = getBrokerIdFromCookie(context);
        // Mark that this broker created it, but do NOT push into assignedBrokers.
        args.addedByBroker = brokerId;
      }
      else if (context.user.role === "ADMIN" && !args.ownedby) {
        // Optional: Keep admin requirement to assign an owner upon creation, or let them skip it too.
        // Assuming we keep existing logic for admin.
      }

      const property = await new Property(args).save();
      return await property.populate(["ownedby", "assignedBrokers"]);
    },

    // 🟢 UPDATED: UPDATE PROPERTY (Check both Assigned and Creator)
    updateProperty: async (_, { id, ...updates }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) {
        throw new Error("Unauthorized: Only Admins, Owners, and Brokers can update properties.");
      }

      const existingProperty = await Property.findById(id);
      if (!existingProperty) throw new Error("Property not found");

      if (context.user.role === "OWNER") {
        const currentOwnerId = getOwnerIdFromCookie(context);
        if (!existingProperty.ownedby || existingProperty.ownedby.toString() !== currentOwnerId.toString()) {
          throw new Error("Unauthorized: You can only update your own properties.");
        }
        delete updates.ownedby; 
      }
      else if (context.user.role === "BROKER") {
        const currentBrokerId = getBrokerIdFromCookie(context);
        
        const isAssigned = existingProperty.assignedBrokers.some(b => b.toString() === currentBrokerId.toString());
        const isCreator = existingProperty.addedByBroker?.toString() === currentBrokerId.toString();

        if (!isAssigned && !isCreator) {
          throw new Error("Unauthorized: You can only update properties assigned to you or created by you.");
        }
        delete updates.ownedby; 
      }

      const property = await Property.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate(["ownedby", "assignedBrokers"]);
      return property;
    },

    // 🟢 UPDATED: DELETE PROPERTY (Check both Assigned and Creator)
    deleteProperty: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) {
        throw new Error("Unauthorized: Only Admins, Owners, and Brokers can delete properties.");
      }

      const existingProperty = await Property.findById(id);
      if (!existingProperty) throw new Error("Property not found");

      if (context.user.role === "OWNER") {
        const currentOwnerId = getOwnerIdFromCookie(context);
        if (!existingProperty.ownedby || existingProperty.ownedby.toString() !== currentOwnerId.toString()) {
          throw new Error("Unauthorized: You can only delete your own properties.");
        }
      }
      else if (context.user.role === "BROKER") {
        const currentBrokerId = getBrokerIdFromCookie(context);
        
        const isAssigned = existingProperty.assignedBrokers.some(b => b.toString() === currentBrokerId.toString());
        const isCreator = existingProperty.addedByBroker?.toString() === currentBrokerId.toString();

        if (!isAssigned && !isCreator) {
          throw new Error("Unauthorized: You can only delete properties assigned to you or created by you.");
        }
      }

      await Property.findByIdAndDelete(id);
      return "Property deleted successfully";
    }
  }
};