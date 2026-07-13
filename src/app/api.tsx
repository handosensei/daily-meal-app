import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  apiContract,
  apiContractVersion,
  apiEndpointCount,
  apiServers,
} from '@/api/openapi';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function ApiScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">{apiContract.info.title}</ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Version {apiContractVersion}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedText type="subtitle">Endpoints disponibles</ThemedText>
          <ThemedText type="title">{apiEndpointCount}</ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Le contrat OpenAPI est pret a documenter les endpoints backend des
            qu&apos;ils seront ajoutes.
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedText type="subtitle">Serveurs declares</ThemedText>
          {apiServers.map((server) => (
            <ThemedView key={server.url} style={styles.serverRow}>
              <ThemedText type="code">{server.url}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {server.description}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  panel: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  serverRow: {
    gap: Spacing.one,
  },
});
