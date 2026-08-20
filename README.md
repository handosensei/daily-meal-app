# Daily Meal App

Application mobile cross platform iOS et Android initialisee avec React Native, Expo et TypeScript.

## Prerequis

- Node.js LTS
- npm
- Xcode pour lancer l'application sur iOS
- Android Studio pour lancer l'application sur Android

## Installation

```bash
npm install
```

## Lancer l'application

```bash
npm run start
```

Commandes utiles :

```bash
npm run ios
npm run android
npm run web
npm run lint
npm run test
```

## Qualite et CI

La CI GitHub Actions s'execute sur chaque pull request et sur `main`.
Elle installe les dependances avec `npm ci`, puis valide :

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build:web
npm run test:functional
```

`npm run test:functional` verifie les routes publiques de l'export web Expo,
dans un esprit Cypress-like sans dependance supplementaire.
