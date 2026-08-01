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

## Documentation API

Le contrat Swagger/OpenAPI est disponible dans
`public/swagger/openapi.json`. L'application l'importe via
`src/api/openapi.ts` pour connaitre les endpoints disponibles.

En mode web, la page Swagger UI est servie depuis `/swagger/index.html`.
