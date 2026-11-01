import React, {useCallback, useState} from 'react';
import {View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {favoritesApi, ApiProperty} from '../api/client';
import {PropertyCard} from '../components/PropertyCard';
import {Colors, Typography, Spacing} from '../theme';
import {Property, RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SavedScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
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

  const renderEmpty = () => (
    <View style={s.body}>
      <View style={s.circle}>
        <Icon name={error ? 'cloud-off' : 'bookmark-border'} size={44} color={Colors.textLight} />
      </View>
      <Text style={s.emptyTitle}>{error ? 'Something went wrong' : 'No saved properties'}</Text>
      <Text style={s.emptyBody}>
        {error || 'Save a property from its listing and it will appear here.'}
      </Text>
      {error ? (
        <TouchableOpacity style={s.retryBtn} onPress={load} accessibilityRole="button">
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Saved</Text>
        <Text style={s.sub}>Properties you've bookmarked</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={s.loader} size="large" color={Colors.primary} />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          contentContainerStyle={properties.length ? s.list : s.emptyList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          renderItem={({item}) => (
            <PropertyCard
              property={item as Property}
              onPress={p => nav.navigate('PropertyDetail', {propertyId: p.id})}
              onFavorite={removeFavorite}
            />
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  header: {
    paddingHorizontal: 20,
    paddingTop: Spacing.xxxl + 10,
    paddingBottom: 12,
  },
  title: {fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5},
  sub: {...Typography.body, color: Colors.textSecondary, marginTop: 2},
  loader: {flex: 1},
  list: {paddingHorizontal: Spacing.base, paddingBottom: 24},
  emptyList: {flexGrow: 1},
  body: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80},
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8},
  emptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  retryText: {color: Colors.textInverse, fontWeight: '700'},
});
