import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { SecondaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { User, Phone, Mail, Award, Receipt, LogOut, ChevronRight, ShieldCheck } from 'lucide-react-native';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of SalonSync?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Client Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* User Identity Card */}
        <GlassCard goldBorder style={styles.userCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0) : 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>Client Account</Text>

          <View style={styles.contactDetails}>
            <View style={styles.contactItem}>
              <Mail size={14} color={COLORS.primaryGold} />
              <Text style={styles.contactText}>{user?.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={14} color={COLORS.primaryGold} />
              <Text style={styles.contactText}>{user?.phone || 'No phone registered'}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick Account Links */}
        <GlassCard style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Appointments')}>
            <View style={styles.menuIcon}>
              <User size={16} color={COLORS.primaryGold} />
            </View>
            <Text style={styles.menuLabel}>My Bookings & Appointments</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('InvoicesScreen')}>
            <View style={styles.menuIcon}>
              <Receipt size={16} color={COLORS.primaryGold} />
            </View>
            <Text style={styles.menuLabel}>My Receipts & Invoices</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Loyalty')}>
            <View style={styles.menuIcon}>
              <Award size={16} color={COLORS.primaryGold} />
            </View>
            <Text style={styles.menuLabel}>Loyalty Points & Membership</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        <SecondaryButton
          title="Sign Out"
          onPress={handleLogout}
          icon={<LogOut size={16} color={COLORS.dangerRed} />}
          style={{ borderColor: COLORS.dangerRed, marginTop: 12 }}
          textStyle={{ color: COLORS.dangerRed }}
        />

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
  scrollContent: {
    padding: 18,
  },
  userCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 24,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.goldBg,
    borderWidth: 2,
    borderColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: COLORS.primaryGold,
    fontSize: 26,
    fontWeight: '800',
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  userRole: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  contactDetails: {
    marginTop: 16,
    gap: 8,
    width: '100%',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.goldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  }
});
