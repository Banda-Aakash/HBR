import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {propertiesApi, ApiProperty} from '../api/client';
import {
  ArchIcon,
  ArchImage,
  FestiveScene,
  FestiveStrip,
  Logo,
  PriceTag,
  RoundButton,
  useStripHeight,
} from '../components/Arch';
import {ErrorState} from '../components/ErrorState';
import {FilterModal, FilterState, DEFAULT_FILTERS} from '../components/FilterModal';
import {useTheme} from '../context/ThemeContext';
import {Colors, Fonts} from '../theme';
import {RootStackParamList} from '../types';
import {formatArea, formatPrice} from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const QUICK_FILTERS = [
  {key: 'all', label: 'All homes'},
  {key: '2bhk', label: '2 BHK', bedrooms: 2},
  {key: '3bhk', label: '3 BHK', bedrooms: 3},
  {key: 'villa', label: 'Villas', type: 'villa'},
];

const summary = (item: ApiProperty) =>
  `${item.city} · ${item.bedrooms} BHK · ${formatArea(item.area, item.areaUnit)}`;

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const stripHeight = useStripHeight();
  const [query, setQuery] = useState('');
  const [quickKey, setQuickKey] = useState('all');
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
    (nextPage: number) => {
      const quick = QUICK_FILTERS.find(q => q.key === quickKey);
      return propertiesApi.list({
        type: filters.type || quick?.type,
        city: filters.city || undefined,
        search: query || undefined,
        minPrice: filters.minPrice ?? undefined,
        maxPrice: filters.maxPrice ?? undefined,
        bedrooms: filters.bedrooms ?? quick?.bedrooms,
        sort: filters.sortBy !== 'default' ? filters.sortBy : undefined,
        page: nextPage,
      });
    },
    [quickKey, query, filters],
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

  const goDetail = (p: ApiProperty) =>
    nav.navigate('PropertyDetail', {propertyId: p.id});

  if (loading) {
    return (
      <View style={[s.screen, s.center, {backgroundColor: theme.soft}]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const onBand = !!theme.festival;
  const cityLabel = filters.city || 'All cities';

  const topBar = (
    <View style={s.topBar}>
      <TouchableOpacity
        style={s.cityBtn}
        onPress={() => setShowFilters(true)}
        accessibilityRole="button"
        accessibilityLabel={`Change city, currently ${cityLabel}`}>
        <Logo onDark={onBand} />
        <View>
          <Text style={[s.cityHint, onBand && s.onBand]}>Looking in</Text>
          <View style={s.cityRow}>
            <Text style={[s.cityName, onBand && s.onBand]}>{cityLabel}</Text>
            <ArchIcon name="down" size={14} strokeWidth={2.4} color={onBand ? Colors.textInverse : Colors.text} />
          </View>
        </View>
      </TouchableOpacity>
      <RoundButton onPress={() => nav.navigate('Saved')} label="Saved homes" bordered={!onBand}>
        <ArchIcon name="heart" />
      </RoundButton>
    </View>
  );

  return (
    <>
    <ScrollView style={[s.screen, {backgroundColor: theme.soft}]} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {theme.festival ? (
        <View style={[s.band, {backgroundColor: theme.primary, height: stripHeight + 162}]}>
          <FestiveStrip festival={theme.festival} />
          <View style={[s.bandBar, {top: stripHeight + 2}]}>{topBar}</View>
          <Text
            style={[s.wish, {top: stripHeight + 54, width: width - 160}]}
            numberOfLines={2}
            adjustsFontSizeToFit
            accessibilityRole="header">
            {theme.wish}
          </Text>
          <View style={s.bandScene} pointerEvents="none">
            <FestiveScene festival={theme.festival} width={132} />
          </View>
        </View>
      ) : (
        <View style={{paddingTop: insets.top + 12}}>
          <View style={s.plainBar}>{topBar}</View>
          <Text style={s.headline} accessibilityRole="header">Find the home you'll cross a bridge for</Text>
        </View>
      )}

      {/* Search */}
      <View style={[s.searchBar, onBand && s.searchOverlap]}>
        <ArchIcon name="search" color={Colors.textSecondary} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search locality or project"
          placeholderTextColor={Colors.textSecondary}
          accessibilityLabel="Search locality or project"
        />
        {query.length > 0 ? (
          <TouchableOpacity style={s.clearBtn} onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
            <ArchIcon name="close" color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.filterBtn, {backgroundColor: theme.primary}]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filters">
            <ArchIcon name="filter" size={18} color={theme.filterIcon} />
            {activeFilterCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeTxt}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Quick filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {QUICK_FILTERS.map(q => {
          const active = quickKey === q.key;
          return (
            <TouchableOpacity
              key={q.key}
              style={[s.chip, active && {backgroundColor: theme.primary, borderColor: theme.primary}]}
              onPress={() => setQuickKey(q.key)}
              accessibilityRole="button"
              accessibilityState={{selected: active}}>
              <Text style={[s.chipTxt, active && s.onBand]}>{q.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured */}
      {featured.length > 0 && (
        <>
          <Text style={s.secTitle} accessibilityRole="header">Featured homes</Text>
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.featuredList}
            keyExtractor={i => i.id}
            snapToInterval={252}
            decelerationRate="fast"
            renderItem={({item}) => (
              <TouchableOpacity style={s.fCard} onPress={() => goDetail(item)} activeOpacity={0.92} accessibilityRole="button" accessibilityLabel={`View ${item.title}`}>
                <View>
                  <ArchImage uri={item.images[0]} width={236} height={288} />
                  <PriceTag price={formatPrice(item.price, item.priceUnit)} />
                </View>
                <Text style={s.fName} numberOfLines={1}>{item.title}</Text>
                <Text style={s.fMeta} numberOfLines={1}>{summary(item)}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* All listings, newest first */}
      <Text style={s.secTitle} accessibilityRole="header">Newest homes</Text>
      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : all.length === 0 ? (
        <Text style={s.emptyTxt}>No properties match your search</Text>
      ) : (
        all.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[s.row, index < all.length - 1 && s.rowLine]}
            onPress={() => goDetail(item)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`View ${item.title}`}>
            <ArchImage uri={item.images[0]} width={92} height={92} footRadius={10} />
            <View style={s.rowBody}>
              <Text style={s.rowPrice}>{formatPrice(item.price, item.priceUnit)}</Text>
              <Text style={s.rowName} numberOfLines={1}>{item.title}</Text>
              <Text style={s.rowMeta} numberOfLines={1}>{summary(item)}</Text>
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
        // Keeps the chips in step with what the filter sheet just chose
        setQuickKey(newFilters.type === 'villa' ? 'villa' : 'all');
      }}
    />
    </>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1},
  center: {justifyContent: 'center', alignItems: 'center'},
  content: {paddingBottom: 36},
  onBand: {color: Colors.textInverse},
  band: {overflow: 'hidden'},
  bandBar: {position: 'absolute', left: 20, right: 20},
  // Sits clear of the search bar, which overlaps the bottom of the band
  bandScene: {position: 'absolute', right: 4, bottom: 30},
  wish: {position: 'absolute', left: 20, fontFamily: Fonts.heavy, fontSize: 30, lineHeight: 32, letterSpacing: -0.6, color: Colors.textInverse},
  plainBar: {paddingHorizontal: 20},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  cityBtn: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44},
  cityHint: {fontFamily: Fonts.medium, fontSize: 12, color: Colors.textSecondary},
  cityRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  cityName: {fontFamily: Fonts.bold, fontSize: 16, color: Colors.text},
  headline: {marginTop: 22, marginBottom: 16, marginHorizontal: 20, fontFamily: Fonts.heavy, fontSize: 36, lineHeight: 38, letterSpacing: -1, color: Colors.text},
  searchBar: {flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, marginHorizontal: 20, paddingLeft: 16, paddingRight: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, backgroundColor: Colors.surface},
  searchOverlap: {marginTop: -26},
  searchInput: {flex: 1, minWidth: 0, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text},
  clearBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  filterBtn: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  filterBadge: {position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center'},
  filterBadgeTxt: {fontFamily: Fonts.bold, fontSize: 10, color: Colors.primary},
  chipRow: {paddingHorizontal: 20, paddingTop: 14, gap: 8},
  chip: {height: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: Colors.textLight, backgroundColor: Colors.surface},
  chipTxt: {fontFamily: Fonts.semibold, fontSize: 14, color: Colors.text},
  secTitle: {marginTop: 28, marginBottom: 14, marginHorizontal: 20, fontFamily: Fonts.display, fontSize: 22, letterSpacing: -0.2, color: Colors.text},
  featuredList: {paddingHorizontal: 20},
  fCard: {width: 236, marginRight: 16},
  fName: {marginTop: 12, fontFamily: Fonts.bold, fontSize: 17, color: Colors.text},
  fMeta: {marginTop: 2, fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, paddingVertical: 12},
  rowLine: {borderBottomWidth: 1, borderBottomColor: Colors.border},
  rowBody: {flex: 1, minWidth: 0},
  rowPrice: {fontFamily: Fonts.display, fontSize: 19, color: Colors.text},
  rowName: {marginTop: 2, fontFamily: Fonts.semibold, fontSize: 15, color: Colors.text},
  rowMeta: {marginTop: 2, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary},
  emptyTxt: {marginHorizontal: 20, paddingVertical: 24, fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary},
  moreBtn: {marginHorizontal: 20, marginTop: 12, height: 48, borderRadius: 14, borderWidth: 1, borderColor: Colors.textLight, alignItems: 'center', justifyContent: 'center'},
  moreTxt: {fontFamily: Fonts.semibold, fontSize: 14, color: Colors.text},
});
