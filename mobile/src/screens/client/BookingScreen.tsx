import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { serviceService, staffService, appointmentService } from '../../services/apiServices';
import { Salon, Service, Staff } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { ServiceCard, StaffCard } from '../../components/Cards';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { COLORS } from '../../constants/theme';
import { ArrowLeft, Calendar, Clock, CheckCircle2, Scissors, User } from 'lucide-react-native';

export const BookingScreen = ({ route, navigation }: any) => {
  const { salon, initialService, initialStaff } = route.params as { salon: Salon; initialService?: Service; initialStaff?: Staff };
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Service, 2: Staff, 3: Date & Time, 4: Summary
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(initialStaff || null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('11:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [sData, stData] = await Promise.all([
        serviceService.getServices().catch(() => []),
        staffService.getStaffList().catch(() => [])
      ]);
      setServices(sData);
      setStaffList(stData);

      if (!selectedService && sData.length > 0) setSelectedService(sData[0]);
      if (!selectedStaff && stData.length > 0) setSelectedStaff(stData[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedStaff) {
      Alert.alert('Booking Error', 'Please select service and staff member.');
      return;
    }

    setLoading(true);
    try {
      await appointmentService.createAppointment({
        salonId: salon._id,
        services: [{ serviceId: selectedService._id, name: selectedService.name, price: selectedService.price }],
        staffId: selectedStaff._id,
        date: selectedDate,
        time: selectedTime,
      });

      Alert.alert('Appointment Confirmed! ✨', `Your ${selectedService.name} is booked with ${selectedStaff.name} for ${selectedDate} at ${selectedTime}.`, [
        { text: 'View Appointments', onPress: () => navigation.navigate('Appointments') }
      ]);
    } catch (e: any) {
      Alert.alert('Booking Error', e.response?.data?.message || 'Failed to confirm appointment');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = ['10:00', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '19:45'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.primaryGold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Session</Text>
        <Text style={styles.stepBadge}>Step {step}/4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Salon Context Card */}
        <GlassCard style={styles.contextCard}>
          <Text style={styles.contextSalon}>{salon.name}</Text>
          <Text style={styles.contextSub}>{salon.city || 'Mumbai'} • Luxury Beauty Hub</Text>
        </GlassCard>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionHeading}>1. Select Service Treatment</Text>
            {services.map(s => (
              <ServiceCard
                key={s._id}
                service={s}
                selected={selectedService?._id === s._id}
                onPress={() => setSelectedService(s)}
              />
            ))}
            <PrimaryButton
              title="Next: Choose Stylist"
              onPress={() => setStep(2)}
              disabled={!selectedService}
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {/* Step 2: Select Staff */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionHeading}>2. Choose Expert Stylist</Text>
            {staffList.map(st => (
              <StaffCard
                key={st._id}
                staff={st}
                selected={selectedStaff?._id === st._id}
                onPress={() => setSelectedStaff(st)}
              />
            ))}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <SecondaryButton title="Back" onPress={() => setStep(1)} style={{ flex: 1 }} />
              <PrimaryButton title="Next: Date & Time" onPress={() => setStep(3)} disabled={!selectedStaff} style={{ flex: 2 }} />
            </View>
          </View>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <View>
            <Text style={styles.sectionHeading}>3. Select Date & Time Slot</Text>
            
            <GlassCard style={{ marginBottom: 16 }}>
              <Text style={styles.subHeading}>Date Selected</Text>
              <Text style={styles.dateDisplay}>{new Date(selectedDate).toDateString()}</Text>
            </GlassCard>

            <Text style={styles.subHeading}>Available Time Slots</Text>
            <View style={styles.slotsGrid}>
              {timeSlots.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.slotItem, selectedTime === t && styles.activeSlotItem]}
                  onPress={() => setSelectedTime(t)}
                >
                  <Text style={[styles.slotText, selectedTime === t && styles.activeSlotText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
              <SecondaryButton title="Back" onPress={() => setStep(2)} style={{ flex: 1 }} />
              <PrimaryButton title="Next: Summary" onPress={() => setStep(4)} style={{ flex: 2 }} />
            </View>
          </View>
        )}

        {/* Step 4: Summary & Confirm */}
        {step === 4 && (
          <View>
            <Text style={styles.sectionHeading}>4. Booking Summary</Text>

            <GlassCard goldBorder style={{ marginBottom: 16 }}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Salon:</Text>
                <Text style={styles.summaryValue}>{salon.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service:</Text>
                <Text style={styles.summaryValue}>{selectedService?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Stylist:</Text>
                <Text style={styles.summaryValue}>{selectedStaff?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date & Time:</Text>
                <Text style={styles.summaryValue}>{selectedDate} at {selectedTime}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{selectedService?.duration} minutes</Text>
              </View>
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 10, marginTop: 10 }]}>
                <Text style={[styles.summaryLabel, { color: COLORS.textPrimary, fontSize: 16 }]}>Total Price:</Text>
                <Text style={{ color: COLORS.primaryGold, fontSize: 18, fontWeight: '800' }}>₹{selectedService?.price}</Text>
              </View>
            </GlassCard>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SecondaryButton title="Back" onPress={() => setStep(3)} style={{ flex: 1 }} />
              <PrimaryButton title="CONFIRM BOOKING" onPress={handleConfirmBooking} loading={loading} style={{ flex: 2 }} />
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  stepBadge: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  contextCard: {
    marginBottom: 16,
  },
  contextSalon: {
    color: COLORS.primaryGold,
    fontSize: 16,
    fontWeight: '800',
  },
  contextSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  subHeading: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateDisplay: {
    color: COLORS.primaryGold,
    fontSize: 16,
    fontWeight: '700',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  slotItem: {
    width: '23%',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeSlotItem: {
    backgroundColor: COLORS.goldBg,
    borderColor: COLORS.borderGold,
  },
  slotText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeSlotText: {
    color: COLORS.primaryGold,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  }
});
