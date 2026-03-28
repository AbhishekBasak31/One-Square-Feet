export const typeDefs = `#graphql
  type Admin { _id: ID! email: String! createdAt: String lastLoginAt: String }
  
  type BankDetails { accountName: String accountNumber: String ifscCode: String bankName: String }
  input BankDetailsInput { accountName: String accountNumber: String ifscCode: String bankName: String }

  type Tenant { 
    _id: ID! name: String! email: String! callNumber: String! whatsappNumber: String! 
    permanentAddress: String! adharNumber: String! adharCardUrl: String! panNumber: String! 
    panCardUrl: String! bankDetails: BankDetails createdAt: String updatedAt: String 
    ownedby: PropertyOwner      # 🟢 ADDED
    addedByBroker: Broker       # 🟢 ADDED
  }

  type Lease {
    _id: ID! tenant: Tenant property: Property status: String tenurestart: String 
    tenureend: String stepuptenure: String gst: String agreedRent: Float 
    agreedMaintenance: Float depositAmount: Float rentAgreementUrl: String 
    createdAt: String updatedAt: String
    ownedby: PropertyOwner      # 🟢 ADDED
    addedByBroker: Broker       # 🟢 ADDED
  }

  type ElectricDetails { units: Float rate: Float }
  
  type Invoice {
    _id: ID! invoiceNo: String tenant: Tenant property: Property billType: String 
    billingMonth: String financialYear: String invoiceDate: String baseAmount: Float 
    cgst: Float sgst: Float totalAmount: Float amountPaid: Float amountDue: Float 
    electricDetails: ElectricDetails status: String
  }

  type Payment {
    _id: ID! invoice: Invoice tenant: Tenant property: Property amount: Float 
    paymentDate: String paymentMethod: String transactionId: String chequeNumber: String 
    chequeDepositDate: String cashDepositDate: String notes: String
  }

  type RazorpayOrderResponse { orderId: String! amount: Float! currency: String! }

  type Client { _id: ID name: String Propertyquery: String deadline: String status: Boolean assigneddate: String email: String phone: String remark: String }
  
  type Broker { _id: ID! name: String email: String phone: String profilepic: String rera: String pancard: String aadhar: String panno: String aadharno: String digitalSignature: String gst: String businessType: String businessregistration: String localtradelicense: String brokerageagreement: String isVerified: Boolean planType: String planExpiryDate: String bankDetails: BankDetails createdAt: String lastLoginAt: String myclients: [Client] }
  
  type PropertyOwner { _id: ID! ownerType: String companyName: String name: String email: String phone: String address: String contactPersonName: String contactPersonPhone: String keyPersonName: String keyPersonPhone: String planType: String assignedBrokers: [Broker] planExpiryDate: String verifyStatus: Boolean pancard: String aadhar: String panno: String aadharno: String gst: String digitalSignature: String profilephoto: String bankDetails: BankDetails createdAt: String lastLoginAt: String }
  
  type AdminAuthResponse { message: String!, admin: Admin, token: String }
  type BrokerAuthResponse { message: String!, broker: Broker, token: String }
  type OwnerAuthResponse { message: String!, owner: PropertyOwner, token: String }
  
  type PropertyAddress { houseno: String street: String city: String state: String pincode: String }
  type VisibilitySettings { showAddressToFreeBrokers: Boolean showOwnerDetailsToFreeBrokers: Boolean showReraToFreeBrokers: Boolean }
  type BrokerOwnerDetails { ownerType: String companyName: String ownerName: String ownerPhone: String contactPersonName: String contactPersonPhone: String keyPersonName: String keyPersonPhone: String }
  
  type Property { _id: ID! type: String name: String img: [String] video: [String] price: String maintenanceCost: String rental: Boolean selling: Boolean address: PropertyAddress rera: String cc: Boolean mutation: Boolean furnished: Boolean carpetarea: String superbuilderarea: String landarea: String propertyAge: Float verified: Boolean noofbedrooms: String noofbathrooms: String noofhalls: String noofkitchens: String noofdrawingrooms: String noofbalcony: String noofparking: String description: String propertypapers:[String] amenities: [String] ownedby: PropertyOwner brokerOwnerDetails: BrokerOwnerDetails assignedBrokers: [Broker] addedByBroker: Broker visibilitySettings: VisibilitySettings activeLease: Lease createdAt: String updatedAt: String }
  
  input AddressInput { houseno: String! street: String! city: String! state: String! pincode: String! }
  input VisibilitySettingsInput { showAddressToFreeBrokers: Boolean showOwnerDetailsToFreeBrokers: Boolean showReraToFreeBrokers: Boolean }
  input BrokerOwnerDetailsInput { ownerType: String companyName: String ownerName: String ownerPhone: String contactPersonName: String contactPersonPhone: String keyPersonName: String keyPersonPhone: String }
  input ClientInput { name: String! Propertyquery: String! deadline: String email: String! phone: String! remark: String }

  input TenantInput { name: String! email: String! callNumber: String! whatsappNumber: String! permanentAddress: String! adharNumber: String! adharCardUrl: String! panNumber: String! panCardUrl: String! bankDetails: BankDetailsInput }
  input LeaseInput { tenantId: ID! propertyId: ID! tenurestart: String! tenureend: String! stepuptenure: String! gst: String agreedRent: Float! agreedMaintenance: Float! depositAmount: Float! rentAgreementUrl: String! }
  input TenantLeaseInput { name: String! email: String! callNumber: String! whatsappNumber: String! permanentAddress: String! adharNumber: String! adharCardUrl: String! panNumber: String! panCardUrl: String! bankDetails: BankDetailsInput propertyId: ID! tenurestart: String! tenureend: String! stepuptenure: String! gst: String agreedRent: Float! agreedMaintenance: Float! depositAmount: Float! rentAgreementUrl: String! }

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
    getLeases: [Lease]
    getLeaseById(id: ID!): Lease
    getTenants: [Tenant]
    getInvoicesByTenant(tenantId: ID!): [Invoice]
    getPaymentsByInvoice(invoiceId: ID!): [Payment]
    getMyInvoices: [Invoice]
  }

  type Mutation {
    registerAdmin(email: String!, password: String!): AdminAuthResponse!
    loginAdmin(email: String!, password: String!): AdminAuthResponse!
    logoutAdmin: String!

    registerBroker(name: String!, email: String!, phone: String!, password: String!, profilepic: String!): BrokerAuthResponse!
    loginBroker(email: String!, password: String!): BrokerAuthResponse!
    logoutBroker: String!
    
    updateBroker(id: ID!, name: String, email: String, phone: String, profilepic: String, rera: String, pancard: String, aadhar: String, panno: String, aadharno: String, digitalSignature: String, gst: String, businessType: String, businessregistration: String, localtradelicense: String, brokerageagreement: String, isVerified: Boolean, planType: String, planExpiryDate: String, bankDetails: BankDetailsInput): Broker!
    deleteBroker(id: ID!): String!

    addBrokerClient(clientData: ClientInput!): Broker!
    updateBrokerClientStatus(clientId: ID!, status: Boolean!): Broker!
    deleteBrokerClient(clientId: ID!): Broker!
    
    registerOwner(ownerType: String, companyName: String, name: String!, email: String!, phone: String!, address: String!, password: String!, contactPersonName: String, contactPersonPhone: String, keyPersonName: String, keyPersonPhone: String): OwnerAuthResponse!
    loginOwner(email: String!, password: String!): OwnerAuthResponse!
    logoutOwner: String!
    
    updateMyOwnerProfile(ownerType: String, companyName: String, name: String, email: String, phone: String, address: String, contactPersonName: String, contactPersonPhone: String, keyPersonName: String, keyPersonPhone: String, pancard: String, aadhar: String, panno: String, aadharno: String, gst: String, digitalSignature: String, profilephoto: String, bankDetails: BankDetailsInput): PropertyOwner!
    updateOwner(id: ID!, ownerType: String, companyName: String, name: String, email: String, phone: String, address: String, contactPersonName: String, contactPersonPhone: String, keyPersonName: String, keyPersonPhone: String, planType: String, planExpiryDate: String, assignedBrokers: [ID], verifyStatus: Boolean, pancard: String, aadhar: String, panno: String, aadharno: String, gst: String, digitalSignature: String, profilephoto: String, bankDetails: BankDetailsInput): PropertyOwner!
    deleteOwner(id: ID!): String!

    createProperty(type: String!, name: String!, img: [String]!, video: [String], price: String, maintenanceCost: String, rental: Boolean, selling: Boolean, propertypapers: [String], address: AddressInput!, rera: String!, cc: Boolean!, mutation: Boolean!, furnished: Boolean!, carpetarea: String!, superbuilderarea: String!, landarea: String!, propertyAge: Float, verified: Boolean, noofbedrooms: String, noofbathrooms: String, noofhalls: String, noofkitchens: String, noofdrawingrooms: String, noofbalcony: String, noofparking: String, description: String!, amenities: [String]!, ownedby: ID, brokerOwnerDetails: BrokerOwnerDetailsInput, assignedBrokers: [ID], visibilitySettings: VisibilitySettingsInput): Property!
    updateProperty(id: ID!, type: String, name: String, img: [String], video: [String], price: String, maintenanceCost: String, rental: Boolean, selling: Boolean, propertypapers: [String], address: AddressInput, rera: String, cc: Boolean, mutation: Boolean, furnished: Boolean, carpetarea: String, superbuilderarea: String, landarea: String, propertyAge: Float, verified: Boolean, noofbedrooms: String, noofbathrooms: String, noofhalls: String, noofkitchens: String, noofdrawingrooms: String, noofbalcony: String, noofparking: String, description: String, amenities: [String], ownedby: ID, brokerOwnerDetails: BrokerOwnerDetailsInput, assignedBrokers: [ID], visibilitySettings: VisibilitySettingsInput): Property!
    deleteProperty(id: ID!): String!

    createTenant(input: TenantInput!): Tenant!
    updateTenant(id: ID!, input: TenantInput!): Tenant!
    deleteTenant(id: ID!): String!

    createLease(input: LeaseInput!): Lease!
    updateLease(id: ID!, input: LeaseInput!): Lease!
    createTenantWithLease(input: TenantLeaseInput!): String!
    deleteLease(id: ID!): String!

    updateInvoiceStatus(id: ID!, status: String!): Invoice!
    createInvoice(tenantId: ID!, propertyId: ID!, billType: String!, billingMonth: String!, baseAmount: Float!, cgst: Float!, sgst: Float!, totalAmount: Float!, electricUnits: Float, electricRate: Float): String!
    
    recordPayment(invoiceId: ID!, amount: Float!, paymentMethod: String!, transactionId: String, chequeNumber: String, chequeDepositDate: String, cashDepositDate: String, notes: String): Payment!
    createRazorpayOrder(invoiceId: ID!, amount: Float!): RazorpayOrderResponse!
    verifyRazorpayPayment(invoiceId: ID!, razorpayPaymentId: String!, razorpayOrderId: String!, razorpaySignature: String!): Payment!
    
    # 🟢 NEW: Mail Sender Engine
    sendDynamicMail(tenantId: ID!, templateType: String!, customMessage: String, invoiceId: ID): String
  }
`;