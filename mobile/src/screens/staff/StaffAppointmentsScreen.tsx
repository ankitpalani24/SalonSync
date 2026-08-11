import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { appointmentService } from '../../services/apiServices';
import { Appointment } from '../../types';
import { AppointmentCard, EmptyStateCard } from '../../components/Cards';
import { COLORS } from '../../constants/theme';

export const StaffAppointmentsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'TODAY' | 'COMPLETED' | 'ALL'>('TODAY');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStaffAppointments();
  }, []);

  const fetchStaffAppointments = async () => {
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
    if (activeTab === 'TODAY') return a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'In Progress';
    if (activeTab === 'COMPLETED') return a.status === 'Completed';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session Schedule</Text>
        <Text style={styles.subtitle}>Assigned appointments & client sessions</Text>

        {/* Tab Filters */}
        <View style={styles.tabRow}>
          {[
            { id: 'TODAY', label: 'Assigned Sessions' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'ALL', label: 'All Logs' }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStaffAppointments} tintColor={COLORS.primaryGold} />}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => navigation.navigate('StaffAppointmentDetails', { appointment: item })}
            actionLabel="Manage Session"
            onAction={() => navigation.navigate('StaffAppointmentDetails', { appointment: item })}
          />
        )}
        ListEmptyComponent={
          <EmptyStateCard
            title={`No ${activeTab.toLowerCase()} sessions`}
            description="Your assigned appointment schedule will appear here."
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
