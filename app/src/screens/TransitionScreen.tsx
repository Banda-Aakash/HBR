import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {Button} from '../components';
import {rentalsApi, ApiRental} from '../api/client';
import {
  TENANCY_STATE_LABELS,
  TENANCY_STATE_COLORS,
  TenancyState,
} from '../types/rental';
import {RootStackParamList} from '../types';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

// Same guard evaluator as TenancyDetailScreen
function evaluateGuards(rental: ApiRental) {
  const hasDoc = (type: string) => rental.documents?.some(d => d.type === type && d.isOnFile) || false;
  const hasInsp = (type: string) => rental.inspections?.some(i => i.type === type) || false;
  const state = rental.state;
  const guardMap: Record<string, {id: string; label: string; description: string; isSatisfied: boolean}[]> = {
    onboarding: [
      {id: 'poa', label: 'Power of Attorney on file', description: 'A valid POA must be uploaded.', isSatisfied: hasDoc('poa')},
      {id: 'deed', label: 'Ownership documents on file', description: 'Sale deed or allotment letter.', isSatisfied: hasDoc('ownership_deed')},
      {id: 'noc', label: 'Society NOC on file', description: 'No-objection certificate from housing society.', isSatisfied: hasDoc('society_noc')},
      {id: 'photos', label: 'Baseline photo inventory', description: 'Room-by-room photo inventory.', isSatisfied: hasDoc('baseline_photos')},
      {id: 'maint', label: 'Agreed maintenance spend limit', description: 'Owner must set a maintenance limit.', isSatisfied: (rental.maintenanceSpendLimit || 0) > 0},
    ],
    marketing: [
      {id: 'screen', label: 'Tenant screening report on file', description: 'Background verification for proposed tenant.', isSatisfied: hasDoc('screening_report')},
      {id: 'approval', label: 'Owner approval recorded', description: 'Explicit owner approval for selected tenant.', isSatisfied: rental.ownerApproval},
    ],
    agreement: [
      {id: 'agree', label: 'E-stamped & signed agreement', description: 'Rental agreement e-stamped and signed.', isSatisfied: hasDoc('agreement')},
      {id: 'deposit', label: 'Security deposit received', description: 'Full security deposit received.', isSatisfied: rental.depositReceived},
      {id: 'police', label: 'Police verification acknowledgement', description: 'Police verification submitted.', isSatisfied: hasDoc('police_verification')},
      {id: 'movein', label: 'Signed move-in inventory', description: 'Move-in inspection signed by both parties.', isSatisfied: hasDoc('move_in_inventory') && hasInsp('movein')},
    ],
    occupied: [
      {id: 'notice', label: 'Notice document with dated receipt', description: 'Written notice of intent to vacate.', isSatisfied: hasDoc('notice_document')},
    ],
    notice: [
      {id: 'moveout', label: 'Move-out inspection completed', description: 'Move-out inspection linked to move-in.', isSatisfied: hasInsp('moveout') && hasInsp('movein')},
    ],
    move_out: [
      {id: 'settled', label: 'Deposit settled with itemised deductions', description: 'Security deposit returned or settled.', isSatisfied: rental.depositSettled},
      {id: 'dues', label: 'All dues cleared', description: 'All outstanding dues cleared.', isSatisfied: rental.duesCleared},
      {id: 'final', label: 'Final statement issued', description: 'Final financial statement generated.', isSatisfied: hasDoc('final_statement')},
    ],
  };
  const guards = guardMap[state] || [];
  const unmet = guards.filter(g => !g.isSatisfied);
  const nextStates: Record<string, string> = {
    onboarding: 'marketing', marketing: 'agreement', agreement: 'occupied',
    occupied: 'notice', notice: 'move_out', move_out: 'marketing',
  };
  return {guards, unmetGuards: unmet, allowed: unmet.length === 0, targetState: nextStates[state] || state};
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TenancyTransition'>;
  route: RouteProp<RootStackParamList, 'TenancyTransition'>;
};

export const TransitionScreen: React.FC<Props> = ({navigation, route}) => {
  const [tenancy, setTenancy] = useState<ApiRental | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rentalsApi.getById(route.params.tenancyId)
      .then(setTenancy)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [route.params.tenancyId]);

  const result = useMemo(() => {
    if (!tenancy) {return null;}
    return evaluateGuards(tenancy);
  }, [tenancy]);

  if (loading) {
    return <View style={styles.errorContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (!tenancy || !result) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={Colors.textLight} />
        <Text style={styles.errorText}>Tenancy not found</Text>
      </View>
    );
  }

  const stateColor = TENANCY_STATE_COLORS[tenancy.state as TenancyState];
  const targetColor = TENANCY_STATE_COLORS[result.targetState as TenancyState];

  // Combine actual guard status with manual overrides (simulating doc uploads)
  const effectiveGuards = result.guards;
  const allSatisfied = effectiveGuards.every(g => g.isSatisfied);
  const metCount = effectiveGuards.filter(g => g.isSatisfied).length;

  // Map guard IDs to actual backend actions
  const fulfillGuard = async (guardId: string) => {
    if (!tenancy) {return;}

    try {
      // Document-type guards: add the document
      const docGuards: Record<string, {type: string; fileName: string}> = {
        poa: {type: 'poa', fileName: 'POA_Document.pdf'},
        deed: {type: 'ownership_deed', fileName: 'Ownership_Deed.pdf'},
        noc: {type: 'society_noc', fileName: 'Society_NOC.pdf'},
        photos: {type: 'baseline_photos', fileName: 'Baseline_Photos.zip'},
        screen: {type: 'screening_report', fileName: 'Screening_Report.pdf'},
        agree: {type: 'agreement', fileName: 'Rental_Agreement.pdf'},
        police: {type: 'police_verification', fileName: 'Police_Verification.pdf'},
        movein: {type: 'move_in_inventory', fileName: 'MoveIn_Inventory.pdf'},
        notice: {type: 'notice_document', fileName: 'Notice_Document.pdf'},
        moveout: {type: 'move_out_inspection', fileName: 'MoveOut_Inspection.pdf'},
        final: {type: 'final_statement', fileName: 'Final_Statement.pdf'},
      };

      // Field-update guards
      const fieldGuards: Record<string, Record<string, any>> = {
        maint: {maintenanceSpendLimit: 5000},
        approval: {ownerApproval: true},
        deposit: {depositReceived: true},
        settled: {depositSettled: true},
        dues: {duesCleared: true},
      };

      if (docGuards[guardId]) {
        await rentalsApi.addDocument(
          tenancy.id,
          docGuards[guardId].type,
          docGuards[guardId].fileName,
        );
      } else if (fieldGuards[guardId]) {
        await rentalsApi.update(tenancy.id, fieldGuards[guardId]);
      }

      // Re-fetch tenancy to get updated guard status
      const updated = await rentalsApi.getById(tenancy.id);
      setTenancy(updated);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to fulfill requirement');
    }
  };

  const handleTransition = () => {
    if (!allSatisfied) {
      Alert.alert(
        'Requirements Not Met',
        'All guard requirements must be satisfied before this transition can proceed.',
      );
      return;
    }

    Alert.alert(
      'Confirm Transition',
      `Advance this tenancy from "${TENANCY_STATE_LABELS[tenancy.state as TenancyState]}" to "${TENANCY_STATE_LABELS[result.targetState as TenancyState]}"?\n\nThis action will be recorded in the audit log.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await rentalsApi.transition(tenancy.id);
              Alert.alert(
                'Transition Complete',
                `Property ${tenancy.property.unitNo} has been advanced to "${TENANCY_STATE_LABELS[result.targetState as TenancyState]}".`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ],
              );
            } catch (e: any) {
              Alert.alert(
                'Transition Failed',
                e.message || 'Could not advance the state. Some requirements may not be met on the server.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>State Transition</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Transition Header */}
        <View style={styles.transitionHeader}>
          <View style={styles.stateFlow}>
            <View style={[styles.statePill, {backgroundColor: stateColor}]}>
              <Text style={styles.statePillText}>
                {TENANCY_STATE_LABELS[tenancy.state as TenancyState]}
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Icon name="arrow-forward" size={24} color={Colors.textLight} />
            </View>
            <View style={[styles.statePill, {backgroundColor: targetColor}]}>
              <Text style={styles.statePillText}>
                {TENANCY_STATE_LABELS[result.targetState as TenancyState]}
              </Text>
            </View>
          </View>

          <Text style={styles.propertyRef}>
            {tenancy.property.address} · {tenancy.property.unitNo}
          </Text>

          {/* Progress Ring */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressCircle,
                allSatisfied && styles.progressCircleComplete,
              ]}>
              <Text
                style={[
                  styles.progressNumber,
                  allSatisfied && styles.progressNumberComplete,
                ]}>
                {metCount}/{effectiveGuards.length}
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  allSatisfied && styles.progressLabelComplete,
                ]}>
                {allSatisfied ? 'Ready' : 'Requirements'}
              </Text>
            </View>
          </View>
        </View>

        {/* Guard Checklist */}
        <View style={styles.guardSection}>
          <Text style={styles.guardSectionTitle}>
            Transition Requirements
          </Text>
          <Text style={styles.guardSectionSubtitle}>
            All requirements must be satisfied before the transition can proceed.
            Tap an unmet requirement to simulate fulfilling it.
          </Text>

          {effectiveGuards.map((guard, index) => (
            <TouchableOpacity
              key={guard.id}
              style={[
                styles.guardCard,
                guard.isSatisfied && styles.guardCardSatisfied,
              ]}
              onPress={() => {
                if (!guard.isSatisfied) {
                  fulfillGuard(guard.id);
                }
              }}
              disabled={guard.isSatisfied}
              activeOpacity={0.8}
              accessible
              accessibilityRole="checkbox"
              accessibilityLabel={guard.label}
              accessibilityState={{checked: guard.isSatisfied}}>
              <View style={styles.guardCardLeft}>
                <View style={styles.guardNumber}>
                  <Text style={styles.guardNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.guardContent}>
                  <Text
                    style={[
                      styles.guardLabel,
                      guard.isSatisfied && styles.guardLabelSatisfied,
                    ]}>
                    {guard.label}
                  </Text>
                  <Text style={styles.guardDescription}>
                    {guard.description}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.guardCheckbox,
                  guard.isSatisfied && styles.guardCheckboxChecked,
                ]}>
                {guard.isSatisfied && (
                  <Icon name="check" size={16} color={Colors.textInverse} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="info" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            Tap any unmet requirement to fulfill it. Documents will be
            added and fields will be updated on the server. Once all
            requirements are green, you can confirm the transition.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Button
          title={
            allSatisfied
              ? `Confirm Transition to ${TENANCY_STATE_LABELS[result.targetState as TenancyState]}`
              : `${result.unmetGuards.length} requirements remaining`
          }
          onPress={handleTransition}
          disabled={!allSatisfied}
          icon={
            <Icon
              name={allSatisfied ? 'check-circle' : 'lock'}
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
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 120,
  },

  // Transition Header
  transitionHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  stateFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statePill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
  },
  statePillText: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyRef: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleComplete: {
    borderColor: Colors.success,
    backgroundColor: '#D1FAE5',
  },
  progressNumber: {
    ...Typography.h2,
    color: Colors.text,
  },
  progressNumberComplete: {
    color: Colors.success,
  },
  progressLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  progressLabelComplete: {
    color: Colors.success,
  },

  // Guard Section
  guardSection: {
    marginBottom: Spacing.xl,
  },
  guardSectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  guardSectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  guardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  guardCardSatisfied: {
    borderColor: Colors.success,
    backgroundColor: '#F0FDF4',
  },
  guardCardLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.md,
  },
  guardNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  guardNumberText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  guardContent: {
    flex: 1,
  },
  guardLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 4,
  },
  guardLabelSatisfied: {
    color: Colors.success,
  },
  guardDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  simulatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  simulatedText: {
    ...Typography.small,
    color: '#7C3AED',
  },
  guardCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  guardCheckboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    ...Typography.caption,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 18,
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
});
