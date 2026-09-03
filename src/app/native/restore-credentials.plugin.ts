import { registerPlugin } from '@capacitor/core';

/**
 * Bridges Android's CredentialManager "Restore Credentials" API (Kotlin
 * plugin, staging.basmapp/docs/JWT_AND_RESTORE_CREDENTIALS_PLAN.md Part B2
 * -- not implemented yet). Until that native plugin is registered, every
 * call here rejects immediately (Capacitor's standard "plugin not
 * implemented" behavior) -- every call site in this app treats that as
 * absence, not a hard failure, since restore is strictly additive over
 * the normal login flow.
 */
export interface RestoreCredentialsPlugin {
  /** requestJson: the WebAuthn PublicKeyCredentialCreationOptionsJSON from restoreCredential/registerChallenge, JSON.stringify'd. */
  createRestoreCredential(options: { requestJson: string }): Promise<{ registrationResponseJson: string }>;
  /** requestJson: the WebAuthn PublicKeyCredentialRequestOptionsJSON from restoreCredential/authChallenge, JSON.stringify'd. */
  getRestoreCredential(options: { requestJson: string }): Promise<{ found: boolean; authenticationResponseJson?: string }>;
  clearRestoreCredential(): Promise<void>;
}

export const RestoreCredentials = registerPlugin<RestoreCredentialsPlugin>('RestoreCredentials');
