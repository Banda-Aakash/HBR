import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {Colors, Typography, Spacing} from '../theme';
import {AuthStackParamList} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export const RegisterScreen: React.FC<Props> = ({navigation}) => {
  const {register, isLoading} = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    const success = await register(name, email, password);
    if (!success) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  const renderField = (
    key: string,
    label: string,
    value: string,
    onChange: (t: string) => void,
    opts?: {
      icon?: string;
      placeholder?: string;
      secure?: boolean;
      keyboard?: 'email-address' | 'default';
      autoCapitalize?: 'none' | 'words';
    },
  ) => (
    <View style={styles.fieldGroup} key={key}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focusedField === key && styles.inputRowFocused,
        ]}>
        <Icon
          name={opts?.icon || 'edit'}
          size={20}
          color={focusedField === key ? Colors.primary : Colors.textLight}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={opts?.placeholder || ''}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={opts?.secure && !showPassword}
          keyboardType={opts?.keyboard || 'default'}
          autoCapitalize={opts?.autoCapitalize || 'none'}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
          accessible
          accessibilityLabel={label}
        />
        {opts?.secure && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Icon
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.textLight}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 1 of 1</Text>
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join thousands of property owners and tenants
          </Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          {renderField('name', 'Full name', name, setName, {
            icon: 'person-outline',
            placeholder: 'John Doe',
            autoCapitalize: 'words',
          })}
          {renderField('email', 'Email address', email, setEmail, {
            icon: 'mail-outline',
            placeholder: 'you@example.com',
            keyboard: 'email-address',
          })}
          {renderField('password', 'Password', password, setPassword, {
            icon: 'lock-outline',
            placeholder: 'Min. 6 characters',
            secure: true,
          })}
          {renderField(
            'confirm',
            'Confirm password',
            confirmPassword,
            setConfirmPassword,
            {
              icon: 'lock-outline',
              placeholder: 'Re-enter password',
              secure: true,
            },
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && {opacity: 0.7}]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Create account">
            <Text style={styles.primaryBtnText}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </Text>
            {!isLoading && (
              <Icon name="arrow-forward" size={20} color="#fff" />
            )}
          </TouchableOpacity>

          <Text style={styles.terms}>
            By creating an account you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {flexGrow: 1, paddingBottom: 32},
  topBar: {
    paddingHorizontal: 20,
    paddingTop: Spacing.xxxl + 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {paddingHorizontal: 24, marginBottom: 20},
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  formCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
  fieldGroup: {marginBottom: 16},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '400',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  terms: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {color: Colors.primary, fontWeight: '500'},
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 28,
  },
  footerText: {...Typography.body, color: Colors.textSecondary},
  footerLink: {...Typography.bodyMedium, color: Colors.primary},
});
