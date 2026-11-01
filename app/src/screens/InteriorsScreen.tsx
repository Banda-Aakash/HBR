import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ArchImage, ScreenHeader} from '../components/Arch';
import {Button} from '../components/Button';
import {SUPPORT_PHONE} from '../config';
import {useTheme} from '../context/ThemeContext';
import {Colors, Fonts} from '../theme';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = [
  {
    key: 'rental-ready',
    title: 'Rental Ready',
    subtitle: 'Basic furnishing, tenant-ready fast',
    price: '₹2.5L – ₹4.5L',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  },
  {
    key: 'moderate',
    title: 'Moderate',
    subtitle: 'Quality furniture and modern finishes',
    price: '₹5L – ₹10L',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
  },
  {
    key: 'luxury',
    title: 'Luxury',
    subtitle: 'Designer furniture and bespoke finishes',
    price: '₹12L – ₹30L+',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    dark: true,
  },
];

export const InteriorsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const theme = useTheme();

  const askForQuote = () => {
    const message = "Hi, I'm interested in interiors for my property. Please share more details.";
    Linking.openURL(`https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`).catch(() => {
      Alert.alert('WhatsApp not available', `Please install WhatsApp or contact us at +${SUPPORT_PHONE}.`);
    });
  };

  return (
    <ScrollView style={[s.screen, {backgroundColor: theme.soft}]} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <ScreenHeader title="Interiors" subtitle={theme.festival ? undefined : 'Choose a level that fits your home and budget.'} />

      <View style={s.cards}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.card, cat.dark && {backgroundColor: theme.primary, borderColor: theme.primary}]}
            activeOpacity={0.9}
            onPress={() => nav.navigate('InteriorDetail', {designId: cat.key})}
            accessibilityRole="button"
            accessibilityLabel={`View ${cat.title} interiors`}>
            <ArchImage uri={cat.image} width={92} height={112} footRadius={12} />
            <View style={s.cardBody}>
              <Text style={[s.cardTitle, cat.dark && s.onDark]}>{cat.title}</Text>
              <Text style={[s.cardSub, cat.dark && s.onDark]}>{cat.subtitle}</Text>
              <Text style={[s.cardPrice, {color: theme.ink}, cat.dark && s.onDark]}>{cat.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Button title="Get a quote on WhatsApp" onPress={askForQuote} style={s.quoteBtn} />
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1},
  content: {paddingBottom: 24},
  cards: {paddingHorizontal: 20, paddingTop: 14, gap: 10},
  card: {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, backgroundColor: Colors.surface},
  cardBody: {flex: 1, minWidth: 0},
  cardTitle: {fontFamily: Fonts.display, fontSize: 21, color: Colors.text},
  cardSub: {marginTop: 2, fontFamily: Fonts.regular, fontSize: 14, lineHeight: 18, color: Colors.textSecondary},
  cardPrice: {marginTop: 5, fontFamily: Fonts.bold, fontSize: 16},
  onDark: {color: Colors.textInverse},
  quoteBtn: {height: 52, paddingVertical: 0},
});
