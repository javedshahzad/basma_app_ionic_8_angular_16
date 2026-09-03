import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';

export interface RestoreCredentialChallenge {
  options: Record<string, unknown>;
  challenge_ticket: string;
}

export interface RestoreCredentialAuthResult {
  success: boolean;
  session?: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  details?: Record<string, unknown>;
  msg?: string;
}

/**
 * Wraps the 5 restoreCredential/* backend endpoints (Part B1, already
 * live in staging.basmapp). registerVerify/authVerify go through
 * ApiClient.postJsonRequest() -- their `response` field is a nested
 * WebAuthn object the backend requires as real JSON, not form-urlencoded.
 */
@Injectable({
  providedIn: 'root'
})
export class RestoreCredentialsApiService {
  constructor(private apiClient: ApiClient) {}

  registerChallenge(): Promise<RestoreCredentialChallenge | null> {
    return this.apiClient
      .postRequest<any>({}, 'restoreCredential/registerChallenge')
      .then(response => (response && response.success ? { options: response.options, challenge_ticket: response.challenge_ticket } : null))
      .catch(() => null);
  }

  registerVerify(response: Record<string, unknown>, challengeTicket: string): Promise<boolean> {
    return this.apiClient
      .postJsonRequest<any>({ response, challenge_ticket: challengeTicket }, 'restoreCredential/registerVerify')
      .then(res => !!res && !!res.success)
      .catch(() => false);
  }

  authChallenge(): Promise<RestoreCredentialChallenge | null> {
    return this.apiClient
      .postRequest<any>({}, 'restoreCredential/authChallenge')
      .then(response => (response && response.success ? { options: response.options, challenge_ticket: response.challenge_ticket } : null))
      .catch(() => null);
  }

  authVerify(response: Record<string, unknown>, challengeTicket: string): Promise<RestoreCredentialAuthResult | null> {
    return this.apiClient
      .postJsonRequest<RestoreCredentialAuthResult>({ response, challenge_ticket: challengeTicket }, 'restoreCredential/authVerify')
      .then(res => (res && res.success ? res : null))
      .catch(() => null);
  }

  remove(credentialId: string): Promise<boolean> {
    return this.apiClient
      .postRequest<any>({ credential_id: credentialId }, 'restoreCredential/remove')
      .then(res => !!res && !!res.success)
      .catch(() => false);
  }
}
