/**
 * Rental State Machine
 * ====================
 * Implements the state machine from platform-build-spec §5.1–5.2.
 *
 * States:  onboarding → marketing → agreement → occupied → notice → move_out → marketing
 *
 * Every transition has guards — hard requirements that MUST be met before the
 * transition is allowed. The machine checks guard satisfaction against the
 * current tenancy data and returns a result with all guards and their status.
 *
 * Guards are enforced in code, not policy.
 */

import {
  Tenancy,
  TenancyState,
  TransitionGuard,
  TransitionResult,
} from '../types/rental';

// ── Allowed transitions ──

const TRANSITIONS: Record<TenancyState, TenancyState | null> = {
  onboarding: 'marketing',
  marketing: 'agreement',
  agreement: 'occupied',
  occupied: 'notice',
  notice: 'move_out',
  move_out: 'marketing', // cycle back
};

// ── Guard definitions per transition ──
// Each guard function receives the tenancy and returns whether it's satisfied.

type GuardDef = {
  id: string;
  label: string;
  description: string;
  check: (tenancy: Tenancy) => boolean;
};

const hasDocument = (tenancy: Tenancy, type: string): boolean =>
  tenancy.documents.some(d => d.type === type && d.isOnFile);

const hasInspection = (tenancy: Tenancy, type: string): boolean =>
  tenancy.inspections.some(i => i.type === type);

const GUARD_DEFS: Record<string, GuardDef[]> = {
  // onboarding → marketing
  'onboarding→marketing': [
    {
      id: 'poa_on_file',
      label: 'Power of Attorney on file',
      description:
        'A valid POA must be uploaded and verified before listing the property.',
      check: t => hasDocument(t, 'poa'),
    },
    {
      id: 'ownership_docs',
      label: 'Ownership documents on file',
      description:
        'Sale deed or allotment letter proving ownership must be on file.',
      check: t => hasDocument(t, 'ownership_deed'),
    },
    {
      id: 'society_noc',
      label: 'Society NOC on file',
      description:
        'No-objection certificate from the housing society for renting.',
      check: t => hasDocument(t, 'society_noc'),
    },
    {
      id: 'baseline_photos',
      label: 'Baseline photo inventory',
      description:
        'Room-by-room photo inventory of the property in its current condition.',
      check: t => hasDocument(t, 'baseline_photos'),
    },
    {
      id: 'maintenance_limit',
      label: 'Agreed maintenance spend limit',
      description:
        'Owner must set an approved spend limit for maintenance without additional approval.',
      check: t =>
        t.maintenanceSpendLimit !== undefined && t.maintenanceSpendLimit > 0,
    },
  ],

  // marketing → agreement
  'marketing→agreement': [
    {
      id: 'screening_report',
      label: 'Tenant screening report on file',
      description:
        'Background verification / screening report for the proposed tenant.',
      check: t => hasDocument(t, 'screening_report'),
    },
    {
      id: 'owner_approval',
      label: 'Owner approval recorded',
      description:
        'Explicit owner approval for the selected tenant must be recorded.',
      check: t => t.ownerApproval === true,
    },
  ],

  // agreement → occupied
  'agreement→occupied': [
    {
      id: 'agreement_signed',
      label: 'E-stamped & signed agreement',
      description:
        'Rental agreement must be e-stamped and signed by both parties.',
      check: t => hasDocument(t, 'agreement'),
    },
    {
      id: 'deposit_received',
      label: 'Security deposit received',
      description:
        'Full security deposit must be received and acknowledged.',
      check: t => t.depositReceived === true,
    },
    {
      id: 'police_verification',
      label: 'Police verification acknowledgement',
      description:
        'Police verification form must be submitted or acknowledged.',
      check: t => hasDocument(t, 'police_verification'),
    },
    {
      id: 'move_in_inventory',
      label: 'Signed move-in inventory',
      description:
        'Detailed move-in inspection inventory signed by both parties.',
      check: t =>
        hasDocument(t, 'move_in_inventory') && hasInspection(t, 'movein'),
    },
  ],

  // occupied → notice
  'occupied→notice': [
    {
      id: 'notice_document',
      label: 'Notice document with dated receipt',
      description:
        'Written notice of intent to vacate with acknowledged receipt date.',
      check: t => hasDocument(t, 'notice_document'),
    },
  ],

  // notice → move_out
  'notice→move_out': [
    {
      id: 'moveout_inspection',
      label: 'Move-out inspection completed',
      description:
        'Move-out inspection must be completed and linked to the move-in inspection.',
      check: t => {
        const hasMoveOut = hasInspection(t, 'moveout');
        const hasMoveIn = hasInspection(t, 'movein');
        return hasMoveOut && hasMoveIn;
      },
    },
  ],

  // move_out → marketing
  'move_out→marketing': [
    {
      id: 'deposit_settled',
      label: 'Deposit settled with itemised deductions',
      description:
        'Security deposit must be returned or settled with itemised deduction list.',
      check: t => t.depositSettled === true,
    },
    {
      id: 'dues_cleared',
      label: 'All dues cleared',
      description:
        'All outstanding dues (rent, utilities, damages) must be cleared.',
      check: t => t.duesCleared === true,
    },
    {
      id: 'final_statement',
      label: 'Final statement issued',
      description:
        'A final financial statement must be generated and shared with the owner.',
      check: t => hasDocument(t, 'final_statement'),
    },
  ],
};

// ── Public API ──

/**
 * Returns the next allowed state for a given current state,
 * or null if no transition exists (shouldn't happen in the cycle).
 */
export function getNextState(current: TenancyState): TenancyState | null {
  return TRANSITIONS[current] ?? null;
}

/**
 * Evaluates all guards for the transition from the tenancy's current state
 * to the next state. Returns a TransitionResult with guard statuses.
 */
export function evaluateTransition(tenancy: Tenancy): TransitionResult | null {
  const targetState = getNextState(tenancy.state);
  if (!targetState) {
    return null;
  }

  const key = `${tenancy.state}→${targetState}`;
  const guardDefs = GUARD_DEFS[key] || [];

  const guards: TransitionGuard[] = guardDefs.map(def => ({
    id: def.id,
    label: def.label,
    description: def.description,
    isSatisfied: def.check(tenancy),
  }));

  const unmetGuards = guards.filter(g => !g.isSatisfied);

  return {
    allowed: unmetGuards.length === 0,
    targetState,
    guards,
    unmetGuards,
  };
}

/**
 * Attempts to transition a tenancy to the next state.
 * Returns the updated tenancy if all guards pass, or throws
 * with unmet guard details if not.
 */
export function transitionTenancy(
  tenancy: Tenancy,
): {success: true; tenancy: Tenancy} | {success: false; result: TransitionResult} {
  const result = evaluateTransition(tenancy);

  if (!result) {
    return {
      success: false,
      result: {
        allowed: false,
        targetState: tenancy.state,
        guards: [],
        unmetGuards: [],
      },
    };
  }

  if (!result.allowed) {
    return {success: false, result};
  }

  return {
    success: true,
    tenancy: {
      ...tenancy,
      state: result.targetState,
    },
  };
}

/**
 * Returns human-readable summary of what's needed for the next transition.
 */
export function getTransitionSummary(tenancy: Tenancy): string {
  const result = evaluateTransition(tenancy);
  if (!result) {
    return 'No further transitions available.';
  }

  if (result.allowed) {
    return `Ready to advance to ${result.targetState}. All ${result.guards.length} requirements met.`;
  }

  return `${result.unmetGuards.length} of ${result.guards.length} requirements pending for ${result.targetState}.`;
}
