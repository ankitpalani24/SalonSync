const mongoose = require('mongoose');

// 1. User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Super Admin', 'Salon Owner', 'Manager', 'Receptionist', 'Staff'], 
    default: 'Staff' 
  },
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });

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
  membershipLevel: { 
    type: String, 
    enum: ['None', 'Silver', 'Gold', 'Platinum'], 
    default: 'None' 
  },
}, { timestamps: true });

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
}, { timestamps: true });

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
}, { timestamps: true });

// Auto-calculate profit margin on save
ServiceSchema.pre('save', function(next) {
  this.profitMargin = this.price - this.materialCost;
  next();
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

// 8. Membership Schema
const MembershipSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, enum: ['Silver', 'Gold', 'Platinum'], required: true },
  discountPercentage: { type: Number, required: true },
  price: { type: Number, required: true },
  validityMonths: { type: Number, default: 12 },
}, { timestamps: true });

// 9. LoyaltyPoint Schema
const LoyaltyPointSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  transactionAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// 10. Invoice Schema
const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
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

// 11. Expense Schema
const ExpenseSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  category: { 
    type: String, 
    enum: ['Rent', 'Electricity', 'Internet', 'Water', 'Staff Salary', 'Product Purchases', 'Marketing', 'Miscellaneous'], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

// 12. Product Schema (Inventory items)
const ProductSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, default: 0 },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  lowStockThreshold: { type: Number, default: 5 }
}, { timestamps: true });

// 13. Supplier Schema
const SupplierSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  outstandingDues: { type: Number, default: 0 }
}, { timestamps: true });

// 14. Staff Schema
const StaffSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked user account if they can log in
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: 'Stylist' },
  salary: { type: Number, default: 0 },
  commissionPercentage: { type: Number, default: 10 }, // e.g. 10%
  rating: { type: Number, default: 5 },
}, { timestamps: true });

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

// 17. Subscription Schema (For Salon platforms/Super Admin)
const SubscriptionSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  plan: { type: String, enum: ['Starter', 'Professional', 'Enterprise'], required: true },
  price: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' }
}, { timestamps: true });

// 18. Notification Schema (SMS/WhatsApp logs)
const NotificationSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  type: { type: String, enum: ['WhatsApp', 'SMS', 'Email'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Sent', 'Pending', 'Failed'], default: 'Sent' },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

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
  LoyaltyPoint: mongoose.model('LoyaltyPoint', LoyaltyPointSchema),
  Invoice: mongoose.model('Invoice', InvoiceSchema),
  Expense: mongoose.model('Expense', ExpenseSchema),
  Product: mongoose.model('Product', ProductSchema),
  Supplier: mongoose.model('Supplier', SupplierSchema),
  Staff: mongoose.model('Staff', StaffSchema),
  Attendance: mongoose.model('Attendance', AttendanceSchema),
  Commission: mongoose.model('Commission', CommissionSchema),
  Subscription: mongoose.model('Subscription', SubscriptionSchema),
  Notification: mongoose.model('Notification', NotificationSchema)
};
