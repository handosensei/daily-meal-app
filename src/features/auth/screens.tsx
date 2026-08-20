import { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  loginWithGoogle,
  loginWithPassword,
  registerUser,
} from '@/api/auth';
import {
  getGroup,
  GroupsAuthenticationError,
  listMyGroups,
  type GroupResponse,
  type MeGroupResponse,
} from '@/api/groups';
import { requestGoogleIdToken } from '@/api/googleIdentity';
import { ThemedText } from '@/components/themed-text';
import { getAuthSession, setAuthSession } from '@/features/auth/session';

const INVALID_CREDENTIALS_MESSAGE = "L'email ou le mot de passe est incorrect.";
const PASSWORD_HELPER = 'Au moins 8 caractères.';
const GROUPS_PATH = '/groups';
const LOGIN_PATH = '/login';
const SIGNUP_PATH = '/signup';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getGroupsRoute(emailVerified: boolean) {
  return {
    pathname: GROUPS_PATH,
    params: { emailVerified: emailVerified ? 'true' : 'false' },
  } as const;
}

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('sam@foyer.fr');
  const [password, setPassword] = useState('password');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmittingPassword, setSubmittingPassword] = useState(false);
  const [isSubmittingGoogle, setSubmittingGoogle] = useState(false);

  async function submitPasswordLogin() {
    setErrorMessage('');
    setSubmittingPassword(true);

    try {
      const loginResponse = await loginWithPassword({ email: email.trim(), password });
      setAuthSession(loginResponse);
      router.replace(getGroupsRoute(loginResponse.emailVerified === true));
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
      const loginResponse = await loginWithGoogle({ idToken });
      setAuthSession(loginResponse);
      router.replace(getGroupsRoute(loginResponse.emailVerified === true));
    } catch {
      setErrorMessage('Connexion Google impossible pour le moment.');
    } finally {
      setSubmittingGoogle(false);
    }
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
                <Pressable
                  accessibilityRole="link"
                  hitSlop={8}
                  onPress={() => {
                    setErrorMessage('');
                    router.push(SIGNUP_PATH);
                  }}>
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

export function SignupScreen() {
  const router = useRouter();
  const [lastname, setLastname] = useState('');
  const [firstname, setFirstname] = useState('Sam');
  const [signupEmail, setSignupEmail] = useState('sam@foyer.fr');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupErrorMessage, setSignupErrorMessage] = useState('');
  const [isSubmittingSignup, setSubmittingSignup] = useState(false);

  function validateSignupForm() {
    const trimmedLastname = lastname.trim();
    const trimmedFirstname = firstname.trim();
    const trimmedEmail = signupEmail.trim();

    if (trimmedLastname.length < 3) {
      return 'Le nom doit contenir au moins 3 caractères.';
    }

    if (trimmedFirstname.length < 3) {
      return 'Le prénom doit contenir au moins 3 caractères.';
    }

    if (!isValidEmail(trimmedEmail)) {
      return 'Saisissez une adresse e-mail valide.';
    }

    if (signupPassword.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }

    return '';
  }

  async function submitSignup() {
    const validationMessage = validateSignupForm();
    setSignupErrorMessage(validationMessage);

    if (validationMessage) {
      return;
    }

    setSubmittingSignup(true);

    try {
      const registeredUser = await registerUser({
        lastname: lastname.trim(),
        firstname: firstname.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
      });
      router.replace(getGroupsRoute(registeredUser.emailVerified));
    } catch (error) {
      setSignupErrorMessage(
        error instanceof EmailAlreadyExistsError
          ? 'Cette adresse e-mail est déjà utilisée.'
          : "Inscription impossible pour le moment.",
      );
    } finally {
      setSubmittingSignup(false);
    }
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
          <View style={styles.signupCard}>
            <View style={styles.phoneSheet}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.phoneHandle}
              />
              <View style={styles.signupHeaderRow}>
                <Pressable
                  accessibilityLabel="Retour à la connexion"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    setSignupErrorMessage('');
                    router.replace(LOGIN_PATH);
                  }}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                  <ThemedText style={styles.backButtonText}>‹</ThemedText>
                </Pressable>
                <ThemedText style={styles.signupHeaderTitle}>Créer un compte</ThemedText>
              </View>

              <ThemedText accessibilityRole="header" style={styles.signupTitle}>
                On fait connaissance ?
              </ThemedText>
              <ThemedText style={styles.signupSubtitle}>
                Quelques infos et on vous installe à table.
              </ThemedText>

              <View style={styles.signupForm}>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.label}>Nom</ThemedText>
                  <TextInput
                    accessibilityLabel="Nom"
                    autoComplete="family-name"
                    onChangeText={setLastname}
                    placeholder="Dupont"
                    placeholderTextColor="#7E7378"
                    style={styles.input}
                    textContentType="familyName"
                    value={lastname}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.label}>Prénom</ThemedText>
                  <TextInput
                    accessibilityLabel="Prénom"
                    autoComplete="given-name"
                    onChangeText={setFirstname}
                    placeholder="Sam"
                    placeholderTextColor="#7E7378"
                    style={styles.input}
                    textContentType="givenName"
                    value={firstname}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.label}>E-mail</ThemedText>
                  <TextInput
                    accessibilityLabel="E-mail d'inscription"
                    autoCapitalize="none"
                    autoComplete="email"
                    inputMode="email"
                    keyboardType="email-address"
                    onChangeText={setSignupEmail}
                    placeholder="sam@foyer.fr"
                    placeholderTextColor="#7E7378"
                    style={styles.input}
                    textContentType="emailAddress"
                    value={signupEmail}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.label}>Mot de passe</ThemedText>
                  <TextInput
                    accessibilityLabel="Mot de passe d'inscription"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onChangeText={setSignupPassword}
                    placeholder={PASSWORD_HELPER}
                    placeholderTextColor="#7E7378"
                    secureTextEntry
                    style={styles.input}
                    textContentType="newPassword"
                    value={signupPassword}
                  />
                </View>

                {signupErrorMessage ? (
                  <ThemedText accessibilityLiveRegion="polite" style={styles.errorText}>
                    {signupErrorMessage}
                  </ThemedText>
                ) : null}

                <View style={styles.infoBox}>
                  <View style={styles.infoIcon}>
                    <ThemedText style={styles.infoIconText}>›</ThemedText>
                  </View>
                  <ThemedText style={styles.infoText}>
                    <ThemedText style={styles.infoStrong}>Ensuite : </ThemedText>
                    on crée un groupe, ou on rejoint le vôtre avec un code.
                  </ThemedText>
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmittingSignup}
                  onPress={submitSignup}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.signupPrimaryButton,
                    pressed && styles.pressed,
                    isSubmittingSignup && styles.disabledButton,
                  ]}>
                  {isSubmittingSignup ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.primaryButtonText}>Continuer</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function GroupsScreen() {
  const { emailVerified } = useLocalSearchParams<{ emailVerified?: string }>();
  const authSession = getAuthSession();
  const canCreateOrJoinGroup = emailVerified === 'true' || authSession?.emailVerified === true;
  const [groups, setGroups] = useState<MeGroupResponse[]>([]);
  const [selectedGroupSummary, setSelectedGroupSummary] = useState<MeGroupResponse | null>(null);
  const [isLoadingGroups, setLoadingGroups] = useState(true);
  const [groupsErrorMessage, setGroupsErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      if (!authSession) {
        setLoadingGroups(false);
        setGroupsErrorMessage('Connectez-vous pour afficher vos groupes.');
        return;
      }

      setLoadingGroups(true);
      setGroupsErrorMessage('');

      try {
        const loadedGroups = await listMyGroups(authSession.accessToken);

        if (isMounted) {
          setGroups(loadedGroups);
        }
      } catch (error) {
        if (isMounted) {
          setGroupsErrorMessage(
            error instanceof GroupsAuthenticationError
              ? 'Votre session a expiré. Connectez-vous à nouveau.'
              : 'Impossible de charger vos groupes pour le moment.',
          );
        }
      } finally {
        if (isMounted) {
          setLoadingGroups(false);
        }
      }
    }

    loadGroups();

    return () => {
      isMounted = false;
    };
  }, [authSession]);

  if (selectedGroupSummary && authSession) {
    return (
      <GroupDetailScreen
        accessToken={authSession.accessToken}
        groupSummary={selectedGroupSummary}
        onBack={() => setSelectedGroupSummary(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.connectedContainer}>
      <ScrollView contentContainerStyle={styles.connectedContent} showsVerticalScrollIndicator={false}>
        <View style={styles.connectedPanel}>
          <BrandMark />
          <ThemedText accessibilityRole="header" style={styles.connectedTitle}>
            Mes groupes
          </ThemedText>
          <ThemedText style={styles.connectedSubtitle}>
            {"Choisissez celui qu'on planifie aujourd'hui."}
          </ThemedText>

          {isLoadingGroups ? (
            <View accessibilityLiveRegion="polite" style={styles.groupsStateBox}>
              <ActivityIndicator color="#A83E60" />
              <ThemedText style={styles.groupsStateText}>Chargement de vos groupes...</ThemedText>
            </View>
          ) : null}

          {!isLoadingGroups && groupsErrorMessage ? (
            <View accessibilityLiveRegion="polite" style={styles.groupsStateBox}>
              <ThemedText style={styles.errorText}>{groupsErrorMessage}</ThemedText>
            </View>
          ) : null}

          {!isLoadingGroups && !groupsErrorMessage && groups.length === 0 ? (
            <View accessibilityLiveRegion="polite" style={styles.groupsStateBox}>
              <ThemedText style={styles.groupsStateText}>
                {"Vous n'appartenez à aucun groupe pour le moment."}
              </ThemedText>
            </View>
          ) : null}

          {!isLoadingGroups && !groupsErrorMessage && groups.length > 0 ? (
            <View style={styles.groupList}>
              {groups.map((group) => (
                <GroupCard group={group} key={group.id} onPress={() => setSelectedGroupSummary(group)} />
              ))}
            </View>
          ) : null}

          {canCreateOrJoinGroup ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => undefined}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.connectedPrimaryButton,
                pressed && styles.pressed,
              ]}>
              <ThemedText style={styles.primaryButtonText}>Créer ou rejoindre un groupe</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GroupCard({ group, onPress }: { group: MeGroupResponse; onPress: () => void }) {
  const roleLabel = group.role === 'admin' ? 'Responsable' : 'Membre';
  const membersLabel = `${group.membersCount} ${group.membersCount > 1 ? 'membres' : 'membre'}`;

  return (
    <Pressable
      accessibilityLabel={`${group.name}, ${roleLabel}, ${membersLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.groupCard, pressed && styles.pressed]}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.groupAvatar}>
        <ThemedText style={styles.groupAvatarText}>{group.name.charAt(0).toUpperCase()}</ThemedText>
      </View>
      <View style={styles.groupDetails}>
        <View style={styles.groupTitleRow}>
          <ThemedText numberOfLines={2} style={styles.groupName}>
            {group.name}
          </ThemedText>
          <View style={[styles.roleBadge, group.role === 'admin' && styles.adminRoleBadge]}>
            <ThemedText style={[styles.roleBadgeText, group.role === 'admin' && styles.adminRoleBadgeText]}>
              {roleLabel}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.groupMeta}>{membersLabel}</ThemedText>
      </View>
      <ThemedText accessibilityElementsHidden importantForAccessibility="no" style={styles.groupChevron}>
        ›
      </ThemedText>
    </Pressable>
  );
}

function GroupDetailScreen({
  accessToken,
  groupSummary,
  onBack,
}: {
  accessToken: string;
  groupSummary: MeGroupResponse;
  onBack: () => void;
}) {
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [isLoadingGroup, setLoadingGroup] = useState(true);
  const [groupErrorMessage, setGroupErrorMessage] = useState('');
  const activeGroup = group ?? groupSummary;
  const members = group?.members ?? [];
  const membersCount = group?.membersCount ?? groupSummary.membersCount;
  const membersLabel = `${membersCount} ${membersCount > 1 ? 'membres' : 'membre'}`;

  useEffect(() => {
    let isMounted = true;

    async function loadGroup() {
      setLoadingGroup(true);
      setGroupErrorMessage('');

      try {
        const loadedGroup = await getGroup(accessToken, groupSummary.id);

        if (isMounted) {
          setGroup(loadedGroup);
        }
      } catch (error) {
        if (isMounted) {
          setGroupErrorMessage(
            error instanceof GroupsAuthenticationError
              ? 'Votre session a expiré. Connectez-vous à nouveau.'
              : 'Impossible de charger ce groupe pour le moment.',
          );
        }
      } finally {
        if (isMounted) {
          setLoadingGroup(false);
        }
      }
    }

    loadGroup();

    return () => {
      isMounted = false;
    };
  }, [accessToken, groupSummary.id]);

  return (
    <SafeAreaView style={styles.connectedContainer}>
      <ScrollView contentContainerStyle={styles.groupDetailContent} showsVerticalScrollIndicator={false}>
        <View style={styles.groupDetailPanel}>
          <View style={styles.groupDetailHeader}>
            <Pressable
              accessibilityLabel="Retour à la liste des groupes"
              accessibilityRole="button"
              onPress={onBack}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <ThemedText style={styles.iconButtonText}>‹</ThemedText>
            </Pressable>
            <View style={styles.groupTitleBlock}>
              <ThemedText accessibilityRole="header" numberOfLines={2} style={styles.groupDetailTitle}>
                {activeGroup.name}
              </ThemedText>
              {group?.frequency ? (
                <ThemedText numberOfLines={2} style={styles.groupFrequency}>
                  {group.frequency}
                </ThemedText>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel={`Paramètres du groupe ${activeGroup.name}`}
              accessibilityRole="button"
              onPress={() => undefined}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <ThemedText style={styles.settingsIcon}>⚙</ThemedText>
            </Pressable>
          </View>

          <View style={styles.groupSummaryCard}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.memberStack}>
              {getSummaryMembers(activeGroup, members).map((member, index) => (
                <View
                  key={member.id}
                  style={[
                    styles.summaryAvatar,
                    { backgroundColor: getMemberColor(index), marginLeft: index === 0 ? 0 : -10 },
                  ]}>
                  <ThemedText style={styles.summaryAvatarText}>{getMemberInitial(member.firstName)}</ThemedText>
                </View>
              ))}
            </View>
            <View style={styles.summaryTextBlock}>
              <ThemedText style={styles.summaryCount}>{membersLabel}</ThemedText>
              <ThemedText style={styles.summarySubtitle}>{group?.frequency ?? 'Chargement de la fréquence'}</ThemedText>
            </View>
          </View>

          <View style={styles.membersSectionHeader}>
            <ThemedText style={styles.membersSectionTitle}>Membres & rôles</ThemedText>
            <ThemedText style={styles.membersSectionCount}>{membersLabel}</ThemedText>
          </View>

          {isLoadingGroup ? (
            <View accessibilityLiveRegion="polite" style={styles.groupsStateBox}>
              <ActivityIndicator color="#A83E60" />
              <ThemedText style={styles.groupsStateText}>Chargement du groupe...</ThemedText>
            </View>
          ) : null}

          {!isLoadingGroup && groupErrorMessage ? (
            <View accessibilityLiveRegion="polite" style={styles.groupsStateBox}>
              <ThemedText style={styles.errorText}>{groupErrorMessage}</ThemedText>
            </View>
          ) : null}

          {!isLoadingGroup && !groupErrorMessage && members.length > 0 ? (
            <View style={styles.memberList}>
              {members.map((member, index) => (
                <MemberRow key={member.id} member={member} index={index} />
              ))}
            </View>
          ) : null}

          {!isLoadingGroup && !groupErrorMessage && members.length === 0 ? (
            <View accessibilityLiveRegion="polite" style={styles.groupsStateBox}>
              <ThemedText style={styles.groupsStateText}>
                Aucun membre à afficher pour le moment.
              </ThemedText>
            </View>
          ) : null}

          <Pressable
            accessibilityLabel={`Inviter des membres dans ${activeGroup.name}`}
            accessibilityRole="button"
            onPress={() => undefined}
            style={({ pressed }) => [styles.primaryButton, styles.inviteButton, pressed && styles.pressed]}>
            <ThemedText style={styles.inviteIcon}>⊕</ThemedText>
            <ThemedText style={styles.primaryButtonText}>Inviter</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MemberRow({
  member,
  index,
}: {
  member: GroupResponse['members'][number];
  index: number;
}) {
  const roleLabel = member.role === 'admin' ? 'Admin' : 'Membre';

  return (
    <View accessibilityLabel={`${getMemberDisplayName(member)}, ${roleLabel}`} style={styles.memberRow}>
      <View style={[styles.memberAvatar, { backgroundColor: getMemberColor(index) }]}>
        <ThemedText style={styles.memberAvatarText}>{getMemberInitial(member.firstName)}</ThemedText>
      </View>
      <View style={styles.memberDetails}>
        <View style={styles.memberNameRow}>
          <ThemedText numberOfLines={1} style={styles.memberName}>
            {getMemberDisplayName(member)}
          </ThemedText>
          <View style={[styles.roleBadge, member.role === 'admin' && styles.adminRoleBadge]}>
            <ThemedText style={[styles.roleBadgeText, member.role === 'admin' && styles.adminRoleBadgeText]}>
              {roleLabel}
            </ThemedText>
          </View>
        </View>
      </View>
      <ThemedText accessibilityElementsHidden importantForAccessibility="no" style={styles.memberChevron}>
        ›
      </ThemedText>
    </View>
  );
}

function getSummaryMembers(group: MeGroupResponse | GroupResponse, members: GroupResponse['members']) {
  if (members.length > 0) {
    return members.slice(0, 4);
  }

  return Array.from({ length: Math.min(group.membersCount, 4) }, (_, index) => ({
    id: `${group.id}-placeholder-${index}`,
    firstName: group.name.charAt(index),
    role: 'member' as const,
  }));
}

function getMemberInitial(firstName: string) {
  return firstName.trim().charAt(0).toUpperCase();
}

function getMemberDisplayName(member: GroupResponse['members'][number]) {
  const lastInitial = member.lastName.trim().charAt(0).toUpperCase();

  return lastInitial ? `${member.firstName} ${lastInitial}.` : member.firstName;
}

function getMemberColor(index: number) {
  return ['#6D825E', '#5D7C8A', '#955E7F', '#8B5773'][index % 4];
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
  signupCard: {
    width: '100%',
    maxWidth: 390,
  },
  stepBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    marginBottom: 17,
    paddingHorizontal: 5,
  },
  stepBadge: {
    minWidth: 26,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#FFF3F6',
  },
  stepBadgeText: {
    color: '#70263F',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  stepTitle: {
    color: '#352A2F',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  phoneSheet: {
    width: '100%',
    minHeight: 638,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: '#D8CED2',
    backgroundColor: '#FFFCFC',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
    shadowColor: '#2E2026',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
  phoneHandle: {
    alignSelf: 'center',
    width: 94,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#C9BCC1',
    marginBottom: 28,
  },
  signupHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#352A2F',
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 31,
  },
  signupHeaderTitle: {
    color: '#2E2529',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  signupTitle: {
    color: '#2E2529',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 29,
    marginTop: 18,
  },
  signupSubtitle: {
    color: '#6E6268',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 4,
  },
  signupForm: {
    marginTop: 21,
    gap: 13,
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
  infoBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    borderRadius: 12,
    backgroundColor: '#EEF7F8',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#244455',
  },
  infoIconText: {
    color: '#244455',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 16,
  },
  infoText: {
    flex: 1,
    color: '#244455',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  infoStrong: {
    color: '#244455',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  primaryButton: {
    minHeight: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#A83E60',
    marginTop: 2,
  },
  signupPrimaryButton: {
    marginTop: 6,
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
    backgroundColor: '#F4EFEF',
  },
  connectedContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  connectedPanel: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 24,
    backgroundColor: '#FFFCFC',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  connectedTitle: {
    color: '#2E2529',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginTop: 28,
    textAlign: 'center',
  },
  connectedSubtitle: {
    color: '#6E6268',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  groupsStateBox: {
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: '#F6F1F2',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  groupsStateText: {
    color: '#574B51',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  groupList: {
    gap: 12,
    marginTop: 24,
  },
  groupCard: {
    minHeight: 92,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2D6DA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#2E2026',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#EAE1E4',
  },
  groupAvatarText: {
    color: '#574B51',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  groupDetails: {
    flex: 1,
    gap: 8,
  },
  groupTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  groupName: {
    flex: 1,
    color: '#2E2529',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  roleBadge: {
    borderRadius: 999,
    backgroundColor: '#E8E1E4',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adminRoleBadge: {
    backgroundColor: '#FFF3F6',
  },
  roleBadgeText: {
    color: '#4D4448',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  adminRoleBadgeText: {
    color: '#70263F',
  },
  groupMeta: {
    color: '#6E6268',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  groupChevron: {
    color: '#766B70',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
  connectedPrimaryButton: {
    marginTop: 28,
  },
  groupDetailContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  groupDetailPanel: {
    width: '100%',
    maxWidth: 390,
    minHeight: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFCFC',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  groupDetailHeader: {
    minHeight: 56,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconButtonText: {
    color: '#4D4448',
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 38,
  },
  settingsIcon: {
    color: '#4D4448',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  groupTitleBlock: {
    flex: 1,
    gap: 2,
  },
  groupDetailTitle: {
    color: '#2E2529',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  groupFrequency: {
    color: '#6E6268',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  groupSummaryCard: {
    minHeight: 80,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2D6DA',
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#2E2026',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  memberStack: {
    minWidth: 126,
    flexDirection: 'row',
  },
  summaryAvatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  summaryAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  summaryTextBlock: {
    flex: 1,
    gap: 3,
  },
  summaryCount: {
    color: '#2E2529',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  summarySubtitle: {
    color: '#6E6268',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  membersSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 28,
  },
  membersSectionTitle: {
    color: '#4D4448',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  membersSectionCount: {
    color: '#766B70',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  memberList: {
    marginTop: 8,
  },
  memberRow: {
    minHeight: 72,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6DDE0',
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberName: {
    color: '#2E2529',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  memberChevron: {
    color: '#766B70',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
  inviteButton: {
    minHeight: 52,
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  inviteIcon: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 24,
  },
});
