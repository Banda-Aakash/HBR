import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {propertiesApi, ApiProperty} from '../api/client';
import {Colors, Spacing} from '../theme';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SearchScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await propertiesApi.list({search: query || undefined});
        if (!cancelled) {setResults(res.properties);}
      } catch (e) { console.warn(e); }
      if (!cancelled) {setLoading(false);}
    }, 300); // debounce
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const fmtPrice = (p: number, u: string) => {
    if (p >= 1e6) {return `$${(p / 1e6).toFixed(1)}M`;}
    if (p >= 1e3) {return `$${(p / 1e3).toFixed(0)}K${u === 'month' ? '/mo' : ''}`;}
    return `$${p}`;
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Search</Text>
        <Text style={s.sub}>Find your perfect property</Text>
      </View>
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Icon name="search" size={22} color={Colors.textTertiary} />
          <TextInput style={s.input} value={query} onChangeText={setQuery} placeholder="City, address, type..." placeholderTextColor={Colors.textTertiary} />
          {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><Icon name="close" size={20} color={Colors.textTertiary} /></TouchableOpacity>}
        </View>
      </View>
      <Text style={s.count}>{loading ? 'Searching...' : `${results.length} propert${results.length !== 1 ? 'ies' : 'y'} found`}</Text>
      <FlatList
        data={results}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 32}}
        renderItem={({item}) => (
          <TouchableOpacity style={s.card} onPress={() => nav.navigate('PropertyDetail', {propertyId: item.id})} activeOpacity={0.9}>
            <Image source={{uri: item.images[0]}} style={s.cardImg} />
            <View style={s.cardBody}>
              <View style={s.cardTop}><View style={s.badge}><Text style={s.badgeTxt}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text></View><View style={s.rating}><Icon name="star" size={12} color={Colors.star} /><Text style={s.ratingTxt}>{item.rating}</Text></View></View>
              <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={s.locRow}><Icon name="location-on" size={14} color={Colors.primary} /><Text style={s.locTxt} numberOfLines={1}>{item.city}, {item.state}</Text></View>
              <View style={s.div} />
              <View style={s.botRow}><Text style={s.price}>{fmtPrice(item.price, item.priceUnit)}</Text><View style={s.chips}><Text style={s.chip}>{item.bedrooms} bed</Text><Text style={s.chip}>{item.area} sqft</Text></View></View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <View style={s.empty}><Icon name="search-off" size={44} color={Colors.textLight} /><Text style={s.emptyTxt}>No properties found</Text></View> : undefined}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  header: {paddingHorizontal: 20, paddingTop: Spacing.xxxl + 10, paddingBottom: 4},
  title: {fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5},
  sub: {fontSize: 14, color: Colors.textSecondary, marginTop: 2},
  searchWrap: {paddingHorizontal: 20, paddingVertical: 14},
  searchBar: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 50, gap: 10, borderWidth: 1, borderColor: Colors.chipBorder},
  input: {flex: 1, fontSize: 15, color: Colors.text},
  count: {fontSize: 13, color: Colors.textSecondary, paddingHorizontal: 24, marginBottom: 10},
  card: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, shadowColor: Colors.shadow, shadowOffset: {width: 0, height: 3}, shadowOpacity: 1, shadowRadius: 10, elevation: 3},
  cardImg: {width: '100%', height: 160, backgroundColor: Colors.borderLight},
  cardBody: {padding: 14},
  cardTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6},
  badge: {backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8},
  badgeTxt: {fontSize: 11, fontWeight: '700', color: Colors.primary},
  rating: {flexDirection: 'row', alignItems: 'center', gap: 3},
  ratingTxt: {fontSize: 13, fontWeight: '600', color: Colors.text},
  cardTitle: {fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 4},
  locRow: {flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10},
  locTxt: {fontSize: 13, color: Colors.textSecondary, flex: 1},
  div: {height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginBottom: 10},
  botRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  price: {fontSize: 19, fontWeight: '800', color: Colors.text},
  chips: {flexDirection: 'row', gap: 6},
  chip: {fontSize: 11, fontWeight: '600', color: Colors.textSecondary, backgroundColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden'},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyTxt: {fontSize: 14, color: Colors.textSecondary, marginTop: 10},
});
