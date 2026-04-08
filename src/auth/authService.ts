import auth from '@react-native-firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import appleAuth from '@invertase/react-native-apple-authentication'
import * as Crypto from 'expo-crypto'
import { Platform } from 'react-native'

// ─── Setup ───────────────────────────────────────────────────────────────────
//
// Before this works you must:
//  1. Firebase Console → Authentication → Sign-in method → Enable Google
//  2. Re-download google-services.json and GoogleService-Info.plist
//  3. Replace WEB_CLIENT_ID below with the Web OAuth client ID shown in
//     Firebase Console → Authentication → Sign-in method → Google → Web SDK
//  4. Replace REPLACE_WITH_REVERSED_CLIENT_ID in app.json iosUrlScheme with
//     the reversed CLIENT_ID from the updated GoogleService-Info.plist
//  5. For Apple: Firebase Console → Authentication → Sign-in method → Apple
//     Add your bundle ID (com.differapps.intervaltimer) as a service ID
//
// ─────────────────────────────────────────────────────────────────────────────

const WEB_CLIENT_ID = '703339875432-2cj2ekf03t8u77fknmvni8odqbf77juq.apps.googleusercontent.com'
const ANDROID_UPLOAD_SHA1 = '8D:05:42:3D:DA:49:76:FD:36:66:62:E3:C5:B2:34:BB:E9:F7:0B:23'
const ANDROID_UPLOAD_SHA256 = 'CC:5F:5B:3E:EB:77:AF:61:CD:44:2E:4D:45:45:8A:71:49:01:DD:93:BF:93:5C:94:AE:F3:F8:4E:F0:11:25:D6'

GoogleSignin.configure({
  webClientId:   WEB_CLIENT_ID,
  offlineAccess: true,
})

function extractGoogleErrorCode(error: any): string {
  const code = error?.code ?? error?.nativeErrorCode ?? error?.userInfo?.code
  return code !== undefined && code !== null ? String(code) : 'unknown'
}

export function isGoogleSignInCancelled(error: any): boolean {
  const code = extractGoogleErrorCode(error)
  const message = String(error?.message ?? '')
  return code === '12501' || code === 'SIGN_IN_CANCELLED' || message.includes('Sign in action cancelled')
}

export function getGoogleSignInErrorMessage(error: any): string {
  const code = extractGoogleErrorCode(error)
  const rawMessage = String(error?.message ?? 'No message')

  if (isGoogleSignInCancelled(error)) {
    return 'Google sign-in was cancelled.'
  }

  if (code === '10' || code === 'DEVELOPER_ERROR') {
    return `Android Google sign-in is misconfigured. Add this Android signing cert to Firebase for com.differapps.intervaltimer, then re-download google-services.json and rebuild. SHA-1: ${ANDROID_UPLOAD_SHA1} SHA-256: ${ANDROID_UPLOAD_SHA256}`
  }

  if (rawMessage.includes('no ID token')) {
    return 'Google sign-in completed without an ID token. Verify the web client ID in Firebase Authentication and the Google Sign-In configuration.'
  }

  return `Google sign-in failed. Code: ${code}. ${rawMessage}`
}

function extractAppleErrorCode(error: any): string {
  const code = error?.code ?? error?.userInfo?.code
  return code !== undefined && code !== null ? String(code) : 'unknown'
}

export function isAppleSignInCancelled(error: any): boolean {
  const code = extractAppleErrorCode(error)
  return code === '1001'
}

export function getAppleSignInErrorMessage(error: any): string {
  const code = extractAppleErrorCode(error)
  const rawMessage = String(error?.message ?? 'No message')

  if (isAppleSignInCancelled(error)) {
    return 'Apple sign-in was cancelled.'
  }

  if (rawMessage.includes('identity token') || code === '1000') {
    return 'Apple sign-in is not fully configured. Check the Apple provider in Firebase Authentication, confirm the iOS capability is enabled for this bundle ID, and rebuild the app.'
  }

  return `Apple sign-in failed. Code: ${code}. ${rawMessage}`
}

// ─── Google ───────────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  const response = await GoogleSignin.signIn()
  const idToken  = response.data?.idToken
  if (!idToken) throw new Error('Google Sign-In returned no ID token')
  const credential = auth.GoogleAuthProvider.credential(idToken)
  await auth().signInWithCredential(credential)
}

// ─── Apple (iOS only) ────────────────────────────────────────────────────────

export function isAppleAuthAvailable(): boolean {
  return Platform.OS === 'ios' && appleAuth.isSupported
}

export async function signInWithApple(): Promise<void> {
  // Generate a cryptographic nonce — Apple signs it so Firebase can verify
  const rawNonce = Array.from(
    { length: 32 },
    () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
      Math.floor(Math.random() * 62)
    ],
  ).join('')

  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  )

  const response = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes:    [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    nonce:              hashedNonce,
  })

  if (!response.identityToken) throw new Error('Apple Sign-In returned no identity token')

  const credential = auth.AppleAuthProvider.credential(
    response.identityToken,
    rawNonce,
  )
  await auth().signInWithCredential(credential)
}

// ─── Email / Password ────────────────────────────────────────────────────────

export async function createAccountWithEmail(email: string, password: string): Promise<void> {
  await auth().createUserWithEmailAndPassword(email, password)
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await auth().signInWithEmailAndPassword(email, password)
}

export async function sendPasswordReset(email: string): Promise<void> {
  await auth().sendPasswordResetEmail(email)
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await auth().signOut()
  try {
    await GoogleSignin.revokeAccess()
    await GoogleSignin.signOut()
  } catch {
    // Google was not the sign-in provider — safe to ignore
  }
}
