import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.primaryBtn,
        (disabled || loading) && styles.disabledBtn,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#000000" size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.primaryText, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.secondaryBtn,
        (disabled || loading) && styles.disabledBtn,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.primaryGold} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.secondaryText, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: COLORS.primaryGold,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.primaryGold,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: {
    color: COLORS.primaryGold,
    fontSize: 15,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  }
});
