import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {useRole} from '../context/RoleContext';
import {favoritesApi, bookingsApi} from '../api/client';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const {width} = Dimensions.get('window');

// ── Menu sections with grouped items ──
const accountItems = [
  {
    icon: 'person-outline',
    label: 'Personal Information',
    subtitle: 'Name, phone, email',
    nav: undefined as string | undefined,
  },
  {
    icon: 'event-note',
    label: 'My Bookings',
    subtitle: 'Upcoming and past visits',
    nav: 'MyBookings' as string | undefined,
  },
  {
    icon: 'verified-user',
    label: 'Identity Verification',
    subtitle: 'PAN, Aadhaar, documents',
    nav: undefined as string | undefined,
  },
  {
    icon: 'account-balance-wallet',
    label: 'Payment Methods',
    subtitle: 'Bank accounts, UPI',
    nav: undefined as string | undefined,
  },
];

const preferencesItems = [
  {
    icon: 'notifications-none',
    label: 'Notifications',
    subtitle: 'Push, email, SMS alerts',
  },
  {
    icon: 'language',
    label: 'Language & Region',
    subtitle: 'English (India)',
  },
  {
    icon: 'dark-mode',
    label: 'Appearance',
    subtitle: 'Light mode',
  },
];

const supportItems = [
  {
    icon: 'headset-mic',
    label: 'Help Centre',
    subtitle: 'FAQs, contact support',
  },
  {
    icon: 'shield',
    label: 'Privacy & Security',
    subtitle: 'Data, permissions, 2FA',
  },
  {
    icon: 'description',
    label: 'Terms & Policies',
    subtitle: 'Legal documents',
  },
];

export const ProfileScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const {user, logout} = useAuth();
  const {isOwner, toggleMode} = useRole();
  const [favCount, setFavCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    favoritesApi.list().then(r => setFavCount(r.count)).catch(() => {});
    bookingsApi.list(isOwner ? 'owner' : 'tenant').then(r => setBookingCount(r.count)).catch(() => {});
  }, [isOwner]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: logout},
    ]);
  };

  const renderMenuItem = (
    item: {icon: string; label: string; subtitle: string; nav?: string},
    isLast: boolean,
  ) => (
    <TouchableOpacity
      key={item.label}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      activeOpacity={0.6}
      onPress={() => item.nav ? nav.navigate(item.nav as any) : undefined}
      accessible
      accessibilityRole="button"
      accessibilityLabel={item.label}>
      <View style={styles.menuIcon}>
        <Icon name={item.icon} size={21} color={Colors.textSecondary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={Colors.borderLight} />
    </TouchableOpacity>
  );

  const renderSection = (
    title: string,
    items: {icon: string; label: string; subtitle: string; nav?: string}[],
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, i) => renderMenuItem(item, i === items.length - 1))}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {/* ── Hero header with gradient feel ── */}
      <View style={styles.heroContainer}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Text style={styles.screenTitle}>Profile</Text>
            <TouchableOpacity
              style={styles.settingsBtn}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Settings">
              <Icon name="settings" size={22} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>

          {/* Avatar + Info */}
          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    user?.avatar ||
                    'https://randomuser.me/api/portraits/men/1.jpg',
                }}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.editAvatarBtn}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Change profile photo">
                <Icon name="camera-alt" size={14} color={Colors.textInverse} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.name || 'Guest User'}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || 'guest@example.com'}
              </Text>
              <View style={styles.verifiedRow}>
                <Icon name="verified" size={15} color="#34D399" />
                <Text style={styles.verifiedText}>Verified account</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats card overlapping hero */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {favCount}
            </Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {bookingCount}
            </Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <View style={styles.ratingRow}>
              <Text style={styles.statNumber}>4.8</Text>
              <Icon name="star" size={14} color={Colors.star} />
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* ── Mode Switch ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account Type</Text>
        <View style={styles.modeCard}>
          <View style={styles.modeInfo}>
            <View
              style={[
                styles.modeIconCircle,
                {backgroundColor: Colors.primaryLight},
              ]}>
              <Icon
                name={isOwner ? 'business' : 'person-search'}
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={styles.modeTextBlock}>
              <Text style={styles.modeActiveLabel}>
                {isOwner ? 'Owner / Investor' : 'Tenant / Renter'}
              </Text>
              <Text style={styles.modeHint}>
                {isOwner
                  ? 'Manage properties, track rentals, view interiors'
                  : 'Browse available rentals, save favourites'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={toggleMode}
            style={styles.toggleBar}
            activeOpacity={0.75}
            accessible
            accessibilityRole="switch"
            accessibilityLabel={`Switch to ${isOwner ? 'tenant' : 'owner'} mode`}
            accessibilityState={{checked: isOwner}}>
            <View
              style={[
                styles.toggleHalf,
                isOwner && styles.toggleHalfActive,
                isOwner && {backgroundColor: Colors.primary},
              ]}>
              <Icon
                name="business"
                size={16}
                color={isOwner ? '#fff' : Colors.textLight}
              />
              <Text
                style={[
                  styles.toggleText,
                  isOwner && styles.toggleTextActive,
                ]}>
                Owner
              </Text>
            </View>
            <View
              style={[
                styles.toggleHalf,
                !isOwner && styles.toggleHalfActive,
                !isOwner && {backgroundColor: Colors.primary},
              ]}>
              <Icon
                name="person-search"
                size={16}
                color={!isOwner ? '#fff' : Colors.textLight}
              />
              <Text
                style={[
                  styles.toggleText,
                  !isOwner && styles.toggleTextActive,
                ]}>
                Tenant
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Menu sections ── */}
      {renderSection('Account', accountItems)}
      {renderSection('Preferences', preferencesItems)}
      {renderSection('Support', supportItems)}

      {/* ── Sign out ── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Sign out">
          <Icon name="logout" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>RealApp v1.0.0</Text>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>Made in India</Text>
      </View>
    </ScrollView>
  );
};

const HERO_HEIGHT = 200;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Hero ──
  heroContainer: {
    marginBottom: 44, // half of stats card height for overlap
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroContent: {
    paddingTop: Spacing.xxxl + 8,
    paddingHorizontal: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  screenTitle: {
    ...Typography.h2,
    color: Colors.textInverse,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl + 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: Colors.borderLight,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileInfo: {
    marginLeft: Spacing.base,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: 2,
  },
  userEmail: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    ...Typography.small,
    color: '#34D399',
    fontWeight: '600',
  },

  // ── Stats Card (overlapping hero) ──
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statSep: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  // ── Section ──
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Mode card ──
  modeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  modeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTextBlock: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  modeActiveLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 2,
  },
  modeHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  toggleHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md - 2,
  },
  toggleHalfActive: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
  },
  toggleTextActive: {
    color: '#fff',
  },

  // ── Menu items ──
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 1,
  },
  menuSubtitle: {
    ...Typography.small,
    color: Colors.textLight,
  },

  // ── Sign out ──
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  footerText: {
    ...Typography.small,
    color: Colors.textLight,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textLight,
  },
});
