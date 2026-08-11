import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { InputField } from '../../components/InputField';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { Mail, Lock, Sparkles, Phone } from 'lucide-react-native';

export const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter email/phone and password');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await login(identifier, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Logo Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>SS</Text>
            </View>
            <Text style={styles.brandTitle}>SalonSync</Text>
            <Text style={styles.brandTagline}>Luxury Salon & Beauty Ecosystem</Text>
          </View>

          {/* Form Card */}
          <GlassCard goldBorder style={styles.formCard}>
            <Text style={styles.welcomeTitle}>Sign In</Text>
            <Text style={styles.welcomeSub}>Client & Staff Mobile Workspace</Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{errorMsg}</Text>
              </View>
            ) : null}

            <InputField
              label="Email Address or Mobile Number"
              placeholder="e.g. client@salonsync.com or 9876500001"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<Mail size={18} color={COLORS.primaryGold} />}
            />

            <InputField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Lock size={18} color={COLORS.primaryGold} />}
            />

            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Sign In to Account"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 12 }}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <SecondaryButton
              title="Create Client Account"
              onPress={() => navigation.navigate('Signup')}
            />
          </GlassCard>

          {/* Helper hint */}
          <Text style={styles.roleNotice}>
            Salon Owners & Managers: Please sign in via the SalonSync web dashboard.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    color: '#000000',
    fontSize: 26,
    fontWeight: '900',
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandTagline: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  formCard: {
    padding: 22,
  },
  welcomeTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  welcomeSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.dangerRed,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorBoxText: {
    color: COLORS.dangerRed,
    fontSize: 13,
    fontWeight: '600',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    color: COLORS.textMuted,
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  roleNotice: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  }
});
