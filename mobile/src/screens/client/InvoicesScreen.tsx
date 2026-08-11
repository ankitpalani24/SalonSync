import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { invoiceService } from '../../services/apiServices';
import { Invoice } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { EmptyStateCard } from '../../components/Cards';
import { COLORS } from '../../constants/theme';
import { Receipt, FileText, CheckCircle2 } from 'lucide-react-native';

export const InvoicesScreen = ({ navigation }: any) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Receipts & Invoices</Text>
        <Text style={styles.subtitle}>Verified billing receipts from your salon visits</Text>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <GlassCard style={styles.invoiceCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.invoiceNum}>{item.invoiceNumber}</Text>
                <Text style={styles.invoiceDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.paidBadge}>
                <CheckCircle2 size={12} color={COLORS.successGreen} />
                <Text style={styles.paidText}>Paid</Text>
              </View>
            </View>

            <View style={styles.servicesList}>
              {item.services?.map((s, idx) => (
                <Text key={idx} style={styles.serviceItem}>• {s.name} (x{s.quantity || 1}) - ₹{s.price * (s.quantity || 1)}</Text>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.methodText}>Method: {item.paymentMethod}</Text>
              <Text style={styles.totalAmount}>Total: ₹{item.finalAmount}</Text>
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyStateCard
              title="No Invoices Found"
              description="Your checkout receipts will appear here after completed sessions."
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
  invoiceCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNum: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  invoiceDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidText: {
    color: COLORS.successGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  servicesList: {
    marginVertical: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  serviceItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  totalAmount: {
    color: COLORS.primaryGold,
    fontSize: 16,
    fontWeight: '800',
  }
});
