import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {propertiesApi, ApiProperty} from '../api/client';
import {Colors} from '../theme';
import {RootStackParamList} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
  route: RouteProp<RootStackParamList, 'BookingConfirmation'>;
};

export const BookingConfirmationScreen: React.FC<Props> = ({navigation, route}) => {
  const {booking} = route.params;
  const [property, setProperty] = React.useState<ApiProperty | null>(null);

  React.useEffect(() => {
    propertiesApi.getById(booking.propertyId).then(setProperty).catch(() => {});
  }, [booking.propertyId]);

  const fmtDate = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={s.container}>
      <View style={s.body}>
        {/* Success icon */}
        <View style={s.successCircle}>
          <Icon name="check" size={44} color="#fff" />
        </View>
        <Text style={s.title}>Booking Confirmed!</Text>
        <Text style={s.sub}>Your visit has been scheduled</Text>

        {/* Details card */}
        <View style={s.card}>
          {[
            {icon: 'home', label: 'Property', value: property?.title || 'Unknown'},
            {icon: 'event', label: 'Date', value: fmtDate},
            {icon: 'schedule', label: 'Time', value: booking.time},
            {icon: 'info', label: 'Status', value: 'Confirmed', color: Colors.success},
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Icon name={row.icon} size={18} color={Colors.primary} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  <Text style={[s.rowVal, row.color ? {color: row.color} : undefined]}>
                    {row.value}
                  </Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={s.sep} />}
            </View>
          ))}
          {booking.notes ? (
            <>
              <View style={s.sep} />
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Icon name="notes" size={18} color={Colors.primary} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.rowLabel}>Notes</Text>
                  <Text style={s.rowVal}>{booking.notes}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        <Text style={s.confId}>
          Confirmation #{booking.id.slice(-8).toUpperCase()}
        </Text>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => navigation.navigate('MyBookings')}
          activeOpacity={0.85}>
          <Text style={s.primaryBtnTxt}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.85}>
          <Text style={s.secondaryBtnTxt}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  body: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24},
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.success,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 6},
  sub: {fontSize: 14, color: Colors.textSecondary, marginBottom: 28},
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  row: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8},
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowLabel: {fontSize: 12, color: Colors.textSecondary, marginBottom: 2},
  rowVal: {fontSize: 14, fontWeight: '600', color: Colors.text},
  sep: {height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0', marginVertical: 2},
  confId: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: 1,
    marginTop: 18,
  },
  actions: {paddingHorizontal: 24, paddingBottom: 36, gap: 12},
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnTxt: {fontSize: 16, fontWeight: '700', color: '#fff'},
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    height: 54,
    borderWidth: 1.5,
    borderColor: Colors.chipBorder,
  },
  secondaryBtnTxt: {fontSize: 16, fontWeight: '700', color: Colors.text},
});
