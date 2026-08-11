import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GlassCard } from './GlassCard';
import { COLORS } from '../constants/theme';
import { Salon, Service, Staff, Appointment } from '../types';
import { Star, MapPin, Phone, Calendar, Clock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react-native';

// Rating Stars
export const RatingStars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => {
  return (
    <View style={styles.starRow}>
      <Star size={size} color={COLORS.primaryGold} fill={COLORS.primaryGold} />
      <Text style={styles.starText}>{rating ? rating.toFixed(1) : '5.0'}</Text>
    </View>
  );
};

// Salon Card
export const SalonCard: React.FC<{ salon: Salon; onPress: () => void }> = ({ salon, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <GlassCard style={styles.salonCard}>
        <View style={styles.salonHeader}>
          <View style={styles.salonLogoBox}>
            <Text style={styles.salonLogoText}>{salon.name.charAt(0)}</Text>
          </View>
          <View style={styles.salonInfo}>
            <Text style={styles.salonName}>{salon.name}</Text>
            <View style={styles.salonLocation}>
              <MapPin size={12} color={COLORS.primaryGold} />
              <Text style={styles.salonCity}>{salon.city || 'Mumbai'}, {salon.state || 'Maharashtra'}</Text>
            </View>
          </View>
          <RatingStars rating={salon.rating || 4.8} />
        </View>

        <View style={styles.salonFooter}>
          <Text style={styles.planBadge}>{salon.subscriptionPlan || 'Starter Salon'}</Text>
          <View style={styles.bookAction}>
            <Text style={styles.bookText}>View Services</Text>
            <ChevronRight size={14} color={COLORS.primaryGold} />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

// Service Card
export const ServiceCard: React.FC<{
  service: Service;
  onPress?: () => void;
  selected?: boolean;
}> = ({ service, onPress, selected }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <GlassCard style={[styles.serviceCard, selected && styles.selectedServiceCard]}>
        <View style={styles.serviceHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceCategory}>{service.category} • {service.duration} mins</Text>
          </View>
          <Text style={styles.servicePrice}>₹{service.price}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

// Staff Card
export const StaffCard: React.FC<{
  staff: Staff;
  onPress?: () => void;
  selected?: boolean;
}> = ({ staff, onPress, selected }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <GlassCard style={[styles.staffCard, selected && styles.selectedStaffCard]}>
        <View style={styles.staffHeader}>
          <View style={styles.staffAvatar}>
            <Text style={styles.avatarText}>{staff.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.staffName}>{staff.name}</Text>
            <Text style={styles.staffRole}>{staff.role}</Text>
          </View>
          <RatingStars rating={staff.rating || 5.0} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

// Appointment Card
export const AppointmentCard: React.FC<{
  appointment: Appointment;
  onPress?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}> = ({ appointment, onPress, onAction, actionLabel }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return COLORS.successGreen;
      case 'Cancelled': return COLORS.dangerRed;
      case 'In Progress': return COLORS.infoBlue;
      default: return COLORS.primaryGold;
    }
  };

  const salonObj = typeof appointment.salonId === 'object' ? appointment.salonId : null;
  const staffObj = typeof appointment.staffId === 'object' ? appointment.staffId : null;
  const customerObj = typeof appointment.customerId === 'object' ? appointment.customerId : null;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <GlassCard style={styles.appointmentCard}>
        <View style={styles.apptHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.apptTitle}>
              {appointment.services?.map(s => s.name).join(', ') || 'Salon Session'}
            </Text>
            <Text style={styles.apptSub}>
              {salonObj ? salonObj.name : 'SalonSync Partner'} {staffObj ? `• Stylist: ${staffObj.name}` : ''}
            </Text>
            {customerObj && <Text style={styles.apptCustomer}>Client: {customerObj.name}</Text>}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(appointment.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
              {appointment.status}
            </Text>
          </View>
        </View>

        <View style={styles.apptDetailsRow}>
          <View style={styles.detailItem}>
            <Calendar size={13} color={COLORS.primaryGold} />
            <Text style={styles.detailText}>{new Date(appointment.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={13} color={COLORS.primaryGold} />
            <Text style={styles.detailText}>{appointment.time}</Text>
          </View>
          <Text style={styles.priceText}>
            ₹{appointment.services?.reduce((s, i) => s + (i.price || 0), 0) || 0}
          </Text>
        </View>

        {onAction && actionLabel && (
          <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
            <Text style={styles.actionBtnText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

// Stat Card
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ title, value, subtitle, color = COLORS.primaryGold, icon }) => {
  return (
    <GlassCard style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        {icon}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </GlassCard>
  );
};

// Empty State
export const EmptyStateCard: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
}> = ({ title, description, icon }) => {
  return (
    <GlassCard style={styles.emptyContainer}>
      {icon || <AlertCircle size={32} color={COLORS.primaryGold} />}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{description}</Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  starText: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '700',
  },
  salonCard: {
    marginBottom: 14,
  },
  salonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  salonLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salonLogoText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 18,
  },
  salonInfo: {
    flex: 1,
  },
  salonName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  salonLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  salonCity: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  salonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  planBadge: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  bookAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bookText: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: '600',
  },
  serviceCard: {
    marginBottom: 10,
  },
  selectedServiceCard: {
    borderColor: COLORS.primaryGold,
    backgroundColor: COLORS.goldBg,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  serviceCategory: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  servicePrice: {
    color: COLORS.primaryGold,
    fontSize: 16,
    fontWeight: '800',
  },
  staffCard: {
    marginBottom: 10,
  },
  selectedStaffCard: {
    borderColor: COLORS.primaryGold,
    backgroundColor: COLORS.goldBg,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.goldBg,
    borderWidth: 1,
    borderColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primaryGold,
    fontWeight: '700',
    fontSize: 16,
  },
  staffName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  staffRole: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  appointmentCard: {
    marginBottom: 14,
  },
  apptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  apptTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  apptSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  apptCustomer: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  apptDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  priceText: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtn: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.goldBg,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGold,
  },
  actionBtnText: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '700',
  },
  statCard: {
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  statSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginVertical: 12,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  }
});
