const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  // Set bufferCommands to false so Mongoose fails quickly instead of buffering and timing out
  mongoose.set('bufferCommands', false);

  const primaryURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salonsync';
  const fallbackURI = 'mongodb://127.0.0.1:27017/salonsync';

  try {
    console.log('Connecting to Primary MongoDB Database...');
    const conn = await mongoose.connect(primaryURI, {
      serverSelectionTimeoutMS: 5000 // 5s timeout
    });
    console.log(`MongoDB Connected (Primary): ${conn.connection.host}`);
    
    // Auto-seed default users and multi-tenant structures if User database is empty
    await seedDatabase();

    // Drop unique index on invoiceNumber to support multiple salons
    try {
      await mongoose.connection.db.collection('invoices').dropIndex('invoiceNumber_1');
      console.log('Dropped unique index invoiceNumber_1 to support multiple salons.');
    } catch (e) {
      // index not found, ignore
    }
  } catch (primaryError) {
    console.error(`Primary Database connection error: ${primaryError.message}`);
    
    if (primaryURI !== fallbackURI) {
      console.log('Attempting connection to local fallback MongoDB database...');
      try {
        const conn = await mongoose.connect(fallbackURI, {
          serverSelectionTimeoutMS: 3000 // 3s timeout
        });
        console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
        await seedDatabase();

        try {
          await mongoose.connection.db.collection('invoices').dropIndex('invoiceNumber_1');
          console.log('Dropped unique index invoiceNumber_1 to support multiple salons on fallback.');
        } catch (e) {}
      } catch (fallbackError) {
        console.error(`Local fallback Database connection also failed: ${fallbackError.message}`);
        console.log('===================================================');
        console.log('  WARNING: NO ACTIVE DATABASE CONNECTION.');
        console.log('  Mongoose queries will fail immediately.');
        console.log('  Enable Demo (Offline Mock) Mode on the client.');
        console.log('===================================================');
      }
    } else {
      console.log('===================================================');
      console.log('  WARNING: NO ACTIVE DATABASE CONNECTION.');
      console.log('  Mongoose queries will fail immediately.');
      console.log('  Enable Demo (Offline Mock) Mode on the client.');
      console.log('===================================================');
    }
  }
};

const seedDatabase = async () => {
  try {
    // Import models to register schemas
    const models = require('../models');
    const userCount = await models.User.countDocuments();
    
    if (userCount > 0) {
      console.log('Database already populated. Checking services and products...');
      await models.User.updateOne(
        { email: 'admin@salonsync.com' },
        { name: 'Ankit Palani' }
      );

      // Seed dynamic Aarav Sharma and Isha Patel if missing
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = await bcrypt.hash('password123', salt);
      const luxeSalon = await models.Salon.findOne({ ownerName: 'Alexander Wright' });
      const bandraBranch = luxeSalon ? await models.Branch.findOne({ salonId: luxeSalon._id }) : null;

      if (luxeSalon && bandraBranch) {
        // Aarav Sharma User
        const hasAaravUser = await models.User.findOne({ email: 'aarav@luxegold.com' });
        if (!hasAaravUser) {
          await models.User.create({
            name: "Aarav Sharma",
            email: "aarav@luxegold.com",
            phone: "+91 98765 00003",
            password: defaultPassword,
            role: "STAFF",
            salonId: luxeSalon._id,
            branchId: bandraBranch._id
          });
        }

        // Aarav Sharma Staff Profile
        const hasAaravStaff = await models.Staff.findOne({ name: "Aarav Sharma" });
        if (!hasAaravStaff) {
          await models.Staff.create({
            salonId: luxeSalon._id,
            branchId: bandraBranch._id,
            name: "Aarav Sharma",
            phone: "+91 98765 00003",
            role: "Stylist & Grooming Expert",
            salary: 25000,
            commissionPercentage: 15,
            rating: 4.7
          });
        }

        // Isha Patel User
        const hasIshaUser = await models.User.findOne({ email: 'isha@luxegold.com' });
        if (!hasIshaUser) {
          await models.User.create({
            name: "Isha Patel",
            email: "isha@luxegold.com",
            phone: "9812222222",
            password: defaultPassword,
            role: "CLIENT",
            salonId: luxeSalon._id,
            branchId: bandraBranch._id
          });
        }

        // Isha Patel Customer Profile
        const hasIshaCustomer = await models.Customer.findOne({ email: 'isha@luxegold.com' });
        if (!hasIshaCustomer) {
          await models.Customer.create({
            salonId: luxeSalon._id,
            branchId: bandraBranch._id,
            name: "Isha Patel",
            phone: "9812222222",
            email: "isha@luxegold.com",
            gender: "Female",
            birthday: new Date("1996-04-12"),
            address: "Juhu Heights, Mumbai",
            notes: "Enjoys organic hair spas.",
            loyaltyPoints: 150,
            membershipLevel: "Gold"
          });
        }
      }
      
      const salon = await models.Salon.findOne();
      if (salon) {
        const serviceCount = await models.Service.countDocuments({ salonId: salon._id });
        if (serviceCount < 5) {
          console.log('Adding additional catalog services...');
          await models.Service.deleteMany({ salonId: salon._id });
          await models.Service.create([
            {
              salonId: salon._id,
              name: "Signature Haircut & Styling",
              category: "Haircut",
              duration: 45,
              price: 1500,
              materialCost: 150,
              description: "Wash, conditioning, custom styling, and blow dry by senior artist."
            },
            {
              salonId: salon._id,
              name: "Global Balayage & Highlights",
              category: "Hair Color",
              duration: 120,
              price: 6500,
              materialCost: 1200,
              description: "Premium gold-toned hair highlights with damage defense shield."
            },
            {
              salonId: salon._id,
              name: "Keratin Smooth Treatment",
              category: "Other",
              duration: 90,
              price: 4500,
              materialCost: 800,
              description: "Long-lasting frizz control and hair straightening treatment."
            },
            {
              salonId: salon._id,
              name: "O3+ Bridal Gold Facial",
              category: "Facial",
              duration: 60,
              price: 3500,
              materialCost: 600,
              description: "Luxury skin brightening facial with gold micro-particles."
            },
            {
              salonId: salon._id,
              name: "Deep Tissue Swedish Massage",
              category: "Spa",
              duration: 60,
              price: 2500,
              materialCost: 300,
              description: "Therapeutic body massage to relieve deep muscle tension."
            },
            {
              salonId: salon._id,
              name: "Charcoal Detox Pedicure",
              category: "Spa",
              duration: 45,
              price: 1200,
              materialCost: 150,
              description: "Purifying clay mask massage and nail cleaning service."
            },
            {
              salonId: salon._id,
              name: "Classic Beard Trim & Shave",
              category: "Haircut",
              duration: 30,
              price: 600,
              materialCost: 50,
              description: "Precise razor shaping with hot towel treatment."
            }
          ]);
        }

        const productCount = await models.Product.countDocuments({ salonId: salon._id });
        if (productCount < 5) {
          console.log('Adding catalog products...');
          await models.Product.deleteMany({ salonId: salon._id });
          await models.Product.create([
            {
              salonId: salon._id,
              name: "L'Oreal Professional Absolut Repair Shampoo",
              sku: "LOR-AR-250",
              category: "Hair Care",
              quantity: 25,
              purchasePrice: 450,
              sellingPrice: 750,
              lowStockThreshold: 3
            },
            {
              salonId: salon._id,
              name: "Kerastase Elixir Ultime Hair Oil",
              sku: "KER-EU-100",
              category: "Hair Care",
              quantity: 15,
              purchasePrice: 1800,
              sellingPrice: 2800,
              lowStockThreshold: 2
            },
            {
              salonId: salon._id,
              name: "Moroccanoil Treatment Original",
              sku: "MOR-TO-100",
              category: "Hair Care",
              quantity: 10,
              purchasePrice: 2200,
              sellingPrice: 3200,
              lowStockThreshold: 2
            },
            {
              salonId: salon._id,
              name: "O3+ Brightening Facial Mask",
              sku: "O3P-BFM-50",
              category: "Skin Care",
              quantity: 20,
              purchasePrice: 380,
              sellingPrice: 650,
              lowStockThreshold: 4
            },
            {
              salonId: salon._id,
              name: "Lotus Herbals Safe Sun SPF 50",
              sku: "LOT-SS-100",
              category: "Skin Care",
              quantity: 30,
              purchasePrice: 220,
              sellingPrice: 395,
              lowStockThreshold: 5
            },
            {
              salonId: salon._id,
              name: "Schwarzkopf Taft Hair Wax",
              sku: "SCW-THW-85",
              category: "Hair Care",
              quantity: 40,
              purchasePrice: 250,
              sellingPrice: 450,
              lowStockThreshold: 5
            }
          ]);
        }
      }
      return;
    }
    
    console.log('Database is empty. Automatically seeding default enterprise multi-tenant configuration...');
    
    // Clear other collections if user is empty to avoid half-seeded databases
    await models.Salon.deleteMany({});
    await models.Branch.deleteMany({});
    await models.Customer.deleteMany({});
    await models.Staff.deleteMany({});
    await models.Service.deleteMany({});
    await models.Product.deleteMany({});
    await models.Supplier.deleteMany({});
    await models.Expense.deleteMany({});
    await models.Appointment.deleteMany({});
    await models.Invoice.deleteMany({});
    await models.Attendance.deleteMany({});
    await models.Commission.deleteMany({});
    
    // 1. Create default Salons
    const luxeSalon = await models.Salon.create({
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
    });
    
    const royalSalon = await models.Salon.create({
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
    });
    
    // 2. Create default Branches
    const bandraBranch = await models.Branch.create({
      salonId: luxeSalon._id,
      name: "Bandra Flagship",
      address: "Carter Road, Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      phone: "+91 22 2640 1234",
      status: "Active"
    });
    
    const juhuBranch = await models.Branch.create({
      salonId: luxeSalon._id,
      name: "Juhu Salon Suite",
      address: "JVPD Scheme, Juhu",
      city: "Mumbai",
      state: "Maharashtra",
      phone: "+91 22 2620 5678",
      status: "Active"
    });
    
    const cpBranch = await models.Branch.create({
      salonId: royalSalon._id,
      name: "CP Grooming Lounge",
      address: "Radial Road 2, Connaught Place",
      city: "Delhi",
      state: "Delhi",
      phone: "+91 11 4150 9999",
      status: "Active"
    });
    
    // 3. Create default Users (Passwords are all hashed)
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);
    
    await models.User.create([
      {
        name: "Ankit Palani",
        email: "admin@salonsync.com",
        phone: "+91 99999 88888",
        password: defaultPassword,
        role: "SUPER_ADMIN"
      },
      {
        name: "Alexander Wright",
        email: "alex@luxegold.com",
        phone: "+91 98765 43210",
        password: defaultPassword,
        role: "FRANCHISE_OWNER",
        salonId: luxeSalon._id,
        branchId: bandraBranch._id
      },
      {
        name: "Victoria Beckham",
        email: "victoria@luxegold.com",
        phone: "+91 98765 43211",
        password: defaultPassword,
        role: "SALON_MANAGER",
        salonId: luxeSalon._id,
        branchId: bandraBranch._id
      },
      {
        name: "Rachel Green",
        email: "rachel@luxegold.com",
        phone: "+91 98765 43212",
        password: defaultPassword,
        role: "STAFF",
        salonId: luxeSalon._id,
        branchId: bandraBranch._id
      },
      {
        name: "Daniel Craig",
        email: "daniel@luxegold.com",
        phone: "+91 98765 43213",
        password: defaultPassword,
        role: "STAFF",
        salonId: luxeSalon._id,
        branchId: bandraBranch._id
      },
      {
        name: "Priyanka Chopra",
        email: "priyanka@chopra.com",
        phone: "9819999999",
        password: defaultPassword,
        role: "CLIENT",
        salonId: luxeSalon._id,
        branchId: bandraBranch._id
      },
      {
        name: "Aarav Sharma",
        email: "aarav@luxegold.com",
        phone: "+91 98765 00003",
        password: defaultPassword,
        role: "STAFF",
        salonId: luxeSalon._id,
        branchId: bandraBranch._id
      },
      {
        name: "Isha Patel",
        email: "isha@luxegold.com",
        phone: "9812222222",
        password: defaultPassword,
        role: "CLIENT",
        salonId: luxeSalon._id,
        branchId: bandraBranch._id
      }
    ]);
    
    // 4. Create Customers
    await models.Customer.create({
      salonId: luxeSalon._id,
      branchId: bandraBranch._id,
      name: "Priyanka Chopra",
      phone: "9819999999",
      email: "priyanka@chopra.com",
      gender: "Female",
      birthday: new Date("1982-07-18"),
      address: "Bandra Seafront Apartment",
      notes: "Requires organic products only. Prefers Jasmine tea during treatment.",
      loyaltyPoints: 345,
      membershipLevel: "Platinum"
    });
    
    await models.Customer.create({
      salonId: luxeSalon._id,
      branchId: bandraBranch._id,
      name: "Ranveer Singh",
      phone: "9828888888",
      email: "ranveer@singh.com",
      gender: "Male",
      birthday: new Date("1985-07-06"),
      address: "JVPD Scheme Bungalow",
      notes: "Enjoys funky hairstyles. Loud music enthusiast.",
      loyaltyPoints: 120,
      membershipLevel: "Gold"
    });

    await models.Customer.create({
      salonId: luxeSalon._id,
      branchId: bandraBranch._id,
      name: "Isha Patel",
      phone: "9812222222",
      email: "isha@luxegold.com",
      gender: "Female",
      birthday: new Date("1996-04-12"),
      address: "Juhu Heights, Mumbai",
      notes: "Enjoys organic hair spas.",
      loyaltyPoints: 150,
      membershipLevel: "Gold"
    });
    
    // 5. Create Staff
    await models.Staff.create({
      salonId: luxeSalon._id,
      branchId: bandraBranch._id,
      name: "Emma Watson",
      phone: "9876500001",
      role: "Senior Hair Stylist",
      salary: 30000,
      commissionPercentage: 15,
      rating: 4.9
    });
    
    await models.Staff.create({
      salonId: luxeSalon._id,
      branchId: bandraBranch._id,
      name: "Brad Pitt",
      phone: "9876500002",
      role: "Skin Care Expert",
      salary: 28000,
      commissionPercentage: 12,
      rating: 4.8
    });

    await models.Staff.create({
      salonId: luxeSalon._id,
      branchId: bandraBranch._id,
      name: "Aarav Sharma",
      phone: "+91 98765 00003",
      role: "Stylist & Grooming Expert",
      salary: 25000,
      commissionPercentage: 15,
      rating: 4.7
    });
    
    // 6. Create Services
    await models.Service.create([
      {
        salonId: luxeSalon._id,
        name: "Signature Haircut & Styling",
        category: "Haircut",
        duration: 45,
        price: 1500,
        materialCost: 150,
        description: "Wash, conditioning, custom styling, and blow dry by senior artist."
      },
      {
        salonId: luxeSalon._id,
        name: "Global Balayage & Highlights",
        category: "Hair Color",
        duration: 120,
        price: 6500,
        materialCost: 1200,
        description: "Premium gold-toned hair highlights with damage defense shield."
      },
      {
        salonId: luxeSalon._id,
        name: "Keratin Smooth Treatment",
        category: "Other",
        duration: 90,
        price: 4500,
        materialCost: 800,
        description: "Long-lasting frizz control and hair straightening treatment."
      },
      {
        salonId: luxeSalon._id,
        name: "O3+ Bridal Gold Facial",
        category: "Facial",
        duration: 60,
        price: 3500,
        materialCost: 600,
        description: "Luxury skin brightening facial with gold micro-particles."
      },
      {
        salonId: luxeSalon._id,
        name: "Deep Tissue Swedish Massage",
        category: "Spa",
        duration: 60,
        price: 2500,
        materialCost: 300,
        description: "Therapeutic body massage to relieve deep muscle tension."
      },
      {
        salonId: luxeSalon._id,
        name: "Charcoal Detox Pedicure",
        category: "Spa",
        duration: 45,
        price: 1200,
        materialCost: 150,
        description: "Purifying clay mask massage and nail cleaning service."
      },
      {
        salonId: luxeSalon._id,
        name: "Classic Beard Trim & Shave",
        category: "Haircut",
        duration: 30,
        price: 600,
        materialCost: 50,
        description: "Precise razor shaping with hot towel treatment."
      }
    ]);

    // 7. Create Products
    await models.Product.create([
      {
        salonId: luxeSalon._id,
        name: "L'Oreal Professional Absolut Repair Shampoo",
        sku: "LOR-AR-250",
        category: "Hair Care",
        quantity: 25,
        purchasePrice: 450,
        sellingPrice: 750,
        lowStockThreshold: 3
      },
      {
        salonId: luxeSalon._id,
        name: "Kerastase Elixir Ultime Hair Oil",
        sku: "KER-EU-100",
        category: "Hair Care",
        quantity: 15,
        purchasePrice: 1800,
        sellingPrice: 2800,
        lowStockThreshold: 2
      },
      {
        salonId: luxeSalon._id,
        name: "Moroccanoil Treatment Original",
        sku: "MOR-TO-100",
        category: "Hair Care",
        quantity: 10,
        purchasePrice: 2200,
        sellingPrice: 3200,
        lowStockThreshold: 2
      },
      {
        salonId: luxeSalon._id,
        name: "O3+ Brightening Facial Mask",
        sku: "O3P-BFM-50",
        category: "Skin Care",
        quantity: 20,
        purchasePrice: 380,
        sellingPrice: 650,
        lowStockThreshold: 4
      },
      {
        salonId: luxeSalon._id,
        name: "Lotus Herbals Safe Sun SPF 50",
        sku: "LOT-SS-100",
        category: "Skin Care",
        quantity: 30,
        purchasePrice: 220,
        sellingPrice: 395,
        lowStockThreshold: 5
      },
      {
        salonId: luxeSalon._id,
        name: "Schwarzkopf Taft Hair Wax",
        sku: "SCW-THW-85",
        category: "Hair Care",
        quantity: 40,
        purchasePrice: 250,
        sellingPrice: 450,
        lowStockThreshold: 5
      }
    ]);
    
    console.log('Database auto-seeding completed successfully.');
  } catch (error) {
    console.error(`Database auto-seeding failed: ${error.message}`);
  }
};

module.exports = connectDB;
