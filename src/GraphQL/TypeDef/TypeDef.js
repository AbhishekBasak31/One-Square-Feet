export const typeDefs = `#graphql
  type Admin { _id: ID! email: String! createdAt: String lastLoginAt: String }
  
  type Broker { _id: ID! name: String email: String phone: String profilepic: String rera: String pancard: String aadhar: String gst: String businessType: String businessregistration: String localtradelicense: String brokerageagreement: String isVerified: Boolean planType: String planExpiryDate: String createdAt: String lastLoginAt: String }
  
  type PropertyOwner { _id: ID! name: String email: String phone: String address: String planType: String assignedBrokers: [Broker] planExpiryDate: String verifyStatus: Boolean pancard: String aadhar: String profilephoto: String createdAt: String lastLoginAt: String }
  
  type AdminAuthResponse { message: String!, admin: Admin, token: String }
  type BrokerAuthResponse { message: String!, broker: Broker, token: String }
  type OwnerAuthResponse { message: String!, owner: PropertyOwner, token: String }
  
  type PropertyAddress { houseno: String street: String city: String state: String pincode: String }
  type VisibilitySettings { showAddressToFreeBrokers: Boolean showOwnerDetailsToFreeBrokers: Boolean showReraToFreeBrokers: Boolean }
  
  type Property { _id: ID! type: String name: String img: [String] address: PropertyAddress rera: String cc: Boolean mutation: Boolean furnished: Boolean carpetarea: String superbuilderarea: String landarea: String verified: Boolean noofbedrooms: String noofbathrooms: String noofhalls: String noofkitchens: String noofdrawingrooms: String noofbalcony: String noofparking: String description: String propertypapers:[String] amenities: [String] ownedby: PropertyOwner assignedBrokers: [Broker] visibilitySettings: VisibilitySettings createdAt: String updatedAt: String }
  
  input AddressInput { houseno: String! street: String! city: String! state: String! pincode: String! }
  input VisibilitySettingsInput { showAddressToFreeBrokers: Boolean showOwnerDetailsToFreeBrokers: Boolean showReraToFreeBrokers: Boolean }
  
  type Query {
    getBrokers: [Broker]
    getBrokerById(id: ID!): Broker
    getMyBrokerProfile: Broker
    getOwners: [PropertyOwner]
    getOwnerById(id: ID!): PropertyOwner
    getMyOwnerProfile: PropertyOwner
    getProperties: [Property]
    getPropertyById(id: ID!): Property
    getMyAssignedProperties: [Property] 
    getMyAssignedBrokers: [Broker]
  }

  type Mutation {
    registerAdmin(email: String!, password: String!): AdminAuthResponse!
    loginAdmin(email: String!, password: String!): AdminAuthResponse!
    logoutAdmin: String!

    registerBroker(name: String!, email: String!, phone: String!, password: String!, profilepic: String!): BrokerAuthResponse!
    loginBroker(email: String!, password: String!): BrokerAuthResponse!
    logoutBroker: String!
    updateBroker(
      id: ID!, 
      name: String, 
      email: String, 
      phone: String, 
      profilepic: String, 
      rera: String, 
      pancard: String, 
      aadhar: String, 
      gst: String, 
      businessType: String, 
      businessregistration: String, 
      localtradelicense: String, 
      brokerageagreement: String, 
      isVerified: Boolean, 
      planType: String, 
      planExpiryDate: String
    ): Broker!
    deleteBroker(id: ID!): String!

    registerOwner(name: String!, email: String!, phone: String!, address: String!, password: String!): OwnerAuthResponse!
    loginOwner(email: String!, password: String!): OwnerAuthResponse!
    logoutOwner: String!
    updateMyOwnerProfile(
      name: String, 
      email: String, 
      phone: String, 
      address: String, 
      pancard: String, 
      aadhar: String, 
      profilephoto: String
    ): PropertyOwner!
    
    updateOwner(id: ID!, name: String, email: String, phone: String, address: String, planType: String, planExpiryDate: String, assignedBrokers: [ID], verifyStatus: Boolean, pancard: String, aadhar: String, profilephoto: String): PropertyOwner!
    deleteOwner(id: ID!): String!

    # 🟢 FIX: ownedby is now 'ID' instead of 'ID!'
    createProperty(
      type: String!, name: String!, img: [String]!, address: AddressInput!, rera: String!, 
      cc: Boolean!, mutation: Boolean!, furnished: Boolean!, carpetarea: String!, 
      superbuilderarea: String!, landarea: String!, verified: Boolean, noofbedrooms: String, 
      noofbathrooms: String, noofhalls: String, noofkitchens: String, noofdrawingrooms: String, 
      noofbalcony: String, noofparking: String, description: String!, propertypapers:[String], 
      amenities: [String]!, ownedby: ID, assignedBrokers: [ID], visibilitySettings: VisibilitySettingsInput
    ): Property!

    updateProperty(
      id: ID!, type: String, name: String, img: [String], address: AddressInput, rera: String, 
      cc: Boolean, mutation: Boolean, furnished: Boolean, carpetarea: String, 
      superbuilderarea: String, landarea: String, verified: Boolean, noofbedrooms: String, 
      noofbathrooms: String, noofhalls: String, noofkitchens: String, noofdrawingrooms: String, 
      noofbalcony: String, noofparking: String, description: String, propertypapers:[String], 
      amenities: [String], ownedby: ID, assignedBrokers: [ID], visibilitySettings: VisibilitySettingsInput
    ): Property!
    
    deleteProperty(id: ID!): String!
  }
`;

// export const typeDefs = `#graphql
//   # ==========================================
//   # 1. CORE DATA TYPES
//   # ==========================================
//   type HomeBanner { _id: ID!, Htext1: String!, Dtext1: String!, Htext2: String!, Dtext2: String!, Htext3: String!, Dtext3: String!, Banner1: String!, Banner1AltText: String!, Banner2: String!, Banner2AltText: String!, Banner3: String!, Banner3AltText: String! }
//   type HomeAbout { _id: ID!, Htext: String!, tab1Icon: String!, tab2Icon: String!, tab3Icon: String!, tab1Name: String!, tab2Name: String!, tab3Name: String!, tab1Desc: String!, tab1Bp1: String!, tab1Bp2: String!, tab1Bp3: String!, tab1img: String!, tab1imgAltText: String!, tab2Desc: String!, tab2Bp1: String!, tab2Bp2: String!, tab2Bp3: String!, tab2img: String!, tab2imgAltText: String!, tab3Desc: String!, tab3Bp1: String!, tab3Bp2: String!, tab3Bp3: String!, tab3img: String!, tab3imgAltText: String! }
//   type HomeSpecialItems { _id: ID!, Largetext: String!, CenterImage: String!, CenterImageName: String!, leftsidetextblockHtext: String!, leftsidetextblockDtext: String!, rightsidetextblockHtext: String!, rightsidetextblockDtext: String!, ProductGridHtext: String!, Product1Img: String!, product1ImgAlt: String!, Product1Name: String!, Product2Img: String!, product2ImgAlt: String!, Product2Name: String!, Product3Img: String!, product3ImgAlt: String!, Product3Name: String!, Product4Img: String!, product4ImgAlt: String!, Product4Name: String! }

//   type Event { 
//     _id: ID!
//     slug: String
//     img: String!
//     location: String!
//     title: String!
//     catagory: String!
//     date: String!
//     time: String!
//     description: String!
//     hostcontact: String!
//     hostname: String!
//     isActive: Boolean 
//   }
//   type EventPartner { _id: ID!, Img: String!, altText: String! }
//   type EventSec { _id: ID!, tag: String!, Htext: String!, EventPartnerhtext: String!, events: [Event], eventPartners: [EventPartner] }

//   type GalleryVedio { _id: ID!, Videourl: String!, altTag: String!, Htext: String!, isPopular: Boolean }
//   type GallerySec { _id: ID!, tag: String!, Htext: String!, videos: [GalleryVedio] }

//   type Space { _id: ID, Htext: String!, SpaceImg: String!, Dtext: String! }
//   type ResturantSpace { _id: ID!, Htext: String!, space: [Space] }

//   type Review { _id: ID, name: String!, rating: String!, comment: String!, avatar: String! }
//   type ReviewSection { _id: ID!, Htext: String!, Dtext: String!, reviews: [Review] }

//   type SocialMediamarketSec { _id: ID!, Htext: String!, Pagename: String!, PageLink: String!, cardImg1: String!, card1Name: String!, cardImg2: String!, card2Name: String!, cardImg3: String!, card3Name: String! }
//   type ContactDetails { _id: ID!, Htext: String, whour: String, email: String, phone: String, address: String, map: String }

//   type Social { _id: ID!, icon: String!, link: String! }
//   type QuickLink { _id: ID!, name: String!, link: String! }
  
//   type Footer { 
//     _id: ID!
//     logo: String!
//     logo2: String!    
//     dtext: String!
//     copyright: String!
//     socials: [Social]
//     quickLinks: [QuickLink]
//   }

//   type Contact { _id: ID!, name: String!, email: String!, phone: String!, message: String!, createdAt: String }
//   type Booking { _id: ID!, name: String, phone: String!, location: String, people: String, date: String, createdAt: String }
  
//   type User { _id: ID!, email: String!, createdAt: String, lastLoginAt: String }
//   type AuthResponse { message: String!, user: User, token: String }
 
//   type Owner { _id: ID!, Htext: String!, dtext: String!, img: String!, ownername: String!, Desig: String!, createdAt: String }

//   # ==========================================
//   # 2. INPUT TYPES
//   # ==========================================
//   input SpaceInput { Htext: String!, SpaceImg: String!, Dtext: String! }
//   input ReviewInput { name: String!, rating: String!, comment: String!, avatar: String! }

//   # ==========================================
//   # 3. QUERIES (Read Data)
//   # ==========================================
//   type Query {
//     getHomeBanners: [HomeBanner]
//     getHomeBannerById(id: ID!): HomeBanner
//     getHomeAbouts: [HomeAbout]
//     getHomeAboutById(id: ID!): HomeAbout
//     getHomeSpecialItems: [HomeSpecialItems]
//     getHomeSpecialItemById(id: ID!): HomeSpecialItems
    
//     getEventSecs: [EventSec]
//     getEventSecById(id: ID!): EventSec
//     getEvents: [Event]
//     getEventById(id: ID!): Event
//     getEventPartners: [EventPartner]
//     getEventPartnerById(id: ID!): EventPartner
    
//     getGallerySecs: [GallerySec]
//     getGallerySecById(id: ID!): GallerySec
//     getGalleryVedios: [GalleryVedio]
//     getGalleryVedioById(id: ID!): GalleryVedio
    
//     getResturantSpaces: [ResturantSpace]
//     getResturantSpaceById(id: ID!): ResturantSpace
//     getReviewSections: [ReviewSection]
//     getReviewSectionById(id: ID!): ReviewSection
    
//     getSocialMediamarketSecs: [SocialMediamarketSec]
//     getSocialMediamarketSecById(id: ID!): SocialMediamarketSec
//     getContactDetails: [ContactDetails]
//     getContactDetailById(id: ID!): ContactDetails
    
//     getFooters: [Footer]
//     getFooterById(id: ID!): Footer
//     getSocials: [Social]
//     getSocialById(id: ID!): Social
//     getQuickLinks: [QuickLink]
//     getQuickLinkById(id: ID!): QuickLink

//     getContacts: [Contact]
//     getContactById(id: ID!): Contact
//     getBookings: [Booking]
//     getBookingById(id: ID!): Booking

//     getMe: User
//     getUsers: [User]
//     getOwner: [Owner]
//     getOwnerById(id: ID!): Owner
//   }

//   # ==========================================
//   # 4. MUTATIONS (Create/Update/Delete)
//   # ==========================================
//   type Mutation {
//     createHomeBanner(Htext1: String!, Dtext1: String!, Htext2: String!, Dtext2: String!, Htext3: String!, Dtext3: String!, Banner1: String!, Banner1AltText: String!, Banner2: String!, Banner2AltText: String!, Banner3: String!, Banner3AltText: String!): HomeBanner!
//     updateHomeBanner(id: ID!, Htext1: String, Dtext1: String, Htext2: String, Dtext2: String, Htext3: String, Dtext3: String, Banner1: String, Banner1AltText: String, Banner2: String, Banner2AltText: String, Banner3: String, Banner3AltText: String): HomeBanner!
//     deleteHomeBanner(id: ID!): String!

//     createHomeAbout(Htext: String!, tab1Icon: String!, tab2Icon: String!, tab3Icon: String!, tab1Name: String!, tab2Name: String!, tab3Name: String!, tab1Desc: String!, tab1Bp1: String!, tab1Bp2: String!, tab1Bp3: String!, tab1img: String!, tab1imgAltText: String!, tab2Desc: String!, tab2Bp1: String!, tab2Bp2: String!, tab2Bp3: String!, tab2img: String!, tab2imgAltText: String!, tab3Desc: String!, tab3Bp1: String!, tab3Bp2: String!, tab3Bp3: String!, tab3img: String!, tab3imgAltText: String!): HomeAbout!
//     updateHomeAbout(id: ID!, Htext: String, tab1Icon: String, tab2Icon: String, tab3Icon: String, tab1Name: String, tab2Name: String, tab3Name: String, tab1Desc: String, tab1Bp1: String, tab1Bp2: String, tab1Bp3: String, tab1img: String, tab1imgAltText: String, tab2Desc: String, tab2Bp1: String, tab2Bp2: String, tab2Bp3: String, tab2img: String, tab2imgAltText: String, tab3Desc: String, tab3Bp1: String, tab3Bp2: String, tab3Bp3: String, tab3img: String, tab3imgAltText: String): HomeAbout!
//     deleteHomeAbout(id: ID!): String!

//     createHomeSpecialItems(Largetext: String!, CenterImage: String!, CenterImageName: String!, leftsidetextblockHtext: String!, leftsidetextblockDtext: String!, rightsidetextblockHtext: String!, rightsidetextblockDtext: String!, ProductGridHtext: String!, Product1Img: String!, product1ImgAlt: String!, Product1Name: String!, Product2Img: String!, product2ImgAlt: String!, Product2Name: String!, Product3Img: String!, product3ImgAlt: String!, Product3Name: String!, Product4Img: String!, product4ImgAlt: String!, Product4Name: String!): HomeSpecialItems!
//     updateHomeSpecialItems(id: ID!, Largetext: String, CenterImage: String, CenterImageName: String, leftsidetextblockHtext: String, leftsidetextblockDtext: String, rightsidetextblockHtext: String, rightsidetextblockDtext: String, ProductGridHtext: String, Product1Img: String, product1ImgAlt: String, Product1Name: String, Product2Img: String, product2ImgAlt: String, Product2Name: String, Product3Img: String, product3ImgAlt: String, Product3Name: String, Product4Img: String, product4ImgAlt: String, Product4Name: String): HomeSpecialItems!
//     deleteHomeSpecialItems(id: ID!): String!

//     createEventSec(tag: String!, Htext: String!, EventPartnerhtext: String!): EventSec!
//     updateEventSec(id: ID!, tag: String, Htext: String, EventPartnerhtext: String): EventSec!
//     deleteEventSec(id: ID!): String!

//     createEvent(img: String!, location: String!, title: String!, catagory: String!, date: String!, time: String!, description: String!, hostcontact: String!, hostname: String!, isActive: Boolean): Event!
//     updateEvent(id: ID!, img: String, location: String, title: String, catagory: String, date: String, time: String, description: String, hostcontact: String, hostname: String, isActive: Boolean): Event!
//     deleteEvent(id: ID!): String!

//     createEventPartner(Img: String!, altText: String!): EventPartner!
//     updateEventPartner(id: ID!, Img: String, altText: String): EventPartner!
//     deleteEventPartner(id: ID!): String!

//     createGallerySec(tag: String!, Htext: String!): GallerySec!
//     updateGallerySec(id: ID!, tag: String, Htext: String): GallerySec!
//     deleteGallerySec(id: ID!): String!

//     createGalleryVedio(Videourl: String!, altTag: String!, Htext: String!, isPopular: Boolean): GalleryVedio!
//     updateGalleryVedio(id: ID!, Videourl: String, altTag: String, Htext: String, isPopular: Boolean): GalleryVedio!
//     deleteGalleryVedio(id: ID!): String!

//     createResturantSpace(Htext: String!, space: [SpaceInput]!): ResturantSpace!
//     updateResturantSpace(id: ID!, Htext: String, space: [SpaceInput]): ResturantSpace!
//     deleteResturantSpace(id: ID!): String!

//     createReviewSection(Htext: String!, Dtext: String!, reviews: [ReviewInput]!): ReviewSection!
//     updateReviewSection(id: ID!, Htext: String, Dtext: String, reviews: [ReviewInput]): ReviewSection!
//     deleteReviewSection(id: ID!): String!

//     createSocialMediamarketSec(Htext: String!, Pagename: String!, PageLink: String!, cardImg1: String!, card1Name: String!, cardImg2: String!, card2Name: String!, cardImg3: String!, card3Name: String!): SocialMediamarketSec!
//     updateSocialMediamarketSec(id: ID!, Htext: String, Pagename: String, PageLink: String, cardImg1: String, card1Name: String, cardImg2: String, card2Name: String, cardImg3: String, card3Name: String): SocialMediamarketSec!
//     deleteSocialMediamarketSec(id: ID!): String!

//     createContactDetails(Htext: String, whour: String, email: String, phone: String, address: String, map: String): ContactDetails!
//     updateContactDetails(id: ID!, Htext: String, whour: String, email: String, phone: String, address: String, map: String): ContactDetails!
//     deleteContactDetails(id: ID!): String!

//     createFooter(logo: String!, logo2: String!, dtext: String!, copyright: String!): Footer!
//     updateFooter(id: ID!, logo: String, logo2: String, dtext: String, copyright: String): Footer!
//     deleteFooter(id: ID!): String!

//     createSocial(icon: String!, link: String!): Social!
//     updateSocial(id: ID!, icon: String, link: String): Social!
//     deleteSocial(id: ID!): String!

//     createQuickLink(name: String!, link: String!): QuickLink!
//     updateQuickLink(id: ID!, name: String, link: String): QuickLink!
//     deleteQuickLink(id: ID!): String!

//     createContact(name: String!, email: String!, phone: String!, message: String!): Contact!
//     updateContact(id: ID!, name: String, email: String, phone: String, message: String): Contact!
//     deleteContact(id: ID!): String!

//     createBooking(name: String, phone: String!, location: String, people: String, date: String): Booking!
//     updateBooking(id: ID!, name: String, phone: String, location: String, people: String, date: String): Booking!
//     deleteBooking(id: ID!): String!

//     registerUser(email: String!, password: String!): AuthResponse!
//     loginUser(email: String!, password: String!): AuthResponse!
//     logoutUser: String!
//     updateSelf(email: String, password: String): User!
//     deleteUser(id: ID!): String!

//     createOwner(Htext: String!, dtext: String!, img: String!, ownername: String!, Desig: String!): Owner!
//     updateOwner(id: ID!, Htext: String, dtext: String, img: String, ownername: String, Desig: String): Owner!
//     deleteOwner(id: ID!): String!
//   }
// `;