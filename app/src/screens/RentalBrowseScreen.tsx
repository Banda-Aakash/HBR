import React, {useState, useCallback, useRef} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {rentalsApi, ApiRental} from '../api/client';
import {ErrorState} from '../components/ErrorState';
import {RootStackParamList} from '../types';
import {Colors, Spacing} from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const RentalBrowseScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [rentals, setRentals] = useState<ApiRental[]>([]);
  const [available, setAvailable] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Answers to an older search are dropped when a newer one has started
  const latestRequest = useRef(0);

  const load = useCallback(async (nextPage: number) => {
    const request = ++latestRequest.current;
    try {
      const res = await rentalsApi.browseAll({search: query.trim() || undefined, page: nextPage});
      if (request !== latestRequest.current) {return;}
      setRentals(prev => (nextPage === 1 ? res.rentals : [...prev, ...res.rentals]));
      setAvailable(res.available);
      setPage(nextPage);
      setHasMore(res.hasMore);
      setError(null);
    } catch (e: any) {
      if (request === latestRequest.current) {
        setError(e.message || 'Could not load rentals.');
      }
    } finally {
      if (request === latestRequest.current) {
        setLoading(false);
      }
    }
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load]),
  );

  const fmtRent = (n: number) => `₹${n.toLocaleString('en-IN')}/mo`;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Find a Rental</Text><Text style={s.sub}>{available} available now</Text></View>
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Icon name="search" size={22} color={Colors.textTertiary} />
          <TextInput style={s.input} value={query} onChangeText={setQuery} placeholder="Locality, address..." placeholderTextColor={Colors.textTertiary} />
          {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><Icon name="close" size={20} color={Colors.textTertiary} /></TouchableOpacity>}
        </View>
      </View>
      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList data={rentals} keyExtractor={i => i.id} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 32}}
          onEndReached={() => {
            if (hasMore) {load(page + 1);}
          }}
          renderItem={({item}) => {
            const avail = item.state === 'marketing';
            return (
              <TouchableOpacity style={s.card} onPress={() => nav.navigate('RentalPropertyDetail', {tenancyId: item.id})} activeOpacity={0.9}>
                <Image source={{uri: item.property.image}} style={s.cardImg} />
                <View style={s.badgeRow}><View style={[s.availBadge, {backgroundColor: avail ? Colors.success : Colors.warning}]}><Text style={s.availTxt}>{avail ? 'Available' : 'Leased'}</Text></View></View>
                <View style={s.cardBody}>
                  <Text style={s.cardTitle}>{item.property.address}</Text>
                  <Text style={s.cardUnit}>{item.property.unitNo}{item.property.tower ? ` · ${item.property.tower}` : ''} · F{item.property.floor}</Text>
                  <View style={s.locRow}><Icon name="location-on" size={14} color={Colors.primary} /><Text style={s.locTxt}>{item.property.locality}, {item.property.city}</Text></View>
                  <View style={s.div} />
                  <View style={s.botRow}><Text style={s.rent}>{fmtRent(item.rent)}</Text><View style={s.chips}><Text style={s.chip}>{item.property.carpetArea} sqft</Text>{item.property.facing && <Text style={s.chip}>{item.property.facing}</Text>}</View></View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={error ? <ErrorState message={error} onRetry={() => load(1)} /> : <View style={s.empty}><Icon name="search-off" size={44} color={Colors.textLight} /><Text style={s.emptyTxt}>No rentals found</Text></View>}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  header: {paddingHorizontal: 20, paddingTop: Spacing.xxxl + 10, paddingBottom: 4},
  title: {fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5},
  sub: {fontSize: 14, color: Colors.textSecondary, marginTop: 2},
  searchWrap: {paddingHorizontal: 20, paddingVertical: 12},
  searchBar: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 50, gap: 10, borderWidth: 1, borderColor: Colors.chipBorder},
  input: {flex: 1, fontSize: 15, color: Colors.text},
  card: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3},
  cardImg: {width: '100%', height: 170, backgroundColor: Colors.borderLight},
  badgeRow: {position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6},
  availBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  availTxt: {fontSize: 11, fontWeight: '700', color: '#fff'},
  cardBody: {padding: 14},
  cardTitle: {fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 2},
  cardUnit: {fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 6},
  locRow: {flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10},
  locTxt: {fontSize: 13, color: Colors.textSecondary},
  div: {height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginBottom: 10},
  botRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  rent: {fontSize: 20, fontWeight: '800', color: Colors.text},
  chips: {flexDirection: 'row', gap: 6},
  chip: {fontSize: 11, fontWeight: '600', color: Colors.textSecondary, backgroundColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden'},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyTxt: {fontSize: 14, color: Colors.textSecondary, marginTop: 10},
});
