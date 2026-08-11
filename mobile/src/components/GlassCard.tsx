import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  goldBorder?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, goldBorder }) => {
  return (
    <View style={[
      styles.card,
      goldBorder && styles.goldBorderStyle,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  goldBorderStyle: {
    borderColor: COLORS.borderGold,
  }
});
