import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { GlassCard } from '../../components/GlassCard';
import { COLORS } from '../../constants/theme';
import { Award, Crown, Gift, Sparkles, CheckCircle2 } from 'lucide-react-native';

export const LoyaltyScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loyalty & Rewards</Text>
        <Text style={styles.subtitle}>Earn points on every session and unlock exclusive perks</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Main Points Balance Banner */}
        <GlassCard goldBorder style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Total Rewards Balance</Text>
              <Text style={styles.heroPoints}>2,450 Pts</Text>
            </View>
            <View style={styles.crownBadge}>
              <Crown size={28} color={COLORS.primaryGold} />
              <Text style={styles.crownText}>Gold Club</Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '70%' }]} />
          </View>
          <Text style={styles.progressSub}>350 points needed for your next free Hair Spa</Text>
        </GlassCard>

        {/* Membership Tier Card */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Gold Membership Perks</Text>
          
          <View style={styles.perkRow}>
            <CheckCircle2 size={16} color={COLORS.primaryGold} />
            <Text style={styles.perkText}>15% Discount on all Hair Spa & Hair Color</Text>
          </View>
          <View style={styles.perkRow}>
            <CheckCircle2 size={16} color={COLORS.primaryGold} />
            <Text style={styles.perkText}>Priority Slot Booking & Express Check-in</Text>
          </View>
          <View style={styles.perkRow}>
            <CheckCircle2 size={16} color={COLORS.primaryGold} />
            <Text style={styles.perkText}>Free Birthday Styling Treatment Voucher</Text>
          </View>
          
          <Text style={styles.expiryNote}>Expires: 30 September 2026</Text>
        </GlassCard>

        {/* Redeemable Rewards List */}
        <Text style={styles.sectionTitle}>Available Rewards</Text>

        {[
          { title: 'Free Blow Dry & Hair Styling', points: 1500 },
          { title: 'Organic Hair Spa Treatment', points: 2800 },
          { title: 'Gold Glow Express Facial', points: 3500 },
        ].map((item, idx) => (
          <GlassCard key={idx} style={styles.rewardCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardTitle}>{item.title}</Text>
              <Text style={styles.rewardPoints}>{item.points} Loyalty Points Required</Text>
            </View>
            <TouchableOpacity style={styles.redeemBtn}>
              <Text style={styles.redeemBtnText}>Redeem</Text>
            </TouchableOpacity>
          </GlassCard>
        ))}

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
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  heroPoints: {
    color: COLORS.primaryGold,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  crownBadge: {
    alignItems: 'center',
  },
  crownText: {
    color: COLORS.primaryGold,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryGold,
    borderRadius: 4,
  },
  progressSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  sectionCard: {
    marginBottom: 18,
  },
  sectionHeading: {
    color: COLORS.primaryGold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  perkText: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  expiryNote: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rewardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rewardPoints: {
    color: COLORS.primaryGold,
    fontSize: 12,
    marginTop: 2,
  },
  redeemBtn: {
    backgroundColor: COLORS.goldBg,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  redeemBtnText: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '700',
  }
});
