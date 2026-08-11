import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { appointmentService } from '../../services/apiServices';
import { Appointment } from '../../types';
import { AppointmentCard, EmptyStateCard } from '../../components/Cards';
import { COLORS } from '../../constants/theme';

export const AppointmentsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setRefreshing(true);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'UPCOMING') return a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'In Progress';
    if (activeTab === 'COMPLETED') return a.status === 'Completed';
    if (activeTab === 'CANCELLED') return a.status === 'Cancelled';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        <Text style={styles.subtitle}>Track, manage, or reschedule your salon sessions</Text>

        {/* Tab Filters */}
        <View style={styles.tabRow}>
          {[
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, activeTab === t.id && styles.activeTabBtn]}
              onPress={() => setActiveTab(t.id as any)}
            >
              <Text style={[styles.tabText, activeTab === t.id && styles.activeTabText]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAppointments} tintColor={COLORS.primaryGold} />}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
            actionLabel={item.status === 'Completed' ? 'Leave Review ⭐' : 'View Details'}
            onAction={() => {
              if (item.status === 'Completed') {
                navigation.navigate('WriteReview', { salonId: typeof item.salonId === 'object' ? item.salonId._id : item.salonId });
              } else {
                navigation.navigate('AppointmentDetails', { appointment: item });
              }
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyStateCard
            title={`No ${activeTab.toLowerCase()} appointments`}
            description="Book your next haircut or spa session with top salons on SalonSync."
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  activeTabBtn: {
    backgroundColor: COLORS.goldBg,
    borderColor: COLORS.borderGold,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primaryGold,
    fontWeight: '700',
  },
  listContent: {
    padding: 18,
  }
});
