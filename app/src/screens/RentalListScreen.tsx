import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {rentalsApi, ApiRental} from '../api/client';
import {
  TenancyState,
  TENANCY_STATE_LABELS,
  TENANCY_STATE_COLORS,
} from '../types/rental';
import {RootStackParamList} from '../types';
import {Colors, Spacing} from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type FilterKey = TenancyState | 'all';

const FILTERS: {key: FilterKey; label: string}[] = [
  {key: 'all', label: 'All'},
  {key: 'onboarding', label: 'Onboarding'},
  {key: 'marketing', label: 'Marketing'},
  {key: 'agreement', label: 'Agreement'},
  {key: 'occupied', label: 'Occupied'},
  {key: 'notice', label: 'Notice'},
  {key: 'move_out', label: 'Move Out'},
];

export const RentalListScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [rentals, setRentals] = useState<ApiRental[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rentalsApi.list(filter !== 'all' ? filter : undefined);
      setRentals(res.rentals);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const fmtRent = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  /* ─── Card ─── */
  const renderCard = ({item}: {item: ApiRental}) => {
    const stColor = TENANCY_STATE_COLORS[item.state as TenancyState] || Colors.textSecondary;
    const stLabel = TENANCY_STATE_LABELS[item.state as TenancyState] || item.state;

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.94}
        onPress={() => nav.navigate('TenancyDetail', {tenancyId: item.id})}>

        {/* Image */}
        <Image source={{uri: item.property.image}} style={s.cardImg} />

        {/* State ribbon */}
        <View style={[s.ribbon, {backgroundColor: stColor}]}>
          <Text style={s.ribbonTxt}>{stLabel}</Text>
        </View>

        {/* Content */}
        <View style={s.cardContent}>
          {/* Row 1: name + rent */}
          <View style={s.nameRow}>
            <Text style={s.cardName} numberOfLines={1}>{item.property.address}</Text>
            <Text style={s.cardRent}>{fmtRent(item.rent)}<Text style={s.cardRentUnit}>/mo</Text></Text>
          </View>

          {/* Row 2: meta */}
          <Text style={s.cardMeta}>
            {item.property.unitNo}
            {item.property.tower ? `  ·  ${item.property.tower}` : ''}
            {`  ·  Floor ${item.property.floor}`}
            {item.property.carpetArea > 0 ? `  ·  ${item.property.carpetArea} sqft` : ''}
          </Text>

          {/* Row 3: location */}
          <View style={s.cardLocRow}>
            <Icon name="place" size={14} color={Colors.textTertiary} />
            <Text style={s.cardLocTxt}>{item.property.locality}, {item.property.city}</Text>
          </View>

          {/* Row 4: actions */}
          <View style={s.cardActions}>
            <TouchableOpacity
              style={s.btnPrimary}
              activeOpacity={0.85}
              onPress={() => nav.navigate('TenancyDetail', {tenancyId: item.id})}>
              <Text style={s.btnPrimaryTxt}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.btnGhost}
              activeOpacity={0.85}
              onPress={() => nav.navigate('TenancyTransition', {tenancyId: item.id})}>
              <Text style={s.btnGhostTxt}>Advance State</Text>
              <Icon name="chevron-right" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ─── Screen ─── */
  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>My Rentals</Text>
          <Text style={s.subtitle}>
            {loading ? '...' : `${rentals.length} propert${rentals.length !== 1 ? 'ies' : 'y'}`}
          </Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          activeOpacity={0.85}
          onPress={() => nav.navigate('AddProperty')}>
          <Icon name="add" size={20} color="#fff" />
          <Text style={s.addBtnTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filters — fixed height, equal padding, horizontally scrollable */}
      <View style={s.filterWrap}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterList}
          keyExtractor={f => f.key}
          renderItem={({item: f}) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                style={[s.filterBtn, active && s.filterBtnActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.8}>
                <Text style={[s.filterBtnTxt, active && s.filterBtnTxtActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rentals}
          keyExtractor={i => i.id}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <View style={s.emptyCircle}>
                <Icon name="home-work" size={36} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>No properties</Text>
              <Text style={s.emptyBody}>
                Add your first property to start managing it.
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                activeOpacity={0.85}
                onPress={() => nav.navigate('AddProperty')}>
                <Icon name="add" size={18} color="#fff" />
                <Text style={s.emptyBtnTxt}>Add Property</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

/* ════════════════════════════════════════ */

const FILTER_H = 38;

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.background},

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Spacing.xxxl + 10,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  headerLeft: {},
  title: {fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5},
  subtitle: {fontSize: 14, color: Colors.textSecondary, marginTop: 3},
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
  },
  addBtnTxt: {fontSize: 14, fontWeight: '600', color: '#fff'},

  /* Filters */
  filterWrap: {
    backgroundColor: Colors.surface,
    paddingTop: 12,
    paddingBottom: 14,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterBtn: {
    height: FILTER_H,
    paddingHorizontal: 18,
    borderRadius: FILTER_H / 2,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterBtnTxtActive: {
    color: '#fff',
  },

  /* List */
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  listContent: {padding: 20, paddingBottom: 32},

  /* Card */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImg: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.borderLight,
  },
  ribbon: {
    position: 'absolute',
    top: 12,
    left: 0,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  ribbonTxt: {fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.3},
  cardContent: {padding: 16},
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardName: {fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 10},
  cardRent: {fontSize: 16, fontWeight: '800', color: Colors.primary},
  cardRentUnit: {fontSize: 12, fontWeight: '500', color: Colors.textTertiary},
  cardMeta: {fontSize: 13, color: Colors.textSecondary, marginBottom: 6, lineHeight: 18},
  cardLocRow: {flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 16},
  cardLocTxt: {fontSize: 13, color: Colors.textTertiary},

  /* Card actions */
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btnPrimary: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryTxt: {fontSize: 14, fontWeight: '600', color: '#fff'},
  btnGhost: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  btnGhostTxt: {fontSize: 14, fontWeight: '600', color: Colors.primary},

  /* Empty */
  emptyWrap: {alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32},
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8},
  emptyBody: {fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24},
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },
  emptyBtnTxt: {fontSize: 15, fontWeight: '700', color: '#fff'},
});
