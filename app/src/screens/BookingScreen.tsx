import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {propertiesApi, bookingsApi, ApiProperty} from '../api/client';
import {useRole} from '../context/RoleContext';
import {Colors, Spacing} from '../theme';
import {RootStackParamList, Booking} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BookingScreen'>;
  route: RouteProp<RootStackParamList, 'BookingScreen'>;
};

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

const getNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', {weekday: 'short'}),
      num: d.getDate(),
      month: d.toLocaleDateString('en-US', {month: 'short'}),
    });
  }
  return days;
};

export const BookingScreen: React.FC<Props> = ({navigation, route}) => {
  const {mode} = useRole();
  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [selDate, setSelDate] = useState('');
  const [selTime, setSelTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const dates = getNext7Days();

  React.useEffect(() => {
    propertiesApi.getById(route.params.propertyId).then(setProperty).catch(() => {});
  }, [route.params.propertyId]);

  if (!property) {
    return (
      <View style={s.errWrap}>
        <Text style={s.errTxt}>Loading...</Text>
      </View>
    );
  }

  const handleBook = async () => {
    if (!selDate || !selTime) {
      Alert.alert('Missing Info', 'Please pick a date and time.');
      return;
    }
    setLoading(true);
    try {
      const res = await bookingsApi.create(property.id, selDate, selTime, notes, mode);
      const booking: Booking = {
        id: res.booking.id,
        propertyId: res.booking.propertyId,
        userId: res.booking.userId,
        date: res.booking.date,
        time: res.booking.time,
        status: res.booking.status,
        notes: res.booking.notes,
        createdAt: res.booking.createdAt,
      };

      // Format date for WhatsApp message
      const fmtDate = new Date(selDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Build WhatsApp message
      const message = [
        `🏠 *New Booking Confirmed*`,
        ``,
        `*Property:* ${property.title}`,
        `*Location:* ${property.city}, ${property.state}`,
        `*Date:* ${fmtDate}`,
        `*Time:* ${selTime}`,
        notes ? `*Notes:* ${notes}` : '',
        ``,
        `*Booking ID:* ${res.booking.id}`,
        ``,
        `Looking forward to the visit!`,
      ].filter(Boolean).join('\n');

      const whatsappUrl = `https://wa.me/916281889589?text=${encodeURIComponent(message)}`;

      // Navigate to confirmation screen
      navigation.replace('BookingConfirmation', {booking});

      // Open WhatsApp after a short delay so navigation completes first
      setTimeout(() => {
        Linking.openURL(whatsappUrl).catch(() => {
          // WhatsApp not installed — fail silently, booking is already confirmed
        });
      }, 500);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Book a Visit</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Property summary */}
        <View style={s.summaryCard}>
          <Image source={{uri: property.images[0]}} style={s.summaryImg} />
          <View style={s.summaryInfo}>
            <Text style={s.summaryTitle} numberOfLines={2}>{property.title}</Text>
            <View style={s.summaryLoc}>
              <Icon name="location-on" size={13} color={Colors.primary} />
              <Text style={s.summaryLocTxt}>{property.city}, {property.state}</Text>
            </View>
          </View>
        </View>

        {/* Date */}
        <Text style={s.secTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.datesRow}>
          {dates.map(d => {
            const active = selDate === d.date;
            return (
              <TouchableOpacity
                key={d.date}
                style={[s.dateCard, active && s.dateCardActive]}
                onPress={() => setSelDate(d.date)}>
                <Text style={[s.dateDay, active && s.dateTxtActive]}>{d.day}</Text>
                <Text style={[s.dateNum, active && s.dateTxtActive]}>{d.num}</Text>
                <Text style={[s.dateMonth, active && s.dateTxtActive]}>{d.month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time */}
        <Text style={s.secTitle}>Select Time</Text>
        <View style={s.timeGrid}>
          {timeSlots.map(t => {
            const active = selTime === t;
            return (
              <TouchableOpacity
                key={t}
                style={[s.timeSlot, active && s.timeSlotActive]}
                onPress={() => setSelTime(t)}>
                <Text style={[s.timeTxt, active && s.timeTxtActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text style={s.secTitle}>
          Notes <Text style={s.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={s.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any questions or special requests..."
          placeholderTextColor={Colors.textLight}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.confirmBtn, (!selDate || !selTime) && {opacity: 0.5}]}
          onPress={handleBook}
          disabled={!selDate || !selTime || loading}
          activeOpacity={0.85}>
          <Icon name="check-circle" size={18} color="#fff" />
          <Text style={s.confirmBtnTxt}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  errWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  errTxt: {fontSize: 15, color: Colors.textSecondary},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Spacing.xxxl + 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {width: 40, height: 40, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center'},
  headerTitle: {fontSize: 18, fontWeight: '700', color: Colors.text},
  scroll: {padding: 20, paddingBottom: 100},

  // Summary
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryImg: {width: 90, height: 76, backgroundColor: Colors.borderLight},
  summaryInfo: {flex: 1, padding: 12, justifyContent: 'center'},
  summaryTitle: {fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4},
  summaryLoc: {flexDirection: 'row', alignItems: 'center', gap: 3},
  summaryLocTxt: {fontSize: 12, color: Colors.textSecondary},

  // Section title
  secTitle: {fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12},
  optional: {fontWeight: '400', color: Colors.textLight},

  // Dates
  datesRow: {gap: 10, marginBottom: 24},
  dateCard: {
    width: 68,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  dateCardActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  dateDay: {fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4},
  dateNum: {fontSize: 22, fontWeight: '800', color: Colors.text},
  dateMonth: {fontSize: 11, color: Colors.textSecondary, marginTop: 2},
  dateTxtActive: {color: '#fff'},

  // Time
  timeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24},
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timeSlotActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  timeTxt: {fontSize: 13, fontWeight: '600', color: Colors.textSecondary},
  timeTxtActive: {color: '#fff'},

  // Notes
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
    marginBottom: 20,
  },

  // Bottom
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnTxt: {fontSize: 16, fontWeight: '700', color: '#fff'},
});
