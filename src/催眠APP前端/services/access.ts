import type { HypnosisFeature } from '../types';

export const SUBSCRIPTION_TIERS = ['VIP1', 'VIP2', 'VIP3', 'VIP4', 'VIP5', 'VIP6'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export type SubscriptionState = {
  tier: SubscriptionTier;
};

export type AccessContext = {
  debugEnabled: boolean;
  subscription: SubscriptionState | null;
  nowVirtualMinutes: number | null;
};

export function isSubscriptionActive(ctx: AccessContext): boolean {
  if (ctx.debugEnabled) return true;
  return ctx.subscription !== null;
}

function featureRequiredSubscriptionTier(feature: HypnosisFeature): SubscriptionTier | null {
  if (feature.tier === 'TRIAL' || feature.tier === 'VIP1') return null;
  if (SUBSCRIPTION_TIERS.includes(feature.tier as SubscriptionTier)) return feature.tier as SubscriptionTier;

  // Feature tiers above VIP5 still require the highest subscription tier.
  return 'VIP6';
}

export function canUseFeature(feature: HypnosisFeature, ctx: AccessContext): boolean {
  if (ctx.debugEnabled) return true;

  const required = featureRequiredSubscriptionTier(feature);
  if (required === null) return true;

  if (!isSubscriptionActive(ctx) || !ctx.subscription) return false;
  return SUBSCRIPTION_TIERS.indexOf(ctx.subscription.tier) >= SUBSCRIPTION_TIERS.indexOf(required);
}

export function getBodyStatsUnlocked(opts: { debugEnabled: boolean; vip1StatsUnlocked: boolean }): boolean {
  return opts.debugEnabled || opts.vip1StatsUnlocked;
}
