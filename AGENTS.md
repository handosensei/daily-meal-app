# Instructions Frontend

Tout developpement frontend doit respecter les bonnes pratiques de securite, de maintenabilite, d'accessibilite et les normes UI du projet.

Toute fonctionnalite ou correction demandee doit contenir :

- des tests unitaires ;
- des tests fonctionnels, comme Cypress.

## Design system

Le fichier `DESIGN.md` est la source de verite du design system DailyMeal pour le frontend.

Toute nouvelle fonctionnalite frontend, correction d'anomalie frontend ou modification d'interface existante doit respecter `DESIGN.md` :

- utiliser les intentions produit, principes UI, tokens, couleurs, typographies, espacements, rayons, ombres, mouvements, iconographie et composants definis ;
- conserver une interface calme, majoritairement neutre, avec Damson reserve aux actions principales, selections et reperes de navigation ;
- ne jamais coder un etat uniquement par la couleur ;
- respecter les exigences d'accessibilite, de responsive design, de mode sombre, de cibles tactiles et de reduction de mouvement ;
- verifier les etats chargement, succes, erreur, vide, desactive et offline des composants concernes.

Si une demande produit contredit `DESIGN.md`, arreter l'implementation et demander un arbitrage avant de modifier l'interface.

## Contrats d'interface API

Avant de developper une fonctionnalite frontend qui consomme une API, consulter obligatoirement le contrat d'interface correspondant.

Le snapshot OpenAPI versionne et directement accessible a Codex se trouve dans `doc/api/openapi.json`. Il provient du contrat officiel du backend expose par `GET /api-json` et `GET /swagger.json`.

Avant toute implementation frontend liee a une API :

- executer `npm run sync:api-contract` avec le backend local demarre ;
- ou definir `DAILYMEAL_API_CONTRACT_URL` vers une URL `/api-json` accessible ;
- verifier et versionner les changements de `doc/api/openapi.json` dans la merge request frontend ;
- generer les types avec `npm run generate:api-types` uniquement depuis ce snapshot.

Si le snapshot est absent, ancien ou contradictoire avec le backend, arreter l'implementation et synchroniser le contrat avant de continuer.

Le frontend doit etre implemente strictement a partir du contrat d'interface documente. Il ne doit pas supposer de champs, de formats, de codes HTTP ou de comportements non documentes.

Le contrat doit etre considere comme la source de verite pour :

- les routes API appelees ;
- les methodes HTTP ;
- les parametres de route ;
- les parametres de query ;
- les payloads envoyes ;
- les schemas de reponse ;
- les codes d'erreur ;
- les regles de validation ;
- les etats fonctionnels attendus.

Si le contrat est absent, incomplet ou contradictoire avec le besoin frontend, arreter le developpement et poser les questions necessaires avant d'implementer.

## Implementation frontend

Toute nouvelle fonctionnalite frontend doit etre responsive et fonctionner correctement sur mobile, tablette et desktop.

Chaque fonctionnalite doit gerer les etats attendus :

- chargement ;
- succes ;
- erreur ;
- etat vide ;
- validation utilisateur ;
- absence ou indisponibilite des donnees.

Le code frontend doit respecter les conventions existantes du projet pour :

- les composants ;
- la gestion d'etat ;
- les appels API ;
- les routes ;
- le style ;
- les tests ;
- les messages utilisateur.

## Tests frontend

Toute nouvelle fonctionnalite frontend doit avoir des tests unitaires couvrant 100% des nouvelles lignes de code.

Toute nouvelle fonctionnalite frontend doit egalement avoir des tests Cypress couvrant les principaux parcours utilisateur.

Les tests doivent verifier que le frontend consomme uniquement les champs et comportements documentes dans le contrat d'interface.

## Securite et robustesse

Le frontend ne doit jamais exposer de secrets, tokens techniques ou donnees sensibles non destinees a l'utilisateur.

Les erreurs API doivent etre gerees proprement et affichees avec des messages adaptes, sans fuite d'information sensible.

## Livraison

Apres le developpement d'une nouvelle fonctionnalite ou la correction d'une anomalie frontend :

- executer les tests pertinents ;
- verifier que les jobs CI sont compatibles avec les changements ;
- pousser le code ;
- creer une merge request sur GitHub.
