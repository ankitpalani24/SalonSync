import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { authService } from '../../services/apiServices';
import { GlassCard } from '../../components/GlassCard';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSentMessage(res.message || 'OTP code sent to your registered email & phone');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Error sending password reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.primaryGold} />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        <GlassCard goldBorder style={styles.card}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your registered email address and we will send you verification instructions.</Text>

          {sentMessage ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={20} color={COLORS.successGreen} />
              <Text style={styles.successText}>{sentMessage}</Text>
            </View>
          ) : null}

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <InputField
            label="Email Address"
            placeholder="client@salonsync.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Mail size={18} color={COLORS.primaryGold} />}
          />

          <PrimaryButton
            title="Send Verification Code"
            onPress={handleSendOTP}
            loading={loading}
            style={{ marginTop: 12 }}
          />
        </GlassCard>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    flex: 1,
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
  card: {
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
    marginTop: 4,
    marginBottom: 20,
  },
  successBox: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.successGreen,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  successText: {
    color: COLORS.successGreen,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  errorBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.dangerRed,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.dangerRed,
    fontSize: 13,
    fontWeight: '600',
  }
});
