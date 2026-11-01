import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {rentalsApi, ApiRental} from '../api/client';
import {RootStackParamList} from '../types';
import {Colors, Spacing} from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const RentalSearchScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [allRentals, setAllRentals] = useState<ApiRental[]>([]);

  useEffect(() => {
    rentalsApi.browseAll().then(res => {
      setAllRentals(res.rentals);
    }).catch(console.warn);
  }, []);

  const results = query.trim()
    ? allRentals.filter(r => {
        const q = query.toLowerCase();
        return r.property.address.toLowerCase().includes(q) || r.property.locality.toLowerCase().includes(q) || r.property.city.toLowerCase().includes(q) || r.property.unitNo.toLowerCase().includes(q);
      })
    : allRentals;

  const fmtRent = (n: number) => `₹${n.toLocaleString('en-IN')}/mo`;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Search Rentals</Text><Text style={s.sub}>Find your next home</Text></View>
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Icon name="search" size={22} color={Colors.textTertiary} />
          <TextInput style={s.input} value={query} onChangeText={setQuery} placeholder="Locality, address, city..." placeholderTextColor={Colors.textTertiary} />
          {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><Icon name="close" size={20} color={Colors.textTertiary} /></TouchableOpacity>}
        </View>
      </View>
      <Text style={s.count}>{results.length} rental{results.length !== 1 ? 's' : ''} found</Text>
      <FlatList data={results} keyExtractor={i => i.id} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 32}}
        renderItem={({item}) => {
          const avail = item.state === 'marketing';
          return (
            <TouchableOpacity style={s.card} onPress={() => nav.navigate('RentalPropertyDetail', {tenancyId: item.id})} activeOpacity={0.9}>
              <Image source={{uri: item.property.image}} style={s.cardImg} />
              <View style={s.cardBody}>
                <View style={s.topRow}><View style={[s.badge, {backgroundColor: avail ? Colors.success : Colors.warning}]}><Text style={s.badgeTxt}>{avail ? 'Available' : 'Leased'}</Text></View><Text style={s.rent}>{fmtRent(item.rent)}</Text></View>
                <Text style={s.addr} numberOfLines={1}>{item.property.address}</Text>
                <Text style={s.unit}>{item.property.unitNo} · {item.property.carpetArea} sqft</Text>
                <View style={s.locRow}><Icon name="location-on" size={13} color={Colors.textSecondary} /><Text style={s.locTxt}>{item.property.locality}, {item.property.city}</Text></View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View style={s.empty}><Icon name="search-off" size={44} color={Colors.textLight} /><Text style={s.emptyTxt}>No rentals found</Text></View>}
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
  card: {flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3},
  cardImg: {width: 105, height: 115, backgroundColor: Colors.borderLight},
  cardBody: {flex: 1, padding: 12, justifyContent: 'center'},
  topRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4},
  badge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6},
  badgeTxt: {fontSize: 10, fontWeight: '700', color: '#fff'},
  rent: {fontSize: 14, fontWeight: '700', color: Colors.primary},
  addr: {fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2},
  unit: {fontSize: 12, color: Colors.textSecondary, marginBottom: 4},
  locRow: {flexDirection: 'row', alignItems: 'center', gap: 2},
  locTxt: {fontSize: 11, color: Colors.textSecondary},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyTxt: {fontSize: 14, color: Colors.textSecondary, marginTop: 10},
});
