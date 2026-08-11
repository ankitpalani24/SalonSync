import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { reviewService } from '../../services/apiServices';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { Star, ArrowLeft } from 'lucide-react-native';

export const ReviewSubmissionModal = ({ route, navigation }: any) => {
  const { salonId, staffId, staffName } = route.params as { salonId: string; staffId?: string; staffName?: string };
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await reviewService.createReview({
        salonId,
        staffId,
        rating,
        comment
      });
      Alert.alert('Review Submitted ✨', 'Thank you for rating your salon session experience!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.primaryGold} />
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>

        <GlassCard goldBorder style={styles.card}>
          <Text style={styles.title}>Rate Your Experience</Text>
          <Text style={styles.subtitle}>{staffName ? `Stylist: ${staffName}` : 'Salon Session Review'}</Text>

          {/* Interactive Star Picker */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map(starNum => (
              <TouchableOpacity key={starNum} onPress={() => setRating(starNum)}>
                <Star
                  size={36}
                  color={COLORS.primaryGold}
                  fill={starNum <= rating ? COLORS.primaryGold : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Written Review (Optional)</Text>
          <TextInput
            placeholder="Share feedback on haircut quality, ambiance, staff behavior..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={4}
            style={styles.textArea}
            value={comment}
            onChangeText={setComment}
          />

          <PrimaryButton
            title="Submit Rating & Review"
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 16 }}
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
    marginTop: 2,
    marginBottom: 20,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    height: 100,
    textAlignVertical: 'top',
  }
});
