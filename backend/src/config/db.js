const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salonsync');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed default users and multi-tenant structures if User database is empty
    await seedDatabase();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Do not crash the server in dev mode if MongoDB is not running; fall back gracefully
    console.log('Server running in standalone mode (no live database connection).');
  }
};

const seedDatabase = async () => {
  try {
    // Import models to register schemas
    const models = require('../models');
    const userCount = await models.User.countDocuments();
    
    if (userCount > 0) {
      console.log('Database already populated. Skipping auto-seeding.');
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
        name: "SalonSync Administrator",
        email: "admin@salonflow.ai",
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
      }
    ]);
    
    console.log('Database auto-seeding completed successfully.');
  } catch (error) {
    console.error(`Database auto-seeding failed: ${error.message}`);
  }
};

module.exports = connectDB;
