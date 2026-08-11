import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, staffService } from '../../services/apiServices';
import { Appointment } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { StatCard, AppointmentCard } from '../../components/Cards';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { Calendar, DollarSign, Star, Clock, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react-native';

export const StaffDashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    try {
      const [apptsData, commsData, attData] = await Promise.all([
        appointmentService.getAppointments().catch(() => []),
        staffService.getCommissions().catch(() => []),
        staffService.getAttendance().catch(() => [])
      ]);
      setAppointments(apptsData);
      setCommissions(commsData);
      setAttendance(attData);

      // Check today's clock in status
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = attData.find(a => new Date(a.date).toISOString().split('T')[0] === today);
      setClockedIn(Boolean(todayRecord && todayRecord.checkIn && !todayRecord.checkOut));
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStaffData();
    setRefreshing(false);
  };

  const handleClockToggle = async () => {
    if (!user) return;
    const action = clockedIn ? 'clockout' : 'clockin';
    try {
      await staffService.recordAttendance(user.id, action);
      setClockedIn(!clockedIn);
      Alert.alert('Attendance Updated ✨', `Successfully ${action === 'clockin' ? 'Clocked IN' : 'Clocked OUT'}.`);
    } catch (e: any) {
      Alert.alert('Attendance Error', e.response?.data?.message || 'Failed to update attendance');
    }
  };

  const todayAppts = appointments.filter(a => a.status !== 'Cancelled');
  const completedToday = todayAppts.filter(a => a.status === 'Completed').length;
  const nextAppt = todayAppts.find(a => a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'In Progress');

  const totalCommissionsEarned = commissions.reduce((sum, c) => sum + (c.commissionEarned || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGold} />}
      >
        
        {/* Header Greeting & Clock In Button */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSub}>Staff Workspace ✂️</Text>
            <Text style={styles.greetingTitle}>{user?.name || 'Stylist'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.clockBadge, clockedIn && styles.clockedInBadge]}
            onPress={handleClockToggle}
          >
            <UserCheck size={16} color={clockedIn ? COLORS.successGreen : COLORS.primaryGold} />
            <Text style={[styles.clockText, clockedIn && { color: COLORS.successGreen }]}>
              {clockedIn ? 'Clocked IN' : 'Clock IN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* KPI Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statHalf}>
            <StatCard title="Today's Bookings" value={todayAppts.length} subtitle={`${completedToday} completed`} icon={<Calendar size={18} color={COLORS.primaryGold} />} />
          </View>
          <View style={styles.statHalf}>
            <StatCard title="Total Commission" value={`₹${totalCommissionsEarned.toLocaleString()}`} subtitle="Earned this month" color={COLORS.successGreen} icon={<DollarSign size={18} color={COLORS.successGreen} />} />
          </View>
        </View>

        {/* Next Appointment Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next Appointment</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {nextAppt ? (
          <AppointmentCard
            appointment={nextAppt}
            onPress={() => navigation.navigate('StaffAppointmentDetails', { appointment: nextAppt })}
            actionLabel="Start / Complete Session"
            onAction={() => navigation.navigate('StaffAppointmentDetails', { appointment: nextAppt })}
          />
        ) : (
          <GlassCard style={styles.emptyCard}>
            <CheckCircle2 size={28} color={COLORS.successGreen} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No upcoming appointments scheduled right now.</Text>
          </GlassCard>
        )}

        {/* Performance Quick Link */}
        <GlassCard goldBorder style={styles.perfCard} onPress={() => navigation.navigate('Performance')}>
          <View style={styles.perfRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.perfTitle}>My Stylist Rating</Text>
              <Text style={styles.perfSub}>4.8 ⭐ (Based on 124 client reviews)</Text>
            </View>
            <TouchableOpacity style={styles.perfBtn} onPress={() => navigation.navigate('Performance')}>
              <Text style={styles.perfBtnText}>View Performance</Text>
            </TouchableOpacity>
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
  scrollContent: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greetingSub: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: '600',
  },
  greetingTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  clockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.goldBg,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clockedInBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderColor: COLORS.successGreen,
  },
  clockText: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statHalf: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllText: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  perfCard: {
    marginTop: 4,
    marginBottom: 20,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perfTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  perfSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  perfBtn: {
    backgroundColor: COLORS.primaryGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  perfBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  }
});
