import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {Button} from '../components';
import {rentalsApi, ApiRental} from '../api/client';
import {
  TENANCY_STATES,
  TENANCY_STATE_LABELS,
  TENANCY_STATE_COLORS,
  TenancyState,
} from '../types/rental';
import {RootStackParamList} from '../types';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

// Lightweight guard evaluator that works with ApiRental data
function evaluateGuards(rental: ApiRental) {
  const hasDoc = (type: string) => rental.documents?.some(d => d.type === type && d.isOnFile) || false;
  const hasInsp = (type: string) => rental.inspections?.some(i => i.type === type) || false;
  const state = rental.state;

  const guardMap: Record<string, {id: string; label: string; isSatisfied: boolean}[]> = {
    onboarding: [
      {id: 'poa', label: 'POA on file', isSatisfied: hasDoc('poa')},
      {id: 'deed', label: 'Ownership documents', isSatisfied: hasDoc('ownership_deed')},
      {id: 'noc', label: 'Society NOC', isSatisfied: hasDoc('society_noc')},
      {id: 'photos', label: 'Baseline photos', isSatisfied: hasDoc('baseline_photos')},
      {id: 'maint', label: 'Maintenance limit set', isSatisfied: (rental.maintenanceSpendLimit || 0) > 0},
    ],
    marketing: [
      {id: 'screen', label: 'Screening report', isSatisfied: hasDoc('screening_report')},
      {id: 'approval', label: 'Owner approval', isSatisfied: rental.ownerApproval},
    ],
    agreement: [
      {id: 'agree', label: 'Signed agreement', isSatisfied: hasDoc('agreement')},
      {id: 'deposit', label: 'Deposit received', isSatisfied: rental.depositReceived},
      {id: 'police', label: 'Police verification', isSatisfied: hasDoc('police_verification')},
      {id: 'movein', label: 'Move-in inventory', isSatisfied: hasDoc('move_in_inventory') && hasInsp('movein')},
    ],
    occupied: [
      {id: 'notice', label: 'Notice document', isSatisfied: hasDoc('notice_document')},
    ],
    notice: [
      {id: 'moveout', label: 'Move-out inspection', isSatisfied: hasInsp('moveout') && hasInsp('movein')},
    ],
    move_out: [
      {id: 'settled', label: 'Deposit settled', isSatisfied: rental.depositSettled},
      {id: 'dues', label: 'Dues cleared', isSatisfied: rental.duesCleared},
      {id: 'final', label: 'Final statement', isSatisfied: hasDoc('final_statement')},
    ],
  };

  const guards = guardMap[state] || [];
  const unmet = guards.filter(g => !g.isSatisfied);
  const nextStates: Record<string, string> = {
    onboarding: 'marketing', marketing: 'agreement', agreement: 'occupied',
    occupied: 'notice', notice: 'move_out', move_out: 'marketing',
  };

  return {
    guards,
    unmetGuards: unmet,
    allowed: unmet.length === 0,
    targetState: nextStates[state] || state,
  };
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TenancyDetail'>;
  route: RouteProp<RootStackParamList, 'TenancyDetail'>;
};

export const TenancyDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const [tenancy, setTenancy] = useState<ApiRental | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rentalsApi.getById(route.params.tenancyId)
      .then(setTenancy)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [route.params.tenancyId]);

  if (loading) {
    return <View style={styles.errorContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (!tenancy) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={Colors.textLight} />
        <Text style={styles.errorText}>Tenancy not found</Text>
      </View>
    );
  }

  const result = evaluateGuards(tenancy);
  const summary = result.allowed
    ? `Ready to advance to ${result.targetState}. All ${result.guards.length} requirements met.`
    : `${result.unmetGuards.length} of ${result.guards.length} requirements pending for ${result.targetState}.`;
  const stateColor = TENANCY_STATE_COLORS[tenancy.state as TenancyState] || Colors.textSecondary;
  const currentIndex = TENANCY_STATES.indexOf(tenancy.state as TenancyState);

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tenancy Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* State Machine Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Property Lifecycle</Text>
          <View style={styles.timeline}>
            {TENANCY_STATES.map((state, index) => {
              const isPast = index < currentIndex;
              const isCurrent = index === currentIndex;
              const dotColor = isPast || isCurrent
                ? TENANCY_STATE_COLORS[state]
                : Colors.borderLight;

              return (
                <View key={state} style={styles.timelineStep}>
                  {/* Connector line */}
                  {index > 0 && (
                    <View
                      style={[
                        styles.timelineConnector,
                        {
                          backgroundColor: isPast
                            ? TENANCY_STATE_COLORS[TENANCY_STATES[index - 1]]
                            : Colors.borderLight,
                        },
                      ]}
                    />
                  )}
                  {/* Dot */}
                  <View
                    style={[
                      styles.timelineDot,
                      {backgroundColor: dotColor},
                      isCurrent && styles.timelineDotCurrent,
                    ]}>
                    {isPast && (
                      <Icon name="check" size={12} color={Colors.textInverse} />
                    )}
                    {isCurrent && (
                      <View style={styles.timelineDotInner} />
                    )}
                  </View>
                  {/* Label */}
                  <Text
                    style={[
                      styles.timelineLabel,
                      isCurrent && {color: stateColor, fontWeight: '700'},
                      isPast && {color: Colors.textSecondary},
                    ]}>
                    {TENANCY_STATE_LABELS[state]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Property Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.propertyCard}>
            <Image
              source={{uri: tenancy.property.image}}
              style={styles.propertyImage}
            />
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>
                {tenancy.property.address}
              </Text>
              <Text style={styles.propertyUnit}>
                {tenancy.property.unitNo}
                {tenancy.property.tower
                  ? ` · ${tenancy.property.tower}`
                  : ''}
              </Text>
              <Text style={styles.propertyMeta}>
                Floor {tenancy.property.floor} · {tenancy.property.carpetArea}{' '}
                sqft
                {tenancy.property.facing
                  ? ` · ${tenancy.property.facing}`
                  : ''}
              </Text>
              <Text style={styles.propertyLocation}>
                {tenancy.property.locality}, {tenancy.property.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Owner & Tenant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.partiesCard}>
            {/* Owner */}
            <View style={styles.partyRow}>
              <View style={styles.partyLeft}>
                {tenancy.owner.avatar ? (
                  <Image
                    source={{uri: tenancy.owner.avatar}}
                    style={styles.partyAvatar}
                  />
                ) : (
                  <View
                    style={[styles.partyAvatar, styles.partyAvatarPlaceholder]}>
                    <Icon name="person" size={20} color={Colors.textLight} />
                  </View>
                )}
                <View>
                  <Text style={styles.partyName}>{tenancy.owner.name}</Text>
                  <Text style={styles.partyRole}>
                    Owner{' '}
                    {tenancy.owner.residencyStatus === 'nri' ? '(NRI)' : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.contactBtn}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Call ${tenancy.owner.name}`}>
                <Icon name="phone" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {tenancy.tenant && (
              <>
                <View style={styles.partyDivider} />
                <View style={styles.partyRow}>
                  <View style={styles.partyLeft}>
                    {tenancy.tenant.avatar ? (
                      <Image
                        source={{uri: tenancy.tenant.avatar}}
                        style={styles.partyAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.partyAvatar,
                          styles.partyAvatarPlaceholder,
                        ]}>
                        <Icon
                          name="person"
                          size={20}
                          color={Colors.textLight}
                        />
                      </View>
                    )}
                    <View>
                      <Text style={styles.partyName}>
                        {tenancy.tenant.name}
                      </Text>
                      <Text style={styles.partyRole}>Tenant</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${tenancy.tenant.name}`}>
                    <Icon name="phone" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financials</Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialBox}>
              <Text style={styles.financialLabel}>Monthly Rent</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(tenancy.rent)}
              </Text>
            </View>
            <View style={styles.financialBox}>
              <Text style={styles.financialLabel}>Security Deposit</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(tenancy.deposit)}
              </Text>
            </View>
            {tenancy.maintenanceSpendLimit !== undefined && (
              <View style={styles.financialBox}>
                <Text style={styles.financialLabel}>Maintenance Limit</Text>
                <Text style={styles.financialValue}>
                  {formatCurrency(tenancy.maintenanceSpendLimit)}
                </Text>
              </View>
            )}
            {tenancy.escalationPct !== undefined && (
              <View style={styles.financialBox}>
                <Text style={styles.financialLabel}>Annual Escalation</Text>
                <Text style={styles.financialValue}>
                  {tenancy.escalationPct}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Documents ({tenancy.documents.length})
          </Text>
          {tenancy.documents.map(doc => (
            <View key={doc.id} style={styles.docRow}>
              <View style={styles.docIconContainer}>
                <Icon
                  name={doc.isOnFile ? 'description' : 'upload-file'}
                  size={20}
                  color={doc.isOnFile ? Colors.success : Colors.warning}
                />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.fileName}</Text>
                <Text style={styles.docMeta}>
                  {doc.type.replace(/_/g, ' ')} · {doc.createdAt}
                </Text>
              </View>
              {doc.isOnFile && (
                <Icon name="check-circle" size={18} color={Colors.success} />
              )}
            </View>
          ))}
          {tenancy.documents.length === 0 && (
            <Text style={styles.emptyMeta}>No documents uploaded yet</Text>
          )}
        </View>

        {/* Inspections */}
        {tenancy.inspections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Inspections ({tenancy.inspections.length})
            </Text>
            {tenancy.inspections.map(insp => (
              <View key={insp.id} style={styles.inspectionCard}>
                <View style={styles.inspectionHeader}>
                  <View style={styles.inspectionTypeBadge}>
                    <Text style={styles.inspectionTypeText}>
                      {insp.type === 'movein'
                        ? 'Move-In'
                        : insp.type === 'moveout'
                        ? 'Move-Out'
                        : 'Periodic'}
                    </Text>
                  </View>
                  <Text style={styles.inspectionDate}>{insp.conductedAt}</Text>
                </View>
                <Text style={styles.inspectionBy}>
                  Conducted by {insp.conductedBy}
                </Text>
                <View style={styles.inspectionItems}>
                  {insp.items.map(item => (
                    <View key={item.id} style={styles.inspectionItemRow}>
                      <Text style={styles.inspectionItemText}>
                        {item.room} — {item.item}
                      </Text>
                      <View
                        style={[
                          styles.conditionBadge,
                          {
                            backgroundColor:
                              item.condition === 'good'
                                ? '#D1FAE5'
                                : item.condition === 'fair'
                                ? '#FEF3C7'
                                : '#FEE2E2',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.conditionText,
                            {
                              color:
                                item.condition === 'good'
                                  ? '#065F46'
                                  : item.condition === 'fair'
                                  ? '#92400E'
                                  : '#991B1B',
                            },
                          ]}>
                          {item.condition}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Ledger */}
        {tenancy.ledger.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ledger ({tenancy.ledger.length} entries)
            </Text>
            {tenancy.ledger.map(entry => (
              <View key={entry.id} style={styles.ledgerRow}>
                <View
                  style={[
                    styles.ledgerIcon,
                    {
                      backgroundColor:
                        entry.direction === 'in' ? '#D1FAE5' : '#FEE2E2',
                    },
                  ]}>
                  <Icon
                    name={
                      entry.direction === 'in'
                        ? 'arrow-downward'
                        : 'arrow-upward'
                    }
                    size={16}
                    color={entry.direction === 'in' ? '#065F46' : '#991B1B'}
                  />
                </View>
                <View style={styles.ledgerInfo}>
                  <Text style={styles.ledgerDesc}>{entry.description}</Text>
                  <Text style={styles.ledgerDate}>{entry.date}</Text>
                </View>
                <Text
                  style={[
                    styles.ledgerAmount,
                    {
                      color:
                        entry.direction === 'in'
                          ? Colors.success
                          : Colors.error,
                    },
                  ]}>
                  {entry.direction === 'in' ? '+' : '−'}
                  {formatCurrency(entry.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Transition Summary */}
        {result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Transition</Text>
            <View style={styles.transitionSummaryCard}>
              <View style={styles.transitionSummaryHeader}>
                <View style={[styles.stateBadgeLg, {backgroundColor: stateColor}]}>
                  <Text style={styles.stateBadgeLgText}>
                    {TENANCY_STATE_LABELS[tenancy.state as TenancyState] || tenancy.state}
                  </Text>
                </View>
                <Icon name="arrow-forward" size={20} color={Colors.textLight} />
                <View
                  style={[
                    styles.stateBadgeLg,
                    {backgroundColor: TENANCY_STATE_COLORS[result.targetState as TenancyState]},
                  ]}>
                  <Text style={styles.stateBadgeLgText}>
                    {TENANCY_STATE_LABELS[result.targetState as TenancyState]}
                  </Text>
                </View>
              </View>
              <Text style={styles.transitionSummaryText}>{summary}</Text>

              {/* Mini guard list */}
              {result.guards.map(g => (
                <View key={g.id} style={styles.miniGuardRow}>
                  <Icon
                    name={g.isSatisfied ? 'check-circle' : 'radio-button-unchecked'}
                    size={18}
                    color={g.isSatisfied ? Colors.success : Colors.textLight}
                  />
                  <Text
                    style={[
                      styles.miniGuardText,
                      g.isSatisfied && styles.miniGuardTextMet,
                    ]}>
                    {g.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{height: 120}} />
      </ScrollView>

      {/* Bottom CTA */}
      {result && (
        <View style={styles.bottomBar}>
          <Button
            title={
              result.allowed
                ? `Advance to ${TENANCY_STATE_LABELS[result.targetState as TenancyState]}`
                : `Review Requirements (${result.unmetGuards.length} pending)`
            }
            onPress={() =>
              navigation.navigate('TenancyTransition', {
                tenancyId: tenancy.id,
              })
            }
            style={styles.transitionBtn}
            icon={
              <Icon
                name={result.allowed ? 'arrow-forward' : 'checklist'}
                size={20}
                color={Colors.textInverse}
              />
            }
          />
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xxxl + 10,
    paddingBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  headerSpacer: {width: 40},
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  // Timeline
  timelineCard: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    top: 11,
    right: '50%',
    left: '-50%',
    height: 2,
    zIndex: -1,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  timelineDotCurrent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textInverse,
  },
  timelineLabel: {
    ...Typography.small,
    color: Colors.textLight,
    textAlign: 'center',
  },

  // Property
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  propertyImage: {
    width: 110,
    height: 110,
    backgroundColor: Colors.borderLight,
  },
  propertyInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  propertyName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 2,
  },
  propertyUnit: {
    ...Typography.captionMedium,
    color: Colors.primary,
    marginBottom: 2,
  },
  propertyMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  propertyLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Parties
  partiesCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  partyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
  },
  partyAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  partyRole: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  partyDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Financials
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  financialBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '48%',
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  financialLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  financialValue: {
    ...Typography.subtitle,
    color: Colors.text,
  },

  // Documents
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  docIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    ...Typography.captionMedium,
    color: Colors.text,
  },
  docMeta: {
    ...Typography.small,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  emptyMeta: {
    ...Typography.body,
    color: Colors.textLight,
    fontStyle: 'italic',
  },

  // Inspections
  inspectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  inspectionTypeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  inspectionTypeText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  inspectionDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  inspectionBy: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inspectionItems: {
    gap: Spacing.xs,
  },
  inspectionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectionItemText: {
    ...Typography.caption,
    color: Colors.text,
  },
  conditionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  conditionText: {
    ...Typography.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Ledger
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ledgerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  ledgerInfo: {
    flex: 1,
  },
  ledgerDesc: {
    ...Typography.captionMedium,
    color: Colors.text,
  },
  ledgerDate: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ledgerAmount: {
    ...Typography.bodyMedium,
  },

  // Transition Summary
  transitionSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  transitionSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stateBadgeLg: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  stateBadgeLgText: {
    ...Typography.captionMedium,
    color: Colors.textInverse,
  },
  transitionSummaryText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  miniGuardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  miniGuardText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  miniGuardTextMet: {
    color: Colors.success,
    textDecorationLine: 'line-through',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  transitionBtn: {
    width: '100%',
  },
});
