import { hasActivePaidPlan, usableUserPlan } from './available-plan';

describe('available plan helpers', () => {
  const paid = { plan: { slug: 'premium' }, isExpire: false };

  describe('usableUserPlan', () => {
    it('returns a real plan unchanged', () => {
      expect(usableUserPlan(paid)).toBe(paid);
    });

    it('treats every non-plan answer from getUserPlan as "no plan"', () => {
      expect(usableUserPlan(false)).toBeNull(); // no subscription
      expect(usableUserPlan('User Not Found')).toBeNull(); // truthy string
      expect(usableUserPlan(null)).toBeNull();
      expect(usableUserPlan(undefined)).toBeNull();
      expect(usableUserPlan({})).toBeNull();
      expect(usableUserPlan({ isExpire: false })).toBeNull(); // no plan key
      expect(usableUserPlan({ plan: null, isExpire: false })).toBeNull(); // plan row missing
      expect(usableUserPlan({ plan: 'free' })).toBeNull();
    });
  });

  describe('hasActivePaidPlan', () => {
    it('is true for a non-free plan that has not expired', () => {
      expect(hasActivePaidPlan(paid)).toBeTrue();
    });

    it('is false for a free plan or an expired plan', () => {
      expect(hasActivePaidPlan({ plan: { slug: 'free' }, isExpire: false })).toBeFalse();
      expect(hasActivePaidPlan({ plan: { slug: 'premium' }, isExpire: true })).toBeFalse();
    });

    it('does not throw, and is false, for the shapes that used to crash on `.plan.slug`', () => {
      // Sentry issue 150453663: "Cannot read properties of undefined (reading 'slug')"
      for (const bad of [undefined, null, false, 'User Not Found', {}, { isExpire: false }, { plan: null }]) {
        expect(() => hasActivePaidPlan(bad)).not.toThrow();
        expect(hasActivePaidPlan(bad)).toBeFalse();
      }
    });
  });
});
