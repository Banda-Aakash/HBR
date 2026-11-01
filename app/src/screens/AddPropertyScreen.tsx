import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {rentalsApi} from '../api/client';
import {Colors, Spacing, Fonts} from '../theme';
import {RootStackParamList} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddProperty'>;
};

export const AddPropertyScreen: React.FC<Props> = ({navigation}) => {
  const [address, setAddress] = useState('');
  const [unitNo, setUnitNo] = useState('');
  const [tower, setTower] = useState('');
  const [floor, setFloor] = useState('');
  const [carpetArea, setCarpetArea] = useState('');
  const [facing, setFacing] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [maintenanceLimit, setMaintenanceLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!address.trim() || !unitNo.trim() || !city.trim() || !rent.trim()) {
      Alert.alert('Missing Fields', 'Address, unit number, city, and rent are required.');
      return;
    }

    setLoading(true);
    try {
      await rentalsApi.create({
        address: address.trim(),
        unitNo: unitNo.trim(),
        tower: tower.trim() || undefined,
        floor: Number(floor) || undefined,
        carpetArea: Number(carpetArea) || undefined,
        facing: facing.trim() || undefined,
        locality: locality.trim() || undefined,
        city: city.trim(),
        rent: Number(rent),
        deposit: Number(deposit) || undefined,
        maintenanceSpendLimit: Number(maintenanceLimit) || undefined,
      });
      Alert.alert('Property Added', 'Your property has been added and is now in the onboarding stage.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    opts?: {placeholder?: string; keyboard?: 'numeric' | 'default'; required?: boolean},
  ) => (
    <View style={s.field}>
      <Text style={s.label}>
        {label}
        {opts?.required && <Text style={s.req}> *</Text>}
      </Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={opts?.placeholder || ''}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={opts?.keyboard || 'default'}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add Property</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled">
        {/* Info banner */}
        <View style={s.infoBanner}>
          <Icon name="info-outline" size={18} color={Colors.primary} />
          <Text style={s.infoTxt}>
            Your property will start in the onboarding stage. Complete the required documents to move it to marketing.
          </Text>
        </View>

        {/* Property Details */}
        <Text style={s.sectionTitle}>Property Details</Text>
        {renderField('Building / Society Name', address, setAddress, {placeholder: 'e.g. Prestige Lakeside Habitat', required: true})}
        <View style={s.row}>
          <View style={s.halfField}>
            {renderField('Unit No', unitNo, setUnitNo, {placeholder: 'e.g. A-1204', required: true})}
          </View>
          <View style={s.halfField}>
            {renderField('Tower / Block', tower, setTower, {placeholder: 'e.g. Tower A'})}
          </View>
        </View>
        <View style={s.row}>
          <View style={s.halfField}>
            {renderField('Floor', floor, setFloor, {placeholder: '12', keyboard: 'numeric'})}
          </View>
          <View style={s.halfField}>
            {renderField('Carpet Area (sqft)', carpetArea, setCarpetArea, {placeholder: '1450', keyboard: 'numeric'})}
          </View>
        </View>
        <View style={s.row}>
          <View style={s.halfField}>
            {renderField('Facing', facing, setFacing, {placeholder: 'East'})}
          </View>
          <View style={s.halfField}>
            {renderField('Locality', locality, setLocality, {placeholder: 'e.g. Varthur'})}
          </View>
        </View>
        {renderField('City', city, setCity, {placeholder: 'e.g. Bangalore', required: true})}

        {/* Financial */}
        <Text style={[s.sectionTitle, {marginTop: 8}]}>Financial</Text>
        {renderField('Monthly Rent (₹)', rent, setRent, {placeholder: '35000', keyboard: 'numeric', required: true})}
        <View style={s.row}>
          <View style={s.halfField}>
            {renderField('Security Deposit (₹)', deposit, setDeposit, {placeholder: 'Auto: 6x rent', keyboard: 'numeric'})}
          </View>
          <View style={s.halfField}>
            {renderField('Maintenance Limit (₹)', maintenanceLimit, setMaintenanceLimit, {placeholder: '5000', keyboard: 'numeric'})}
          </View>
        </View>
      </ScrollView>

      {/* Submit */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.submitBtn, loading && {opacity: 0.7}]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}>
          <Icon name="add-home" size={20} color="#fff" />
          <Text style={s.submitTxt}>{loading ? 'Adding...' : 'Add Property'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Spacing.xxxl + 8,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  backBtn: {width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {fontSize: 18, fontFamily: Fonts.bold, color: Colors.text},
  scroll: {padding: 20, paddingBottom: 100},

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.primaryLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTxt: {fontFamily: Fonts.regular, fontSize: 13, color: Colors.primaryDark, flex: 1, lineHeight: 19},

  sectionTitle: {fontSize: 16, fontFamily: Fonts.bold, color: Colors.text, marginBottom: 14},

  field: {marginBottom: 16},
  label: {fontSize: 13, fontFamily: Fonts.semibold, color: Colors.text, marginBottom: 8},
  req: {color: Colors.error},
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.text,
  },
  row: {flexDirection: 'row', gap: 12},
  halfField: {flex: 1},

  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitTxt: {fontSize: 16, fontFamily: Fonts.bold, color: '#fff'},
});
