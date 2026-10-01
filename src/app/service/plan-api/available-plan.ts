import { UserPlan } from './plan-api.service';

/**
 * The plan the app keeps in storage under `availablePlan`, and the
 * `response` of the API's getUserPlan it comes from, are not always a plan.
 * The server answers with `false` (no subscription), the string
 * "User Not Found", or a subscription whose `plan` is null (its plan row is
 * missing). All of those are truthy or partly filled, and the app used to
 * treat any truthy answer as a plan and read `.plan.slug` from it, which
 * crashed the class list ("Cannot read properties of undefined (reading
 * 'slug')", Sentry issue 150453663) and, from storage, kept crashing on
 * every later start.
 *
 * Returns the value only when it really is a plan, otherwise null. Callers
 * treat null exactly like the API's `response: false`.
 */
export function usableUserPlan(value: unknown): UserPlan | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const plan = (value as UserPlan).plan;
  if (!plan || typeof plan !== 'object') {
    return null;
  }
  return value as UserPlan;
}

/** A non-free plan that has not expired (e.g. unlocks e-learning). */
export function hasActivePaidPlan(value: unknown): boolean {
  const plan = usableUserPlan(value);
  return !!plan && plan.plan?.slug != 'free' && plan.isExpire == false;
}
