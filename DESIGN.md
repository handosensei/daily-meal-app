# DailyMeal - Design System

Ce fichier est la reference design du projet `daily-meal-app`. Il synthétise le dossier partagé `/Users/hando/workspaces/dailymeal/design-system/` et doit guider toute nouvelle fonctionnalité ou modification d'interface.

## Intention produit

DailyMeal aide un foyer - familles, couples, colocations ou groupes de passage - à planifier ses repas ensemble et à produire une liste de courses partagée.

Sentiment cible : **"Vivre ensemble devient plus simple et plus agréable."**

DailyMeal n'est pas une app de recettes ni un dashboard de productivité. La cuisine est le contexte ; le sujet est le quotidien partagé, l'organisation calme et la collaboration discrète.

Personnalité : chaleureux, calme, accueillant, simple, rassurant, naturel, vivant.

A éviter : esthétique startup futuriste, look IA, dashboard SaaS, app bancaire, outil de productivité froid, minimalisme stérile, décoration superflue, mascotte alimentaire.

## Principes UI

1. **Le neutre porte l'interface ; la couleur guide.** Environ 80-90% de l'écran doit rester en neutres chauds. La couleur signature Damson sert aux actions principales, à la sélection et au repérage.
2. **Une seule couleur signature.** Damson (`#A23E5C`) est la couleur de marque. Ne pas multiplier les accents pour "faire vivant".
3. **La hiérarchie vient du type, du rythme et de l'espace.** Ne pas utiliser des aplats colorés pour hiérarchiser. Utiliser poids typographique, espacement et composition.
4. **Chaleureux sans rustique.** Arrondis doux, surfaces calmes, ombres discrètes. Pas de dégradés décoratifs, effets tape-à-l'oeil ou ombres dures.
5. **"Nous", discrètement.** Montrer la collaboration avec des avatars, initiales, "ajouté par" ou présence légère, sans bannières intrusives.
6. **Accessible par conception.** WCAG 2.2 AA minimum, double codage systématique, cibles tactiles généreuses, focus visible et mode sombre compatible.
7. **Encore agréable après 500 usages.** Si un élément est joli mais fatigant, le retirer. En cas de conflit entre expressivité et calme, le calme gagne.

## Couleurs

### Palette primitive

- Signature Damson : `#A23E5C` (`damson.500`) pour l'identité, l'action principale, les états actifs et la navigation sélectionnée.
- Neutres Umber : neutres chauds légèrement mauves pour surfaces, textes et bordures. Ils dominent l'interface.
- Supports sourds :
  - Sage : succès / terminé.
  - Ochre : avertissement doux.
  - Brick : erreur uniquement.
  - Slate : information.
- Palette membres : couleurs stables pour avatars et catégories de personnes, jamais utilisées comme couleur de marque.

### Thème clair

- `surface.canvas` : `#FAF7F7`
- `surface.raised` : `#FFFFFF`
- `surface.sunken` : `umber.100`
- `surface.selected` : `damson.50`
- `text.primary` : `umber.900`
- `text.secondary` : `umber.700`
- `text.muted` : `umber.500` (ne pas alléger)
- `action.primary` : `damson.500`
- `action.primary-hover` : `damson.600`
- `action.primary-pressed` : `damson.700`
- `text.on-brand` : `umber.0`

### Thème sombre

- `surface.canvas` : `umber.1000` (`#1A1517`)
- `surface.raised` : `umber.900`
- `surface.sunken` : `#141012`
- `surface.selected` : `#2C1B24`
- `text.primary` : `umber.100`
- `text.secondary` : `umber.300`
- `text.muted` : `umber.400`
- `action.primary` : `damson.300`
- `text.on-brand` : `umber.1000`

### Règles couleur

- Une seule action primaire Damson par écran.
- Les supports `success`, `warning`, `error` et `info` sont réservés aux états fonctionnels.
- Ne jamais coder une information par la seule couleur : ajouter icône, forme, libellé, texte barré ou état ARIA.
- Les icônes héritent de `currentColor` ; la signature n'apparaît que pour une action ou une sélection.

## Typographie

Deux familles seulement :

- Titres / display : **Bricolage Grotesque**, fallback `Georgia, serif`.
- Texte / UI : **Hanken Grotesk**, fallback `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`.

Echelle :

- `display` : 32 / 38, semibold.
- `h1` : 26 / 32, semibold.
- `h2` : 22 / 28, semibold.
- `h3` : 18 / 24, semibold.
- `body-lg` : 18 / 28, regular.
- `body` : 16 / 24, regular.
- `body-sm` : 14 / 20, regular.
- `label` : 14 / 18, semibold.
- `caption` : 13 / 18, medium.

Utiliser les tailles système / Dynamic Type quand la plateforme le permet. Ne pas figer les hauteurs de texte. Tester les layouts à 130%.

## Espacement, rayons, ombres

Base d'espacement 4pt :

- `space.1` 4px
- `space.2` 8px
- `space.3` 12px
- `space.4` 16px
- `space.5` 20px
- `space.6` 24px
- `space.8` 32px
- `space.10` 40px
- `space.12` 48px
- `space.16` 64px

Rayons :

- `radius.xs` 6px
- `radius.sm` 10px
- `radius.md` 12px
- `radius.lg` 16px
- `radius.xl` 24px
- `radius.pill` 999px, réservé aux chips, avatars et contrôles adaptés.

Cibles tactiles :

- Minimum : 48px.
- Confort : 56px.
- Les icônes de 20-24px gardent une zone de tap de 44-48px.

Ombres :

- Utiliser les rôles `elevation.card`, `elevation.sheet`, `elevation.nav`, `elevation.modal`.
- L'élévation doit rester discrète ; une différence de surface suffit souvent.

## Mouvement

La satisfaction vient de la fluidité, pas de l'effet.

- `motion.duration.xfast` : 100ms pour pression et micro-retour.
- `motion.duration.fast` : 160ms pour hover, press, coche.
- `motion.duration.base` : 220ms pour entrée de carte, chip, header au scroll.
- `motion.duration.slow` : 320ms pour feuille, modale, barre de progression.
- `easing.standard` : `(0.2, 0, 0, 1)`.
- `easing.settle` : `(0.32, 0.72, 0, 1)`, sans dépassement.
- `easing.exit` : `(0.4, 0, 1, 1)`.

Règles :

- Entrées courtes : translation 4-8px maximum + fondu.
- Une seule propriété majeure bouge à la fois.
- Pas de rebond, confetti, shimmer clignotant ou transition flashy.
- Sous `prefers-reduced-motion: reduce`, supprimer translations et animations en boucle ; conserver seulement des fondus courts.

## Iconographie

- Style ligne arrondie, joints et extrémités arrondis.
- Grille 24px, trait 1.75px par défaut.
- Remplissage réservé aux états actifs afin de doubler le codage forme + couleur.
- Tailles : 16px inline, 20px champs/chips, 24px défaut, 28px navigation/actions principales.
- Set recommandé : Lucide ou Phosphor regular, sans mélange de familles.

Icônes de base :

- Navigation : calendrier semaine, panier, livre ouvert, foyer.
- Actions : plus, recherche, coche, édition, suppression, rafraîchir, chevron.
- Domaine : assiette, casserole, horloge, utilisateurs, tag, alerte, information.

A éviter : icônes multicolores, emoji comme icône système, 3D, ombres, dégradés, styles hétérogènes.

## Composants attendus

Chaque composant interactif doit couvrir : défaut, actif/pressé, focus, désactivé, chargement, vide et erreur.

### `MealCard`

- Surface `surface.raised`, `radius.lg`, `elevation.card`, padding `space.4`.
- Vignette optionnelle petite 1:1, jamais photo décorative dominante.
- Titre en `typography.h3`, métadonnées en `caption` / `text.secondary`.
- Etat pressé : `surface.hover`, scale 0.99, transition rapide.
- Image absente ou cassée : fallback discret sur `surface.sunken`.

### `WeekPlanner`

- Lecture calendrier familial : 7 jours x moments.
- Jour courant : point Damson + gras.
- Créneau vide : `surface.sunken` + `+` discret.
- Drag/focus : contour `border.focus`, surface sélectionnée, mouvement sans rebond.
- Etat vide : illustration quotidienne + texte collectif + un CTA.

### `ShoppingItem`

- Ligne haute, cochable une main, hauteur au moins `touch.comfortable`.
- Case avec zone de tap 48px.
- Coché : coche + couleur success + texte barré.
- Erreur : liseré ou icône + action de retry, jamais rouge seul.

### `AisleList`

- Groupement par rayon avec header collant, icône, compteur `x/y`.
- Progression discrète : piste `surface.sunken`, remplissage success.
- Hors ligne : feedback info calme et non bloquant.

### `ServingStepper`

- Contrôle `- N +`, boutons 44-48px minimum.
- Presets discrets.
- Désactiver les bornes min/max avec état visuel et sémantique.

### Avatars et présence

- Avatars ronds, photo ou initiales, couleur membre stable.
- Tailles : xs 20, sm 28, md 40.
- Présence : point + anneau, pas couleur seule.
- Collaboration visible sans notification intrusive.

### Boutons et FAB

- `primary` : `action.primary`, `text.on-brand`, `radius.md`, min-height 48px. Une seule action primaire par écran.
- `secondary` : `action.subtle`, `action.secondary-text`, bordure subtile.
- `tertiary` : texte seul.
- `destructive` : `feedback.error.solid`, réservé aux suppressions.
- `FAB` : rond 56px, icône plus, `action.primary`, au-dessus de la tab bar.
- Chargement : conserver largeur/hauteur pour éviter les sauts de layout.

### Navigation

- Bottom tab bar : Semaine, Courses, Recettes, Foyer.
- Onglet actif : icône remplie + Damson + libellé.
- Onglet inactif : `text.muted`.
- `AppHeader` : titre `h2`, sous-titre `caption`, surface élevée au scroll si nécessaire.

### Saisie et recherche

- Hauteur minimum 48px, `radius.md`, `surface.sunken`, bord `border.strong`.
- Focus : `border.focus` 2px + anneau.
- Erreur : bord error + icône + message.
- Recherche vide : proposer une action claire, par exemple "Pas trouvé - l'ajouter quand même ?".

### Feedback

- Toast / Snackbar : `surface.inverse`, `text.on-inverse`, `radius.md`, entrée basse courte.
- Confirmer sans alarmer ; ton non culpabilisant.
- Dialog de suppression : action destructive clairement identifiée.
- Chips : `radius.pill`, libellé obligatoire, coche ou icône pour l'état actif.

## Etats vides et illustrations

Les illustrations servent seulement les états vides, onboarding ou confirmations calmes.

Sujets recommandés : table dressée ensemble, mains qui passent un plat, plan de travail du matin, panier près de la porte, calendrier partagé, chaises autour d'une table.

Style : trait souple, aplats sourds, neutres Umber dominants, Damson par petites touches, peu de détails, beaucoup d'air.

A éviter : légumes souriants, ustensiles cartoon, personnages corporate génériques, photos stock, visuels de recettes appétissantes, esthétique "IA".

Intégration :

- Illustration contenue, 160px max de haut sur mobile.
- Phrase au pluriel collectif.
- Un seul CTA.
- Illustration décorative masquée aux lecteurs d'écran.

## Accessibilité

- Respecter WCAG 2.2 AA minimum.
- Viser AAA pour le texte de corps.
- Focus visible avec `border.focus` + offset.
- Ordre de focus logique.
- Rôles et états sémantiques natifs : bouton, case, onglet, titre de section, `aria-checked`, `aria-disabled`, live region polie pour toasts/progression.
- Icônes décoratives masquées ; icônes porteuses de sens étiquetées.
- Toute action au swipe doit avoir un équivalent au tap.
- Les erreurs API doivent être compréhensibles et ne jamais exposer de données sensibles.

## Règles de composition

- Fond dominant `surface.canvas`.
- Surfaces de contenu en `surface.raised` ou `surface.sunken`.
- Une action principale Damson par écran.
- Les informations secondaires restent neutres.
- Les états fonctionnels utilisent `feedback.*` avec icône/forme/libellé.
- Le texte et l'espace portent la hiérarchie.
- Les boutons, champs et lignes interactives respectent les cibles tactiles.
- Les états chargement, succès, erreur, vide, désactivé et offline doivent être prévus dès la conception.

## Checklist avant livraison frontend

- L'écran reste majoritairement neutre et calme.
- Il n'y a qu'une action primaire Damson par écran.
- Aucun état n'est codé uniquement par la couleur.
- Les cibles tactiles font au moins 48px.
- Le focus est visible et l'ordre de navigation est logique.
- Les textes restent lisibles à 130% et sur mobile.
- Les états chargement, vide, erreur, désactivé et offline sont gérés.
- Le mode sombre reste cohérent et contrasté.
- Les animations respectent `prefers-reduced-motion`.
- L'UI répond à la question : "sera-t-elle encore agréable après 500 usages ?"
