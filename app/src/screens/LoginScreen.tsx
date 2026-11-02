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
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FestiveScene, FestiveStrip, FullLogo, useStripHeight} from '../components/Arch';
import {Button} from '../components/Button';
import {useAuth} from '../context/AuthContext';
import {useTheme} from '../context/ThemeContext';
import {FEATURES} from '../config';
import {Colors, Fonts, Typography} from '../theme';
import {AuthStackParamList} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {login, isLoading} = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stripHeight = useStripHeight();
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
      style={[styles.container, {backgroundColor: theme.soft}]}
      behavior={Platform.OS === 'ios' ? undefined : 'height'}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {/* ── Brand hero ── */}
        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.primary,
              paddingTop: theme.festival ? stripHeight + 6 : insets.top + 40,
            },
          ]}>
          {theme.festival ? <FestiveStrip festival={theme.festival} /> : null}
          <FullLogo width={230} />
          <Text style={styles.tagline}>
            {theme.wish || 'Your complete real estate companion'}
          </Text>
          {theme.festival ? <FestiveScene festival={theme.festival} width={176} /> : null}
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>

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
                    : Colors.textSecondary
                }
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textSecondary}
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
                    : Colors.textSecondary
                }
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={Colors.textSecondary}
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
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In button */}
          <Button
            title={isLoading ? 'Signing in...' : 'Sign in'}
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.primaryBtn}
          />

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
        <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16) + 8}]}>
          <Text style={styles.footerText}>New here?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityRole="button">
            <Text style={[styles.footerLink, {color: theme.ink}]}> Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {flexGrow: 1},

  // Hero
  hero: {alignItems: 'center', paddingBottom: 20, overflow: 'hidden'},
  tagline: {
    marginTop: 6,
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.textInverse,
  },

  // Form
  form: {paddingHorizontal: 20, paddingTop: 24},
  welcomeTitle: {
    fontFamily: Fonts.heavy,
    fontSize: 30,
    letterSpacing: -0.6,
    color: Colors.text,
    marginBottom: 18,
  },

  // Fields
  fieldGroup: {marginBottom: 14},
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.textLight,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.text,
  },

  // CTA
  primaryBtn: {height: 54, paddingVertical: 0, marginTop: 6},

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 18,
  },
  dividerLine: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border},
  dividerText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialPillText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.text,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {...Typography.body, fontSize: 15, color: Colors.textSecondary},
  footerLink: {fontFamily: Fonts.bold, fontSize: 15},
});
