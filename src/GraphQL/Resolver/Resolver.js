import jwt from "jsonwebtoken";
import Broker from "../../Models/Global/Broker.js";
import PropertyOwner from "../../Models/Global/Owner.js";
import Property from "../../Models/Global/Property.js";
import Admin from "../../Models/Global/User.js";
import Tenant from "../../Models/Global/Tenants.js";
import Lease from "../../Models/Global/Lease.js";
import Invoice from "../../Models/Global/Invoice.js";
import Payment from "../../Models/Global/Payment.js";

const getOwnerIdFromCookie = (context) => {
  const token = context.req?.cookies?.OwnerToken;
  if (!token) throw new Error("Unauthorized: No token found in cookies.");
  try { return jwt.verify(token, process.env.JWT_SECRET).id || jwt.verify(token, process.env.JWT_SECRET)._id; } 
  catch (err) { throw new Error("Unauthorized: Invalid or expired token."); }
};

const getBrokerIdFromCookie = (context) => {
  const token = context.req?.cookies?.BrokerToken;
  if (!token) throw new Error("Unauthorized: No token found in cookies.");
  try { return jwt.verify(token, process.env.JWT_SECRET).id || jwt.verify(token, process.env.JWT_SECRET)._id; } 
  catch (err) { throw new Error("Unauthorized: Invalid or expired token."); }
};

const getFY = (dateString) => {
  const d = new Date(dateString);
  const m = d.getMonth(); const y = d.getFullYear();
  return m < 3 ? `${y - 1}-${y}` : `${y}-${y + 1}`;
};

export const resolvers = {
  Query: {
    getBrokers: async (_, __, context) => { if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized"); return await Broker.find().sort({ createdAt: -1 }); },
    getBrokerById: async (_, { id }, context) => { if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized"); return await Broker.findById(id); },
    getMyBrokerProfile: async (_, __, context) => { if (!context.user || context.user.role !== "BROKER") throw new Error("Unauthorized"); return await Broker.findById(context.user.id); },
    getOwners: async (_, __, context) => { if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized"); return await PropertyOwner.find().sort({ createdAt: -1 }).populate("assignedBrokers"); },
    getMyOwnerProfile: async (_, __, context) => { if (!context.user || context.user.role !== "OWNER") throw new Error("Unauthorized"); return await PropertyOwner.findById(context.user.id); },
    getOwnerById: async (_, { id }, context) => { if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized"); return await PropertyOwner.findById(id).populate("assignedBrokers"); },
    getProperties: async (_, __, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      let filter = {};
      if (context.user.role === "OWNER") filter.ownedby = getOwnerIdFromCookie(context); 
      else if (context.user.role === "BROKER") filter.addedByBroker = getBrokerIdFromCookie(context); 
      return await Property.find(filter).sort({ createdAt: -1 }).populate("ownedby").populate("assignedBrokers").populate("addedByBroker"); 
    },
    getPropertyById: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      const property = await Property.findById(id).populate("ownedby").populate("assignedBrokers").populate("addedByBroker"); 
      if (!property) throw new Error("Property not found");
      return property;
    },
    getMyAssignedProperties: async (_, __, context) => {
      if (!context.user || context.user.role !== "BROKER") throw new Error("Unauthorized Broker.");
      const broker = await Broker.findById(context.user.id);
      if (!broker) throw new Error("Broker not found.");
      const properties = await Property.find({ assignedBrokers: broker._id }).populate("ownedby").populate("addedByBroker"); 
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
      if (!isPremium) return brokers.map(b => ({ _id: b._id, name: b.name, businessType: b.businessType || "Not Specified", profilepic: b.profilepic }));
      return brokers; 
    },

    getLeases: async (_, __, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      return await Lease.find({ status: "ACTIVE" }).sort({ createdAt: -1 }).populate("tenant").populate("property");
    },
    getLeaseById: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      return await Lease.findById(id).populate("tenant").populate("property");
    },
    getTenants: async (_, __, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      return await Tenant.find().sort({ createdAt: -1 });
    },
    getInvoicesByTenant: async (_, { tenantId }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      return await Invoice.find({ tenant: tenantId }).sort({ invoiceDate: -1 });
    },
    getPaymentsByInvoice: async (_, { invoiceId }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      return await Payment.find({ invoice: invoiceId }).sort({ paymentDate: -1 });
    },
    getMyInvoices: async (_, __, context) => {
      if (!context.user || context.user.role !== "OWNER") throw new Error("Unauthorized");
      
      // 1. Find all properties owned by this user
      const properties = await Property.find({ ownedby: context.user.id });
      const propertyIds = properties.map(p => p._id);
      
      // 2. Fetch all invoices linked to those properties
      return await Invoice.find({ property: { $in: propertyIds } })
        .sort({ invoiceDate: -1 })
        .populate('tenant')
        .populate('property');
    },
  },

  Mutation: {
    registerAdmin: async (_, args) => { const existing = await Admin.findOne({ email: args.email }); if (existing) throw new Error("Admin already exists"); const admin = await new Admin(args).save(); return { message: "Admin registered successfully.", admin }; },
    loginAdmin: async (_, { email, password }, context) => { const admin = await Admin.findOne({ email }); if (!admin || !(await admin.comparePassword(password))) throw new Error("Invalid credentials"); const token = admin.generateAccessToken(); admin.lastLoginAt = new Date(); await admin.save(); const isProd = process.env.NODE_ENV === "production"; context.res.cookie("AdminToken", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/", maxAge: 24 * 60 * 60 * 1000 }); return { message: "Admin login successful", admin, token }; },
    logoutAdmin: async (_, __, context) => { const isProd = process.env.NODE_ENV === "production"; context.res.clearCookie("AdminToken", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" }); return "Admin logged out successfully"; },
    
    registerBroker: async (_, args) => { const existing = await Broker.findOne({ email: args.email }); if (existing) throw new Error("Broker already exists"); const broker = await new Broker(args).save(); return { message: "Broker registered successfully.", broker }; },
    loginBroker: async (_, { email, password }, context) => { const broker = await Broker.findOne({ email }); if (!broker || !(await broker.comparePassword(password))) throw new Error("Invalid credentials"); const token = broker.generateAccessToken(); broker.lastLoginAt = new Date(); await broker.save(); const isProd = process.env.NODE_ENV === "production"; context.res.cookie("BrokerToken", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/", maxAge: 24 * 60 * 60 * 1000 }); return { message: "Broker login successful", broker, token }; },
    logoutBroker: async (_, __, context) => { const isProd = process.env.NODE_ENV === "production"; context.res.clearCookie("BrokerToken", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" }); return "Broker logged out successfully"; },
    updateBroker: async (_, { id, ...updates }) => await Broker.findByIdAndUpdate(id, { $set: updates }, { new: true }),
    deleteBroker: async (_, { id }) => { await Broker.findByIdAndDelete(id); await Property.updateMany({ assignedBrokers: id }, { $pull: { assignedBrokers: id } }); await PropertyOwner.updateMany({ assignedBrokers: id }, { $pull: { assignedBrokers: id } }); return "Broker deleted"; },
    
    addBrokerClient: async (_, { clientData }, context) => { if (!context.user || context.user.role !== "BROKER") throw new Error("Unauthorized"); const brokerId = getBrokerIdFromCookie(context); return await Broker.findByIdAndUpdate(brokerId, { $push: { myclients: clientData } }, { new: true }); },
    updateBrokerClientStatus: async (_, { clientId, status }, context) => { if (!context.user || context.user.role !== "BROKER") throw new Error("Unauthorized"); const brokerId = getBrokerIdFromCookie(context); return await Broker.findOneAndUpdate({ _id: brokerId, "myclients._id": clientId }, { $set: { "myclients.$.status": status } }, { new: true }); },
    deleteBrokerClient: async (_, { clientId }, context) => { if (!context.user || context.user.role !== "BROKER") throw new Error("Unauthorized"); const brokerId = getBrokerIdFromCookie(context); return await Broker.findByIdAndUpdate(brokerId, { $pull: { myclients: { _id: clientId } } }, { new: true }); },
    
    registerOwner: async (_, args) => { const existing = await PropertyOwner.findOne({ email: args.email }); if (existing) throw new Error("Owner already exists"); const owner = await new PropertyOwner(args).save(); return { message: "Owner registered successfully", owner }; },
    loginOwner: async (_, { email, password }, context) => { const owner = await PropertyOwner.findOne({ email }); if (!owner || !(await owner.comparePassword(password))) throw new Error("Invalid credentials"); const token = owner.generateAccessToken(); owner.lastLoginAt = new Date(); await owner.save(); const isProd = process.env.NODE_ENV === "production"; context.res.cookie("OwnerToken", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/", maxAge: 24 * 60 * 60 * 1000 }); return { message: "Owner login successful", owner, token }; },
    logoutOwner: async (_, __, context) => { const isProd = process.env.NODE_ENV === "production"; context.res.clearCookie("OwnerToken", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" }); return "Owner logged out successfully"; },
    updateMyOwnerProfile: async (_, updates, context) => { if (!context.user || context.user.role !== "OWNER") throw new Error("Unauthorized"); updates.verifyStatus = false; return await PropertyOwner.findByIdAndUpdate(context.user.id, { $set: updates }, { new: true }).populate("assignedBrokers"); },
    updateOwner: async (_, { id, ...updates }, context) => { if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized"); return await PropertyOwner.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate("assignedBrokers"); },
    deleteOwner: async (_, { id }, context) => { if (!context.user || context.user.role !== "ADMIN") throw new Error("Unauthorized"); await PropertyOwner.findByIdAndDelete(id); return "Owner deleted"; },

    createProperty: async (_, args, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      if (context.user.role === "OWNER") {
        const ownerId = getOwnerIdFromCookie(context); const ownerDoc = await PropertyOwner.findById(ownerId);
        if (!ownerDoc || !ownerDoc.verifyStatus) throw new Error("Action Restricted: Account pending admin verification.");
        args.ownedby = ownerId;
      } else if (context.user.role === "BROKER") { args.addedByBroker = getBrokerIdFromCookie(context); }
      const property = await new Property(args).save(); return await property.populate(["ownedby", "assignedBrokers", "addedByBroker"]);
    },
    updateProperty: async (_, { id, ...updates }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      const existingProperty = await Property.findById(id); if (!existingProperty) throw new Error("Property not found");
      if (context.user.role === "OWNER") {
        const currentOwnerId = getOwnerIdFromCookie(context);
        if (!existingProperty.ownedby || existingProperty.ownedby.toString() !== currentOwnerId.toString()) throw new Error("Unauthorized");
        delete updates.ownedby; 
      } else if (context.user.role === "BROKER") {
        const currentBrokerId = getBrokerIdFromCookie(context);
        const isAssigned = existingProperty.assignedBrokers.some(b => b.toString() === currentBrokerId.toString());
        const isCreator = existingProperty.addedByBroker?.toString() === currentBrokerId.toString();
        if (!isAssigned && !isCreator) throw new Error("Unauthorized");
        delete updates.ownedby; 
      }
      return await Property.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate(["ownedby", "assignedBrokers", "addedByBroker"]);
    },
    deleteProperty: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      const existingProperty = await Property.findById(id); if (!existingProperty) throw new Error("Property not found");
      await Property.findByIdAndDelete(id); return "Property deleted successfully";
    },

    // 🟢 TENANT CRUD
    createTenant: async (_, { input }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized.");
      return await new Tenant({ ...input }).save();
    },
    updateTenant: async (_, { id, input }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized.");
      return await Tenant.findByIdAndUpdate(id, { $set: input }, { new: true });
    },
    deleteTenant: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized.");
      await Tenant.findByIdAndDelete(id);
      await Lease.deleteMany({ tenant: id }); // Clean up associated leases
      return "Tenant Profile Deleted Successfully";
    },

    // 🟢 LEASE CRUD
    createLease: async (_, { input }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized.");
      const property = await Property.findById(input.propertyId);
      if (!property) throw new Error("Property not found.");
      if (property.activeLease) throw new Error("This property is already actively rented!");

      const newLease = await new Lease({ ...input, status: 'ACTIVE' }).save();
      property.activeLease = newLease._id;
      await property.save();
      return newLease;
    },
    updateLease: async (_, { id, input }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized.");
      return await Lease.findByIdAndUpdate(id, { $set: input }, { new: true });
    },
    createTenantWithLease: async (_, { input }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized.");

      const property = await Property.findById(input.propertyId);
      if (!property) throw new Error("Property not found.");
      if (property.activeLease) throw new Error("This property is already actively rented!");

      const newTenant = await new Tenant({
        name: input.name, email: input.email, callNumber: input.callNumber, whatsappNumber: input.whatsappNumber,
        permanentAddress: input.permanentAddress, adharNumber: input.adharNumber, adharCardUrl: input.adharCardUrl,
        panNumber: input.panNumber, panCardUrl: input.panCardUrl, bankDetails: input.bankDetails
      }).save();

      const newLease = await new Lease({
        tenant: newTenant._id, property: property._id, status: 'ACTIVE',
        tenurestart: input.tenurestart, tenureend: input.tenureend, stepuptenure: input.stepuptenure, gst: input.gst,
        agreedRent: input.agreedRent, agreedMaintenance: input.agreedMaintenance, depositAmount: input.depositAmount, rentAgreementUrl: input.rentAgreementUrl
      }).save();

      property.activeLease = newLease._id;
      await property.save();
      return "Tenant Profile & Lease created successfully!";
    },
    deleteLease: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) throw new Error("Unauthorized");
      const lease = await Lease.findById(id);
      if (!lease) throw new Error("Lease not found");

      await Property.findByIdAndUpdate(lease.property, { $set: { activeLease: null } });
      lease.status = "TERMINATED";
      await lease.save();
      return "Lease terminated and Property is now available.";
    },

    // 🟢 INVOICE GENERATOR
    createInvoice: async (_, args, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const invoiceDate = new Date();
      const fy = getFY(invoiceDate);
      const invoiceNo = `INV-${args.billType.substring(0,3)}-${fy.substring(2,7)}/${Math.floor(1000 + Math.random() * 9000)}`;

      const newInvoice = await new Invoice({
        tenant: args.tenantId, property: args.propertyId, billType: args.billType, billingMonth: args.billingMonth,
        baseAmount: args.baseAmount, cgst: args.cgst, sgst: args.sgst, totalAmount: args.totalAmount,
        amountPaid: 0, amountDue: args.totalAmount, invoiceNo, financialYear: fy, invoiceDate,
        electricDetails: { units: args.electricUnits || 0, rate: args.electricRate || 0 }, status: "UNPAID"
      }).save();

      return newInvoice._id.toString(); 
    },
    updateInvoiceStatus: async (_, { id, status }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      return await Invoice.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    },

    // 🟢 PAYMENT ENGINE (Math fixed for legacy invoices)
    recordPayment: async (_, { invoiceId, amount, paymentMethod, transactionId, notes }, context) => {
      if (!context.user) throw new Error("Unauthorized");

      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) throw new Error("Invoice not found.");

      // Safely handle missing amountDue fields on legacy records
      let currentDue = invoice.amountDue != null ? invoice.amountDue : invoice.totalAmount;
      let currentPaid = invoice.amountPaid != null ? invoice.amountPaid : 0;

      if (amount > currentDue) throw new Error(`Amount exceeds due balance. Only ₹${currentDue} is due.`);

      const payment = await new Payment({
        invoice: invoice._id, tenant: invoice.tenant, property: invoice.property,
        amount, paymentMethod, transactionId: transactionId || "N/A", notes
      }).save();

      invoice.amountPaid = currentPaid + amount;
      invoice.amountDue = currentDue - amount;
      invoice.status = invoice.amountDue <= 0 ? "PAID" : "PARTIAL";
      await invoice.save();

      return payment;
    }
  }
};