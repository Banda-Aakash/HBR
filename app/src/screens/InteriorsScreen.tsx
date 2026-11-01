import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Colors, Spacing} from '../theme';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const {width} = Dimensions.get('window');

const CATEGORIES = [
  {
    key: 'rental-ready',
    title: 'Rental Ready',
    subtitle: 'Basic furnishing to get your property tenant-ready fast',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    icon: 'chair',
  },
  {
    key: 'moderate',
    title: 'Moderate',
    subtitle: 'Balanced design with quality furniture and modern finishes',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    icon: 'weekend',
  },
  {
    key: 'luxury',
    title: 'Luxury',
    subtitle: 'Premium interiors with designer furniture and bespoke finishes',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    icon: 'auto-awesome',
  },
];

export const InteriorsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 32}}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Interiors</Text>
        <Text style={s.subtitle}>
          Choose a style that fits your property
        </Text>
      </View>

      {/* Category cards */}
      <View style={s.cardsWrap}>
        {CATEGORIES.map((cat, index) => (
          <TouchableOpacity
            key={cat.key}
            style={s.card}
            activeOpacity={0.92}
            onPress={() => nav.navigate('InteriorDetail', {designId: cat.key})}>
            <Image source={{uri: cat.image}} style={s.cardImg} />
            <View style={s.cardScrim} />

            {/* Number badge */}
            <View style={s.numBadge}>
              <Text style={s.numTxt}>{index + 1}</Text>
            </View>

            {/* Content on image */}
            <View style={s.cardContent}>
              <View style={s.iconCircle}>
                <Icon name={cat.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={s.cardTitle}>{cat.title}</Text>
              <Text style={s.cardSub}>{cat.subtitle}</Text>
              <View style={s.cardArrow}>
                <Text style={s.cardArrowTxt}>View Samples</Text>
                <Icon name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom info */}
      <View style={s.infoBox}>
        <Icon name="info-outline" size={18} color={Colors.textTertiary} />
        <Text style={s.infoTxt}>
          Tap any category to view sample images and get a quote via WhatsApp.
        </Text>
      </View>
    </ScrollView>
  );
};

const CARD_H = 200;

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.background},
  header: {
    paddingHorizontal: 24,
    paddingTop: Spacing.xxxl + 10,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  title: {fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5},
  subtitle: {fontSize: 14, color: Colors.textSecondary, marginTop: 4},

  cardsWrap: {padding: 20, gap: 18},

  card: {
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
  },
  cardImg: {width: '100%', height: '100%'},
  cardScrim: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  numBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numTxt: {fontSize: 14, fontWeight: '700', color: '#fff'},
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4},
  cardSub: {fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 12},
  cardArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardArrowTxt: {fontSize: 13, fontWeight: '600', color: '#fff'},

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
  },
  infoTxt: {fontSize: 13, color: Colors.textTertiary, flex: 1, lineHeight: 18},
});
