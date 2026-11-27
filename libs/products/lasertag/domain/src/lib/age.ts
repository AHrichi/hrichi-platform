/**
 * Who may sign up alone. Only the birth year is asked, so the age is the
 * youngest a person born that year can be today: someone born in 2013 is
 * treated as 12 for all of 2026 and needs a guardian.
 */
export interface AgePolicy {
  /** Below this age a guardian must create the account. */
  readonly guardianUnder: number;
  /** Below this age the player is a minor: private by default. */
  readonly minorUnder: number;
  /** Why the numbers are what they are, and what still needs checking. */
  readonly note: string;
}

export type CountryCode = 'TN';

export const AGE_POLICIES: Record<CountryCode, AgePolicy> = {
  TN: {
    // The owner's choice (2026-11-27). Law 2004-63, article 28, asks for the
    // guardian's consent and the family judge's authorisation for anyone
    // under 18: a launch blocker until a lawyer confirms (ADR-0033).
    guardianUnder: 13,
    minorUnder: 18,
    note: 'Under review: law 2004-63 art. 28 covers every child under 18.',
  },
};

export const OLDEST_BIRTH_YEAR_SPAN = 100;

export type SignupAge = 'adult' | 'minor' | 'guardian-required' | 'invalid';

/** The youngest a person born in `birthYear` can be on `now`. */
export function youngestAge(birthYear: number, now: Date): number {
  return now.getUTCFullYear() - birthYear - 1;
}

export function signupAge(
  birthYear: number,
  policy: AgePolicy,
  now: Date,
): SignupAge {
  const year = now.getUTCFullYear();
  if (
    !Number.isInteger(birthYear) ||
    birthYear > year ||
    birthYear < year - OLDEST_BIRTH_YEAR_SPAN
  ) {
    return 'invalid';
  }
  const age = youngestAge(birthYear, now);
  if (age < policy.guardianUnder) return 'guardian-required';
  return age < policy.minorUnder ? 'minor' : 'adult';
}
