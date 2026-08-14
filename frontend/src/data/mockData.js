// Mock Seed Data for SalonSync (Enterprise Salon Management SaaS)
// Seeded for a premium salon franchise "Luxe & Gold Salon & Spa"

export const mockSalons = [
  {
    _id: "salon_luxe_123",
    name: "Luxe & Gold Salon & Spa",
    slug: "luxe-salon-spa-mumbai",
    ownerName: "Alexander Wright",
    email: "alexander@luxegold.com",
    phone: "+91 98765 43210",
    address: "7th Avenue, Signature Towers, Bandra West",
    locality: "Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    gstNumber: "27AAAAA1111A1Z1",
    businessType: "Premium Salon & Spa Franchise",
    subscriptionPlan: "Franchise",
    subscriptionStatus: "Active",
    tagline: "Bandra's Premier Luxury Hair, Skincare & Wellness Sanctuary",
    logoUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80",
    description: "Luxe & Gold Salon & Spa is Mumbai's premier luxury beauty sanctuary. Offering bespoke haircutting, balayage, organic skincare facials, deep-tissue body spas, and bridal makeover packages in a tranquil 5-star ambiance.",
    openingHours: "Mon - Sun: 09:00 AM - 09:00 PM",
    rating: 4.9,
    totalReviews: 142,
    startingPrice: 500,
    popularServices: ["Signature Haircut", "24K Gold Facial", "Global Balayage"],
    availableToday: true,
    distanceStr: "1.2 km away",
    galleryImages: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    _id: "salon_barber_456",
    name: "The Royal Grooming Co",
    slug: "the-royal-grooming-delhi",
    ownerName: "Robert Miller",
    email: "robert@royalgroom.com",
    phone: "+91 91234 56789",
    address: "Inner Circle, Connaught Place",
    locality: "Connaught Place",
    city: "Delhi",
    state: "Delhi",
    gstNumber: "07BBBBB2222B2Z2",
    businessType: "Gentlemen's Barber Shop",
    subscriptionPlan: "Starter Salon",
    subscriptionStatus: "Active",
    tagline: "Vintage Gentlemen's Barbering & Beard Sculpting Studio",
    logoUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1600&q=80",
    description: "Classic gentlemen's barbershop in the heart of Connaught Place. Hot towel shaves, precision fade cuts, beard styling, and scalp therapy.",
    openingHours: "Mon - Sun: 10:00 AM - 08:30 PM",
    rating: 4.8,
    totalReviews: 98,
    startingPrice: 350,
    popularServices: ["Royal Beard Trim", "Executive Cut", "Hot Towel Shave"],
    availableToday: true,
    distanceStr: "3.5 km away",
    galleryImages: [
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    _id: "salon_aura_789",
    name: "Aura Skincare & Wellness Clinic",
    slug: "aura-skincare-wellness-bangalore",
    ownerName: "Dr. Maya Sen",
    email: "maya@aurawellness.com",
    phone: "+91 98888 77777",
    address: "100 Feet Road, Indiranagar",
    locality: "Indiranagar",
    city: "Bangalore",
    state: "Karnataka",
    businessType: "Skincare & Aesthetic MedSpa",
    subscriptionPlan: "Franchise",
    subscriptionStatus: "Active",
    tagline: "Advanced Dermatological Skincare & Holistic Spa Retreat",
    logoUrl: "https://images.unsplash.com/photo-1512290900673-0e86b0394017?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80",
    description: "State-of-the-art dermatological skincare treatments, hydrafacials, organic peelings, and holistic body massages.",
    openingHours: "Tue - Sun: 09:30 AM - 08:00 PM",
    rating: 4.9,
    totalReviews: 115,
    startingPrice: 800,
    popularServices: ["Hydra Radiance Facial", "Swedish Deep Tissue Massage", "Detox Body Wrap"],
    availableToday: true,
    distanceStr: "2.1 km away",
    galleryImages: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    _id: "salon_velvet_101",
    name: "Velvet Hair & Color Lounge",
    slug: "velvet-hair-lounge-pune",
    ownerName: "Sarah Jenkins",
    email: "sarah@velvethair.com",
    phone: "+91 97777 66666",
    address: "Lane 7, Koregaon Park",
    locality: "Koregaon Park",
    city: "Pune",
    state: "Maharashtra",
    businessType: "Hair Color & Styling Studio",
    subscriptionPlan: "Starter Salon",
    subscriptionStatus: "Active",
    tagline: "Trendy Hair Coloring, Keratin Smooth & Hair Transformations",
    logoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80",
    description: "Chic hair color studio specializing in balayage, ombre, vivid pastel transformations, and keratin smoothing.",
    openingHours: "Mon - Sun: 10:00 AM - 09:00 PM",
    rating: 4.7,
    totalReviews: 76,
    startingPrice: 400,
    popularServices: ["Balayage & Tonal Gloss", "Keratin Botox Spa", "Style Blowout"],
    availableToday: true,
    distanceStr: "4.0 km away",
    galleryImages: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    _id: "salon_enchanted_202",
    name: "Enchanted Glow Beauty Suite",
    slug: "enchanted-glow-juhu-mumbai",
    ownerName: "Pooja Malhotra",
    email: "pooja@enchantedglow.com",
    phone: "+91 96666 55555",
    address: "Juhu Tara Road, Juhu Beach",
    locality: "Juhu Beach",
    city: "Mumbai",
    state: "Maharashtra",
    businessType: "Luxury Bridal & Makeover Lounge",
    subscriptionPlan: "Franchise",
    subscriptionStatus: "Active",
    tagline: "Celebrity Bridal Makeovers, HD Makeup & Luxury Spa",
    logoUrl: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1600&q=80",
    description: "Celebrity beauty lounge in Juhu. Renowned for HD bridal makeup, airbrush makeover, and organic gel nail art.",
    openingHours: "Mon - Sun: 09:00 AM - 09:30 PM",
    rating: 4.9,
    totalReviews: 184,
    startingPrice: 1200,
    popularServices: ["Bridal HD Makeover", "Airbrush Party Glam", "Gel Nail Art Extensions"],
    availableToday: true,
    distanceStr: "5.8 km away",
    galleryImages: [
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80"
    ]
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
    _id: "user_emma_staff",
    name: "Emma Watson",
    email: "9876500001@salonsync.com",
    phone: "9876500001",
    role: "STAFF",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  },
  {
    _id: "user_brad_staff",
    name: "Brad Pitt",
    email: "9876500002@salonsync.com",
    phone: "9876500002",
    role: "STAFF",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1"
  },
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
  {
    _id: "m_silver",
    salonId: "salon_luxe_123",
    name: "Silver Tier Pass",
    tier: "Silver",
    discountPercentage: 10,
    price: 5000,
    validityMonths: 6,
    includedServices: [
      { serviceId: "serv_1", name: "Signature Haircut & Styling", sessionsCount: 2 }
    ],
    priorityBooking: true,
    loyaltyMultiplier: 1.25,
    specialOffers: ["10% off all retail products", "Complimentary birthday blow dry"],
    description: "Ideal entry membership plan with 10% discount on all services and 2 complimentary haircuts.",
    active: true
  },
  {
    _id: "m_gold",
    salonId: "salon_luxe_123",
    name: "Gold Royalty Pass",
    tier: "Gold",
    discountPercentage: 15,
    price: 10000,
    validityMonths: 12,
    includedServices: [
      { serviceId: "serv_1", name: "Signature Haircut & Styling", sessionsCount: 4 },
      { serviceId: "serv_3", name: "24K Gold Luxury Facial", sessionsCount: 2 }
    ],
    priorityBooking: true,
    loyaltyMultiplier: 1.5,
    specialOffers: ["15% off all retail products", "VIP Lounge Access", "Weekend Fast-Track Booking"],
    description: "Our most popular annual membership offering 15% discount, complimentary gold facials & priority booking.",
    active: true
  },
  {
    _id: "m_platinum",
    salonId: "salon_luxe_123",
    name: "Platinum Elite Club",
    tier: "Platinum",
    discountPercentage: 20,
    price: 20000,
    validityMonths: 12,
    includedServices: [
      { serviceId: "serv_1", name: "Signature Haircut & Styling", sessionsCount: 6 },
      { serviceId: "serv_3", name: "24K Gold Luxury Facial", sessionsCount: 4 },
      { serviceId: "serv_5", name: "Deep Tissue Swedish Spa", sessionsCount: 2 }
    ],
    priorityBooking: true,
    loyaltyMultiplier: 2.0,
    specialOffers: ["20% off all retail products", "Free Birthday Spa & Gift Hamper", "Unlimited VIP Suite Access", "Dedicated Stylist Concierge"],
    description: "The ultimate luxury salon experience with 20% discount on all services, complimentary spa packages, and 2x points.",
    active: true
  }
];

export const mockCustomerMemberships = [
  {
    _id: "csub_1",
    salonId: "salon_luxe_123",
    customerId: "cust_1", // Priyanka Chopra
    membershipPlanId: "m_platinum",
    tier: "Platinum",
    startDate: "2026-01-01",
    expiryDate: "2026-12-31",
    status: "Active",
    pricePaid: 20000,
    discountPercentage: 20,
    benefitsUsed: [
      { serviceId: "serv_1", serviceName: "Signature Haircut & Styling", sessionsUsed: 2, totalSessions: 6 },
      { serviceId: "serv_3", serviceName: "24K Gold Luxury Facial", sessionsUsed: 1, totalSessions: 4 },
      { serviceId: "serv_5", serviceName: "Deep Tissue Swedish Spa", sessionsUsed: 0, totalSessions: 2 }
    ],
    history: [
      { date: "2026-01-01", action: "Subscribed", details: "Subscribed to Platinum Elite Club for ₹20,000" },
      { date: "2026-03-10", action: "Benefit Used", details: "Redeemed 1 session of Signature Haircut & Styling" }
    ],
    expiryNotified: false
  },
  {
    _id: "csub_2",
    salonId: "salon_luxe_123",
    customerId: "cust_3", // Deepika Padukone
    membershipPlanId: "m_platinum",
    tier: "Platinum",
    startDate: "2025-09-01",
    expiryDate: "2026-08-31", // Expiring soon!
    status: "Expiring Soon",
    pricePaid: 20000,
    discountPercentage: 20,
    benefitsUsed: [
      { serviceId: "serv_1", serviceName: "Signature Haircut & Styling", sessionsUsed: 5, totalSessions: 6 },
      { serviceId: "serv_3", serviceName: "24K Gold Luxury Facial", sessionsUsed: 3, totalSessions: 4 },
      { serviceId: "serv_5", serviceName: "Deep Tissue Swedish Spa", sessionsUsed: 2, totalSessions: 2 }
    ],
    history: [
      { date: "2025-09-01", action: "Subscribed", details: "Subscribed to Platinum Elite Club for ₹20,000" }
    ],
    expiryNotified: true
  },
  {
    _id: "csub_3",
    salonId: "salon_luxe_123",
    customerId: "cust_2", // Ranveer Singh
    membershipPlanId: "m_gold",
    tier: "Gold",
    startDate: "2026-02-15",
    expiryDate: "2027-02-14",
    status: "Active",
    pricePaid: 10000,
    discountPercentage: 15,
    benefitsUsed: [
      { serviceId: "serv_1", serviceName: "Signature Haircut & Styling", sessionsUsed: 1, totalSessions: 4 },
      { serviceId: "serv_3", serviceName: "24K Gold Luxury Facial", sessionsUsed: 0, totalSessions: 2 }
    ],
    history: [
      { date: "2026-02-15", action: "Subscribed", details: "Subscribed to Gold Royalty Pass for ₹10,000" }
    ],
    expiryNotified: false
  }
];

export const mockStaff = [
  {
    _id: "staff_1",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Emma Watson",
    phone: "9876500001",
    email: "9876500001@salonsync.com",
    role: "Senior Hair Stylist",
    salary: 35000,
    commissionPercentage: 15,
    rating: 4.9,
    specialization: ["Signature Haircut", "Global Balayage", "Keratin Treatment"],
    services: ["serv_1", "serv_2"],
    experienceYears: 6,
    experienceLevel: "Master Artist",
    bio: "Certified senior hair architect specializing in precision couture cuts and multi-tonal hand balayage techniques.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    status: "Active"
  },
  {
    _id: "staff_2",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Brad Pitt",
    phone: "9876500002",
    email: "9876500002@salonsync.com",
    role: "Skin Care Expert",
    salary: 30000,
    commissionPercentage: 12,
    rating: 4.8,
    specialization: ["24K Gold Facial", "Swedish Spa Therapy", "Anti-Aging Peel"],
    services: ["serv_3", "serv_5"],
    experienceYears: 5,
    experienceLevel: "Senior Specialist",
    bio: "Dermatology-certified aesthetician dedicated to cellular glow skin therapies and holistic muscle release massage.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    status: "Active"
  },
  {
    _id: "staff_3",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Angelina Jolie",
    phone: "9876500003",
    email: "daniel@luxegold.com",
    role: "Master Makeup Artist",
    salary: 45000,
    commissionPercentage: 20,
    rating: 5.0,
    specialization: ["Bridal HD Airbrush", "Glamour Makeup", "Couture Styling"],
    services: ["serv_4", "serv_1"],
    experienceYears: 8,
    experienceLevel: "Celebrity Master",
    bio: "Renowned bridal makeup virtuoso with 8+ years creating flawless runway aesthetics for luxury clientele.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
    status: "Active"
  },
  {
    _id: "staff_aarav",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    name: "Aarav Sharma",
    phone: "+91 98765 00003",
    email: "aarav@luxegold.com",
    role: "Stylist & Grooming Expert",
    salary: 26000,
    commissionPercentage: 15,
    rating: 4.7,
    specialization: ["Gentlemen Grooming", "Beard Sculpting", "Hair Spa"],
    services: ["serv_1"],
    experienceYears: 4,
    experienceLevel: "Lead Specialist",
    bio: "Modern men's grooming expert specializing in razor fade cuts, royal beard sculpting, and hair revitalization.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    status: "Active"
  }
];

export const mockReviews = [
  {
    _id: "rev_1",
    salonId: "salon_luxe_123",
    staffId: "staff_1",
    customerId: "cust_1",
    customerName: "Priyanka Chopra",
    serviceName: "Signature Haircut & Styling",
    rating: 5,
    comment: "Emma transformed my hair completely! The balayage tone is rich and gorgeous. Truly world-class styling.",
    date: "2026-06-20"
  },
  {
    _id: "rev_2",
    salonId: "salon_luxe_123",
    staffId: "staff_1",
    customerId: "cust_3",
    customerName: "Deepika Padukone",
    serviceName: "Global Balayage & Highlights",
    rating: 5,
    comment: "Always a 5-star treatment with Emma. Punctual, meticulous, and listens carefully to what I want.",
    date: "2026-06-15"
  },
  {
    _id: "rev_3",
    salonId: "salon_luxe_123",
    staffId: "staff_2",
    customerId: "cust_3",
    customerName: "Deepika Padukone",
    serviceName: "24K Gold Luxury Facial",
    rating: 5,
    comment: "Brad's facial massage is deeply soothing. My skin felt instantly rejuvenated and hydrated.",
    date: "2026-06-18"
  },
  {
    _id: "rev_4",
    salonId: "salon_luxe_123",
    staffId: "staff_3",
    customerId: "cust_1",
    customerName: "Priyanka Chopra",
    serviceName: "Bridal HD Airbrush Makeup",
    rating: 5,
    comment: "Angelina's airbrush technique is legendary! Flawless coverage that lasted all evening through photo shoots.",
    date: "2026-06-10"
  },
  {
    _id: "rev_5",
    salonId: "salon_luxe_123",
    staffId: "staff_aarav",
    customerId: "cust_2",
    customerName: "Ranveer Singh",
    serviceName: "Gentlemen Grooming",
    rating: 4.8,
    comment: "Super sharp edge lineup and beard trim by Aarav. Highly energetic and friendly service!",
    date: "2026-06-12"
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
  // Customer Notifications
  {
    _id: "nt_cust_1",
    salonId: "salon_luxe_123",
    targetRole: "Customer",
    recipientId: "cust_1",
    recipientName: "Priyanka Chopra",
    category: "Appointment",
    type: "WhatsApp",
    title: "Appointment Confirmed",
    message: "Your booking for Signature Haircut & Styling at Luxe & Gold Salon is confirmed for today at 10:30 AM.",
    read: false,
    status: "Sent",
    providerUsed: "MetaCloudAPI",
    createdAt: "2026-06-24T09:30:00Z"
  },
  {
    _id: "nt_cust_2",
    salonId: "salon_luxe_123",
    targetRole: "Customer",
    recipientId: "cust_2",
    recipientName: "Ranveer Singh",
    category: "Payment",
    type: "InApp",
    title: "Payment Received",
    message: "Payment of ₹3,630 received via UPI for Invoice #INV-2026-0002. Thank you for visiting Luxe & Gold!",
    read: true,
    status: "Sent",
    providerUsed: "Internal",
    createdAt: "2026-06-24T10:15:00Z"
  },
  {
    _id: "nt_cust_3",
    salonId: "salon_luxe_123",
    targetRole: "Customer",
    recipientId: "cust_3",
    recipientName: "Deepika Padukone",
    category: "Loyalty",
    type: "WhatsApp",
    title: "Loyalty Points Credited",
    message: "🎉 You've earned 363 Loyalty Points on your recent visit! Current balance: 512 PTS.",
    read: false,
    status: "Sent",
    providerUsed: "MetaCloudAPI",
    createdAt: "2026-06-24T11:00:00Z"
  },
  // Staff Notifications
  {
    _id: "nt_staff_1",
    salonId: "salon_luxe_123",
    targetRole: "Staff",
    recipientId: "staff_1",
    recipientName: "Emma Watson",
    category: "Appointment",
    type: "InApp",
    title: "New Appointment Assigned",
    message: "New 24K Gold Facial appointment assigned with client Deepika Padukone today at 14:00 PM.",
    read: false,
    status: "Sent",
    providerUsed: "Internal",
    createdAt: "2026-06-24T09:00:00Z"
  },
  {
    _id: "nt_staff_2",
    salonId: "salon_luxe_123",
    targetRole: "Staff",
    recipientId: "staff_2",
    recipientName: "David Beckham",
    category: "Review",
    type: "InApp",
    title: "New 5-Star Review Received",
    message: "Client Rahul S. rated your Executive Beard Grooming service 5.0 ★: 'David is an absolute master barber!'",
    read: true,
    status: "Sent",
    providerUsed: "Internal",
    createdAt: "2026-06-23T18:45:00Z"
  },
  // Owner / Manager Notifications
  {
    _id: "nt_owner_1",
    salonId: "salon_luxe_123",
    targetRole: "Owner",
    category: "Inventory",
    type: "InApp",
    title: "Low Inventory Alert",
    message: "⚠️ 2 products are below reorder threshold: Argan Hair Oil (3 left) and Keratin Repair Conditioner (2 left).",
    read: false,
    status: "Sent",
    providerUsed: "Internal",
    createdAt: "2026-06-24T08:30:00Z"
  },
  {
    _id: "nt_owner_2",
    salonId: "salon_luxe_123",
    targetRole: "Owner",
    category: "Expense",
    type: "InApp",
    title: "Unusual Expense Flagged",
    message: "Expense entry of ₹15,000 for 'Spa Salon Equipment Overhaul' exceeds monthly threshold by +35%.",
    read: false,
    status: "Sent",
    providerUsed: "Internal",
    createdAt: "2026-06-24T07:15:00Z"
  },
  {
    _id: "nt_owner_3",
    salonId: "salon_luxe_123",
    targetRole: "Owner",
    category: "DailySummary",
    type: "InApp",
    title: "Daily Business Summary",
    message: "📈 Yesterday's Revenue: ₹28,500 across 18 completed appointments. 100% staff attendance.",
    read: true,
    status: "Sent",
    providerUsed: "Internal",
    createdAt: "2026-06-24T06:00:00Z"
  }
];

export const mockNotificationPrefs = {
  _id: "pref_luxe_1",
  salonId: "salon_luxe_123",
  customerChannels: { InApp: true, WhatsApp: true, SMS: true, Email: false },
  staffChannels: { InApp: true, WhatsApp: true, SMS: false, Email: true },
  ownerChannels: { InApp: true, WhatsApp: true, SMS: true, Email: true }
};

export const mockLoyaltyRules = {
  _id: "rule_luxe_1",
  salonId: "salon_luxe_123",
  pointsEarnedPer100Spent: 10, // Every ₹100 = 10 pts
  pointValueInRupees: 1, // 1 point = ₹1
  expiryMonths: 12,
  maxPointsPerInvoice: 5000,
  maxRedemptionsPerMonth: 10
};

export const mockLoyaltyRewards = [
  {
    _id: "rwd_1",
    salonId: "salon_luxe_123",
    name: "₹200 Instant Bill Voucher",
    type: "Discount",
    pointsCost: 200,
    discountValue: 200,
    description: "Get ₹200 off your final billing invoice instantly on any service or product purchase.",
    expiryDays: 30,
    active: true
  },
  {
    _id: "rwd_2",
    salonId: "salon_luxe_123",
    name: "Free Swedish Head & Shoulder Spa",
    type: "Free Service",
    pointsCost: 350,
    discountValue: 1500,
    serviceId: "serv_5",
    description: "Complimentary 30-minute relaxing muscle-relief scalp & shoulder massage with aromatic oils.",
    expiryDays: 45,
    active: true
  },
  {
    _id: "rwd_3",
    salonId: "salon_luxe_123",
    name: "Free Premium Argan Elixir Shampoo (250ml)",
    type: "Product",
    pointsCost: 450,
    discountValue: 1200,
    productId: "prod_1",
    description: "Take home a complimentary bottle of our signature organic Argan nourishing shampoo.",
    expiryDays: 60,
    active: true
  },
  {
    _id: "rwd_4",
    salonId: "salon_luxe_123",
    name: "VIP Upgrade to 24K Gold Facial",
    type: "Upgrade",
    pointsCost: 400,
    discountValue: 2000,
    description: "Upgrade any basic facial service to our ultra-luxury 24K pure gold foil facial.",
    expiryDays: 30,
    active: true
  },
  {
    _id: "rwd_5",
    salonId: "salon_luxe_123",
    name: "VIP Lounge Pass + 25% Off Next Visit",
    type: "Special Offer",
    pointsCost: 600,
    discountValue: 2500,
    description: "Enjoy exclusive VIP Suite access, herbal teas, and a 25% discount voucher on your next treatment.",
    expiryDays: 90,
    active: true
  }
];

export const mockLoyaltyTransactions = [
  {
    _id: "tx_1",
    salonId: "salon_luxe_123",
    customerId: "cust_1", // Priyanka
    type: "Earned",
    points: 298,
    pointsEarned: 298,
    balanceAfter: 345,
    transactionAmount: 2986,
    invoiceId: "inv_1",
    description: "Earned 298 pts on Invoice INV-2026-0001 (₹2,986)",
    date: "2026-06-23T14:30:00Z"
  },
  {
    _id: "tx_2",
    salonId: "salon_luxe_123",
    customerId: "cust_3", // Deepika
    type: "Earned",
    points: 363,
    pointsEarned: 363,
    balanceAfter: 512,
    transactionAmount: 3630,
    invoiceId: "inv_2",
    description: "Earned 363 pts on Invoice INV-2026-0002 (₹3,630)",
    date: "2026-06-24T10:15:00Z"
  },
  {
    _id: "tx_3",
    salonId: "salon_luxe_123",
    customerId: "cust_2", // Ranveer
    type: "Redeemed",
    points: -200,
    pointsRedeemed: 200,
    balanceAfter: 120,
    rewardId: "rwd_1",
    description: "Redeemed reward '₹200 Instant Bill Voucher' (-200 pts)",
    date: "2026-06-22T11:00:00Z"
  }
];

export const mockWhatsAppConfig = {
  _id: "wcfg_luxe_1",
  salonId: "salon_luxe_123",
  provider: "Unconfigured", // 'MetaCloudAPI', 'Twilio', 'Interakt', 'AISensy', 'Unconfigured'
  apiKey: "",
  phoneNumberId: "",
  webhookSecret: "",
  enabledTriggers: {
    Confirmation: true,
    Reminder: true,
    Cancellation: true,
    Rescheduled: true,
    Invoice: true,
    Payment: true,
    Birthday: true,
    MembershipExpiry: true,
    Loyalty: true,
    Revisit: true,
    Promo: true
  }
};

export const mockWhatsAppTemplates = {
  Confirmation: "Hello {{customerName}}! 🎉 Your booking for {{serviceName}} at {{salonName}} is CONFIRMED for {{appointmentDate}} at {{appointmentTime}}. Stylist: {{staffName}}. We look forward to welcoming you!",
  Reminder: "Hi {{customerName}}, reminder for your upcoming session: {{serviceName}} today at {{appointmentTime}} with {{staffName}} at {{salonName}}. Need to adjust? Reply to this message.",
  Cancellation: "Dear {{customerName}}, your appointment for {{serviceName}} on {{appointmentDate}} at {{salonName}} has been CANCELLED as requested. We hope to see you soon!",
  Rescheduled: "Hello {{customerName}}, your appointment at {{salonName}} has been RESCHEDULED to {{appointmentDate}} at {{appointmentTime}} for {{serviceName}} with {{staffName}}.",
  Invoice: "Hi {{customerName}}, thank you for visiting {{salonName}}! Your tax invoice #{{invoiceNumber}} for {{invoiceAmount}} is ready. Download receipt: {{invoiceUrl}}. Thank you!",
  Payment: "Dear {{customerName}}, payment of {{amountPaid}} received via {{paymentMethod}} at {{salonName}}. Invoice #{{invoiceNumber}}. Thank you for your business!",
  Birthday: "🎉 Happy Birthday {{customerName}}! 🎂 Celebrate with {{salonName}} — enjoy a complimentary Birthday Blowdry & 20% OFF your visit this week! Reply to claim.",
  MembershipExpiry: "Dear {{customerName}}, your {{salonName}} {{membershipTier}} Membership expires on {{expiryDate}}. Renew today to keep your {{discountPercentage}}% discount privileges!",
  Loyalty: "🎉 Congratulations {{customerName}}! You've earned {{pointsEarned}} Loyalty Points at {{salonName}}. Current Balance: {{loyaltyBalance}} PTS. Redeem for instant vouchers on your next visit!",
  Revisit: "We miss you {{customerName}}! It's been a while since your last pampering session at {{salonName}}. Book your next haircut or facial today & get 15% OFF! Reply BOOK.",
  Promo: "✨ Exclusive Offer from {{salonName}}! Book any facial package this weekend & receive a FREE scalp spa! Limited slots available. Reply to book now."
};

export const mockAuditLogs = [
  {
    _id: "log_101",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    branchName: "Bandra Flagship",
    userId: "usr_owner_1",
    userName: "Alexander Wright",
    userRole: "SALON_OWNER",
    action: "PRICE_CHANGE",
    entity: "Service",
    entityId: "srv_1",
    entityName: "Signature Haircut & Styling",
    previousValue: { price: 500, duration: 45 },
    newValue: { price: 750, duration: 45 },
    timestamp: "2026-06-24T11:45:00Z"
  },
  {
    _id: "log_102",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    branchName: "Bandra Flagship",
    userId: "usr_owner_1",
    userName: "Alexander Wright",
    userRole: "SALON_OWNER",
    action: "UPDATE",
    entity: "Customer",
    entityId: "cust_1",
    entityName: "Priyanka Chopra",
    previousValue: { membershipLevel: "Silver Pass", totalSpent: 2800 },
    newValue: { membershipLevel: "Gold Pass", totalSpent: 3630 },
    timestamp: "2026-06-24T10:30:00Z"
  },
  {
    _id: "log_103",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    branchName: "Bandra Flagship",
    userId: "usr_mgr_1",
    userName: "Victoria Beckham",
    userRole: "SALON_MANAGER",
    action: "STATUS_CHANGE",
    entity: "Appointment",
    entityId: "appt_1",
    entityName: "24K Gold Facial (Priyanka Chopra)",
    previousValue: { status: "Confirmed" },
    newValue: { status: "Completed" },
    timestamp: "2026-06-24T09:15:00Z"
  },
  {
    _id: "log_104",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    branchName: "Bandra Flagship",
    userId: "usr_owner_1",
    userName: "Alexander Wright",
    userRole: "SALON_OWNER",
    action: "PERMISSION_CHANGE",
    entity: "Staff",
    entityId: "staff_1",
    entityName: "Emma Watson",
    previousValue: { role: "Stylist", commissionPercentage: 10 },
    newValue: { role: "Senior Specialist", commissionPercentage: 15 },
    timestamp: "2026-06-23T16:20:00Z"
  },
  {
    _id: "log_105",
    salonId: "salon_luxe_123",
    branchId: "branch_mumbai_1",
    branchName: "Bandra Flagship",
    userId: "usr_mgr_1",
    userName: "Victoria Beckham",
    userRole: "SALON_MANAGER",
    action: "CREATE",
    entity: "Expense",
    entityId: "exp_1",
    entityName: "Spa Equipment Maintenance",
    previousValue: null,
    newValue: { amount: 15000, category: "Equipment" },
    timestamp: "2026-06-23T14:10:00Z"
  }
];
