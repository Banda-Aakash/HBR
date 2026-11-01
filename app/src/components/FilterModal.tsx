import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {propertiesApi} from '../api/client';
import {Colors, Fonts} from '../theme';

const {height: SCREEN_H} = Dimensions.get('window');

export interface FilterState {
  city: string | null;
  type: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  sortBy: 'default' | 'price_low' | 'price_high' | 'rating' | 'newest';
}

export const DEFAULT_FILTERS: FilterState = {
  city: null,
  type: null,
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  sortBy: 'default',
};

const TYPES = ['apartment', 'house', 'villa', 'condo', 'penthouse'];
const BEDROOMS = [1, 2, 3, 4, 5];
const PRICE_RANGES = [
  {label: 'Any', min: null, max: null},
  {label: 'Under ₹25K/mo', min: null, max: 25000},
  {label: '₹25K–₹50K/mo', min: 25000, max: 50000},
  {label: 'Under ₹50L', min: null, max: 5000000},
  {label: '₹50L–₹1Cr', min: 5000000, max: 10000000},
  {label: '₹1Cr–₹3Cr', min: 10000000, max: 30000000},
  {label: '₹3Cr+', min: 30000000, max: null},
];
const SORT_OPTIONS = [
  {key: 'default' as const, label: 'Default', icon: 'sort'},
  {key: 'price_low' as const, label: 'Price: Low to High', icon: 'arrow-upward'},
  {key: 'price_high' as const, label: 'Price: High to Low', icon: 'arrow-downward'},
  {key: 'rating' as const, label: 'Top Rated', icon: 'star'},
  {key: 'newest' as const, label: 'Newest First', icon: 'schedule'},
];

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export const FilterModal: React.FC<Props> = ({visible, onClose, filters, onApply}) => {
  const [local, setLocal] = useState<FilterState>(filters);
  const [cities, setCities] = useState<string[]>([]);

  // Reset local state when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocal(filters);
      // The other filters still work if the city list can't be loaded
      propertiesApi.cities().then(res => setCities(res.cities)).catch(() => {});
    }
  }, [visible, filters]);

  const update = (patch: Partial<FilterState>) =>
    setLocal(prev => ({...prev, ...patch}));

  const activeCount = [
    local.city,
    local.type,
    local.minPrice || local.maxPrice,
    local.bedrooms,
    local.sortBy !== 'default' ? local.sortBy : null,
  ].filter(Boolean).length;

  const handleReset = () => setLocal(DEFAULT_FILTERS);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const renderPill = (
    label: string,
    isActive: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      key={label}
      style={[s.pill, isActive && s.pillActive]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Text style={[s.pillTxt, isActive && s.pillTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <TouchableOpacity style={s.overlayTap} onPress={onClose} activeOpacity={1} />

        <View style={s.sheet}>
          {/* Handle bar */}
          <View style={s.handleBar} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Filters</Text>
            {activeCount > 0 && (
              <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                <Text style={s.resetTxt}>Reset all</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

            {/* ── Location ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Location</Text>
              <View style={s.pillGrid}>
                {renderPill('Any', local.city === null, () => update({city: null}))}
                {cities.map(c =>
                  renderPill(c, local.city === c, () =>
                    update({city: local.city === c ? null : c}),
                  ),
                )}
              </View>
            </View>

            {/* ── Property Type ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Property Type</Text>
              <View style={s.pillGrid}>
                {renderPill('Any', local.type === null, () => update({type: null}))}
                {TYPES.map(t =>
                  renderPill(
                    t.charAt(0).toUpperCase() + t.slice(1),
                    local.type === t,
                    () => update({type: local.type === t ? null : t}),
                  ),
                )}
              </View>
            </View>

            {/* ── Price Range ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Price Range</Text>
              <View style={s.pillGrid}>
                {PRICE_RANGES.map(pr =>
                  renderPill(
                    pr.label,
                    local.minPrice === pr.min && local.maxPrice === pr.max,
                    () => update({minPrice: pr.min, maxPrice: pr.max}),
                  ),
                )}
              </View>
            </View>

            {/* ── Bedrooms ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Bedrooms</Text>
              <View style={s.pillGrid}>
                {renderPill('Any', local.bedrooms === null, () => update({bedrooms: null}))}
                {BEDROOMS.map(b =>
                  renderPill(
                    b === 5 ? '5+' : `${b}`,
                    local.bedrooms === b,
                    () => update({bedrooms: local.bedrooms === b ? null : b}),
                  ),
                )}
              </View>
            </View>

            {/* ── Sort By ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Sort By</Text>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[s.sortRow, local.sortBy === opt.key && s.sortRowActive]}
                  onPress={() => update({sortBy: opt.key})}
                  activeOpacity={0.8}>
                  <Icon
                    name={opt.icon}
                    size={18}
                    color={local.sortBy === opt.key ? Colors.primary : Colors.textTertiary}
                  />
                  <Text
                    style={[
                      s.sortTxt,
                      local.sortBy === opt.key && s.sortTxtActive,
                    ]}>
                    {opt.label}
                  </Text>
                  {local.sortBy === opt.key && (
                    <Icon name="check" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>

          {/* Bottom actions */}
          <View style={s.bottom}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Icon name="check" size={18} color={Colors.textInverse} />
              <Text style={s.applyBtnTxt}>
                Apply{activeCount > 0 ? ` (${activeCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const PILL_H = 38;

const s = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end'},
  overlayTap: {flex: 1},
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.85,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {fontSize: 20, fontFamily: Fonts.bold, color: Colors.text},
  resetTxt: {fontSize: 14, fontFamily: Fonts.semibold, color: Colors.primary},
  scroll: {paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8},

  // Section
  section: {marginBottom: 24},
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Pills
  pillGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  pill: {
    height: PILL_H,
    paddingHorizontal: 18,
    borderRadius: PILL_H / 2,
    backgroundColor: Colors.chipBg,
    borderWidth: 1.5,
    borderColor: Colors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: Colors.chipActiveBg,
    borderColor: Colors.chipActiveBg,
  },
  pillTxt: {fontSize: 13, fontFamily: Fonts.semibold, color: Colors.textSecondary},
  pillTxtActive: {color: Colors.chipActiveText},

  // Sort
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  sortRowActive: {
    backgroundColor: Colors.primaryLight,
  },
  sortTxt: {fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, flex: 1},
  sortTxtActive: {color: Colors.primary, fontFamily: Fonts.semibold},

  // Bottom
  bottom: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnTxt: {fontSize: 15, fontFamily: Fonts.semibold, color: Colors.text},
  applyBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyBtnTxt: {fontSize: 15, fontFamily: Fonts.bold, color: Colors.textInverse},
});
