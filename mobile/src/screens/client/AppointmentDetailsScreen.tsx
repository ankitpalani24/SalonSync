import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { appointmentService } from '../../services/apiServices';
import { Appointment } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { SecondaryButton, PrimaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { ArrowLeft, Calendar, Clock, MapPin, Scissors, User, DollarSign } from 'lucide-react-native';

export const AppointmentDetailsScreen = ({ route, navigation }: any) => {
  const { appointment } = route.params as { appointment: Appointment };
  const salonObj = typeof appointment.salonId === 'object' ? appointment.salonId : null;
  const staffObj = typeof appointment.staffId === 'object' ? appointment.staffId : null;

  const handleCancelAppointment = async () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await appointmentService.updateAppointmentStatus(appointment._id, 'Cancelled');
            Alert.alert('Cancelled', 'Your appointment has been cancelled successfully.');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to cancel appointment');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.primaryGold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Voucher</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Status Voucher Header */}
        <GlassCard goldBorder style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.voucherLabel}>Voucher #{appointment._id.substring(appointment._id.length - 6).toUpperCase()}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{appointment.status}</Text>
            </View>
          </View>

          <Text style={styles.salonName}>{salonObj ? salonObj.name : 'SalonSync Salon'}</Text>
          <Text style={styles.salonCity}>{salonObj ? salonObj.address || salonObj.city : 'Main Branch'}</Text>
        </GlassCard>

        {/* Appointment Details Grid */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionHeading}>Session Breakdown</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Scissors size={16} color={COLORS.primaryGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>Services</Text>
              <Text style={styles.detailValue}>{appointment.services?.map(s => s.name).join(', ') || 'Styling Session'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <User size={16} color={COLORS.primaryGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>Assigned Stylist</Text>
              <Text style={styles.detailValue}>{staffObj ? staffObj.name : 'Salon Stylist'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={16} color={COLORS.primaryGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>Date & Time</Text>
              <Text style={styles.detailValue}>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailIcon}>
              <DollarSign size={16} color={COLORS.primaryGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>Total Amount</Text>
              <Text style={[styles.detailValue, { color: COLORS.primaryGold, fontSize: 16, fontWeight: '800' }]}>
                ₹{appointment.services?.reduce((s, i) => s + (i.price || 0), 0) || 0}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Action Controls */}
        {appointment.status !== 'Completed' && appointment.status !== 'Cancelled' && (
          <View style={{ gap: 10, marginTop: 10 }}>
            <SecondaryButton
              title="Cancel Appointment"
              onPress={handleCancelAppointment}
              style={{ borderColor: COLORS.dangerRed }}
              textStyle={{ color: COLORS.dangerRed }}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  voucherLabel: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: COLORS.goldBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: COLORS.primaryGold,
    fontSize: 11,
    fontWeight: '700',
  },
  salonName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  salonCity: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeading: {
    color: COLORS.primaryGold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.goldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 1,
  }
});
