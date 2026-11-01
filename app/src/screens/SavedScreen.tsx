import React, {useCallback, useState} from 'react';
import {View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, useWindowDimensions} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {favoritesApi, ApiProperty} from '../api/client';
import {ArchIcon, ArchImage, PriceTag, ScreenHeader} from '../components/Arch';
import {ErrorState} from '../components/ErrorState';
import {useTheme} from '../context/ThemeContext';
import {Colors, Fonts} from '../theme';
import {RootStackParamList} from '../types';
import {formatPrice} from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GUTTER = 20;
const GAP = 14;

export const SavedScreen: React.FC<{showBack?: boolean}> = ({showBack}) => {
  const nav = useNavigation<Nav>();
  const theme = useTheme();
  const {width} = useWindowDimensions();
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await favoritesApi.list();
      setProperties(res.properties);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Could not load saved properties.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const removeFavorite = async (propertyId: string) => {
    try {
      await favoritesApi.toggle(propertyId);
      setProperties(list => list.filter(p => p.id !== propertyId));
    } catch (e: any) {
      setError(e.message || 'Could not update saved properties.');
    }
  };

  const cardWidth = (width - GUTTER * 2 - GAP) / 2;

  return (
    <View style={[s.container, {backgroundColor: theme.soft}]}>
      <ScreenHeader title="Saved homes" onBack={showBack ? nav.goBack : undefined} />
      {loading ? (
        <ActivityIndicator style={s.loader} size="large" color={theme.primary} />
      ) : error && properties.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={s.column}
          contentContainerStyle={properties.length ? s.list : s.emptyList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.body}>
              <Text style={s.emptyTitle}>No saved homes yet</Text>
              <Text style={s.emptyBody}>Tap the heart on a home and it will appear here.</Text>
            </View>
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={{width: cardWidth}}
              onPress={() => nav.navigate('PropertyDetail', {propertyId: item.id})}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.title}`}>
              <View>
                <ArchImage uri={item.images[0]} width={cardWidth} height={cardWidth * 1.17} footRadius={12} />
                <PriceTag price={formatPrice(item.price, item.priceUnit)} small />
                <TouchableOpacity
                  style={s.heart}
                  onPress={() => removeFavorite(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.title} from saved homes`}>
                  <ArchIcon name="heart" size={17} filled color={Colors.heart} />
                </TouchableOpacity>
              </View>
              <Text style={s.name} numberOfLines={1}>{item.title}</Text>
              <Text style={s.place} numberOfLines={1}>{item.city} · {item.bedrooms} BHK</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1},
  loader: {flex: 1},
  list: {paddingHorizontal: GUTTER, paddingTop: 16, paddingBottom: 24, gap: GAP},
  column: {gap: GAP},
  emptyList: {flexGrow: 1},
  heart: {position: 'absolute', right: 8, bottom: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center'},
  name: {marginTop: 7, fontFamily: Fonts.bold, fontSize: 15, color: Colors.text},
  place: {marginTop: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary},
  body: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80},
  emptyTitle: {fontFamily: Fonts.display, fontSize: 20, color: Colors.text, marginBottom: 8},
  emptyBody: {fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22, color: Colors.textSecondary, textAlign: 'center'},
});
