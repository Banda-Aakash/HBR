import React from 'react';
import {View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {propertiesApi, ApiProperty} from '../api/client';
import {ArchImage, FestiveScene, FestiveStrip, useStripHeight} from '../components/Arch';
import {useTheme} from '../context/ThemeContext';
import {Colors, Fonts} from '../theme';
import {RootStackParamList} from '../types';
import {formatVisitDay} from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
  route: RouteProp<RootStackParamList, 'BookingConfirmation'>;
};

export const BookingConfirmationScreen: React.FC<Props> = ({navigation, route}) => {
  const {booking} = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stripHeight = useStripHeight();
  const [property, setProperty] = React.useState<ApiProperty | null>(null);

  React.useEffect(() => {
    propertiesApi.getById(booking.propertyId).then(setProperty).catch(() => {});
  }, [booking.propertyId]);

  // Navy on navy would hide the button, so the everyday look uses the brand gold here
  const buttonBg = theme.festival ? theme.accent : Colors.gold;
  const buttonText = theme.festival ? theme.onAccent : Colors.primary;

  return (
    <View style={[s.container, {backgroundColor: theme.primary}]}>
      <StatusBar barStyle="light-content" />
      {theme.festival ? <FestiveStrip festival={theme.festival} /> : null}
      <ScrollView
        contentContainerStyle={[s.body, {paddingTop: theme.festival ? stripHeight + 16 : insets.top + 40}]}
        showsVerticalScrollIndicator={false}>
        <ArchImage uri={property?.images?.[0]} width={200} height={232} label={property?.title} />
        <Text style={s.title} accessibilityRole="header">Visit requested</Text>
        <Text style={s.sub}>We'll confirm the time with you soon.</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>{property?.title || 'Your visit'}</Text>
          <Text style={s.cardLine}>{formatVisitDay(booking.date)}, {booking.time}</Text>
          {booking.notes ? <Text style={s.cardLine}>{booking.notes}</Text> : null}
          <Text style={s.cardRef}>Request #{booking.id.slice(-8).toUpperCase()}</Text>
        </View>

        {theme.festival ? (
          <>
            <View style={s.scene}><FestiveScene festival={theme.festival} width={176} /></View>
            <Text style={s.wish}>{theme.wish}</Text>
          </>
        ) : null}
      </ScrollView>

      <View style={[s.actions, {paddingBottom: Math.max(insets.bottom, 16) + 4}]}>
        <TouchableOpacity
          style={[s.primaryBtn, {backgroundColor: buttonBg}]}
          onPress={() => navigation.navigate('MyBookings')}
          activeOpacity={0.85}
          accessibilityRole="button">
          <Text style={[s.primaryTxt, {color: buttonText}]}>View your visits</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.homeBtn} onPress={() => navigation.navigate('Main')} accessibilityRole="button">
          <Text style={s.homeTxt}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1},
  body: {flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16},
  title: {marginTop: 16, fontFamily: Fonts.heavy, fontSize: 32, letterSpacing: -0.6, color: Colors.textInverse},
  sub: {marginTop: 6, fontFamily: Fonts.regular, fontSize: 16, color: Colors.textInverse},
  card: {alignSelf: 'stretch', marginTop: 18, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.surface},
  cardTitle: {fontFamily: Fonts.bold, fontSize: 17, color: Colors.text},
  cardLine: {marginTop: 3, fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary},
  cardRef: {marginTop: 8, fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.5, color: Colors.textSecondary},
  scene: {marginTop: 16},
  wish: {marginTop: 4, fontFamily: Fonts.display, fontSize: 22, color: Colors.textInverse, textAlign: 'center'},
  actions: {paddingHorizontal: 20, paddingTop: 8},
  primaryBtn: {height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  primaryTxt: {fontFamily: Fonts.bold, fontSize: 16},
  homeBtn: {height: 44, marginTop: 4, alignItems: 'center', justifyContent: 'center'},
  homeTxt: {fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textInverse},
});
