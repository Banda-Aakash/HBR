import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {bookingsApi, propertiesApi, ApiBooking} from '../api/client';
import {ArchImage, ScreenHeader} from '../components/Arch';
import {Button} from '../components/Button';
import {ErrorState} from '../components/ErrorState';
import {SUPPORT_PHONE} from '../config';
import {useRole} from '../context/RoleContext';
import {useTheme} from '../context/ThemeContext';
import {Colors, Fonts} from '../theme';
import {formatVisitDay, toDateString} from '../utils/format';

type Tab = 'upcoming' | 'past';

const STEPS = ['Requested', 'Confirmed', 'Visited'];

/** How many tracker steps a visit has reached */
export const stepsReached = (booking: ApiBooking, today: string) => {
  if (booking.status !== 'confirmed') {return 1;}
  return booking.date < today ? 3 : 2;
};

export const BookingsTabScreen: React.FC<{showBack?: boolean}> = ({showBack}) => {
  const {mode} = useRole();
  const theme = useTheme();
  const nav = useNavigation();
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    bookingsApi
      .list(mode)
      .then(res => setBookings(res.bookings))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mode]);

  useFocusEffect(load);

  const handleCancel = (booking: ApiBooking) => {
    Alert.alert(
      'Cancel Visit',
      `Cancel your visit to ${booking.property?.title || 'this property'}?`,
      [
        {text: 'Keep', style: 'cancel'},
        {
          text: 'Cancel Visit',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsApi.cancel(booking.id);
              setBookings(prev =>
                prev.map(b => (b.id === booking.id ? {...b, status: 'cancelled'} : b)),
              );
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed');
            }
          },
        },
      ],
    );
  };

  // The visit list doesn't carry the agent, and a listing can be taken down after a visit is booked
  const callAgent = async (booking: ApiBooking) => {
    const phone = await propertiesApi
      .getById(booking.propertyId)
      .then(p => p.agent.phone.replace(/\D/g, ''))
      .catch(() => '');
    const number = phone || `+${SUPPORT_PHONE}`;
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Could Not Open', `Call us on ${number}.`),
    );
  };

  const today = toDateString(new Date());
  const isUpcoming = (b: ApiBooking) => b.status !== 'cancelled' && b.date >= today;

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter(b => !isUpcoming(b));
  const activeList = tab === 'upcoming' ? upcoming : past;

  const renderCard = ({item}: {item: ApiBooking}) => {
    const reached = stepsReached(item, today);
    const cancelled = item.status === 'cancelled';

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <ArchImage uri={item.property?.image} width={76} height={84} footRadius={10} />
          <View style={s.cardInfo}>
            <Text style={s.cardWhen}>{formatVisitDay(item.date)}, {item.time}</Text>
            <Text style={s.cardHome} numberOfLines={1}>{item.property?.title || 'Property visit'}</Text>
          </View>
        </View>

        {cancelled ? (
          <Text style={s.cancelled}>Cancelled</Text>
        ) : (
          <View style={s.tracker}>
            {STEPS.map((step, i) => (
              <View key={step} style={s.step}>
                <View style={[s.stepBar, i < reached && {backgroundColor: theme.primary}]} />
                <Text style={[s.stepTxt, i < reached && s.stepTxtDone]}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {item.notes ? <Text style={s.notes} numberOfLines={2}>{item.notes}</Text> : null}

        {isUpcoming(item) && (
          <View style={s.actions}>
            <Button title="Call agent" onPress={() => callAgent(item)} style={s.actionBtn} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancel(item)} activeOpacity={0.8} accessibilityRole="button">
              <Text style={s.cancelTxt}>Cancel visit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const tabs: {key: Tab; label: string}[] = [
    {key: 'upcoming', label: `Upcoming (${upcoming.length})`},
    {key: 'past', label: `Past (${past.length})`},
  ];

  return (
    <View style={[s.container, {backgroundColor: theme.soft}]}>
      <ScreenHeader title="Your visits" onBack={showBack ? nav.goBack : undefined} />

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <>
          <View style={s.tabs}>
            {tabs.map(t => {
              const active = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[s.tab, active && {backgroundColor: theme.primary, borderColor: theme.primary}]}
                  onPress={() => setTab(t.key)}
                  accessibilityRole="button"
                  accessibilityState={{selected: active}}>
                  <Text style={[s.tabTxt, active && s.tabTxtActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : activeList.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>{tab === 'upcoming' ? 'No upcoming visits' : 'No past visits'}</Text>
              <Text style={s.emptyTxt}>
                {tab === 'upcoming'
                  ? 'Request a visit from any home and it will appear here.'
                  : 'Your completed and cancelled visits will show up here.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={activeList}
              keyExtractor={i => i.id}
              renderItem={renderCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.list}
            />
          )}
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  tabs: {flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12},
  tab: {height: 42, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 21, borderWidth: 1, borderColor: Colors.textLight, backgroundColor: Colors.surface},
  tabTxt: {fontFamily: Fonts.semibold, fontSize: 14, color: Colors.text},
  tabTxtActive: {color: Colors.textInverse},
  list: {paddingHorizontal: 20, paddingBottom: 24, gap: 12},
  card: {padding: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, backgroundColor: Colors.surface},
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: 12},
  cardInfo: {flex: 1, minWidth: 0},
  cardWhen: {fontFamily: Fonts.display, fontSize: 19, color: Colors.text},
  cardHome: {marginTop: 3, fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary},
  cancelled: {marginTop: 12, fontFamily: Fonts.bold, fontSize: 14, color: Colors.error},
  tracker: {flexDirection: 'row', gap: 5, marginTop: 12},
  step: {flex: 1, gap: 5},
  stepBar: {height: 6, borderRadius: 3, backgroundColor: Colors.border},
  stepTxt: {fontFamily: Fonts.medium, fontSize: 13, color: Colors.textSecondary},
  stepTxtDone: {fontFamily: Fonts.bold, color: Colors.text},
  notes: {marginTop: 10, fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary},
  actions: {flexDirection: 'row', gap: 8, marginTop: 12},
  actionBtn: {flex: 1, height: 46, paddingVertical: 0, paddingHorizontal: 8, borderRadius: 13},
  cancelBtn: {flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.textLight, borderRadius: 13, backgroundColor: Colors.surface},
  cancelTxt: {fontFamily: Fonts.bold, fontSize: 15, color: Colors.text},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 44, paddingBottom: 60},
  emptyTitle: {fontFamily: Fonts.display, fontSize: 20, color: Colors.text, marginBottom: 8},
  emptyTxt: {fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22, color: Colors.textSecondary, textAlign: 'center'},
});
