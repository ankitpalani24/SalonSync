import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { staffService, appointmentService } from '../../services/apiServices';
import { GlassCard } from '../../components/GlassCard';
import { StatCard, RatingStars } from '../../components/Cards';
import { COLORS } from '../../constants/theme';
import { DollarSign, Scissors, Star, Award, TrendingUp, Users } from 'lucide-react-native';

export const StaffPerformanceScreen = ({ navigation }: any) => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    setRefreshing(true);
    try {
      const [commsData, apptsData] = await Promise.all([
        staffService.getCommissions().catch(() => []),
        appointmentService.getAppointments().catch(() => [])
      ]);
      setCommissions(commsData);
      setAppointments(apptsData);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const totalRevGenerated = commissions.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
  const totalCommissionEarned = commissions.reduce((sum, c) => sum + (c.commissionEarned || 0), 0);
  const completedServices = appointments.filter(a => a.status === 'Completed').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stylist Performance</Text>
        <Text style={styles.subtitle}>Track your sales revenue, commissions & client ratings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadPerformance} tintColor={COLORS.primaryGold} />}
      >
        
        <GlassCard goldBorder style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Monthly Commission</Text>
          <Text style={styles.heroValue}>₹{totalCommissionEarned.toLocaleString()}</Text>
          <Text style={styles.heroSub}>Generated from ₹{totalRevGenerated.toLocaleString()} total service sales</Text>
        </GlassCard>

        {/* Performance Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statHalf}>
            <StatCard title="Service Sales" value={`₹${totalRevGenerated.toLocaleString()}`} icon={<TrendingUp size={18} color={COLORS.primaryGold} />} />
          </View>
          <View style={styles.statHalf}>
            <StatCard title="Sessions Done" value={completedServices} icon={<Scissors size={18} color={COLORS.infoBlue} />} color={COLORS.infoBlue} />
          </View>
        </View>

        {/* Rating Card */}
        <GlassCard style={styles.ratingCard}>
          <Text style={styles.cardHeading}>Customer Ratings Breakdown</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingBig}>4.8</Text>
            <View>
              <RatingStars rating={4.8} size={20} />
              <Text style={styles.ratingCount}>Based on 124 completed reviews</Text>
            </View>
          </View>

          <View style={styles.distBarRow}>
            <Text style={styles.distLabel}>5 Stars</Text>
            <View style={styles.distBg}><View style={[styles.distFill, { width: '82%' }]} /></View>
            <Text style={styles.distPct}>82%</Text>
          </View>
          <View style={styles.distBarRow}>
            <Text style={styles.distLabel}>4 Stars</Text>
            <View style={styles.distBg}><View style={[styles.distFill, { width: '14%' }]} /></View>
            <Text style={styles.distPct}>14%</Text>
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
  },
  scrollContent: {
    padding: 18,
  },
  heroCard: {
    marginBottom: 16,
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  heroValue: {
    color: COLORS.primaryGold,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  heroSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statHalf: {
    flex: 1,
  },
  ratingCard: {
    marginBottom: 16,
  },
  cardHeading: {
    color: COLORS.primaryGold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  ratingBig: {
    color: COLORS.textPrimary,
    fontSize: 38,
    fontWeight: '900',
  },
  ratingCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  distBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  distLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    width: 50,
  },
  distBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    backgroundColor: COLORS.primaryGold,
    borderRadius: 3,
  },
  distPct: {
    color: COLORS.textMuted,
    fontSize: 11,
    width: 30,
    textAlign: 'right',
  }
});
