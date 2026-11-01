import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {propertiesApi, favoritesApi, ApiProperty} from '../api/client';
import {ErrorState} from '../components/ErrorState';
import {FilterModal, FilterState, DEFAULT_FILTERS} from '../components/FilterModal';
import {Colors} from '../theme';
import {RootStackParamList} from '../types';
import {formatPrice} from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const {width} = Dimensions.get('window');
const CARD_W = width * 0.7;

const PROPERTY_TYPES = [
  {key: 'all', label: 'All', icon: 'apps'},
  {key: 'apartment', label: 'Apartment', icon: 'apartment'},
  {key: 'house', label: 'House', icon: 'house'},
  {key: 'villa', label: 'Villa', icon: 'villa'},
  {key: 'condo', label: 'Condo', icon: 'business'},
  {key: 'penthouse', label: 'Penthouse', icon: 'location-city'},
];

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const {user} = useAuth();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [featured, setFeatured] = useState<ApiProperty[]>([]);
  const [all, setAll] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  // Answers to an older search or filter are dropped when a newer one has started
  const latestRequest = useRef(0);

  const activeFilterCount = [
    filters.city,
    filters.type,
    filters.minPrice || filters.maxPrice,
    filters.bedrooms,
    filters.sortBy !== 'default' ? filters.sortBy : null,
  ].filter(Boolean).length;

  const fetchPage = useCallback(
    (nextPage: number) =>
      propertiesApi.list({
        type: filters.type || (activeType !== 'all' ? activeType : undefined),
        city: filters.city || undefined,
        search: query || undefined,
        minPrice: filters.minPrice ?? undefined,
        maxPrice: filters.maxPrice ?? undefined,
        bedrooms: filters.bedrooms ?? undefined,
        sort: filters.sortBy !== 'default' ? filters.sortBy : undefined,
        page: nextPage,
      }),
    [activeType, query, filters],
  );

  const fetchData = useCallback(async () => {
    const request = ++latestRequest.current;
    try {
      const [featRes, allRes] = await Promise.all([
        propertiesApi.list({featured: true}),
        fetchPage(1),
      ]);
      if (request !== latestRequest.current) {return;}
      setFeatured(featRes.properties);
      setAll(allRes.properties);
      setPage(1);
      setHasMore(allRes.hasMore);
      setError(null);
    } catch (e: any) {
      if (request === latestRequest.current) {
        setError(e.message || 'Could not load properties.');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMore = async () => {
    const request = latestRequest.current;
    setLoadingMore(true);
    try {
      const res = await fetchPage(page + 1);
      if (request !== latestRequest.current) {return;}
      setAll(prev => [...prev, ...res.properties]);
      setPage(page + 1);
      setHasMore(res.hasMore);
    } catch (e: any) {
      Alert.alert('Could Not Load More', e.message || 'Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFav = async (propertyId: string) => {
    try {
      const res = await favoritesApi.toggle(propertyId);
      const update = (list: ApiProperty[]) =>
        list.map(p =>
          p.id === propertyId ? {...p, isFavorite: res.isFavorite} : p,
        );
      setFeatured(update);
      setAll(update);
    } catch (e) {
      console.warn('Failed to toggle favorite:', e);
    }
  };

  const goDetail = (p: ApiProperty) =>
    nav.navigate('PropertyDetail', {propertyId: p.id});

  if (loading) {
    return (
      <View style={[s.screen, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 36}}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={{flex: 1, marginRight: 16}}>
            <Text style={s.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
            <Text style={s.headline}>Find your{'\n'}perfect place</Text>
          </View>
          <TouchableOpacity>
            <Image
              source={{uri: user?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'}}
              style={s.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchSection}>
        <View style={s.searchBar}>
          <Icon name="search" size={22} color={Colors.textTertiary} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search city, neighbourhood..."
            placeholderTextColor={Colors.textTertiary}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.filterIcon} onPress={() => setShowFilters(true)} activeOpacity={0.8}>
              <Icon name="tune" size={18} color={Colors.primary} />
              {activeFilterCount > 0 && (
                <View style={s.filterBadge}>
                  <Text style={s.filterBadgeTxt}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {PROPERTY_TYPES.map(t => {
          const active = activeType === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setActiveType(t.key)}>
              <Icon name={t.icon} size={18} color={active ? Colors.chipActiveText : Colors.textSecondary} />
              <Text style={[s.chipTxt, active && s.chipTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured */}
      {featured.length > 0 && (
        <>
          <View style={s.secHeader}>
            <Text style={s.secTitle}>Featured</Text>
            <TouchableOpacity onPress={() => goDetail(featured[0])}>
              <Text style={s.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingLeft: 24, paddingRight: 10}}
            keyExtractor={i => i.id}
            snapToInterval={CARD_W + 16}
            decelerationRate="fast"
            renderItem={({item}) => (
              <TouchableOpacity style={s.fCard} onPress={() => goDetail(item)} activeOpacity={0.92}>
                <Image source={{uri: item.images[0]}} style={s.fImg} />
                <View style={s.fTopRow}>
                  <View style={s.fBadge}><Text style={s.fBadgeTxt}>Featured</Text></View>
                  <TouchableOpacity style={s.heartBtn} onPress={() => toggleFav(item.id)}>
                    <Icon name={item.isFavorite ? 'favorite' : 'favorite-border'} size={18} color={item.isFavorite ? Colors.heart : '#fff'} />
                  </TouchableOpacity>
                </View>
                <View style={s.fBottom}>
                  <Text style={s.fPrice}>{formatPrice(item.price, item.priceUnit)}</Text>
                  <Text style={s.fName} numberOfLines={1}>{item.title}</Text>
                  <View style={s.fLocRow}>
                    <Icon name="location-on" size={13} color="rgba(255,255,255,0.7)" />
                    <Text style={s.fLoc}>{item.city}, {item.state}</Text>
                  </View>
                  <View style={s.fStats}>
                    <View style={s.fStat}><Icon name="king-bed" size={13} color="rgba(255,255,255,0.8)" /><Text style={s.fStatTxt}>{item.bedrooms} Beds</Text></View>
                    <View style={s.fStat}><Icon name="bathtub" size={13} color="rgba(255,255,255,0.8)" /><Text style={s.fStatTxt}>{item.bathrooms} Baths</Text></View>
                    <View style={s.fStat}><Icon name="square-foot" size={13} color="rgba(255,255,255,0.8)" /><Text style={s.fStatTxt}>{item.area} sqft</Text></View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Near You */}
      <View style={[s.secHeader, {marginTop: 28}]}>
        <Text style={s.secTitle}>Near You</Text>
      </View>
      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : all.length === 0 ? (
        <View style={s.empty}>
          <Icon name="search-off" size={42} color={Colors.textLight} />
          <Text style={s.emptyTxt}>No properties match your search</Text>
        </View>
      ) : (
        all.map(item => (
          <TouchableOpacity key={item.id} style={s.nCard} onPress={() => goDetail(item)} activeOpacity={0.92}>
            <Image source={{uri: item.images[0]}} style={s.nImg} />
            <View style={s.nBody}>
              <View style={s.nTopRow}>
                <View style={s.nTypeBadge}>
                  <Text style={s.nTypeTxt}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
                </View>
                {item.reviewCount > 0 && (
                  <View style={s.nRating}>
                    <Icon name="star" size={14} color={Colors.star} />
                    <Text style={s.nRatingTxt}>{item.rating}</Text>
                    <Text style={s.nReviewCnt}>({item.reviewCount})</Text>
                  </View>
                )}
              </View>
              <Text style={s.nTitle} numberOfLines={1}>{item.title}</Text>
              <View style={s.nLocRow}>
                <Icon name="location-on" size={14} color={Colors.primary} />
                <Text style={s.nLocTxt} numberOfLines={1}>{item.address}, {item.city}</Text>
              </View>
              <View style={s.nDiv} />
              <View style={s.nBotRow}>
                <Text style={s.nPrice}>{formatPrice(item.price, item.priceUnit)}</Text>
                <View style={s.nStatRow}>
                  <View style={s.nStatChip}><Text style={s.nStatTxt}>{item.bedrooms} bed</Text></View>
                  <View style={s.nStatChip}><Text style={s.nStatTxt}>{item.bathrooms} bath</Text></View>
                  <View style={s.nStatChip}><Text style={s.nStatTxt}>{item.area} sqft</Text></View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
      {!error && hasMore && (
        <TouchableOpacity
          style={s.moreBtn}
          onPress={loadMore}
          disabled={loadingMore}
          activeOpacity={0.8}
          accessibilityRole="button">
          <Text style={s.moreTxt}>{loadingMore ? 'Loading...' : 'Load More'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>

    <FilterModal
      visible={showFilters}
      onClose={() => setShowFilters(false)}
      filters={filters}
      onApply={newFilters => {
        setFilters(newFilters);
        // Also sync the type chip bar with filter type
        if (newFilters.type) {
          setActiveType(newFilters.type);
        }
      }}
    />
    </>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.background},
  header: {backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24},
  headerRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  greeting: {fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: 6},
  headline: {fontSize: 26, fontWeight: '800', color: '#fff', lineHeight: 33, letterSpacing: -0.3},
  avatar: {width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: Colors.borderLight},
  searchSection: {paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8},
  searchBar: {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 16, height: 52, gap: 12, shadowColor: Colors.shadowDark, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.8, shadowRadius: 12, elevation: 5},
  searchInput: {flex: 1, fontSize: 15, color: Colors.text},
  filterIcon: {width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', position: 'relative' as const},
  filterBadge: {position: 'absolute' as const, top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  filterBadgeTxt: {fontSize: 10, fontWeight: '700', color: Colors.textInverse},
  filterRow: {paddingHorizontal: 24, gap: 10, marginTop: 12, marginBottom: 4},
  chip: {flexDirection: 'row', alignItems: 'center', gap: 7, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.chipBg, borderWidth: 1.5, borderColor: Colors.chipBorder},
  chipActive: {backgroundColor: Colors.chipActiveBg, borderColor: Colors.chipActiveBg},
  chipTxt: {fontSize: 13, fontWeight: '600', color: Colors.textSecondary},
  chipTxtActive: {color: Colors.chipActiveText},
  secHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 20, marginBottom: 16},
  secTitle: {fontSize: 20, fontWeight: '700', color: Colors.text},
  seeAll: {fontSize: 14, fontWeight: '600', color: Colors.primaryMedium},
  fCard: {width: CARD_W, height: 240, borderRadius: 18, overflow: 'hidden', marginRight: 16, backgroundColor: Colors.borderLight},
  fImg: {width: '100%', height: '100%'},
  fTopRow: {position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  fBadge: {backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8},
  fBadgeTxt: {fontSize: 11, fontWeight: '700', color: '#fff'},
  heartBtn: {width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center'},
  fBottom: {position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.45)', borderBottomLeftRadius: 18, borderBottomRightRadius: 18},
  fPrice: {fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 3},
  fName: {fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4},
  fLocRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10},
  fLoc: {fontSize: 12, color: 'rgba(255,255,255,0.7)'},
  fStats: {flexDirection: 'row', gap: 14},
  fStat: {flexDirection: 'row', alignItems: 'center', gap: 4},
  fStatTxt: {fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)'},
  nCard: {backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', marginHorizontal: 24, marginBottom: 16, shadowColor: Colors.shadow, shadowOffset: {width: 0, height: 4}, shadowOpacity: 1, shadowRadius: 12, elevation: 3},
  nImg: {width: '100%', height: 170, backgroundColor: Colors.borderLight},
  nBody: {padding: 16},
  nTopRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  nTypeBadge: {backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  nTypeTxt: {fontSize: 11, fontWeight: '700', color: Colors.primary},
  nRating: {flexDirection: 'row', alignItems: 'center', gap: 4},
  nRatingTxt: {fontSize: 13, fontWeight: '700', color: Colors.text},
  nReviewCnt: {fontSize: 12, color: Colors.textSecondary},
  nTitle: {fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6},
  nLocRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12},
  nLocTxt: {fontSize: 13, color: Colors.textSecondary, flex: 1},
  nDiv: {height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginBottom: 12},
  nBotRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  nPrice: {fontSize: 19, fontWeight: '800', color: Colors.text},
  nStatRow: {flexDirection: 'row', gap: 6},
  nStatChip: {backgroundColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6},
  nStatTxt: {fontSize: 11, fontWeight: '600', color: Colors.textSecondary},
  empty: {alignItems: 'center', paddingVertical: 48},
  emptyTxt: {fontSize: 15, color: Colors.textSecondary, marginTop: 12},
  moreBtn: {marginHorizontal: 24, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.chipBorder, alignItems: 'center', justifyContent: 'center'},
  moreTxt: {fontSize: 14, fontWeight: '600', color: Colors.primary},
});
