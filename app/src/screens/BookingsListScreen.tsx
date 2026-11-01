import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {bookingsApi, ApiBooking} from '../api/client';
import {ErrorState} from '../components/ErrorState';
import {Colors, Spacing} from '../theme';
import {RootStackParamList} from '../types';
import {parseDate, toDateString} from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const BookingsListScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    bookingsApi
      .list()
      .then(res => setBookings(res.bookings))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Refresh every time the screen comes into focus
  useFocusEffect(load);

  const handleCancel = (booking: ApiBooking) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel your visit to ${booking.property?.title || 'this property'} on ${formatDate(booking.date)} at ${booking.time}?`,
      [
        {text: 'Keep It', style: 'cancel'},
        {
          text: 'Cancel Visit',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsApi.cancel(booking.id);
              setBookings(prev =>
                prev.map(b =>
                  b.id === booking.id ? {...b, status: 'cancelled'} : b,
                ),
              );
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to cancel');
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateStr: string) => {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isUpcoming = (b: ApiBooking) => {
    if (b.status === 'cancelled') {return false;}
    return b.date >= toDateString(new Date());
  };

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter(b => !isUpcoming(b));

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {bg: Colors.successLight, color: Colors.success, label: 'Confirmed'};
      case 'cancelled':
        return {bg: Colors.errorLight, color: Colors.error, label: 'Cancelled'};
      case 'pending':
        return {bg: Colors.warningLight, color: Colors.warning, label: 'Requested'};
      default:
        return {bg: Colors.borderLight, color: Colors.textSecondary, label: status};
    }
  };

  const renderBookingCard = (item: ApiBooking) => {
    const st = getStatusStyle(item.status);
    const canCancel = item.status === 'confirmed' || item.status === 'pending';

    return (
      <View key={item.id} style={s.card}>
        {/* Property image + info */}
        <View style={s.cardTop}>
          {item.property?.image ? (
            <Image source={{uri: item.property.image}} style={s.cardImg} />
          ) : (
            <View style={[s.cardImg, s.cardImgPlaceholder]}>
              <Icon name="home" size={24} color={Colors.textLight} />
            </View>
          )}
          <View style={s.cardInfo}>
            <View style={[s.statusBadge, {backgroundColor: st.bg}]}>
              <Text style={[s.statusText, {color: st.color}]}>{st.label}</Text>
            </View>
            <Text style={s.cardTitle} numberOfLines={1}>
              {item.property?.title || 'Property'}
            </Text>
            {item.property?.city && (
              <View style={s.locRow}>
                <Icon name="location-on" size={13} color={Colors.textSecondary} />
                <Text style={s.locText}>{item.property.city}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Date & Time */}
        <View style={s.cardDivider} />
        <View style={s.detailsRow}>
          <View style={s.detailItem}>
            <View style={s.detailIcon}>
              <Icon name="event" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={s.detailLabel}>Date</Text>
              <Text style={s.detailValue}>{formatDate(item.date)}</Text>
            </View>
          </View>
          <View style={s.detailSep} />
          <View style={s.detailItem}>
            <View style={s.detailIcon}>
              <Icon name="schedule" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={s.detailLabel}>Time</Text>
              <Text style={s.detailValue}>{item.time}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {item.notes ? (
          <>
            <View style={s.cardDivider} />
            <View style={s.notesRow}>
              <Icon name="notes" size={14} color={Colors.textTertiary} />
              <Text style={s.notesText} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          </>
        ) : null}

        {/* Cancel button */}
        {canCancel && (
          <>
            <View style={s.cardDivider} />
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => handleCancel(item)}
              activeOpacity={0.7}>
              <Icon name="close" size={16} color={Colors.error} />
              <Text style={s.cancelText}>Cancel Visit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[s.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
          <Icon name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Bookings</Text>
        <View style={{width: 40}} />
      </View>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : bookings.length === 0 ? (
        <View style={s.emptyBody}>
          <View style={s.emptyCircle}>
            <Icon name="event-note" size={44} color={Colors.textLight} />
          </View>
          <Text style={s.emptyTitle}>No bookings yet</Text>
          <Text style={s.emptyText}>
            When you book a property visit, it will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...(upcoming.length > 0 ? [{type: 'header', label: `Upcoming (${upcoming.length})`}] : []),
            ...upcoming.map(b => ({type: 'booking', data: b})),
            ...(past.length > 0 ? [{type: 'header', label: `Past & Cancelled (${past.length})`}] : []),
            ...past.map(b => ({type: 'booking', data: b})),
          ]}
          keyExtractor={(item, idx) => item.type === 'header' ? `h-${idx}` : (item as any).data.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          renderItem={({item}) => {
            if (item.type === 'header') {
              return (
                <Text style={s.sectionLabel}>{(item as any).label}</Text>
              );
            }
            return renderBookingCard((item as any).data);
          }}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Spacing.xxxl + 8,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {fontSize: 18, fontWeight: '700', color: Colors.text},

  // List
  listContent: {padding: 20, paddingBottom: 32},
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {flexDirection: 'row', padding: 14},
  cardImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
  },
  cardImgPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  cardInfo: {flex: 1, marginLeft: 12, justifyContent: 'center'},
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {fontSize: 11, fontWeight: '700'},
  cardTitle: {fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2},
  locRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
  locText: {fontSize: 12, color: Colors.textSecondary},

  // Details
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginHorizontal: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  detailItem: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {fontSize: 11, color: Colors.textTertiary},
  detailValue: {fontSize: 14, fontWeight: '600', color: Colors.text},
  detailSep: {width: 1, height: 28, backgroundColor: Colors.divider, marginHorizontal: 8},

  // Notes
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
  },
  notesText: {fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18},

  // Cancel
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  cancelText: {fontSize: 13, fontWeight: '600', color: Colors.error},

  // Empty state
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8},
  emptyText: {fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21},
});
