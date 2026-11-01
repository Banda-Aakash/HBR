import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Alert, Linking} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {propertiesApi, favoritesApi, ApiProperty} from '../api/client';
import {ArchIcon, BackButton, FestiveScene, RoundButton} from '../components/Arch';
import {Button} from '../components/Button';
import {ErrorState} from '../components/ErrorState';
import {useTheme} from '../context/ThemeContext';
import {Colors, Fonts} from '../theme';
import {RootStackParamList} from '../types';
import {formatPrice} from '../utils/format';

const {width} = Dimensions.get('window');
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PropertyDetail'>;
  route: RouteProp<RootStackParamList, 'PropertyDetail'>;
};

const titleCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const PropertyDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    propertiesApi.getById(route.params.propertyId)
      .then(p => setProperty(p))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [route.params.propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFav = async () => {
    if (!property) {return;}
    try {
      const res = await favoritesApi.toggle(property.id);
      setProperty(prev => prev ? {...prev, isFavorite: res.isFavorite} : prev);
    } catch {}
  };

  if (loading) {return <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>;}
  if (!property) {return <View style={s.center}><ErrorState message={error || 'Property not found'} onRetry={load} /></View>;}

  const {agent} = property;
  // WhatsApp links need a country code, which Indian numbers are often saved without
  const phoneDigits = agent.phone.replace(/\D/g, '');
  const whatsappNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const contactAgent = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Could Not Open', `Contact ${agent.name} at ${agent.phone}.`));
  };

  const areaName = property.areaUnit === 'sqm' ? 'sq m' : 'sq ft';
  const pricePerArea = property.priceUnit === 'total' && property.area > 0
    ? `₹${Math.round(property.price / property.area).toLocaleString('en-IN')} per ${areaName}`
    : null;

  const facts = [
    {label: 'BHK', value: property.bedrooms},
    {label: 'Baths', value: property.bathrooms},
    {label: titleCase(areaName), value: property.area.toLocaleString('en-IN')},
    {label: 'Parking', value: property.parkingSpaces},
  ];

  const details = [
    {label: 'Type', value: titleCase(property.type)},
    {label: 'Year built', value: property.yearBuilt ? String(property.yearBuilt) : ''},
    {label: 'Status', value: titleCase(property.status)},
  ].filter(row => row.value);

  return (
    <View style={[s.container, {backgroundColor: theme.soft}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery. Festive decoration stays below it, so a home is never covered. */}
        <View>
          <FlatList data={property.images} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({item}) => <Image source={{uri: item}} style={s.galleryImg} />}
          />
          <View style={[s.topBar, {top: insets.top + 8}]}>
            <BackButton onPress={() => navigation.goBack()} />
            <RoundButton onPress={toggleFav} label={property.isFavorite ? 'Remove from saved homes' : 'Save this home'}>
              <ArchIcon name="heart" filled={property.isFavorite} color={property.isFavorite ? Colors.heart : Colors.text} />
            </RoundButton>
          </View>
          {property.images.length > 1 ? (
            <View style={s.dots}>{property.images.map((_, i) => <View key={i} style={[s.dot, imgIdx === i && s.dotActive]} />)}</View>
          ) : null}
        </View>

        {theme.festival ? (
          <View style={[s.festiveBand, {backgroundColor: theme.primary}]}>
            <Text style={s.festiveWish} numberOfLines={2}>{theme.wish}</Text>
            <FestiveScene festival={theme.festival} width={104} />
          </View>
        ) : null}

        <View style={s.body}>
          <View style={s.priceRow}>
            <Text style={[s.price, {color: theme.ink}]}>{formatPrice(property.price, property.priceUnit)}</Text>
            {pricePerArea ? <Text style={s.pricePerArea}>{pricePerArea}</Text> : null}
          </View>
          <Text style={s.title}>{property.title}</Text>
          <Text style={s.address}>{property.address}, {property.city}, {property.state}</Text>

          <View style={s.facts}>
            {facts.map(fact => (
              <View key={fact.label} style={s.fact}>
                <Text style={s.factValue}>{fact.value}</Text>
                <Text style={s.factLabel}>{fact.label}</Text>
              </View>
            ))}
          </View>

          <Text style={s.secTitle}>About this home</Text>
          <Text style={s.desc}>{property.description}</Text>

          {property.amenities.length > 0 ? (
            <>
              <Text style={s.secTitle}>Amenities</Text>
              <View style={s.amenGrid}>{property.amenities.map(a => <View key={a} style={s.amenChip}><Text style={s.amenTxt}>{a}</Text></View>)}</View>
            </>
          ) : null}

          <Text style={s.secTitle}>Good to know</Text>
          <View style={s.detailsCard}>
            {details.map((row, i) => (
              <View key={row.label} style={[s.detailRow, i < details.length - 1 && s.detailLine]}>
                <Text style={s.detailLbl}>{row.label}</Text>
                <Text style={s.detailVal}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Agent */}
          {agent.name ? (
            <>
              <Text style={s.secTitle}>Your agent</Text>
              <View style={s.agentRow}>
                {agent.avatar ? (
                  <Image source={{uri: agent.avatar}} style={s.agentAv} />
                ) : (
                  <View style={[s.agentAv, {backgroundColor: theme.primary}]}>
                    <Text style={[s.agentInitials, {color: theme.priceText}]}>{agent.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={s.agentInfo}>
                  <Text style={s.agentName}>{agent.name}</Text>
                  <Text style={s.agentMeta}>{agent.rating > 0 ? `${agent.propertiesCount} listings · ${agent.rating} ★` : 'Listing agent'}</Text>
                </View>
                {agent.phone ? (
                  <>
                    <TouchableOpacity style={s.agentBtn} onPress={() => contactAgent(`tel:${phoneDigits}`)} accessibilityRole="button" accessibilityLabel={`Call ${agent.name}`}><ArchIcon name="call" size={19} /></TouchableOpacity>
                    <TouchableOpacity style={s.agentBtn} onPress={() => contactAgent(`https://wa.me/${whatsappNumber}`)} accessibilityRole="button" accessibilityLabel={`Message ${agent.name} on WhatsApp`}><ArchIcon name="whatsapp" size={19} /></TouchableOpacity>
                  </>
                ) : null}
              </View>
            </>
          ) : null}
          <View style={s.bottomSpace} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, {paddingBottom: Math.max(insets.bottom, 12) + 4}]}>
        <View>
          <Text style={s.bottomLbl}>Site visit</Text>
          <Text style={s.bottomVal}>Pick a time</Text>
        </View>
        <Button title="Request a visit" onPress={() => navigation.navigate('BookingScreen', {propertyId: property.id})} style={s.bookBtn} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  galleryImg: {width, height: 320, backgroundColor: Colors.border},
  topBar: {position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between'},
  dots: {position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6},
  dot: {width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)'},
  dotActive: {backgroundColor: Colors.textInverse, width: 22},
  festiveBand: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 72, paddingLeft: 20, paddingRight: 8, overflow: 'hidden'},
  festiveWish: {flex: 1, marginRight: 8, fontFamily: Fonts.display, fontSize: 19, color: Colors.textInverse},
  body: {paddingHorizontal: 20, paddingTop: 22},
  priceRow: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12},
  price: {fontFamily: Fonts.heavy, fontSize: 34, letterSpacing: -0.7},
  pricePerArea: {fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary},
  title: {marginTop: 6, fontFamily: Fonts.display, fontSize: 24, letterSpacing: -0.2, color: Colors.text},
  address: {marginTop: 4, fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary},
  facts: {flexDirection: 'row', marginTop: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border},
  fact: {flex: 1, paddingVertical: 14},
  factValue: {fontFamily: Fonts.bold, fontSize: 19, color: Colors.text},
  factLabel: {marginTop: 2, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary},
  secTitle: {marginTop: 22, marginBottom: 10, fontFamily: Fonts.bold, fontSize: 17, color: Colors.text},
  desc: {fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22, color: '#334155'},
  amenGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  amenChip: {paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface},
  amenTxt: {fontFamily: Fonts.medium, fontSize: 13, color: Colors.text},
  detailsCard: {borderWidth: 1, borderColor: Colors.border, borderRadius: 14, backgroundColor: Colors.surface},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 13},
  detailLine: {borderBottomWidth: 1, borderBottomColor: Colors.border},
  detailLbl: {fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary},
  detailVal: {fontFamily: Fonts.semibold, fontSize: 14, color: Colors.text},
  agentRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  agentAv: {width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.border},
  agentInitials: {fontFamily: Fonts.bold, fontSize: 17},
  agentInfo: {flex: 1, minWidth: 0},
  agentName: {fontFamily: Fonts.semibold, fontSize: 15, color: Colors.text},
  agentMeta: {marginTop: 2, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary},
  agentBtn: {width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: Colors.textLight, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center'},
  bottomSpace: {height: 28},
  bottomBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface},
  bottomLbl: {fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary},
  bottomVal: {marginTop: 1, fontFamily: Fonts.bold, fontSize: 15, color: Colors.text},
  bookBtn: {height: 52, paddingVertical: 0, paddingHorizontal: 26},
});
