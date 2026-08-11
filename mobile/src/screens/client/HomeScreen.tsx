import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, FlatList } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { salonService, appointmentService, serviceService } from '../../services/apiServices';
import { Salon, Appointment, Service } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { SalonCard, ServiceCard, AppointmentCard, EmptyStateCard } from '../../components/Cards';
import { COLORS } from '../../constants/theme';
import { Sparkles, Calendar, Award, Gift, Search, ChevronRight, MapPin, Star } from 'lucide-react-native';

export const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomeData = async () => {
    try {
      const [salonsData, servicesData, apptsData] = await Promise.all([
        salonService.getSalons(),
        salonService.getPublicServices(),
        appointmentService.getAppointments().catch(() => [])
      ]);
      setSalons(salonsData);
      setServices(servicesData);
      setAppointments(apptsData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const nextAppt = appointments.find(a => a.status === 'Scheduled' || a.status === 'Confirmed');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGold} />}
      >
        
        {/* Header Greeting */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSub}>Good Day ✨</Text>
            <Text style={styles.greetingTitle}>{user?.name || 'Valued Client'}</Text>
          </View>
          <TouchableOpacity style={styles.pointsBadge} onPress={() => navigation.navigate('Loyalty')}>
            <Award size={16} color={COLORS.primaryGold} />
            <Text style={styles.pointsText}>2,450 Pts</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Search Trigger Banner */}
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Explore')}>
          <Search size={18} color={COLORS.primaryGold} />
          <Text style={styles.searchPlaceholder}>Search salons, services or stylists...</Text>
        </TouchableOpacity>

        {/* Next Upcoming Appointment Widget */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next Appointment</Text>
          {nextAppt && (
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {nextAppt ? (
          <AppointmentCard
            appointment={nextAppt}
            onPress={() => navigation.navigate('AppointmentDetails', { appointment: nextAppt })}
            actionLabel="View Details & Directions"
            onAction={() => navigation.navigate('AppointmentDetails', { appointment: nextAppt })}
          />
        ) : (
          <GlassCard style={styles.noApptCard}>
            <View style={styles.noApptContent}>
              <Calendar size={28} color={COLORS.primaryGold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noApptTitle}>No Upcoming Appointments</Text>
                <Text style={styles.noApptSub}>Treat yourself to luxury styling today.</Text>
              </View>
              <TouchableOpacity
                style={styles.bookNowBadge}
                onPress={() => navigation.navigate('Explore')}
              >
                <Text style={styles.bookNowText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Recommended Luxury Salons */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended Salons</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
            <Text style={styles.seeAllText}>See All ({salons.length})</Text>
          </TouchableOpacity>
        </View>

        {salons.slice(0, 3).map(salon => (
          <SalonCard
            key={salon._id}
            salon={salon}
            onPress={() => navigation.navigate('SalonDetails', { salon })}
          />
        ))}

        {/* Popular Treatments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {services.slice(0, 5).map(service => (
            <TouchableOpacity
              key={service._id}
              style={styles.popularServiceItem}
              onPress={() => {
                const targetSalon = salons[0] || { _id: service.salonId, name: 'SalonSync Salon' };
                navigation.navigate('Booking', { salon: targetSalon, initialService: service });
              }}
            >
              <GlassCard style={styles.popularCard}>
                <Text style={styles.popCategory}>{service.category}</Text>
                <Text style={styles.popName}>{service.name}</Text>
                <Text style={styles.popDuration}>{service.duration} Mins</Text>
                <Text style={styles.popPrice}>₹{service.price}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Special Membership Banner */}
        <GlassCard goldBorder style={styles.promoCard}>
          <View style={styles.promoContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>Gold Club Membership</Text>
              <Text style={styles.promoSub}>Enjoy 15% discount on all haircuts & facial treatments.</Text>
            </View>
            <Gift size={32} color={COLORS.primaryGold} />
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
    marginBottom: 16,
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.goldBg,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 22,
  },
  searchPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 14,
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
  noApptCard: {
    marginBottom: 16,
  },
  noApptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noApptTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  noApptSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  bookNowBadge: {
    backgroundColor: COLORS.primaryGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookNowText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalScroll: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  popularServiceItem: {
    width: 140,
    marginRight: 12,
  },
  popularCard: {
    padding: 14,
  },
  popCategory: {
    color: COLORS.primaryGold,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  popName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  popDuration: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  popPrice: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  promoCard: {
    marginTop: 6,
    marginBottom: 20,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoTitle: {
    color: COLORS.primaryGold,
    fontSize: 16,
    fontWeight: '800',
  },
  promoSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  }
});
