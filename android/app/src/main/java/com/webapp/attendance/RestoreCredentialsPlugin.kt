package com.webapp.attendance

import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CreateRestoreCredentialRequest
import androidx.credentials.CreateRestoreCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetRestoreCredentialOption
import androidx.credentials.RestoreCredential
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import androidx.credentials.exceptions.restorecredential.E2eeUnavailableException
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Bridges Android's CredentialManager "Restore Credentials" API (resident
 * WebAuthn keys, Google Play's zero-tap sign-in requirement, enforced
 * April 2027) to the Ionic app's TS side
 * (src/app/native/restore-credentials.plugin.ts). See
 * staging.basmapp/docs/JWT_AND_RESTORE_CREDENTIALS_PLAN.md Part B.
 *
 * Registered in MainActivity.java before super.onCreate(), per Capacitor's
 * plugin registration convention.
 */
@CapacitorPlugin(name = "RestoreCredentials")
class RestoreCredentialsPlugin : Plugin() {
    private val scope = CoroutineScope(Dispatchers.Main)

    @PluginMethod(returnType = PluginMethod.RETURN_PROMISE)
    fun createRestoreCredential(call: PluginCall) {
        val requestJson = call.getString("requestJson")
        if (requestJson == null) {
            call.reject("requestJson is required")
            return
        }

        val credentialManager = CredentialManager.create(context)
        scope.launch {
            try {
                val response = createRestoreCredentialWithRetry(credentialManager, requestJson)
                val result = JSObject()
                result.put("registrationResponseJson", response.responseJson)
                call.resolve(result)
            } catch (e: CreateCredentialException) {
                call.reject(e.message ?: "create_restore_credential_failed", e)
            }
        }
    }

    private suspend fun createRestoreCredentialWithRetry(
        credentialManager: CredentialManager,
        requestJson: String
    ): CreateRestoreCredentialResponse {
        return try {
            createOnce(credentialManager, requestJson, isCloudBackupEnabled = true)
        } catch (e: E2eeUnavailableException) {
            // Google's documented pattern: end-to-end encryption isn't set up
            // on this device -- retry once with cloud backup explicitly off.
            createOnce(credentialManager, requestJson, isCloudBackupEnabled = false)
        }
    }

    private suspend fun createOnce(
        credentialManager: CredentialManager,
        requestJson: String,
        isCloudBackupEnabled: Boolean
    ): CreateRestoreCredentialResponse {
        val response = credentialManager.createCredential(
            context,
            CreateRestoreCredentialRequest(requestJson, isCloudBackupEnabled)
        )
        return response as? CreateRestoreCredentialResponse
            ?: throw IllegalStateException("Unexpected credential response type")
    }

    @PluginMethod(returnType = PluginMethod.RETURN_PROMISE)
    fun getRestoreCredential(call: PluginCall) {
        val requestJson = call.getString("requestJson")
        if (requestJson == null) {
            call.reject("requestJson is required")
            return
        }

        val credentialManager = CredentialManager.create(context)
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(GetRestoreCredentialOption(requestJson))
            .build()

        scope.launch {
            try {
                val response = credentialManager.getCredential(context, request)
                val credential = response.credential as? RestoreCredential
                val result = JSObject()
                if (credential != null) {
                    result.put("found", true)
                    result.put("authenticationResponseJson", credential.authenticationResponseJson)
                } else {
                    result.put("found", false)
                }
                call.resolve(result)
            } catch (e: NoCredentialException) {
                // Normal case for a brand-new install/device -- resolve with
                // found:false, never a rejection.
                val result = JSObject()
                result.put("found", false)
                call.resolve(result)
            } catch (e: GetCredentialException) {
                call.reject(e.message ?: "get_restore_credential_failed", e)
            }
        }
    }

    @PluginMethod(returnType = PluginMethod.RETURN_PROMISE)
    fun clearRestoreCredential(call: PluginCall) {
        val credentialManager = CredentialManager.create(context)
        scope.launch {
            try {
                credentialManager.clearCredentialState(
                    ClearCredentialStateRequest(ClearCredentialStateRequest.TYPE_CLEAR_RESTORE_CREDENTIAL)
                )
                call.resolve()
            } catch (e: ClearCredentialException) {
                call.reject(e.message ?: "clear_restore_credential_failed", e)
            }
        }
    }
}
