import { apiClient } from '../api/client';
import { User, Salon, Service, Staff, Appointment, Customer, Invoice, Review } from '../types';

export const authService = {
  async login(identifier: string, password?: string) {
    const res = await apiClient.post('/auth/login', { email: identifier, password });
    return res.data;
  },

  async signup(data: { ownerName: string; email: string; phone: string; password?: string; role: string }) {
    const res = await apiClient.post('/auth/signup', data);
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: { email: string; otp: string; newPassword?: string }) {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  }
};

export const salonService = {
  async getSalons(): Promise<Salon[]> {
    const res = await apiClient.get('/salons');
    return res.data.data || [];
  },

  async getPublicServices(): Promise<Service[]> {
    const res = await apiClient.get('/public/services');
    return res.data.data || [];
  }
};

export const serviceService = {
  async getServices(): Promise<Service[]> {
    const res = await apiClient.get('/services');
    return res.data.data || [];
  }
};

export const staffService = {
  async getStaffList(): Promise<Staff[]> {
    const res = await apiClient.get('/staff');
    return res.data.data || [];
  },

  async getAttendance(): Promise<any[]> {
    const res = await apiClient.get('/attendance');
    return res.data.data || [];
  },

  async recordAttendance(staffId: string, action: 'clockin' | 'clockout') {
    const res = await apiClient.post('/attendance', { staffId, action });
    return res.data;
  },

  async getCommissions(): Promise<any[]> {
    const res = await apiClient.get('/commissions');
    return res.data.data || [];
  }
};

export const appointmentService = {
  async getAppointments(): Promise<Appointment[]> {
    const res = await apiClient.get('/appointments');
    return res.data.data || [];
  },

  async createAppointment(data: {
    salonId: string;
    branchId?: string;
    customerId?: string;
    services: Array<{ serviceId: string; name: string; price: number }>;
    staffId: string;
    date: string;
    time: string;
  }): Promise<Appointment> {
    const res = await apiClient.post('/appointments', data);
    return res.data.data;
  },

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    const res = await apiClient.put(`/appointments/${id}`, { status });
    return res.data.data;
  }
};

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const res = await apiClient.get('/customers');
    return res.data.data || [];
  }
};

export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const res = await apiClient.get('/invoices');
    return res.data.data || [];
  }
};

export const reviewService = {
  async getReviews(): Promise<Review[]> {
    const res = await apiClient.get('/reviews');
    return res.data.data || [];
  },

  async createReview(data: { salonId: string; staffId?: string; rating: number; comment?: string }) {
    const res = await apiClient.post('/reviews', data);
    return res.data;
  }
};
