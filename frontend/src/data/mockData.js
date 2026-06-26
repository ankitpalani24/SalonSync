// Mock Seed Data for SalonSync (Enterprise Salon Management SaaS)
// Seeded for a premium salon franchise "Luxe & Gold Salon & Spa"

export const mockSalons = [
  {
    _id: "salon_luxe_123",
    name: "Luxe & Gold Salon & Spa",
    ownerName: "Alexander Wright",
    email: "alexander@luxegold.com",
    phone: "+91 98765 43210",
    address: "7th Avenue, Signature Towers, Block C",
    city: "Mumbai",
    state: "Maharashtra",
    gstNumber: "27AAAAA1111A1Z1",
    businessType: "Premium Salon & Spa Franchise",
    subscriptionPlan: "Franchise",
    subscriptionStatus: "Active"
  },
  {
    _id: "salon_barber_456",
    name: "The Royal Grooming Co",
    ownerName: "Robert Miller",
    email: "robert@royalgroom.com",
    phone: "+91 91234 56789",
    address: "Mall Road, Connaught Place",
    city: "Delhi",
    state: "Delhi",
    gstNumber: "07BBBBB2222B2Z2",
    businessType: "Gentlemen's Barber Shop",
    subscriptionPlan: "Starter Salon",
    subscriptionStatus: "Active"
  }
];

export const mockBranches = [
  {
    _id: "branch_mumbai_1",
    salonId: "salon_luxe_123",
    name: "Bandra Flagship",
    address: "Carter Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    phone: "+91 22 2640 1234",
    status: "Active"
  },
  {
    _id: "branch_mumbai_2",
    salonId: "salon_luxe_123",
    name: "Juhu Salon Suite",
    address: "JVPD Scheme, Juhu",
    city: "Mumbai",
    state: "Maharashtra",
    phone: "+91 22 2620 5678",
    status: "Active"
  },
  {
    _id: "branch_delhi_1",
    salonId: "salon_barber_456",
    name: "CP Grooming Lounge",
    address: "Radial Road 2, Connaught Place",
    city: "Delhi",
    state: "Delhi",
    phone: "+91 11 4150 9999",
    status: "Active"
  }
];

export const mockUsers = [
  // Super Admin
  {
    _id: "user_super_admin",
    name: "Ankit Palani",
    email: "admin@salonsync.com",
    phone: "+91 99999 88888",
    role: "SUPER_ADMIN",
    salonId: null,
    branchId: null
  },
  // Luxe & Gold Owner
  {
    _id: "user_luxe_owner",
    name: "Alexander Wright",
    email: "alex@luxegold.com",
    phone: "+91 98765 43210",
    role: "FRANCHISE_OWNER",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  },
  // Manager
  {
    _id: "user_luxe_manager",
    name: "Victoria Beckham",
    email: "victoria@luxegold.com",
    phone: "+91 98765 43211",
    role: "SALON_MANAGER",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  },
  // Receptionist (Staff)
  {
    _id: "user_luxe_receptionist",
    name: "Rachel Green",
    email: "rachel@luxegold.com",
    phone: "+91 98765 43212",
    role: "STAFF",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  },
  // Staff
  {
    _id: "user_luxe_staff",
    name: "Daniel Craig",
    email: "daniel@luxegold.com",
    phone: "+91 98765 43213",
    role: "STAFF",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  },
  // Client (Priyanka Chopra)
  {
    _id: "user_luxe_client",
    name: "Priyanka Chopra",
    email: "priyanka@chopra.com",
    phone: "9819999999",
    role: "CLIENT",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  },
  // Staff (Aarav Sharma)
  {
    _id: "user_aarav_staff",
    name: "Aarav Sharma",
    email: "aarav@luxegold.com",
    phone: "+91 98765 00003",
    role: "STAFF",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  },
  // Client (Isha Patel)
  {
    _id: "user_isha_client",
    name: "Isha Patel",
    email: "isha@luxegold.com",
    phone: "9812222222",
    role: "CLIENT",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  }
];

export const mockCustomers = [
  {
    _id: "cust_1",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Priyanka Chopra",
    phone: "9819999999",
    email: "priyanka@chopra.com",
    gender: "Female",
    birthday: "1982-07-18",
    address: "Bandra Seafront Apartment",
    notes: "Requires organic products only. Prefers Jasmine tea during treatment.",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    loyaltyPoints: 345,
    membershipLevel: "Platinum"
  },
  {
    _id: "cust_2",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Ranveer Singh",
    phone: "9828888888",
    email: "ranveer@singh.com",
    gender: "Male",
    birthday: "1985-07-06",
    address: "JVPD Scheme Bungalow",
    notes: "Enjoys funky hairstyles. Loud music enthusiast.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    loyaltyPoints: 120,
    membershipLevel: "Gold"
  },
  {
    _id: "cust_3",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Deepika Padukone",
    phone: "9837777777",
    email: "deepika@padukone.com",
    gender: "Female",
    birthday: "1986-01-05",
    address: "Prabhadevi Towers",
    notes: "Prefers Senior Stylist Emma. Loves spa therapies.",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    loyaltyPoints: 512,
    membershipLevel: "Platinum"
  },
  {
    _id: "cust_4",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Virat Kohli",
    phone: "9846666666",
    email: "virat@kohli.com",
    gender: "Male",
    birthday: "1988-11-05",
    address: "Worli Luxury Apartment",
    notes: "Prefers custom beard trim and hair spas.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    loyaltyPoints: 85,
    membershipLevel: "Silver"
  },
  {
    _id: "cust_isha",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Isha Patel",
    phone: "9812222222",
    email: "isha@luxegold.com",
    gender: "Female",
    birthday: "1996-04-12",
    address: "Juhu Heights, Mumbai",
    notes: "Enjoys organic hair spas.",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    loyaltyPoints: 150,
    membershipLevel: "Gold"
  }
];

export const mockServices = [
  {
    _id: "serv_1",
    salonId: "salon_luxe_123",
    name: "Signature Haircut & Styling",
    category: "Haircut",
    duration: 45,
    price: 1500,
    materialCost: 150,
    profitMargin: 1350,
    description: "Wash, conditioning, custom styling, and blow dry by senior artist."
  },
  {
    _id: "serv_2",
    salonId: "salon_luxe_123",
    name: "Global Balayage & Highlights",
    category: "Hair Color",
    duration: 120,
    price: 6500,
    materialCost: 1200,
    profitMargin: 5300,
    description: "Premium gold-toned hair highlights with damage defense shield."
  },
  {
    _id: "serv_3",
    salonId: "salon_luxe_123",
    name: "24K Gold Luxury Facial",
    category: "Facial",
    duration: 75,
    price: 4500,
    materialCost: 800,
    profitMargin: 3700,
    description: "Anti-aging luxury facial using pure 24K gold foil and collagen serum."
  },
  {
    _id: "serv_4",
    salonId: "salon_luxe_123",
    name: "Bridal HD Airbrush Makeup",
    category: "Bridal Services",
    duration: 180,
    price: 25000,
    materialCost: 3500,
    profitMargin: 21500,
    description: "Flawless HD airbrush makeup package, including hair setup and styling assistance."
  },
  {
    _id: "serv_5",
    salonId: "salon_luxe_123",
    name: "Deep Tissue Swedish Spa",
    category: "Spa",
    duration: 60,
    price: 3500,
    materialCost: 400,
    profitMargin: 3100,
    description: "Relaxing muscle-relief massage with premium aromatic oils."
  }
];

export const mockPackages = [
  {
    _id: "pkg_1",
    salonId: "salon_luxe_123",
    name: "Gold Grooming Combo",
    includedServices: [
      { serviceId: "serv_1", name: "Signature Haircut & Styling", sessionsCount: 5 },
      { serviceId: "serv_5", name: "Deep Tissue Swedish Spa", sessionsCount: 2 }
    ],
    price: 11000,
    expiryDate: "2026-12-31"
  },
  {
    _id: "pkg_2",
    salonId: "salon_luxe_123",
    name: "Bridal Glow Makeover",
    includedServices: [
      { serviceId: "serv_3", name: "24K Gold Luxury Facial", sessionsCount: 3 },
      { serviceId: "serv_4", name: "Bridal HD Airbrush Makeup", sessionsCount: 1 }
    ],
    price: 32000,
    expiryDate: "2026-10-01"
  }
];

export const mockMemberships = [
  { _id: "m_silver", salonId: "salon_luxe_123", name: "Silver", discountPercentage: 10, price: 5000, validityMonths: 12 },
  { _id: "m_gold", salonId: "salon_luxe_123", name: "Gold", discountPercentage: 15, price: 10000, validityMonths: 12 },
  { _id: "m_platinum", salonId: "salon_luxe_123", name: "Platinum", discountPercentage: 20, price: 20000, validityMonths: 12 }
];

export const mockStaff = [
  {
    _id: "staff_1",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Emma Watson",
    phone: "9876500001",
    role: "Senior Hair Stylist",
    salary: 30000,
    commissionPercentage: 15,
    rating: 4.9
  },
  {
    _id: "staff_2",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Brad Pitt",
    phone: "9876500002",
    role: "Skin Care Expert",
    salary: 28000,
    commissionPercentage: 12,
    rating: 4.8
  },
  {
    _id: "staff_3",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Angelina Jolie",
    phone: "9876500003",
    role: "Master Makeup Artist",
    salary: 40000,
    commissionPercentage: 20,
    rating: 5.0
  },
  {
    _id: "staff_aarav",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Aarav Sharma",
    phone: "+91 98765 00003",
    role: "Stylist & Grooming Expert",
    salary: 25000,
    commissionPercentage: 15,
    rating: 4.7
  }
];

export const mockProducts = [
  {
    _id: "prod_1",
    salonId: "salon_luxe_123",
    name: "Premium Argan Elixir Shampoo",
    sku: "SHAM-ARG-250",
    category: "Hair Care",
    quantity: 12,
    purchasePrice: 600,
    sellingPrice: 1200,
    supplierId: "supp_1",
    lowStockThreshold: 4
  },
  {
    _id: "prod_2",
    salonId: "salon_luxe_123",
    name: "Pro-Gold Facial Peel-Off Mask",
    sku: "MSK-GLD-500",
    category: "Skin Care",
    quantity: 2, // Trigger low stock alert!
    purchasePrice: 1200,
    sellingPrice: 2400,
    supplierId: "supp_2",
    lowStockThreshold: 3
  },
  {
    _id: "prod_3",
    salonId: "salon_luxe_123",
    name: "Keratin Deep Repair Conditioner",
    sku: "COND-KER-300",
    category: "Hair Care",
    quantity: 18,
    purchasePrice: 450,
    sellingPrice: 900,
    supplierId: "supp_1",
    lowStockThreshold: 5
  }
];

export const mockSuppliers = [
  { _id: "supp_1", salonId: "salon_luxe_123", name: "L'Oreal Professional Ind.", phone: "1800-22-3000", email: "orders@loreal.in", address: "Mumbai Corp Park", outstandingDues: 15000 },
  { _id: "supp_2", salonId: "salon_luxe_123", name: "O3+ Skincare Lab Supplies", phone: "9988776655", email: "supplies@o3plus.com", address: "Delhi Industrial Hub", outstandingDues: 4000 }
];

export const mockExpenses = [
  { _id: "exp_1", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", category: "Rent", amount: 45000, description: "Monthly lease for Bandra center", date: "2026-06-01" },
  { _id: "exp_2", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", category: "Electricity", amount: 18500, description: "Power bill May-June", date: "2026-06-15" },
  { _id: "exp_3", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", category: "Marketing", amount: 12000, description: "Instagram & Facebook ads campaign", date: "2026-06-10" },
  { _id: "exp_4", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", category: "Product Purchases", amount: 18000, description: "Order for hair colors and mask stocks", date: "2026-06-20" }
];

export const mockAppointments = [
  {
    _id: "appt_1",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    customerId: "cust_1", // Priyanka
    services: [{ serviceId: "serv_1", name: "Signature Haircut & Styling", price: 1500 }],
    staffId: "staff_1", // Emma
    date: "2026-06-24", // Today
    time: "10:30",
    status: "Completed"
  },
  {
    _id: "appt_2",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    customerId: "cust_2", // Ranveer
    services: [{ serviceId: "serv_2", name: "Global Balayage & Highlights", price: 6500 }],
    staffId: "staff_1", // Emma
    date: "2026-06-24", // Today
    time: "12:00",
    status: "In Progress"
  },
  {
    _id: "appt_3",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    customerId: "cust_3", // Deepika
    services: [{ serviceId: "serv_3", name: "24K Gold Luxury Facial", price: 4500 }],
    staffId: "staff_2", // Brad
    date: "2026-06-24", // Today
    time: "15:00",
    status: "Confirmed"
  },
  {
    _id: "appt_4",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    customerId: "cust_4", // Virat
    services: [{ serviceId: "serv_1", name: "Signature Haircut & Styling", price: 1500 }],
    staffId: "staff_3", // Angelina
    date: "2026-06-25", // Tomorrow
    time: "11:00",
    status: "Scheduled"
  }
];

export const mockInvoices = [
  {
    _id: "inv_1",
    invoiceNumber: "INV-2026-0001",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    customerId: "cust_1",
    services: [{ serviceId: "serv_1", name: "Signature Haircut & Styling", price: 1500, quantity: 1 }],
    products: [{ productId: "prod_1", name: "Premium Argan Elixir Shampoo", price: 1200, quantity: 1 }],
    tax: 18,
    discount: 200,
    finalAmount: 2986, // (2700 + 486) - 200
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    staffId: "staff_1",
    createdAt: "2026-06-23T14:30:00Z"
  },
  {
    _id: "inv_2",
    invoiceNumber: "INV-2026-0002",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    customerId: "cust_3",
    services: [{ serviceId: "serv_5", name: "Deep Tissue Swedish Spa", price: 3500, quantity: 1 }],
    products: [],
    tax: 18,
    discount: 500,
    finalAmount: 3630, // (3500 + 630) - 500
    paymentMethod: "Card",
    paymentStatus: "Paid",
    staffId: "staff_2",
    createdAt: "2026-06-24T10:15:00Z"
  }
];

export const mockAttendance = [
  { _id: "att_1", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", staffId: "staff_1", date: "2026-06-24", checkIn: "09:15", checkOut: "18:00", workingHours: 8.75, overtime: 0.75 },
  { _id: "att_2", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", staffId: "staff_2", date: "2026-06-24", checkIn: "09:30", checkOut: "18:00", workingHours: 8.5, overtime: 0.5 },
  { _id: "att_3", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", staffId: "staff_3", date: "2026-06-24", checkIn: "09:00", checkOut: "18:30", workingHours: 9.5, overtime: 1.5 }
];

export const mockCommissions = [
  { _id: "comm_1", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", staffId: "staff_1", invoiceId: "inv_1", revenueGenerated: 1500, commissionRate: 15, commissionEarned: 225, date: "2026-06-23" },
  { _id: "comm_2", salonId: "salon_luxe_123", branchId: "branch_mumbai_1", staffId: "staff_2", invoiceId: "inv_2", revenueGenerated: 3500, commissionRate: 12, commissionEarned: 420, date: "2026-06-24" }
];

export const mockNotifications = [
  { _id: "nt_1", salonId: "salon_luxe_123", customerId: "cust_1", type: "WhatsApp", message: "Your booking for Signature Haircut is confirmed.", status: "Sent", sentAt: "2026-06-24T09:30:00Z" },
  { _id: "nt_2", salonId: "salon_luxe_123", customerId: "cust_3", type: "SMS", message: "Reminder: You have a Gold Facial scheduled at 15:00 today.", status: "Sent", sentAt: "2026-06-24T12:00:00Z" }
];
