import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InvalidCredentialsError, loginWithGoogle, loginWithPassword } from '@/api/auth';
import { requestGoogleIdToken } from '@/api/googleIdentity';
import { ThemedText } from '@/components/themed-text';

const INVALID_CREDENTIALS_MESSAGE = "L'email ou le mot de passe est incorrect.";

export default function LoginScreen() {
  const [email, setEmail] = useState('sam@foyer.fr');
  const [password, setPassword] = useState('password');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmittingPassword, setSubmittingPassword] = useState(false);
  const [isSubmittingGoogle, setSubmittingGoogle] = useState(false);
  const [isConnected, setConnected] = useState(false);

  async function submitPasswordLogin() {
    setErrorMessage('');
    setSubmittingPassword(true);

    try {
      await loginWithPassword({ email: email.trim(), password });
      setConnected(true);
    } catch (error) {
      setErrorMessage(
        error instanceof InvalidCredentialsError
          ? INVALID_CREDENTIALS_MESSAGE
          : 'Connexion impossible pour le moment.',
      );
    } finally {
      setSubmittingPassword(false);
    }
  }

  async function submitGoogleLogin() {
    setErrorMessage('');
    setSubmittingGoogle(true);

    try {
      const idToken = await requestGoogleIdToken();
      await loginWithGoogle({ idToken });
      setConnected(true);
    } catch {
      setErrorMessage('Connexion Google impossible pour le moment.');
    } finally {
      setSubmittingGoogle(false);
    }
  }

  if (isConnected) {
    return (
      <SafeAreaView style={styles.connectedContainer}>
        <View style={styles.connectedPanel}>
          <BrandMark />
          <ThemedText style={styles.connectedTitle}>Vous êtes connecté.</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <BrandMark />

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>E-mail</ThemedText>
                <TextInput
                  accessibilityLabel="E-mail"
                  autoCapitalize="none"
                  autoComplete="email"
                  inputMode="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="sam@foyer.fr"
                  placeholderTextColor="#7E7378"
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Mot de passe</ThemedText>
                <TextInput
                  accessibilityLabel="Mot de passe"
                  autoCapitalize="none"
                  autoComplete="password"
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#7E7378"
                  secureTextEntry
                  style={styles.input}
                  textContentType="password"
                  value={password}
                />
              </View>

              {errorMessage ? (
                <ThemedText accessibilityLiveRegion="polite" style={styles.errorText}>
                  {errorMessage}
                </ThemedText>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmittingPassword || isSubmittingGoogle}
                onPress={submitPasswordLogin}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                  (isSubmittingPassword || isSubmittingGoogle) && styles.disabledButton,
                ]}>
                {isSubmittingPassword ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>Se connecter</ThemedText>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>ou</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={isSubmittingPassword || isSubmittingGoogle}
                onPress={submitGoogleLogin}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                  (isSubmittingPassword || isSubmittingGoogle) && styles.disabledButton,
                ]}>
                {isSubmittingGoogle ? (
                  <ActivityIndicator color="#7A2844" />
                ) : (
                  <ThemedText style={styles.secondaryButtonText}>Continuer avec Google</ThemedText>
                )}
              </Pressable>

              <View style={styles.signupRow}>
                <ThemedText style={styles.signupText}>Pas encore de compte ? </ThemedText>
                <Pressable accessibilityRole="link" hitSlop={8}>
                  <ThemedText style={styles.signupLink}>{"S'inscrire"}</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BrandMark() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandTitleRow}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.logo}
        />
        <ThemedText style={styles.brandTitle}>DailyMeal</ThemedText>
      </View>
      <ThemedText style={styles.brandSubtitle}>On mange quoi cette semaine ?</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EFEF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    minHeight: 760,
    borderRadius: 40,
    backgroundColor: '#FFFCFC',
    paddingHorizontal: 18,
    paddingTop: 106,
    paddingBottom: 34,
    shadowColor: '#2E2026',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 6,
  },
  brand: {
    alignItems: 'center',
  },
  brandTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logo: {
    width: 23,
    height: 23,
    borderRadius: 7,
    backgroundColor: '#A23E5C',
    transform: [{ rotate: '45deg' }],
  },
  brandTitle: {
    color: '#2E2529',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 34,
  },
  brandSubtitle: {
    color: '#6E6268',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 6,
  },
  form: {
    marginTop: 36,
    gap: 16,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    color: '#352A2F',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  input: {
    minHeight: 50,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D6C7CC',
    backgroundColor: '#EAE1E4',
    color: '#31272B',
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#8E2E33',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#A83E60',
    marginTop: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3D9DC',
  },
  dividerText: {
    color: '#6D6267',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  secondaryButton: {
    minHeight: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9CDD5',
    backgroundColor: '#FFF3F6',
  },
  secondaryButtonText: {
    color: '#70263F',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  signupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#574B51',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  signupLink: {
    color: '#70263F',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.84,
  },
  disabledButton: {
    opacity: 0.68,
  },
  connectedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFEF',
    padding: 24,
  },
  connectedPanel: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFCFC',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  connectedTitle: {
    color: '#2E2529',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginTop: 28,
    textAlign: 'center',
  },
});
