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
import {useFocusEffect} from '@react-navigation/native';
import {bookingsApi, ApiBooking} from '../api/client';
import {ErrorState} from '../components/ErrorState';
import {useRole} from '../context/RoleContext';
import {Colors, Spacing} from '../theme';
import {parseDate, toDateString} from '../utils/format';

const IMG_H = 180;

type Tab = 'upcoming' | 'past';

export const BookingsTabScreen: React.FC = () => {
  const {mode} = useRole();
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

  const isUpcoming = (b: ApiBooking) =>
    b.status !== 'cancelled' && b.date >= toDateString(new Date());

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter(b => !isUpcoming(b));
  const activeList = tab === 'upcoming' ? upcoming : past;

  const fmtDayNum = (d: string) => parseDate(d).getDate().toString();
  const fmtMonth = (d: string) =>
    parseDate(d).toLocaleDateString('en-US', {month: 'short'}).toUpperCase();
  const fmtFull = (d: string) =>
    parseDate(d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

  const statusCfg = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {bg: '#DEF7EC', color: '#03724A', icon: 'check-circle', label: 'Confirmed'};
      case 'cancelled':
        return {bg: '#FDE8E8', color: '#C81E1E', icon: 'cancel', label: 'Cancelled'};
      case 'pending':
        return {bg: '#FEF3C7', color: '#92400E', icon: 'hourglass-top', label: 'Requested'};
      default:
        return {bg: Colors.borderLight, color: Colors.textSecondary, icon: 'info', label: status};
    }
  };

  const renderCard = ({item}: {item: ApiBooking}) => {
    const st = statusCfg(item.status);
    const canCancel = item.status === 'confirmed' || item.status === 'pending';
    const isPast = !isUpcoming(item);

    return (
      <View style={[s.card, isPast && s.cardPast]}>
        {/* ── Image with overlay info ── */}
        <View style={s.imgWrap}>
          {item.property?.image ? (
            <Image source={{uri: item.property.image}} style={s.img} />
          ) : (
            <View style={[s.img, {backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center'}]}>
              <Icon name="home" size={32} color={Colors.textLight} />
            </View>
          )}
          {/* Scrim */}
          <View style={s.imgScrim} />

          {/* Date badge top-left */}
          <View style={s.dateBadge}>
            <Text style={s.dateBadgeDay}>{fmtDayNum(item.date)}</Text>
            <Text style={s.dateBadgeMonth}>{fmtMonth(item.date)}</Text>
          </View>

          {/* Status pill top-right */}
          <View style={[s.statusPill, {backgroundColor: st.bg}]}>
            <Icon name={st.icon} size={13} color={st.color} />
            <Text style={[s.statusTxt, {color: st.color}]}>{st.label}</Text>
          </View>

          {/* Property name on image */}
          <View style={s.imgBottom}>
            <Text style={s.imgTitle} numberOfLines={1}>
              {item.property?.title || 'Property Visit'}
            </Text>
            {item.property?.city && (
              <View style={s.imgLocRow}>
                <Icon name="location-on" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={s.imgLocTxt}>{item.property.city}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Details below image ── */}
        <View style={s.details}>
          {/* Date & Time row */}
          <View style={s.infoRow}>
            <View style={s.infoChip}>
              <Icon name="event" size={16} color={Colors.primary} />
              <Text style={s.infoChipTxt}>{fmtFull(item.date)}</Text>
            </View>
            <View style={s.infoChip}>
              <Icon name="schedule" size={16} color={Colors.primary} />
              <Text style={s.infoChipTxt}>{item.time}</Text>
            </View>
          </View>

          {/* Notes */}
          {item.notes ? (
            <View style={s.notesBar}>
              <Icon name="chat-bubble-outline" size={14} color={Colors.textTertiary} />
              <Text style={s.notesTxt} numberOfLines={2}>{item.notes}</Text>
            </View>
          ) : null}

          {/* Actions — only for upcoming */}
          {canCancel && !isPast && (
            <View style={s.actionsRow}>
              <TouchableOpacity style={s.actionBtnPrimary} activeOpacity={0.8}>
                <Icon name="phone" size={16} color="#fff" />
                <Text style={s.actionBtnPrimaryTxt}>Call Agent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.actionBtnOutline}
                onPress={() => handleCancel(item)}
                activeOpacity={0.8}>
                <Icon name="event-busy" size={16} color={Colors.error} />
                <Text style={s.actionBtnOutlineTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Visits</Text>
        <View style={s.headerRight}>
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{upcoming.length}</Text>
          </View>
        </View>
      </View>

      {/* ── Tab switcher ── */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'upcoming' && s.tabBtnActive]}
          onPress={() => setTab('upcoming')}
          activeOpacity={0.8}>
          <Icon
            name="event-available"
            size={18}
            color={tab === 'upcoming' ? Colors.primary : Colors.textTertiary}
          />
          <Text style={[s.tabTxt, tab === 'upcoming' && s.tabTxtActive]}>
            Upcoming ({upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'past' && s.tabBtnActive]}
          onPress={() => setTab('past')}
          activeOpacity={0.8}>
          <Icon
            name="history"
            size={18}
            color={tab === 'past' ? Colors.primary : Colors.textTertiary}
          />
          <Text style={[s.tabTxt, tab === 'past' && s.tabTxtActive]}>
            Past ({past.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── List ── */}
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : activeList.length === 0 ? (
        <View style={s.emptyBody}>
          <View style={s.emptyRing}>
            <Icon
              name={tab === 'upcoming' ? 'event-note' : 'history'}
              size={36}
              color={Colors.primary}
            />
          </View>
          <Text style={s.emptyTitle}>
            {tab === 'upcoming' ? 'No upcoming visits' : 'No past visits'}
          </Text>
          <Text style={s.emptyTxt}>
            {tab === 'upcoming'
              ? 'When you schedule a property visit, it will appear here.'
              : 'Your completed and cancelled visits will show up here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeList}
          keyExtractor={i => i.id}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Spacing.xxxl + 10,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  countBadge: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTxt: {fontSize: 13, fontWeight: '700', color: '#fff'},

  /* Tabs */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: Colors.borderLight,
    borderRadius: 14,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  tabTxt: {fontSize: 13, fontWeight: '600', color: Colors.textTertiary},
  tabTxtActive: {color: Colors.primary},

  /* List */
  listContent: {paddingHorizontal: 20, paddingBottom: 32},

  /* Card */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 5,
  },
  cardPast: {
    opacity: 0.75,
  },
  imgWrap: {position: 'relative'},
  img: {width: '100%', height: IMG_H},
  imgScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: IMG_H * 0.6,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dateBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 52,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  dateBadgeDay: {fontSize: 22, fontWeight: '800', color: Colors.text, lineHeight: 26},
  dateBadgeMonth: {fontSize: 11, fontWeight: '700', color: Colors.primary, marginTop: -1},
  statusPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusTxt: {fontSize: 12, fontWeight: '700'},
  imgBottom: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  imgTitle: {fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4},
  imgLocRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
  imgLocTxt: {fontSize: 13, color: 'rgba(255,255,255,0.75)'},

  /* Details */
  details: {padding: 16},
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  infoChipTxt: {fontSize: 13, fontWeight: '600', color: Colors.primaryDark},
  notesBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.borderLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  notesTxt: {fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18},
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionBtnPrimaryTxt: {fontSize: 14, fontWeight: '600', color: '#fff'},
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  actionBtnOutlineTxt: {fontSize: 14, fontWeight: '600', color: Colors.error},

  /* Empty */
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 44,
    paddingBottom: 60,
  },
  emptyRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8},
  emptyTxt: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
