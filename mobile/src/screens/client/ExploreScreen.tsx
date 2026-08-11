import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { salonService } from '../../services/apiServices';
import { Salon } from '../../types';
import { SalonCard, EmptyStateCard } from '../../components/Cards';
import { COLORS } from '../../constants/theme';
import { Search, Filter, MapPin, Star } from 'lucide-react-native';

export const ExploreScreen = ({ navigation }: any) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'RATED' | 'STARTER' | 'FRANCHISE'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    setLoading(true);
    try {
      const data = await salonService.getSalons();
      setSalons(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(query.toLowerCase()));
    
    if (!matchesQuery) return false;
    if (selectedFilter === 'RATED') return (s.rating || 4.8) >= 4.5;
    if (selectedFilter === 'STARTER') return s.subscriptionPlan === 'Starter Salon';
    if (selectedFilter === 'FRANCHISE') return s.subscriptionPlan === 'Franchise';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Salons</Text>
        <Text style={styles.subtitle}>Explore verified luxury beauty & hair salons</Text>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          <Search size={18} color={COLORS.primaryGold} />
          <TextInput
            placeholder="Search salon name or city..."
            placeholderTextColor="#666666"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { id: 'ALL', label: 'All Salons' },
            { id: 'RATED', label: 'Top Rated ⭐' },
            { id: 'STARTER', label: 'Starter Salons' },
            { id: 'FRANCHISE', label: 'Franchise Hubs' }
          ].map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterPill, selectedFilter === f.id && styles.activeFilterPill]}
              onPress={() => setSelectedFilter(f.id as any)}
            >
              <Text style={[styles.filterText, selectedFilter === f.id && styles.activeFilterText]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Salons List */}
      <FlatList
        data={filteredSalons}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SalonCard
            salon={item}
            onPress={() => navigation.navigate('SalonDetails', { salon: item })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyStateCard
              title="No Salons Found"
              description="Try adjusting your search criteria or city filter."
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
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  activeFilterPill: {
    backgroundColor: COLORS.goldBg,
    borderColor: COLORS.borderGold,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterText: {
    color: COLORS.primaryGold,
    fontWeight: '700',
  },
  listContent: {
    padding: 18,
  }
});
