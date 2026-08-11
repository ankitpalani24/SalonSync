import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TextInput } from 'react-native';
import { customerService } from '../../services/apiServices';
import { Customer } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { EmptyStateCard } from '../../components/Cards';
import { COLORS } from '../../constants/theme';
import { Search, User, Phone, Award } from 'lucide-react-native';

export const StaffCustomersScreen = ({ navigation }: any) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.phone && c.phone.includes(query))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Salon Clients</Text>
        <Text style={styles.subtitle}>Directory of salon clients & booking history</Text>

        <View style={styles.searchWrapper}>
          <Search size={18} color={COLORS.primaryGold} />
          <TextInput
            placeholder="Search client name or phone..."
            placeholderTextColor="#666666"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <GlassCard style={styles.custCard}>
            <View style={styles.custHeader}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.custName}>{item.name}</Text>
                <Text style={styles.custPhone}>📱 {item.phone}</Text>
              </View>
              {item.membershipLevel && item.membershipLevel !== 'None' && (
                <View style={styles.membershipBadge}>
                  <Award size={12} color={COLORS.primaryGold} />
                  <Text style={styles.membershipText}>{item.membershipLevel}</Text>
                </View>
              )}
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyStateCard
              title="No Clients Found"
              description="No registered clients match your search query."
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
    marginBottom: 14,
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
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  listContent: {
    padding: 18,
  },
  custCard: {
    marginBottom: 12,
  },
  custHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.goldBg,
    borderWidth: 1,
    borderColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primaryGold,
    fontSize: 18,
    fontWeight: '800',
  },
  custName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  custPhone: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.goldBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  membershipText: {
    color: COLORS.primaryGold,
    fontSize: 11,
    fontWeight: '700',
  }
});
