import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { User, Mail, Phone, Lock, ArrowLeft } from 'lucide-react-native';

export const SignupScreen = ({ navigation }: any) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg('Please complete all required fields');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await signup({ ownerName: name, email, phone, password });
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Registration failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={COLORS.primaryGold} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>

          <GlassCard goldBorder style={styles.formCard}>
            <Text style={styles.title}>Client Registration</Text>
            <Text style={styles.subtitle}>Create your SalonSync customer account to discover salons and book instant treatments.</Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{errorMsg}</Text>
              </View>
            ) : null}

            <InputField
              label="Full Name *"
              placeholder="Ankit Sharma"
              value={name}
              onChangeText={setName}
              icon={<User size={18} color={COLORS.primaryGold} />}
            />

            <InputField
              label="Email Address *"
              placeholder="ankit@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={18} color={COLORS.primaryGold} />}
            />

            <InputField
              label="Mobile Phone *"
              placeholder="9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon={<Phone size={18} color={COLORS.primaryGold} />}
            />

            <InputField
              label="Create Password *"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Lock size={18} color={COLORS.primaryGold} />}
            />

            <PrimaryButton
              title="Create Account & Start Booking"
              onPress={handleSignup}
              loading={loading}
              style={{ marginTop: 12 }}
            />
          </GlassCard>

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
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backText: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    padding: 22,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 20,
    marginTop: 4,
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
  }
});
