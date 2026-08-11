import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { reviewService } from '../../services/apiServices';
import { Review } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { RatingStars, EmptyStateCard } from '../../components/Cards';
import { COLORS } from '../../constants/theme';
import { MessageSquare, Star } from 'lucide-react-native';

export const StaffReviewsScreen = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getReviews();
      setReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Client Feedback & Reviews</Text>
        <Text style={styles.subtitle}>Ratings & written reviews submitted by clients</Text>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.clientName}>{item.customerName}</Text>
              <RatingStars rating={item.rating} />
            </View>
            <Text style={styles.comment}>{item.comment || 'Great experience!'}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyStateCard
              title="No Client Reviews Yet"
              description="Your client ratings will appear here as sessions are completed."
            />
          ) : null
        }
      />
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
  listContent: {
    padding: 18,
  },
  card: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clientName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  comment: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  date: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
  }
});
