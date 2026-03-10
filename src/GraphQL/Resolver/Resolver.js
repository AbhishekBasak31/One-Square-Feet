import jwt from "jsonwebtoken";
import Broker from "../../Models/Global/Broker.js";
import PropertyOwner from "../../Models/Global/Owner.js";
import Property from "../../Models/Global/Property.js";
import Admin from "../../Models/Global/User.js";

// --- 🟢 HELPER FUNCTION ---
const getOwnerIdFromCookie = (context) => {
  const token = context.req?.cookies?.OwnerToken;
  if (!token) throw new Error("Unauthorized: No token found in cookies.");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded._id; // Safely gets the ID
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
      if (!context.user || !["ADMIN", "OWNER"].includes(context.user.role)) {
        throw new Error("Unauthorized");
      }

      let filter = {};
      if (context.user.role === "OWNER") {
        filter.ownedby = getOwnerIdFromCookie(context);
      }

      return await Property.find(filter).sort({ createdAt: -1 }).populate("ownedby").populate("assignedBrokers");
    },
    getPropertyById: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER", "BROKER"].includes(context.user.role)) {
        throw new Error("Unauthorized: You do not have permission to view this.");
      }

      const property = await Property.findById(id).populate("ownedby").populate("assignedBrokers");
      if (!property) throw new Error("Property not found");

      if (context.user.role === "OWNER") {
        const currentOwnerId = getOwnerIdFromCookie(context);
        
        // 🟢 FIX: Prevent crash if the property has no owner (null check)
        if (!property.ownedby) {
           throw new Error("Data Error: This property has no owner assigned.");
        }
        
        const propertyOwnerId = property.ownedby._id ? property.ownedby._id.toString() : property.ownedby.toString();
        
        if (propertyOwnerId !== currentOwnerId.toString()) {
           throw new Error("Unauthorized: You can only view your own property details.");
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
createProperty: async (_, args, context) => {
      if (!context.user || !["ADMIN", "OWNER"].includes(context.user.role)) {
        throw new Error("Unauthorized: Only Admins and Owners can create properties.");
      }

      if (context.user.role === "OWNER") {
        const ownerId = getOwnerIdFromCookie(context); 
        
        // 🟢 NEW INTEGRITY CHECK: Ensure Owner is Verified before allowing creation
        const ownerDoc = await PropertyOwner.findById(ownerId);
        if (!ownerDoc || !ownerDoc.verifyStatus) {
           throw new Error("Action Restricted: Your account must be verified by an admin before you can add properties.");
        }
        
        args.ownedby = ownerId;
      } 
      else if (context.user.role === "ADMIN" && !args.ownedby) {
        throw new Error("Admins must select a property owner.");
      }

      const property = await new Property(args).save();
      return await property.populate(["ownedby", "assignedBrokers"]);
    },

    updateProperty: async (_, { id, ...updates }, context) => {
      if (!context.user || !["ADMIN", "OWNER"].includes(context.user.role)) {
        throw new Error("Unauthorized: Only Admins and Owners can update properties.");
      }

      if (context.user.role === "OWNER") {
        const currentOwnerId = getOwnerIdFromCookie(context);
        const existingProperty = await Property.findById(id);
        
        if (!existingProperty) throw new Error("Property not found");
        
        // 🟢 FIX: Check if ownedby is null (Ghost property check)
        if (!existingProperty.ownedby || existingProperty.ownedby.toString() !== currentOwnerId.toString()) {
          throw new Error("Unauthorized: You can only update your own properties.");
        }
        delete updates.ownedby; 
      }

      const property = await Property.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate(["ownedby", "assignedBrokers"]);
      if (!property) throw new Error("Property not found");
      return property;
    },

    deleteProperty: async (_, { id }, context) => {
      if (!context.user || !["ADMIN", "OWNER"].includes(context.user.role)) {
        throw new Error("Unauthorized: Only Admins and Owners can delete properties.");
      }

      if (context.user.role === "OWNER") {
        const currentOwnerId = getOwnerIdFromCookie(context);
        const existingProperty = await Property.findById(id);
        
        if (!existingProperty) throw new Error("Property not found");
        
        // 🟢 FIX: Check if ownedby is null (Ghost property check)
        if (!existingProperty.ownedby || existingProperty.ownedby.toString() !== currentOwnerId.toString()) {
          throw new Error("Unauthorized: You can only delete your own properties.");
        }
      }

      await Property.findByIdAndDelete(id);
      return "Property deleted successfully";
    }
  }
};
// import bcrypt from "bcrypt";
// import { HomeBanner } from "../../Models/HomePage/Banner.js";
// import { HomeAbout } from "../../Models/HomePage/About.js";
// import { HomeSpecialItems } from "../../Models/HomePage/SpecialItems.js";
// import { EventSec } from "../../Models/Global/EventSec.js";
// import { Event } from "../../Models/Global/Event.js";
// import { EventPartner } from "../../Models/Global/EventPartners.js";
// import { GallerySec } from "../../Models/Global/GallerySec.js";
// import { GalleryVedio } from "../../Models/Global/GalleryVideo.js";
// import { ResturantSpace } from "../../Models/HomePage/ResturantSpace.js";
// import { ReviewSection } from "../../Models/HomePage/ReviewSection.js";
// import { SocialMediamarketSec } from "../../Models/HomePage/SocialMediamarket.js";
// import { ContactDetails } from "../../Models/Global/ContactDetails.js";
// import { Footer } from "../../Models/Global/Footer.js";
// import { Social } from "../../Models/Global/Social.js";
// import { QuickLinks } from "../../Models/Global/QuickLinks.js";
// import { Contact } from "../../Models/Global/Contact.js";
// import { Booking } from "../../Models/Global/Bookings.js";
// import { User } from "../../Models/Global/User.js";
// // ADDED THE OWNER IMPORT HERE
// import { Owner } from "../../Models/HomePage/OwnerSpeech.js"; 

// const isProd = process.env.NODE_ENV === "production";

// export const resolvers = {
//   Query: {
//     getHomeBanners: async () => await HomeBanner.find(),
//     getHomeBannerById: async (_, { id }) => await HomeBanner.findById(id),
//     getHomeAbouts: async () => await HomeAbout.find(),
//     getHomeAboutById: async (_, { id }) => await HomeAbout.findById(id),
//     getHomeSpecialItems: async () => await HomeSpecialItems.find(),
//     getHomeSpecialItemById: async (_, { id }) => await HomeSpecialItems.findById(id),
    
//     getEventSecs: async () => await EventSec.find(),
//     getEventSecById: async (_, { id }) => await EventSec.findById(id),
//     getEvents: async () => await Event.find(),
//     getEventById: async (_, { id }) => await Event.findById(id),
//     getEventPartners: async () => await EventPartner.find(),
//     getEventPartnerById: async (_, { id }) => await EventPartner.findById(id),
    
//     getGallerySecs: async () => await GallerySec.find(),
//     getGallerySecById: async (_, { id }) => await GallerySec.findById(id),
//     getGalleryVedios: async () => await GalleryVedio.find(),
//     getGalleryVedioById: async (_, { id }) => await GalleryVedio.findById(id),
    
//     getResturantSpaces: async () => await ResturantSpace.find(),
//     getResturantSpaceById: async (_, { id }) => await ResturantSpace.findById(id),
//     getReviewSections: async () => await ReviewSection.find(),
//     getReviewSectionById: async (_, { id }) => await ReviewSection.findById(id),
    
//     getSocialMediamarketSecs: async () => await SocialMediamarketSec.find(),
//     getSocialMediamarketSecById: async (_, { id }) => await SocialMediamarketSec.findById(id),
//     getContactDetails: async () => await ContactDetails.find(),
//     getContactDetailById: async (_, { id }) => await ContactDetails.findById(id),
    
//     getFooters: async () => await Footer.find(),
//     getFooterById: async (_, { id }) => await Footer.findById(id),
//     getSocials: async () => await Social.find(),
//     getSocialById: async (_, { id }) => await Social.findById(id),
//     getQuickLinks: async () => await QuickLinks.find(),
//     getQuickLinkById: async (_, { id }) => await QuickLinks.findById(id),

//     getContacts: async () => await Contact.find().sort({ createdAt: -1 }),
//     getContactById: async (_, { id }) => await Contact.findById(id),
//     getBookings: async () => await Booking.find().sort({ createdAt: -1 }),
//     getBookingById: async (_, { id }) => await Booking.findById(id),

//     // --- OWNER QUERIES ---
//     getOwner: async () => await Owner.find(),
//     getOwnerById: async (_, { id }) => await Owner.findById(id),

//     getMe: async (_, __, context) => {
//       if (!context.user) throw new Error("Unauthorized");
//       return await User.findById(context.user.id).select("-password");
//     },
//     getUsers: async () => await User.find().select("-password"),
//   },

//   Mutation: {
//     createHomeBanner: async (_, args) => await new HomeBanner(args).save(),
//     updateHomeBanner: async (_, { id, ...updates }) => await HomeBanner.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteHomeBanner: async (_, { id }) => { await HomeBanner.findByIdAndDelete(id); return "Deleted"; },

//     createHomeAbout: async (_, args) => await new HomeAbout(args).save(),
//     updateHomeAbout: async (_, { id, ...updates }) => await HomeAbout.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteHomeAbout: async (_, { id }) => { await HomeAbout.findByIdAndDelete(id); return "Deleted"; },

//     createHomeSpecialItems: async (_, args) => await new HomeSpecialItems(args).save(),
//     updateHomeSpecialItems: async (_, { id, ...updates }) => await HomeSpecialItems.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteHomeSpecialItems: async (_, { id }) => { await HomeSpecialItems.findByIdAndDelete(id); return "Deleted"; },

//     createEventSec: async (_, args) => await new EventSec(args).save(),
//     updateEventSec: async (_, { id, ...updates }) => await EventSec.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteEventSec: async (_, { id }) => { await EventSec.findByIdAndDelete(id); return "Deleted"; },

//     createEvent: async (_, args) => {
//       const newEvent = new Event(args);
//       return await newEvent.save();
//     },
//     updateEvent: async (_, { id, ...updates }) => {
//       return await Event.findByIdAndUpdate(id, { $set: updates }, { new: true });
//     },
//     deleteEvent: async (_, { id }) => { 
//       await Event.findByIdAndDelete(id); 
//       return "Deleted"; 
//     },

//     createEventPartner: async (_, args) => await new EventPartner(args).save(),
//     updateEventPartner: async (_, { id, ...updates }) => await EventPartner.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteEventPartner: async (_, { id }) => { await EventPartner.findByIdAndDelete(id); return "Deleted"; },

//     createGallerySec: async (_, args) => await new GallerySec(args).save(),
//     updateGallerySec: async (_, { id, ...updates }) => await GallerySec.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteGallerySec: async (_, { id }) => { await GallerySec.findByIdAndDelete(id); return "Deleted"; },

//     createGalleryVedio: async (_, args) => await new GalleryVedio(args).save(),
//     updateGalleryVedio: async (_, { id, ...updates }) => await GalleryVedio.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteGalleryVedio: async (_, { id }) => { await GalleryVedio.findByIdAndDelete(id); return "Deleted"; },

//     createResturantSpace: async (_, args) => await new ResturantSpace(args).save(),
//     updateResturantSpace: async (_, { id, ...updates }) => await ResturantSpace.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteResturantSpace: async (_, { id }) => { await ResturantSpace.findByIdAndDelete(id); return "Deleted"; },

//     createReviewSection: async (_, args) => await new ReviewSection(args).save(),
//     updateReviewSection: async (_, { id, ...updates }) => await ReviewSection.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteReviewSection: async (_, { id }) => { await ReviewSection.findByIdAndDelete(id); return "Deleted"; },

//     createSocialMediamarketSec: async (_, args) => await new SocialMediamarketSec(args).save(),
//     updateSocialMediamarketSec: async (_, { id, ...updates }) => await SocialMediamarketSec.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteSocialMediamarketSec: async (_, { id }) => { await SocialMediamarketSec.findByIdAndDelete(id); return "Deleted"; },

//     createContactDetails: async (_, args) => await new ContactDetails(args).save(),
//     updateContactDetails: async (_, { id, ...updates }) => await ContactDetails.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteContactDetails: async (_, { id }) => { await ContactDetails.findByIdAndDelete(id); return "Deleted"; },

//     createFooter: async (_, args) => await new Footer(args).save(),
//     updateFooter: async (_, { id, ...updates }) => await Footer.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteFooter: async (_, { id }) => { await Footer.findByIdAndDelete(id); return "Deleted"; },

//     createSocial: async (_, args) => await new Social(args).save(),
//     updateSocial: async (_, { id, ...updates }) => await Social.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteSocial: async (_, { id }) => { await Social.findByIdAndDelete(id); return "Deleted"; },

//     createQuickLink: async (_, args) => await new QuickLinks(args).save(),
//     updateQuickLink: async (_, { id, ...updates }) => await QuickLinks.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteQuickLink: async (_, { id }) => { await QuickLinks.findByIdAndDelete(id); return "Deleted"; },

//     createContact: async (_, args) => await new Contact(args).save(),
//     updateContact: async (_, { id, ...updates }) => await Contact.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteContact: async (_, { id }) => { await Contact.findByIdAndDelete(id); return "Deleted"; },

//     createBooking: async (_, args) => await new Booking(args).save(),
//     updateBooking: async (_, { id, ...updates }) => await Booking.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteBooking: async (_, { id }) => { await Booking.findByIdAndDelete(id); return "Deleted"; },

//     // --- OWNER MUTATIONS ---
//     createOwner: async (_, args) => await new Owner(args).save(),
//     updateOwner: async (_, { id, ...updates }) => await Owner.findByIdAndUpdate(id, { $set: updates }, { new: true }),
//     deleteOwner: async (_, { id }) => { await Owner.findByIdAndDelete(id); return "Deleted"; },

//     registerUser: async (_, { email, password }) => {
//       const existing = await User.findOne({ email });
//       if (existing) throw new Error("User already exists");
//       const user = new User({ email, password });
//       await user.save();
//       return { message: "User registered successfully", user };
//     },

//     loginUser: async (_, { email, password }, context) => {
//       const user = await User.findOne({ email });
//       if (!user) throw new Error("Invalid credentials");
//       const isMatch = await user.comparePassword(password);
//       if (!isMatch) throw new Error("Invalid credentials");

//       const token = user.generateAccessToken();
//       user.lastLoginAt = new Date();
//       await user.save();
//       const isProd = process.env.NODE_ENV === "production";
//       context.res.cookie("AccessToken", token, {
//         httpOnly: true,
//         secure: isProd,
//         sameSite: isProd ? "none" : "lax",
//         path: "/",
//         maxAge: 24 * 60 * 60 * 1000,
//       });

//       return { message: "Login successful", user, token };
//     },

//     logoutUser: async (_, __, context) => {
//         const isProd = process.env.NODE_ENV === "production";
//       context.res.clearCookie("AccessToken", {
//         httpOnly: true,
//         secure: isProd,
//         sameSite: isProd ? "none" : "lax",
//         path: "/", 
//       });
//       return "User logged out successfully";
//     },

//     updateSelf: async (_, { email, password }, context) => {
//       if (!context.user) throw new Error("Unauthorized");
//       const user = await User.findById(context.user.id);
//       if (!user) throw new Error("User not found");

//       const updates = {};
//       if (email) updates.email = email;
//       if (password) {
//         const isSame = await user.comparePassword(password);
//         if (isSame) throw new Error("New password cannot be the same as old");
//         const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
//         updates.password = await bcrypt.hash(password, saltRounds);
//       }

//       return await User.findByIdAndUpdate(context.user.id, { $set: updates }, { new: true }).select("-password");
//     },

//     deleteUser: async (_, { id }) => {
//       await User.findByIdAndDelete(id);
//       return "User deleted";
//     }
//   },

//   EventSec: {
//     events: async () => await Event.find({ isActive: true }),
//     eventPartners: async () => await EventPartner.find()
//   },
//   GallerySec: {
//     videos: async () => await GalleryVedio.find()
//   },
//   Footer: {
//     socials: async (parent) => await Social.find({ _id: { $in: parent.socials } }),
//     quickLinks: async (parent) => await QuickLinks.find({ _id: { $in: parent.quickLinks } })
//   }
// };

  