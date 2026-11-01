import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {Button} from '../components';
import {rentalsApi, ApiRental} from '../api/client';
import {RootStackParamList} from '../types';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

const {width} = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    'RentalPropertyDetail'
  >;
  route: RouteProp<RootStackParamList, 'RentalPropertyDetail'>;
};

export const RentalPropertyDetailScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const [tenancy, setTenancy] = React.useState<ApiRental | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    rentalsApi.getById(route.params.tenancyId)
      .then(setTenancy)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [route.params.tenancyId]);

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loading...</Text>
      </View>
    );
  }

  if (!tenancy) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={Colors.textLight} />
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  const isAvailable = tenancy.state === 'marketing';
  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN')}`;

  const handleEnquire = () => {
    const message = [
      `🏠 *Rental Enquiry*`,
      ``,
      `*Property:* ${tenancy.property.address}`,
      `*Unit:* ${tenancy.property.unitNo}${tenancy.property.tower ? ` · ${tenancy.property.tower}` : ''}`,
      `*Location:* ${tenancy.property.locality}, ${tenancy.property.city}`,
      `*Rent:* ${formatCurrency(tenancy.rent)}/month`,
      `*Deposit:* ${formatCurrency(tenancy.deposit)}`,
      `*Area:* ${tenancy.property.carpetArea} sqft`,
      ``,
      `I'm interested in this rental property. Please share more details.`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/916281889589?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert(
        'WhatsApp not available',
        'Please install WhatsApp or contact us at +91 6281889589.',
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{uri: tenancy.property.image}}
            style={styles.image}
          />
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: isAvailable ? Colors.success : Colors.warning},
            ]}>
            <Text style={styles.statusText}>
              {isAvailable ? 'Available Now' : 'Currently Leased'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title & Rent */}
          <Text style={styles.title}>{tenancy.property.address}</Text>
          <Text style={styles.unitInfo}>
            {tenancy.property.unitNo}
            {tenancy.property.tower ? ` · ${tenancy.property.tower}` : ''}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="location-on" size={18} color={Colors.primary} />
            <Text style={styles.locationText}>
              {tenancy.property.locality}, {tenancy.property.city}
            </Text>
          </View>

          <View style={styles.rentCard}>
            <View>
              <Text style={styles.rentLabel}>Monthly Rent</Text>
              <Text style={styles.rentValue}>
                {formatCurrency(tenancy.rent)}
              </Text>
            </View>
            <View style={styles.rentDivider} />
            <View>
              <Text style={styles.rentLabel}>Security Deposit</Text>
              <Text style={styles.rentValue}>
                {formatCurrency(tenancy.deposit)}
              </Text>
            </View>
          </View>

          {/* Property Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Icon name="square-foot" size={22} color={Colors.primary} />
                <Text style={styles.detailValue}>
                  {tenancy.property.carpetArea}
                </Text>
                <Text style={styles.detailLabel}>Sq.ft</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="layers" size={22} color={Colors.primary} />
                <Text style={styles.detailValue}>
                  {tenancy.property.floor}
                </Text>
                <Text style={styles.detailLabel}>Floor</Text>
              </View>
              {tenancy.property.facing && (
                <View style={styles.detailItem}>
                  <Icon name="explore" size={22} color={Colors.primary} />
                  <Text style={styles.detailValue}>
                    {tenancy.property.facing}
                  </Text>
                  <Text style={styles.detailLabel}>Facing</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Icon name="category" size={22} color={Colors.primary} />
                <Text style={styles.detailValue}>
                  {tenancy.property.type === 'residential' ? 'Resi' : 'Comm'}
                </Text>
                <Text style={styles.detailLabel}>Type</Text>
              </View>
            </View>
          </View>

          {/* Lease Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lease Terms</Text>
            <View style={styles.termsCard}>
              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Monthly Rent</Text>
                <Text style={styles.termValue}>
                  {formatCurrency(tenancy.rent)}
                </Text>
              </View>
              <View style={styles.termDivider} />
              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Security Deposit</Text>
                <Text style={styles.termValue}>
                  {formatCurrency(tenancy.deposit)}
                </Text>
              </View>
              <View style={styles.termDivider} />
              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Deposit Months</Text>
                <Text style={styles.termValue}>
                  {Math.round(tenancy.deposit / tenancy.rent)} months
                </Text>
              </View>
              {tenancy.escalationPct !== undefined && (
                <>
                  <View style={styles.termDivider} />
                  <View style={styles.termRow}>
                    <Text style={styles.termLabel}>Annual Escalation</Text>
                    <Text style={styles.termValue}>
                      {tenancy.escalationPct}%
                    </Text>
                  </View>
                </>
              )}
              {tenancy.maintenanceSpendLimit !== undefined && (
                <>
                  <View style={styles.termDivider} />
                  <View style={styles.termRow}>
                    <Text style={styles.termLabel}>Maintenance Included</Text>
                    <Text style={styles.termValue}>
                      Up to {formatCurrency(tenancy.maintenanceSpendLimit)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* What's Included */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Process</Text>
            <View style={styles.processSteps}>
              {[
                {icon: 'search', label: 'Browse & enquire'},
                {icon: 'verified-user', label: 'Background verification'},
                {icon: 'description', label: 'E-stamped agreement'},
                {icon: 'vpn-key', label: 'Move-in with inventory'},
              ].map((step, i) => (
                <View key={step.label} style={styles.processStep}>
                  <View style={styles.processStepNumber}>
                    <Text style={styles.processStepNumberText}>{i + 1}</Text>
                  </View>
                  <Icon name={step.icon} size={20} color={Colors.primary} />
                  <Text style={styles.processStepLabel}>{step.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{height: 120}} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Rent</Text>
          <Text style={styles.bottomPriceValue}>
            {formatCurrency(tenancy.rent)}/mo
          </Text>
        </View>
        <Button
          title={isAvailable ? 'Enquire Now' : 'Join Waitlist'}
          onPress={handleEnquire}
          style={styles.enquireBtn}
          icon={
            <Icon
              name={isAvailable ? 'send' : 'notifications'}
              size={20}
              color={Colors.textInverse}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    marginTop: Spacing.base,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width,
    height: 280,
    backgroundColor: Colors.borderLight,
  },
  backBtn: {
    position: 'absolute',
    top: Spacing.xxxl + 10,
    left: Spacing.base,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.xxxl + 14,
    right: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.captionMedium,
    color: Colors.textInverse,
  },
  content: {
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  unitInfo: {
    ...Typography.subtitle,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  locationText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  rentCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  rentLabel: {
    ...Typography.small,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rentValue: {
    ...Typography.h2,
    color: Colors.primaryDark,
  },
  rentDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.primary,
    opacity: 0.2,
    marginHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  detailItem: {
    alignItems: 'center',
    gap: 4,
  },
  detailValue: {
    ...Typography.subtitle,
    color: Colors.text,
  },
  detailLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  termsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  termLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  termValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  termDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  processSteps: {
    gap: Spacing.md,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  processStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processStepNumberText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '700',
  },
  processStepLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomPrice: {
    flex: 1,
  },
  bottomPriceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  bottomPriceValue: {
    ...Typography.h3,
    color: Colors.text,
  },
  enquireBtn: {
    flex: 1,
    marginLeft: Spacing.base,
  },
});
