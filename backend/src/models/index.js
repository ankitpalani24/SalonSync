const mongoose = require('mongoose');

// 1. User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER', 'STAFF', 'CLIENT'], 
    default: 'STAFF' 
  },
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });

UserSchema.index({ phone: 1 });
UserSchema.index({ salonId: 1, role: 1 });

// 2. Salon Schema
const SalonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  gstNumber: { type: String },
  businessType: { type: String },
  subscriptionPlan: { 
    type: String, 
    enum: ['Starter Salon', 'Franchise'], 
    default: 'Starter Salon' 
  },
  subscriptionStatus: { 
    type: String, 
    enum: ['Active', 'Trial', 'Expired'], 
    default: 'Trial' 
  },
  slug: { type: String, unique: true, sparse: true },
  tagline: { type: String },
  logoUrl: { type: String },
  coverImageUrl: { type: String },
  description: { type: String },
  openingHours: { type: String, default: 'Mon - Sun: 09:00 AM - 09:00 PM' },
  rating: { type: Number, default: 4.9 },
  totalReviews: { type: Number, default: 128 },
  galleryImages: [{ type: String }]
}, { timestamps: true });

// 3. Branch Schema
const BranchSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  phone: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

BranchSchema.index({ salonId: 1, status: 1 });

// 4. Customer Schema
const CustomerSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  birthday: { type: Date },
  address: { type: String },
  notes: { type: String },
  photo: { type: String },
  loyaltyPoints: { type: Number, default: 0 },
  totalPointsEarned: { type: Number, default: 0 },
  totalPointsRedeemed: { type: Number, default: 0 },
  totalPointsExpired: { type: Number, default: 0 },
  membershipLevel: { 
    type: String, 
    enum: ['None', 'Silver', 'Gold', 'Platinum'], 
    default: 'None' 
  },
}, { timestamps: true });

CustomerSchema.index({ salonId: 1, phone: 1 });
CustomerSchema.index({ salonId: 1, email: 1 });
CustomerSchema.index({ salonId: 1, branchId: 1 });

// 5. Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  services: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    name: String,
    price: Number,
  }],
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // "HH:MM" format
  status: { 
    type: String, 
    enum: ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Scheduled' 
  },
  inventoryDeducted: { type: Boolean, default: false },
}, { timestamps: true });

// Performance index for double-booking overlap prevention & availability checks
AppointmentSchema.index({ salonId: 1, staffId: 1, date: 1, time: 1 });
AppointmentSchema.index({ salonId: 1, customerId: 1 });
AppointmentSchema.index({ salonId: 1, date: 1 });

// 6. Service Schema
const ServiceSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Haircut', 'Hair Color', 'Facial', 'Makeup', 'Waxing', 'Spa', 'Bridal Services', 'Other'], 
    required: true 
  },
  duration: { type: Number, default: 30 }, // in minutes
  price: { type: Number, required: true },
  materialCost: { type: Number, default: 0 },
  profitMargin: { type: Number }, // Price - MaterialCost
  description: { type: String },
  requiredProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: 'units' }
  }],
}, { timestamps: true });

ServiceSchema.index({ salonId: 1, category: 1 });

// Auto-calculate profit margin on save
ServiceSchema.pre('save', function() {
  this.profitMargin = this.price - this.materialCost;
});

// 7. Package Schema
const PackageSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  includedServices: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    name: String,
    sessionsCount: { type: Number, default: 1 }
  }],
  price: { type: Number, required: true },
  expiryDate: { type: Date }
}, { timestamps: true });

PackageSchema.index({ salonId: 1 });

// 8. Membership Plan Schema
const MembershipSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  tier: { type: String, enum: ['Silver', 'Gold', 'Platinum', 'VIP'], default: 'Gold' },
  discountPercentage: { type: Number, required: true },
  price: { type: Number, required: true },
  validityMonths: { type: Number, default: 12 },
  includedServices: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    name: String,
    sessionsCount: { type: Number, default: 1 }
  }],
  priorityBooking: { type: Boolean, default: true },
  loyaltyMultiplier: { type: Number, default: 1.5 },
  specialOffers: [{ type: String }],
  description: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

MembershipSchema.index({ salonId: 1, active: 1 });

// 8b. Customer Membership Subscription Schema
const CustomerMembershipSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  membershipPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },
  tier: { type: String, required: true },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Expiring Soon', 'Expired', 'Cancelled'], 
    default: 'Active' 
  },
  pricePaid: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 10 },
  benefitsUsed: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: String,
    sessionsUsed: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 1 }
  }],
  history: [{
    date: { type: Date, default: Date.now },
    action: String,
    details: String
  }],
  expiryNotified: { type: Boolean, default: false }
}, { timestamps: true });

CustomerMembershipSchema.index({ salonId: 1, customerId: 1, status: 1 });

// 9. LoyaltyPoint / Transaction Schema
const LoyaltyPointSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['Earned', 'Redeemed', 'Expired', 'Manual'], required: true },
  points: { type: Number, required: true },
  balanceAfter: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  transactionAmount: { type: Number, default: 0 },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyReward' },
  description: { type: String },
  idempotencyKey: { type: String, sparse: true },
  expiryDate: { type: Date },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

LoyaltyPointSchema.index({ salonId: 1, customerId: 1, date: -1 });
LoyaltyPointSchema.index({ salonId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

// 9b. LoyaltyReward Schema
const LoyaltyRewardSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Discount', 'Free Service', 'Product', 'Upgrade', 'Special Offer'], 
    required: true 
  },
  pointsCost: { type: Number, required: true },
  discountValue: { type: Number, default: 0 },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: { type: String },
  expiryDays: { type: Number, default: 30 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

LoyaltyRewardSchema.index({ salonId: 1, active: 1 });

// 9c. LoyaltyRule Schema
const LoyaltyRuleSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, unique: true },
  pointsEarnedPer100Spent: { type: Number, default: 10 },
  pointValueInRupees: { type: Number, default: 1 },
  expiryMonths: { type: Number, default: 12 },
  maxPointsPerInvoice: { type: Number, default: 5000 },
  maxRedemptionsPerMonth: { type: Number, default: 10 }
}, { timestamps: true });

LoyaltyRuleSchema.index({ salonId: 1 });

// 10. Invoice Schema
const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  services: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  }],
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  }],
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], 
    default: 'Cash' 
  },
  paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }
}, { timestamps: true });

// Compound index to ensure invoice numbers are unique per salon tenant
InvoiceSchema.index({ salonId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ salonId: 1, createdAt: -1 });
InvoiceSchema.index({ salonId: 1, customerId: 1 });
InvoiceSchema.index({ salonId: 1, staffId: 1 });

// 11. Expense Schema
const ExpenseSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  category: { 
    type: String, 
    enum: ['Rent', 'Salary', 'Electricity', 'Water', 'Products', 'Equipment', 'Maintenance', 'Marketing', 'Internet', 'Transportation', 'Other'], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], default: 'Cash' },
  vendor: { type: String },
  receiptUrl: { type: String },
  createdBy: { type: String }
}, { timestamps: true });

ExpenseSchema.index({ salonId: 1, date: -1 });

// 12. Product Schema (Inventory items)
const ProductSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'units' },
  minStock: { type: Number, default: 5 },
  reorderLevel: { type: Number, default: 10 },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  expiryDate: { type: Date },
  lowStockThreshold: { type: Number, default: 5 }
}, { timestamps: true });

ProductSchema.index({ salonId: 1, sku: 1 });
ProductSchema.index({ salonId: 1, quantity: 1 });

// 13. Supplier Schema
const SupplierSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  outstandingDues: { type: Number, default: 0 }
}, { timestamps: true });

SupplierSchema.index({ salonId: 1 });

// 14. Staff Schema
const StaffSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked user account if they can log in
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  role: { type: String, default: 'Stylist' },
  salary: { type: Number, default: 0 },
  commissionPercentage: { type: Number, default: 10 }, // e.g. 10%
  rating: { type: Number, default: 5 },
  specialization: [{ type: String }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  experienceYears: { type: Number, default: 3 },
  experienceLevel: { type: String, default: 'Senior Specialist' },
  bio: { type: String },
  avatar: { type: String },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' }
}, { timestamps: true });

StaffSchema.index({ salonId: 1, branchId: 1 });
StaffSchema.index({ userId: 1 });
StaffSchema.index({ salonId: 1, phone: 1 });

// 15. Attendance Schema
const AttendanceSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: Date, required: true },
  checkIn: { type: String },  // "HH:MM"
  checkOut: { type: String }, // "HH:MM"
  workingHours: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
}, { timestamps: true });

AttendanceSchema.index({ salonId: 1, staffId: 1, date: -1 });

// 16. Commission Schema
const CommissionSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  revenueGenerated: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionEarned: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

CommissionSchema.index({ salonId: 1, staffId: 1, date: -1 });

// 17. Subscription Schema (For Salon platforms/Super Admin)
const SubscriptionSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  plan: { type: String, enum: ['Starter Salon', 'Franchise'], required: true },
  price: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' }
}, { timestamps: true });

SubscriptionSchema.index({ salonId: 1, status: 1 });

// 18. Notification Schema (SMS/WhatsApp logs)
const NotificationSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  type: { type: String, enum: ['WhatsApp', 'SMS', 'Email'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Sent', 'Pending', 'Failed'], default: 'Sent' },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

NotificationSchema.index({ salonId: 1, customerId: 1 });

// 19. Review Schema
const ReviewSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  serviceName: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

ReviewSchema.index({ salonId: 1, staffId: 1 });

// 20. InventoryConsumption Schema (Audit Trail for Automated Deductions)
const InventoryConsumptionSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantityConsumed: { type: Number, required: true },
  unit: { type: String, default: 'units' },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  serviceName: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  staffName: { type: String },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

InventoryConsumptionSchema.index({ salonId: 1, date: -1 });

// Export all models
module.exports = {
  User: mongoose.model('User', UserSchema),
  Salon: mongoose.model('Salon', SalonSchema),
  Branch: mongoose.model('Branch', BranchSchema),
  Customer: mongoose.model('Customer', CustomerSchema),
  Appointment: mongoose.model('Appointment', AppointmentSchema),
  Service: mongoose.model('Service', ServiceSchema),
  Package: mongoose.model('Package', PackageSchema),
  Membership: mongoose.model('Membership', MembershipSchema),
  CustomerMembership: mongoose.model('CustomerMembership', CustomerMembershipSchema),
  LoyaltyPoint: mongoose.model('LoyaltyPoint', LoyaltyPointSchema),
  LoyaltyReward: mongoose.model('LoyaltyReward', LoyaltyRewardSchema),
  LoyaltyRule: mongoose.model('LoyaltyRule', LoyaltyRuleSchema),
  Invoice: mongoose.model('Invoice', InvoiceSchema),
  Expense: mongoose.model('Expense', ExpenseSchema),
  Product: mongoose.model('Product', ProductSchema),
  Supplier: mongoose.model('Supplier', SupplierSchema),
  Staff: mongoose.model('Staff', StaffSchema),
  Attendance: mongoose.model('Attendance', AttendanceSchema),
  Commission: mongoose.model('Commission', CommissionSchema),
  Subscription: mongoose.model('Subscription', SubscriptionSchema),
  Notification: mongoose.model('Notification', NotificationSchema),
  Review: mongoose.model('Review', ReviewSchema),
  InventoryConsumption: mongoose.model('InventoryConsumption', InventoryConsumptionSchema)
};
