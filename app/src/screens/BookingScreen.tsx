import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {propertiesApi, bookingsApi, ApiProperty} from '../api/client';
import {ArchImage, BackButton, FestiveStrip, useStripHeight} from '../components/Arch';
import {Button} from '../components/Button';
import {ErrorState} from '../components/ErrorState';
import {SUPPORT_PHONE} from '../config';
import {useRole} from '../context/RoleContext';
import {useTheme} from '../context/ThemeContext';
import {Colors, Fonts} from '../theme';
import {RootStackParamList, Booking} from '../types';
import {formatVisitDay, parseDate, toDateString} from '../utils/format';

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
      date: toDateString(d),
      day: d.toLocaleDateString('en-US', {weekday: 'short'}),
      num: d.getDate(),
    });
  }
  return days;
};

export const BookingScreen: React.FC<Props> = ({navigation, route}) => {
  const {mode} = useRole();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stripHeight = useStripHeight();
  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selDate, setSelDate] = useState('');
  const [selTime, setSelTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const dates = getNext7Days();

  const loadProperty = useCallback(() => {
    setLoadError(null);
    propertiesApi.getById(route.params.propertyId)
      .then(setProperty)
      .catch((e: Error) => setLoadError(e.message));
  }, [route.params.propertyId]);

  React.useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  if (!property) {
    return (
      <View style={s.errWrap}>
        {loadError ? (
          <ErrorState message={loadError} onRetry={loadProperty} />
        ) : (
          <Text style={s.errTxt}>Loading...</Text>
        )}
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
      const fmtDate = parseDate(selDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Build WhatsApp message
      const message = [
        `🏠 *New Visit Request*`,
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

      const whatsappUrl = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;

      // Navigate to confirmation screen
      navigation.replace('BookingConfirmation', {booking});

      // Open WhatsApp after a short delay so navigation completes first
      setTimeout(() => {
        Linking.openURL(whatsappUrl).catch(() => {
          Alert.alert(
            'Could Not Open WhatsApp',
            `Your request is saved, but we haven't been told about it yet. Please contact us at +${SUPPORT_PHONE} and quote request ${res.booking.id.slice(-8).toUpperCase()}.`,
          );
        });
      }, 500);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const chosen = (active: boolean) =>
    active ? {backgroundColor: theme.primary, borderColor: theme.primary} : undefined;

  return (
    <View style={[s.container, {backgroundColor: theme.soft}]}>
      {/* Header */}
      {theme.festival ? (
        <View style={[s.band, {backgroundColor: theme.primary, paddingTop: stripHeight + 14}]}>
          <FestiveStrip festival={theme.festival} />
          <View style={s.headerRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={[s.headerTitle, s.onBand]} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">When can you visit?</Text>
          </View>
        </View>
      ) : (
        <View style={[s.plainHeader, {paddingTop: insets.top + 12}]}>
          <View style={s.headerRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={s.headerTitle} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">When can you visit?</Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Property summary */}
        <View style={s.summary}>
          <ArchImage uri={property.images[0]} width={66} height={74} footRadius={8} />
          <View style={s.summaryInfo}>
            <Text style={s.summaryTitle} numberOfLines={2}>{property.title}</Text>
            <Text style={s.summaryLoc}>{property.city}, {property.state}</Text>
          </View>
        </View>

        {/* Date */}
        <Text style={s.secTitle}>Pick a day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.datesRow}>
          {dates.map(d => {
            const active = selDate === d.date;
            return (
              <TouchableOpacity
                key={d.date}
                style={[s.dayPill, chosen(active)]}
                onPress={() => setSelDate(d.date)}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[s.dayName, active && s.onBand]}>{d.day}</Text>
                <Text style={[s.dayNum, active && s.onBand]}>{d.num}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time */}
        <Text style={s.secTitle}>Pick a time</Text>
        <View style={s.timeGrid}>
          {timeSlots.map(t => {
            const active = selTime === t;
            return (
              <TouchableOpacity
                key={t}
                style={[s.timeSlot, chosen(active)]}
                onPress={() => setSelTime(t)}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[s.timeTxt, active && s.onBand]}>{t}</Text>
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
          placeholder="Any questions or special requests"
          placeholderTextColor={Colors.textSecondary}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Notes"
        />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, {paddingBottom: Math.max(insets.bottom, 12) + 4}]}>
        <View>
          <Text style={s.bottomLbl}>{selDate ? formatVisitDay(selDate) : 'Choose a day'}</Text>
          <Text style={s.bottomVal}>{selTime || 'and a time'}</Text>
        </View>
        <Button
          title="Send request"
          onPress={handleBook}
          loading={loading}
          disabled={!selDate || !selTime}
         
          style={s.sendBtn}
        />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1},
  errWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  errTxt: {fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary},
  onBand: {color: Colors.textInverse},
  band: {paddingHorizontal: 20, paddingBottom: 18, overflow: 'hidden'},
  plainHeader: {paddingHorizontal: 20, paddingBottom: 8},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  headerTitle: {flex: 1, fontFamily: Fonts.heavy, fontSize: 27, letterSpacing: -0.5, color: Colors.text},
  scroll: {padding: 20, paddingBottom: 24},
  summary: {flexDirection: 'row', alignItems: 'center', gap: 12},
  summaryInfo: {flex: 1, minWidth: 0},
  summaryTitle: {fontFamily: Fonts.bold, fontSize: 17, color: Colors.text},
  summaryLoc: {marginTop: 2, fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary},
  secTitle: {marginTop: 20, marginBottom: 10, fontFamily: Fonts.bold, fontSize: 17, color: Colors.text},
  optional: {fontFamily: Fonts.regular, color: Colors.textSecondary},
  datesRow: {gap: 8},
  dayPill: {width: 64, height: 96, paddingBottom: 12, alignItems: 'center', justifyContent: 'flex-end', borderWidth: 1, borderColor: Colors.textLight, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: Colors.surface},
  dayName: {fontFamily: Fonts.semibold, fontSize: 13, color: Colors.text},
  dayNum: {fontFamily: Fonts.display, fontSize: 23, color: Colors.text},
  timeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  timeSlot: {width: '31.8%', height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.textLight, borderRadius: 12, backgroundColor: Colors.surface},
  timeTxt: {fontFamily: Fonts.semibold, fontSize: 14, color: Colors.text},
  notesInput: {minHeight: 88, padding: 14, borderWidth: 1, borderColor: Colors.textLight, borderRadius: 14, backgroundColor: Colors.surface, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text},
  bottomBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface},
  bottomLbl: {fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary},
  bottomVal: {marginTop: 1, fontFamily: Fonts.bold, fontSize: 15, color: Colors.text},
  sendBtn: {height: 52, paddingVertical: 0, paddingHorizontal: 30},
});
