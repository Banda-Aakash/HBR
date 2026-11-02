import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArchIcon, ArchImage, FestiveStrip, useStripHeight} from '../components/Arch';
import {useAuth} from '../context/AuthContext';
import {useRole} from '../context/RoleContext';
import {useTheme} from '../context/ThemeContext';
import {favoritesApi, bookingsApi} from '../api/client';
import {FEATURES, SUPPORT_PHONE} from '../config';
import {Colors, Fonts, Typography, Spacing, BorderRadius} from '../theme';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const initialsOf = (name?: string) =>
  (name || '?').split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();

export const ProfileScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const {user, logout, deleteAccount} = useAuth();
  const {isOwner, toggleMode} = useRole();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stripHeight = useStripHeight();
  const [favCount, setFavCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const closeDelete = () => {
    setShowDelete(false);
    setDeletePassword('');
  };

  const handleDelete = async () => {
    setDeleting(true);
    const error = await deleteAccount(deletePassword);
    setDeleting(false);
    if (error) {
      Alert.alert('Could Not Delete Account', error);
    }
  };

  const openHelp = () => {
    Linking.openURL(`https://wa.me/${SUPPORT_PHONE}`).catch(() =>
      Alert.alert('WhatsApp not available', `Please contact us at +${SUPPORT_PHONE}.`),
    );
  };

  const menu = [
    {label: 'Saved homes', onPress: () => nav.navigate('Saved')},
    {label: 'Your visits', onPress: () => nav.navigate('MyBookings')},
    {label: 'Help and support', onPress: openHelp},
    {label: 'Sign out', onPress: handleLogout},
  ];

  const onBand = !!theme.festival;

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.soft}]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}>
      <View
        style={[
          styles.hero,
          theme.festival
            ? {backgroundColor: theme.primary, paddingTop: stripHeight + 16}
            : {paddingTop: insets.top + 16},
        ]}>
        {theme.festival ? <FestiveStrip festival={theme.festival} /> : null}
        {user?.avatar ? (
          <ArchImage uri={user.avatar} width={76} height={86} footRadius={10} />
        ) : (
          <View style={[styles.initials, {backgroundColor: theme.festival ? theme.accent : theme.primary}]}>
            <Text style={[styles.initialsText, {color: theme.festival ? theme.onAccent : Colors.gold}]}>
              {initialsOf(user?.name)}
            </Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, onBand && styles.onBand]} numberOfLines={1} adjustsFontSizeToFit>
            {user?.name || 'Guest User'}
          </Text>
          <Text style={[styles.userEmail, onBand && styles.onBand]} numberOfLines={1}>
            {theme.wish || user?.email}
          </Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, {color: theme.ink}]}>{favCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, {color: theme.ink}]}>{bookingCount}</Text>
          <Text style={styles.statLabel}>Visits</Text>
        </View>
      </View>

      {/* ── Mode Switch ── */}
      {FEATURES.rentals ? (
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
      ) : null}

      {/* ── Menu ── */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          {menu.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < menu.length - 1 && styles.menuItemBorder]}
              activeOpacity={0.6}
              onPress={item.onPress}
              accessibilityRole="button">
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ArchIcon name="right" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.deleteLink}
          onPress={() => setShowDelete(true)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Delete account">
          <Text style={styles.deleteLinkText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>HomeBridge Reality v1.0.0</Text>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>Made in India</Text>
      </View>

      {/* ── Delete account ── */}
      <Modal visible={showDelete} transparent animationType="fade" onRequestClose={closeDelete}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete your account?</Text>
            <Text style={styles.modalBody}>
              This permanently removes your account, bookings and saved
              properties. It can't be undone. Enter your password to confirm.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Password"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              accessibilityLabel="Password"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={closeDelete}
                disabled={deleting}
                accessibilityRole="button">
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDeleteBtn, (!deletePassword || deleting) && styles.modalBtnDisabled]}
                onPress={handleDelete}
                disabled={!deletePassword || deleting}
                accessibilityRole="button">
                <Text style={styles.modalDeleteText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  onBand: {color: Colors.textInverse},

  // ── Header ──
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  initials: {
    width: 76,
    height: 86,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {fontFamily: Fonts.heavy, fontSize: 26},
  profileInfo: {flex: 1, minWidth: 0},
  userName: {
    fontFamily: Fonts.heavy,
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.text,
  },
  userEmail: {
    marginTop: 2,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  deleteLink: {alignItems: 'center', paddingVertical: 14, marginTop: 4},
  deleteLinkText: {...Typography.caption, color: Colors.textSecondary, textDecorationLine: 'underline'},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {backgroundColor: Colors.surface, borderRadius: 16, padding: 20},
  modalTitle: {fontFamily: Fonts.display, fontSize: 18, color: Colors.text, marginBottom: 8},
  modalBody: {...Typography.body, color: Colors.textSecondary, lineHeight: 21, marginBottom: 14},
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    color: Colors.text,
    marginBottom: 16,
  },
  modalActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 8},
  modalBtn: {paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10},
  modalBtnDisabled: {opacity: 0.5},
  modalCancelText: {fontFamily: Fonts.semibold, color: Colors.textSecondary},
  modalDeleteBtn: {backgroundColor: Colors.error},
  modalDeleteText: {fontFamily: Fonts.bold, color: Colors.textInverse},

  // ── Stats ──
  statsCard: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: Fonts.display,
    fontSize: 26,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // ── Section ──
  section: {
    paddingHorizontal: 20,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontFamily: Fonts.semibold,
    color: Colors.textLight,
  },
  toggleTextActive: {
    color: '#fff',
  },

  // ── Menu items ──
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: Spacing.base,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.text,
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
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textSecondary,
  },
});
