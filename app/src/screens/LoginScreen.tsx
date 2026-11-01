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
import {FEATURES} from '../config';
import {Colors, Typography} from '../theme';
import {AuthStackParamList} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {login, isLoading} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    const error = await login(email.trim(), password);
    if (error) {
      Alert.alert(
        'Login Failed',
        error === 'Invalid credentials' ? 'Please check your email and password.' : error,
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ── Brand hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroBg} />
          <View style={styles.logoCircle}>
            <Icon name="apartment" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.brand}>RealApp</Text>
          <Text style={styles.tagline}>
            Your complete real estate companion
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.formCard}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSub}>
            Sign in to manage properties and bookings
          </Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email address</Text>
            <View
              style={[
                styles.inputRow,
                focusedField === 'email' && styles.inputRowFocused,
              ]}>
              <Icon
                name="mail-outline"
                size={20}
                color={
                  focusedField === 'email'
                    ? Colors.primary
                    : Colors.textLight
                }
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                accessible
                accessibilityLabel="Email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              {FEATURES.passwordReset ? (
                <TouchableOpacity>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View
              style={[
                styles.inputRow,
                focusedField === 'password' && styles.inputRowFocused,
              ]}>
              <Icon
                name="lock-outline"
                size={20}
                color={
                  focusedField === 'password'
                    ? Colors.primary
                    : Colors.textLight
                }
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                accessible
                accessibilityLabel="Password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                accessible
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }>
                <Icon
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && {opacity: 0.7}]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Sign in">
            {isLoading ? (
              <Text style={styles.primaryBtnText}>Signing in...</Text>
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Sign In</Text>
                <Icon name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {FEATURES.socialLogin ? (
            <>
              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social pills */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialPill} activeOpacity={0.7}>
                  <Icon name="public" size={20} color="#EA4335" />
                  <Text style={styles.socialPillText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialPill} activeOpacity={0.7}>
                  <Icon name="apple" size={20} color="#000" />
                  <Text style={styles.socialPillText}>Apple</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.footerLink}> Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {flexGrow: 1},

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 36,
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },

  // Form card
  formCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  welcomeSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 24,
  },

  // Fields
  fieldGroup: {marginBottom: 18},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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

  // CTA
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
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

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0'},
  dividerText: {
    fontSize: 12,
    color: Colors.textLight,
    marginHorizontal: 12,
  },

  // Social
  socialRow: {flexDirection: 'row', gap: 12},
  socialPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 28,
  },
  footerText: {...Typography.body, color: Colors.textSecondary},
  footerLink: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
});
