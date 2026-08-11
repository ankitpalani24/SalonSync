import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { serviceService, staffService, reviewService } from '../../services/apiServices';
import { Salon, Service, Staff, Review } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { ServiceCard, StaffCard, RatingStars, EmptyStateCard } from '../../components/Cards';
import { PrimaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { MapPin, Phone, Mail, Clock, Star, Scissors, Users, MessageSquare, ArrowLeft } from 'lucide-react-native';

export const SalonDetailsScreen = ({ route, navigation }: any) => {
  const { salon } = route.params as { salon: Salon };
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SERVICES' | 'STAFF' | 'REVIEWS'>('OVERVIEW');
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadSalonDetails();
  }, []);

  const loadSalonDetails = async () => {
    try {
      const [servicesData, staffData, reviewsData] = await Promise.all([
        serviceService.getServices().catch(() => []),
        staffService.getStaffList().catch(() => []),
        reviewService.getReviews().catch(() => [])
      ]);
      setServices(servicesData);
      setStaff(staffData);
      setReviews(reviewsData);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.primaryGold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{salon.name}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Salon Hero Card */}
        <GlassCard goldBorder style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>{salon.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.salonName}>{salon.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={COLORS.primaryGold} />
                <Text style={styles.locationText}>{salon.city || 'Mumbai'}, {salon.state || 'Maharashtra'}</Text>
              </View>
            </View>
            <RatingStars rating={salon.rating || 4.8} size={16} />
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Phone size={13} color={COLORS.primaryGold} />
              <Text style={styles.infoText}>{salon.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Clock size={13} color={COLORS.primaryGold} />
              <Text style={styles.infoText}>9:00 AM - 9:00 PM</Text>
            </View>
          </View>
        </GlassCard>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'SERVICES', label: `Services (${services.length})` },
            { id: 'STAFF', label: `Stylists (${staff.length})` },
            { id: 'REVIEWS', label: `Reviews (${reviews.length})` }
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabItem, activeTab === t.id && styles.activeTabItem]}
              onPress={() => setActiveTab(t.id as any)}
            >
              <Text style={[styles.tabText, activeTab === t.id && styles.activeTabText]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Contents */}
        {activeTab === 'OVERVIEW' && (
          <View style={styles.tabContent}>
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>About Salon</Text>
              <Text style={styles.aboutBody}>
                {salon.name} offers high-end luxury styling, precision haircuts, organic hair spa treatments, and bridal cosmetics powered by certified expert stylists.
              </Text>
            </GlassCard>

            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Opening Hours</Text>
              <View style={styles.hourRow}>
                <Text style={styles.dayText}>Monday - Sunday</Text>
                <Text style={styles.timeText}>09:00 AM - 09:00 PM</Text>
              </View>
            </GlassCard>
          </View>
        )}

        {activeTab === 'SERVICES' && (
          <View style={styles.tabContent}>
            {services.map(service => (
              <ServiceCard
                key={service._id}
                service={service}
                onPress={() => navigation.navigate('Booking', { salon, initialService: service })}
              />
            ))}
          </View>
        )}

        {activeTab === 'STAFF' && (
          <View style={styles.tabContent}>
            {staff.map(member => (
              <StaffCard
                key={member._id}
                staff={member}
                onPress={() => navigation.navigate('Booking', { salon, initialStaff: member })}
              />
            ))}
          </View>
        )}

        {activeTab === 'REVIEWS' && (
          <View style={styles.tabContent}>
            {reviews.length === 0 ? (
              <EmptyStateCard title="No Reviews Yet" description="Be the first client to leave a review for this salon!" />
            ) : (
              reviews.map(r => (
                <GlassCard key={r._id} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>{r.customerName}</Text>
                    <RatingStars rating={r.rating} />
                  </View>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontStyle: 'italic' }}>{r.comment || 'Great experience!'}</Text>
                </GlassCard>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* Floating Bottom CTA */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="BOOK APPOINTMENT"
          onPress={() => navigation.navigate('Booking', { salon })}
        />
      </View>
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
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  heroCard: {
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '800',
  },
  salonName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  activeTabItem: {
    backgroundColor: COLORS.goldBg,
    borderColor: COLORS.borderGold,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primaryGold,
    fontWeight: '700',
  },
  tabContent: {
    gap: 10,
  },
  sectionCard: {
    marginBottom: 12,
  },
  sectionHeading: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  aboutBody: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayText: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  timeText: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 11, 11, 0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    padding: 16,
  }
});
