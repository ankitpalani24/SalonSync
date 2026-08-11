export type UserRole = 'CLIENT' | 'STAFF' | 'SALON_OWNER' | 'SALON_MANAGER' | 'FRANCHISE_OWNER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  salonId?: string;
  branchId?: string;
}

export interface Salon {
  _id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  rating?: number;
  photo?: string;
  subscriptionPlan?: string;
}

export interface Branch {
  _id: string;
  salonId: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  status: 'Active' | 'Inactive';
}

export interface Service {
  _id: string;
  salonId: string;
  name: string;
  category: string;
  duration: number; // in minutes
  price: number;
  materialCost?: number;
  description?: string;
}

export interface Staff {
  _id: string;
  salonId: string;
  branchId?: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  rating: number;
  salary?: number;
  commissionPercentage?: number;
  photo?: string;
}

export interface Appointment {
  _id: string;
  salonId: string | Salon;
  branchId?: string | Branch;
  customerId: string | Customer;
  staffId: string | Staff;
  services: Array<{
    serviceId: string;
    name: string;
    price: number;
  }>;
  date: string;
  time: string;
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt?: string;
}

export interface Customer {
  _id: string;
  salonId: string;
  branchId?: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  membershipLevel: 'None' | 'Silver' | 'Gold' | 'Platinum';
  gender?: string;
  birthday?: string;
  address?: string;
  photo?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  salonId: string;
  customerId?: Customer | string;
  services: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  products?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  tax: number;
  discount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  createdAt: string;
}

export interface Review {
  _id: string;
  salonId: string;
  staffId?: string;
  customerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface LoyaltyPoint {
  _id: string;
  customerId: string;
  pointsEarned: number;
  transactionAmount: number;
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  staffId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workingHours: number;
}

export interface CommissionRecord {
  _id: string;
  staffId: string;
  revenueGenerated: number;
  commissionRate: number;
  commissionEarned: number;
  date: string;
}

export type RootStackParamList = {
  Auth: undefined;
  ClientTabs: undefined;
  StaffTabs: undefined;
  SalonDetails: { salon: Salon };
  ServiceDetails: { service: Service; salon: Salon };
  Booking: { salon: Salon; initialService?: Service; initialStaff?: Staff };
  AppointmentDetails: { appointment: Appointment };
  StaffAppointmentDetails: { appointment: Appointment };
  StaffCustomerDetails: { customer: Customer };
  InvoiceViewer: { invoice: Invoice };
  WriteReview: { salonId: string; staffId?: string; staffName?: string };
};
