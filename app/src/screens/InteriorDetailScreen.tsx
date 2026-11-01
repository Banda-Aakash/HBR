import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {SUPPORT_PHONE} from '../config';
import {Colors, Spacing, Fonts} from '../theme';
import {RootStackParamList} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InteriorDetail'>;
  route: RouteProp<RootStackParamList, 'InteriorDetail'>;
};

const {width} = Dimensions.get('window');
const IMG_W = (width - 48 - 10) / 2; // 2 columns with gap

const CATEGORY_DATA: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  images: string[];
  priceRange: string;
}> = {
  'rental-ready': {
    title: 'Rental Ready',
    subtitle: 'Basic furnishing to get tenant-ready fast',
    description: 'Functional, clean interiors designed to make your property move-in ready. Includes essential furniture, basic appliances, and neutral decor that appeals to a wide range of tenants.',
    features: [
      'Sofa set & dining table',
      'Beds with mattresses',
      'Basic kitchen appliances',
      'Curtains & lighting',
      'Wardrobes',
      'TV unit',
    ],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600',
    ],
    priceRange: '₹2.5L – ₹4.5L',
  },
  moderate: {
    title: 'Moderate',
    subtitle: 'Balanced design with quality finishes',
    description: 'A well-designed space that balances aesthetics with practicality. Quality furniture, coordinated colour palettes, and thoughtful layouts that make a home feel curated without breaking the bank.',
    features: [
      'Designer sofa & accent chairs',
      'Modular kitchen setup',
      'Coordinated colour scheme',
      'Quality bed frames & linen',
      'Decorative lighting',
      'Wall art & accessories',
      'Study/work desk area',
      'Balcony seating',
    ],
    images: [
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600',
    ],
    priceRange: '₹5L – ₹10L',
  },
  luxury: {
    title: 'Luxury',
    subtitle: 'Premium interiors with bespoke finishes',
    description: 'High-end interiors crafted with premium materials, designer brands, and custom detailing. Every element is handpicked — from Italian marble to solid wood furniture — for a space that feels truly exceptional.',
    features: [
      'Custom designer furniture',
      'Premium marble & wood flooring',
      'Smart home integration',
      'Italian kitchen fittings',
      'Walk-in wardrobes',
      'Home theater setup',
      'Designer bathroom fittings',
      'Landscaped balcony/terrace',
      'Bespoke lighting design',
      'Art curation',
    ],
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',
    ],
    priceRange: '₹12L – ₹30L+',
  },
};

export const InteriorDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const categoryKey = route.params.designId;
  const data = CATEGORY_DATA[categoryKey];

  if (!data) {
    return (
      <View style={s.center}>
        <Icon name="error-outline" size={44} color={Colors.textLight} />
        <Text style={s.centerTxt}>Category not found</Text>
      </View>
    );
  }

  const handleEnquire = () => {
    const message = [
      `🎨 *Interior Design Enquiry*`,
      ``,
      `*Category:* ${data.title}`,
      `*Budget Range:* ${data.priceRange}`,
      ``,
      `I'm interested in ${data.title.toLowerCase()} interiors for my property. Please share more details and schedule a consultation.`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert(
        'WhatsApp not available',
        `Please install WhatsApp or contact us at +${SUPPORT_PHONE}.`,
      );
    });
  };

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header image */}
        <View style={s.heroWrap}>
          <Image source={{uri: data.images[0]}} style={s.heroImg} />
          <View style={s.heroScrim} />
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <Text style={s.heroTitle}>{data.title}</Text>
            <Text style={s.heroSub}>{data.subtitle}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Price badge */}
          <View style={s.priceBadge}>
            <Icon name="sell" size={16} color={Colors.primary} />
            <Text style={s.priceLabel}>Estimated Budget</Text>
            <Text style={s.priceValue}>{data.priceRange}</Text>
          </View>

          {/* Description */}
          <View style={s.section}>
            <Text style={s.secTitle}>About</Text>
            <Text style={s.desc}>{data.description}</Text>
          </View>

          {/* What's included */}
          <View style={s.section}>
            <Text style={s.secTitle}>What's Included</Text>
            <View style={s.featuresList}>
              {data.features.map(f => (
                <View key={f} style={s.featureRow}>
                  <Icon name="check-circle" size={16} color={Colors.primary} />
                  <Text style={s.featureTxt}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sample gallery */}
          <View style={s.section}>
            <Text style={s.secTitle}>Sample Gallery</Text>
            <View style={s.gallery}>
              {data.images.map((img, i) => (
                <Image key={i} source={{uri: img}} style={s.galleryImg} />
              ))}
            </View>
          </View>

          <View style={{height: 100}} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <View style={s.bottomLeft}>
          <Text style={s.bottomLabel}>From</Text>
          <Text style={s.bottomPrice}>{data.priceRange}</Text>
        </View>
        <TouchableOpacity style={s.enquireBtn} onPress={handleEnquire} activeOpacity={0.85}>
          <Icon name="chat" size={18} color="#fff" />
          <Text style={s.enquireTxt}>Enquire on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.background},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  centerTxt: {fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, marginTop: 10},

  // Hero
  heroWrap: {position: 'relative'},
  heroImg: {width: '100%', height: 260, backgroundColor: Colors.borderLight},
  heroScrim: {position: 'absolute', left: 0, right: 0, bottom: 0, height: 140, backgroundColor: 'rgba(0,0,0,0.45)'},
  backBtn: {
    position: 'absolute', top: Spacing.xxxl + 8, left: 16,
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  heroBottom: {position: 'absolute', bottom: 20, left: 20, right: 20},
  heroTitle: {fontSize: 28, fontFamily: Fonts.heavy, color: '#fff', marginBottom: 4},
  heroSub: {fontFamily: Fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.75)'},

  // Body
  body: {padding: 20},

  // Price
  priceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryLight, padding: 14, borderRadius: 14, marginBottom: 24,
  },
  priceLabel: {fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1},
  priceValue: {fontSize: 16, fontFamily: Fonts.bold, color: Colors.primary},

  // Sections
  section: {marginBottom: 24},
  secTitle: {fontSize: 18, fontFamily: Fonts.bold, color: Colors.text, marginBottom: 12},
  desc: {fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22},

  // Features
  featuresList: {gap: 10},
  featureRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  featureTxt: {fontFamily: Fonts.regular, fontSize: 14, color: Colors.text},

  // Gallery
  gallery: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  galleryImg: {width: IMG_W, height: IMG_W * 0.75, borderRadius: 12, backgroundColor: Colors.borderLight},

  // Bottom
  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider,
    shadowColor: '#000', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
  bottomLeft: {flex: 1},
  bottomLabel: {fontFamily: Fonts.regular, fontSize: 12, color: Colors.textTertiary},
  bottomPrice: {fontSize: 18, fontFamily: Fonts.heavy, color: Colors.text},
  enquireBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingHorizontal: 20, height: 50,
    shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  enquireTxt: {fontSize: 15, fontFamily: Fonts.bold, color: '#fff'},
});
