import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { appointmentService } from '../../services/apiServices';
import { Appointment } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { ArrowLeft, User, Scissors, Calendar, Clock, DollarSign, CheckCircle2, Play } from 'lucide-react-native';

export const StaffAppointmentDetailsScreen = ({ route, navigation }: any) => {
  const { appointment } = route.params as { appointment: Appointment };
  const [currentStatus, setCurrentStatus] = useState(appointment.status);
  const [loading, setLoading] = useState(false);

  const customerObj = typeof appointment.customerId === 'object' ? appointment.customerId : null;

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      await appointmentService.updateAppointmentStatus(appointment._id, newStatus);
      setCurrentStatus(newStatus as any);
      Alert.alert('Status Updated ✨', `Appointment status updated to ${newStatus}.`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.primaryGold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Action Console</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Customer Identity Card */}
        <GlassCard goldBorder style={styles.card}>
          <Text style={styles.cardLabel}>Client Information</Text>
          <View style={styles.clientRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{customerObj ? customerObj.name.charAt(0) : 'C'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{customerObj ? customerObj.name : 'Walk-in Client'}</Text>
              <Text style={styles.clientPhone}>{customerObj ? customerObj.phone : 'N/A'}</Text>
              {customerObj?.membershipLevel && customerObj.membershipLevel !== 'None' && (
                <Text style={styles.clubBadge}>{customerObj.membershipLevel} Club Member</Text>
              )}
            </View>
          </View>
        </GlassCard>

        {/* Treatment Details */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardLabel}>Session Details</Text>
          
          <View style={styles.detailItem}>
            <Scissors size={16} color={COLORS.primaryGold} />
            <Text style={styles.detailText}>{appointment.services?.map(s => s.name).join(', ')}</Text>
          </View>

          <View style={styles.detailItem}>
            <Calendar size={16} color={COLORS.primaryGold} />
            <Text style={styles.detailText}>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</Text>
          </View>

          <View style={styles.detailItem}>
            <DollarSign size={16} color={COLORS.primaryGold} />
            <Text style={[styles.detailText, { color: COLORS.primaryGold, fontWeight: '800' }]}>
              Service Value: ₹{appointment.services?.reduce((s, i) => s + (i.price || 0), 0)}
            </Text>
          </View>
        </GlassCard>

        {/* Action Controls for Staff */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardLabel}>Update Status</Text>
          <Text style={styles.currentStatusText}>Current Status: <Text style={{ color: COLORS.primaryGold, fontWeight: '800' }}>{currentStatus}</Text></Text>

          <View style={styles.actionsBox}>
            {currentStatus !== 'In Progress' && currentStatus !== 'Completed' && (
              <PrimaryButton
                title="Start Service"
                onPress={() => handleUpdateStatus('In Progress')}
                loading={loading}
                icon={<Play size={16} color="#000000" fill="#000000" />}
                style={{ backgroundColor: COLORS.infoBlue }}
              />
            )}

            {currentStatus !== 'Completed' && (
              <PrimaryButton
                title="Complete Service Session"
                onPress={() => handleUpdateStatus('Completed')}
                loading={loading}
                icon={<CheckCircle2 size={16} color="#000000" />}
                style={{ backgroundColor: COLORS.successGreen }}
              />
            )}
          </View>
        </GlassCard>

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
  cardLabel: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldBg,
    borderWidth: 1,
    borderColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primaryGold,
    fontSize: 18,
    fontWeight: '800',
  },
  clientName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  clientPhone: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  clubBadge: {
    color: COLORS.primaryGold,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  detailText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  currentStatusText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 14,
  },
  actionsBox: {
    gap: 10,
  }
});
