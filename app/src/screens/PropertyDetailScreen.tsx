import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Alert, Linking} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {propertiesApi, favoritesApi, ApiProperty} from '../api/client';
import {ErrorState} from '../components/ErrorState';
import {Colors, Spacing} from '../theme';
import {RootStackParamList} from '../types';
import {formatPrice} from '../utils/format';

const {width} = Dimensions.get('window');
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PropertyDetail'>;
  route: RouteProp<RootStackParamList, 'PropertyDetail'>;
};

export const PropertyDetailScreen: React.FC<Props> = ({navigation, route}) => {
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

  if (loading) {return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;}
  if (!property) {return <View style={s.center}><ErrorState message={error || 'Property not found'} onRetry={load} /></View>;}

  const {agent} = property;
  // WhatsApp links need a country code, which Indian numbers are often saved without
  const phoneDigits = agent.phone.replace(/\D/g, '');
  const whatsappNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const contactAgent = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Could Not Open', `Contact ${agent.name} at ${agent.phone}.`));
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View>
          <FlatList data={property.images} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({item}) => <Image source={{uri: item}} style={s.galleryImg} />}
          />
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><Icon name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
          <View style={s.topRight}>
            <TouchableOpacity style={s.circleBtn} onPress={toggleFav}><Icon name={property.isFavorite ? 'favorite' : 'favorite-border'} size={20} color={property.isFavorite ? Colors.heart : Colors.text} /></TouchableOpacity>
            <TouchableOpacity style={s.circleBtn}><Icon name="share" size={20} color={Colors.text} /></TouchableOpacity>
          </View>
          <View style={s.dots}>{property.images.map((_, i) => <View key={i} style={[s.dot, imgIdx === i && s.dotActive]} />)}</View>
          <View style={s.imgCounter}><Icon name="photo-library" size={14} color="#fff" /><Text style={s.imgCounterTxt}>{imgIdx + 1}/{property.images.length}</Text></View>
        </View>

        <View style={s.body}>
          <View style={s.typeBadge}><Text style={s.typeTxt}>{property.type.charAt(0).toUpperCase() + property.type.slice(1)}</Text></View>
          <Text style={s.title}>{property.title}</Text>
          <View style={s.locRow}><Icon name="location-on" size={16} color={Colors.primary} /><Text style={s.locTxt}>{property.address}, {property.city}, {property.state}</Text></View>
          <View style={s.priceRow}><Text style={s.price}>{formatPrice(property.price, property.priceUnit)}</Text>{property.reviewCount > 0 && <View style={s.ratingPill}><Icon name="star" size={14} color={Colors.star} /><Text style={s.ratingVal}>{property.rating}</Text><Text style={s.ratingCnt}>({property.reviewCount})</Text></View>}</View>

          {/* Stats */}
          <View style={s.statsCard}>
            {[{ic: 'king-bed', v: property.bedrooms, l: 'Beds'}, {ic: 'bathtub', v: property.bathrooms, l: 'Baths'}, {ic: 'square-foot', v: property.area, l: property.areaUnit}, {ic: 'directions-car', v: property.parkingSpaces, l: 'Parking'}].map((st, i) => (
              <React.Fragment key={st.l}>{i > 0 && <View style={s.statSep} />}<View style={s.statItem}><Icon name={st.ic} size={22} color={Colors.primary} /><Text style={s.statVal}>{st.v}</Text><Text style={s.statLbl}>{st.l}</Text></View></React.Fragment>
            ))}
          </View>

          <View style={s.sec}><Text style={s.secTitle}>About</Text><Text style={s.desc}>{property.description}</Text></View>
          <View style={s.sec}><Text style={s.secTitle}>Amenities</Text><View style={s.amenGrid}>{property.amenities.map(a => <View key={a} style={s.amenChip}><Icon name="check-circle" size={15} color={Colors.success} /><Text style={s.amenTxt}>{a}</Text></View>)}</View></View>

          {/* Agent */}
          {agent.name ? (
            <View style={s.sec}>
              <Text style={s.secTitle}>Listed by</Text>
              <View style={s.agentCard}>
                {agent.avatar ? (
                  <Image source={{uri: agent.avatar}} style={s.agentAv} />
                ) : (
                  <View style={[s.agentAv, s.agentAvEmpty]}><Icon name="person" size={24} color={Colors.textLight} /></View>
                )}
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={s.agentName}>{agent.name}</Text>
                  {agent.rating > 0 && <Text style={s.agentMeta}>{agent.propertiesCount} listings · {agent.rating} ★</Text>}
                </View>
                {agent.phone ? (
                  <>
                    <TouchableOpacity style={s.agentBtn} onPress={() => contactAgent(`tel:${phoneDigits}`)} accessibilityRole="button" accessibilityLabel={`Call ${agent.name}`}><Icon name="phone" size={18} color={Colors.primary} /></TouchableOpacity>
                    <TouchableOpacity style={s.agentBtn} onPress={() => contactAgent(`https://wa.me/${whatsappNumber}`)} accessibilityRole="button" accessibilityLabel={`Message ${agent.name} on WhatsApp`}><Icon name="chat" size={18} color={Colors.primary} /></TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={s.sec}>
            <Text style={s.secTitle}>Details</Text>
            <View style={s.detailsCard}>
              {[{l: 'Type', v: property.type.charAt(0).toUpperCase() + property.type.slice(1)}, {l: 'Year Built', v: String(property.yearBuilt)}, {l: 'Status', v: property.status.charAt(0).toUpperCase() + property.status.slice(1), c: Colors.success}, {l: 'ZIP Code', v: property.zipCode}].map((d, i, arr) => (
                <View key={d.l} style={[s.detailRow, i < arr.length - 1 && s.detailBorder]}><Text style={s.detailLbl}>{d.l}</Text><Text style={[s.detailVal, d.c ? {color: d.c} : undefined]}>{d.v}</Text></View>
              ))}
            </View>
          </View>
          <View style={{height: 100}} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <View style={{flex: 1}}><Text style={s.bottomLbl}>Price</Text><Text style={s.bottomPrice}>{formatPrice(property.price, property.priceUnit)}</Text></View>
        <TouchableOpacity style={s.bookBtn} activeOpacity={0.85} onPress={() => navigation.navigate('BookingScreen', {propertyId: property.id})}>
          <Icon name="event" size={18} color="#fff" /><Text style={s.bookBtnTxt}>Book a Visit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  galleryImg: {width, height: 320, backgroundColor: Colors.borderLight},
  backBtn: {position: 'absolute', top: Spacing.xxxl + 8, left: 16, width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4},
  topRight: {position: 'absolute', top: Spacing.xxxl + 8, right: 16, flexDirection: 'row', gap: 8},
  circleBtn: {width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4},
  dots: {position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6},
  dot: {width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)'},
  dotActive: {backgroundColor: '#fff', width: 22},
  imgCounter: {position: 'absolute', bottom: 14, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8},
  imgCounterTxt: {fontSize: 11, fontWeight: '600', color: '#fff'},
  body: {paddingHorizontal: 20, paddingTop: 20},
  typeBadge: {alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10},
  typeTxt: {fontSize: 12, fontWeight: '700', color: Colors.primary},
  title: {fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: 6},
  locRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12},
  locTxt: {fontSize: 14, color: Colors.textSecondary, flex: 1},
  priceRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18},
  price: {fontSize: 26, fontWeight: '800', color: Colors.primary},
  ratingPill: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: Colors.chipBorder},
  ratingVal: {fontSize: 14, fontWeight: '700', color: Colors.text},
  ratingCnt: {fontSize: 12, color: Colors.textSecondary},
  statsCard: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3},
  statItem: {alignItems: 'center', flex: 1},
  statVal: {fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 4},
  statLbl: {fontSize: 11, color: Colors.textSecondary, marginTop: 2},
  statSep: {width: 1, height: 36, backgroundColor: Colors.divider},
  sec: {marginBottom: 24},
  secTitle: {fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12},
  desc: {fontSize: 14, color: Colors.textSecondary, lineHeight: 22},
  amenGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  amenChip: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.chipBorder},
  amenTxt: {fontSize: 13, fontWeight: '500', color: Colors.text},
  agentCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3},
  agentAv: {width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.borderLight},
  agentAvEmpty: {alignItems: 'center', justifyContent: 'center'},
  agentName: {fontSize: 15, fontWeight: '700', color: Colors.text},
  agentMeta: {fontSize: 12, color: Colors.textSecondary, marginTop: 2},
  agentBtn: {width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginLeft: 8},
  detailsCard: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14},
  detailBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider},
  detailLbl: {fontSize: 14, color: Colors.textSecondary},
  detailVal: {fontSize: 14, fontWeight: '600', color: Colors.text},
  bottomBar: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider, shadowColor: '#000', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8},
  bottomLbl: {fontSize: 12, color: Colors.textSecondary},
  bottomPrice: {fontSize: 22, fontWeight: '800', color: Colors.text},
  bookBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, height: 50, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4},
  bookBtnTxt: {fontSize: 15, fontWeight: '700', color: '#fff'},
});
