# PRD — Ultimate Playbook

## 1. Vision

Un outil web permettant à un coach ou un joueur de **dessiner, éditer et rejouer des actions tactiques d'Ultimate Frisbee**, de façon aussi simple à utiliser qu'un tableau blanc, mais réutilisable, partageable et animable.

Usage principal visé : **Ultimate indoor 5v5**. L'outil doit néanmoins rester générique pour ne pas être bloqué sur ce seul format (autres effectifs, plays sans défense, plays à 3 joueurs pour un drill, etc.).

## 2. Utilisateurs cibles

- Coachs qui préparent des séances ou des stratégies de match.
- Joueurs qui consultent le playbook de leur équipe (en salle, sur le bord du terrain, ou à la maison).

Contraintes d'usage :

- Doit être utilisable sur **PC, tablette et smartphone** (édition ET consultation).
- Utilisation possible en salle/bord de terrain avec une connectivité réseau incertaine → ne pas dépendre d'un backend pour consulter/éditer une action en MVP.

## 3. Concepts clés

- **Terrain** : représentation du terrain de jeu, avec un type configurable (voir §4.1).
- **Entité** : un joueur (équipe offense ou défense) ou le disque, représenté par un cercle coloré (plus petit pour le disque).
- **Frame (image-clé)** : un instantané des positions de toutes les entités à un moment donné de l'action.
- **Branche** : à partir d'une frame, une continuation alternative parmi plusieurs options possibles (ex. "sortie de ligne" avec un choix entre around et strike) — voir §4.3.
- **Action** : un **arbre** de frames (une simple séquence dans le cas courant, sans branche), avec un nom et des métadonnées, représentant un enchaînement tactique complet (ex. "Iso break side depuis stack vertical").

## 4. Scope du MVP

### 4.1 Configuration du terrain

Presets sélectionnables :

- **Demi-terrain** (par défaut) — la majorité des actions se jouent dans une moitié de terrain avec en-but.
- **Terrain complet** — avec les deux en-buts.
- **Terrain indéfini** — un espace rectangulaire sans en-but (utile pour drills / exercices ne représentant pas une situation de match).

Les dimensions doivent avoir des valeurs par défaut adaptées à l'**indoor** mais rester des paramètres modifiables (pas de valeurs codées en dur non configurables).

Couleurs par défaut : terrain en **gris** (neutre, façon sol de gymnase, ne concurrence pas visuellement les joueurs), en-but en **bleu**. Valeurs exactes et rationale dans `docs/DATA_MODEL.md` (section couleurs). Pas d'UI de personnalisation au MVP, mais le modèle de données est conçu pour rendre ça configurable sans migration future.

**Marge sideline** (optionnelle, désactivée par défaut) : pour les plays où le disque ou un joueur doit visiblement sortir du terrain (ex. un around qui contourne la marque par l'extérieur), possibilité de réserver une marge hors-ligne dans la vue plutôt que de rester cadré pile sur le terrain. Voir `docs/DATA_MODEL.md` (section "Marge sideline") pour le détail.

### 4.2 Configuration de l'effectif

- Preset par défaut : **5v5** (5 attaquants / 5 défenseurs).
- Presets rapides de positionnement initial pour le 5v5, accessibles en un clic :
  - **Stack vertical** — 2 handlers + 3 attaquants alignés, disque chez un handler.
  - **Stack horizontal** — variante avec alignement horizontal.
  - (La défense en face peut être positionnée automatiquement en miroir simple, ou laissée absente — voir point suivant.)
- Effectif librement modifiable : ajouter/retirer un joueur de n'importe quelle équipe individuellement, y compris pour composer des situations hors 5v5 (ex. 3 joueurs seuls pour un drill, 0 défenseur pour un travail offensif pur).
- Pas de limite basse (0 joueur par équipe possible) ; limite haute raisonnable pour rester jouable à l'écran (voir `docs/DATA_MODEL.md`).

### 4.3 Éditeur d'action (frames)

- Une action est un **arbre de frames** : une simple séquence dans le cas courant, mais une frame peut avoir plusieurs continuations (**branches**) quand le play comporte un choix (ex. sortie de ligne : around ou strike) — ce n'est pas un cas marginal, un des tout premiers plays visés en a besoin.
- Créer une nouvelle frame **duplique la frame courante** (positions de départ = positions de la frame précédente), pour ne repositionner que ce qui change. C'est l'action par défaut : elle crée une continuation simple (un seul enfant), le cas de figure le plus courant reste donc aussi simple qu'avant.
- Créer une **branche** à partir de n'importe quelle frame ("ajouter une option depuis cette frame") : action distincte de la précédente, elle demande un nom court par branche (ex. "Autour", "Strike"). Si la frame n'avait jusque-là qu'une seule continuation, celle-ci doit être nommée rétroactivement au moment où le fork est créé.
- Réordonner, dupliquer, supprimer une frame via une bande de vignettes (timeline), qui se scinde visuellement en pistes parallèles à partir d'un embranchement.
- Déplacer une entité par glisser-déposer (souris ET tactile).
- Assigner le disque à un joueur (le disque suit alors sa position) ou le positionner librement (ex. disque en vol entre deux frames).
- Annoter une frame avec une note texte libre (ex. "coupe et swing").
- Undo/redo sur les actions d'édition.

### 4.4 Mode lecture (Play)

- **Pas à pas** : navigation manuelle frame par frame (précédent/suivant). Arrivé sur une frame à plusieurs branches, "suivant" devient un choix entre les options disponibles.
- **Fluide** : animation continue interpolant les positions entre chaque paire de frames consécutives, avec vitesse réglable. S'il y a des branches, le chemin complet à jouer se choisit **avant** de lancer la lecture (jamais d'interruption en cours d'animation pour demander un choix).
- Affichage des flèches de déplacement entre deux frames consécutives (trajectoire de chaque joueur, distinction visuelle passe de disque / course de joueur).

### 4.5 Trajectoire courbe du disque

- Sur une transition donnée (entre une frame et la suivante), possibilité de définir explicitement une trajectoire **courbe** du disque plutôt que la ligne droite par défaut — cas d'usage : blade, hammer, huck avec un arc prononcé.
- Édition via un unique point de contrôle draggable (courbe de Bézier quadratique), affiché sur le segment concerné, avec la même interaction que le déplacement d'une entité. Un bouton permet de revenir à une trajectoire rectiligne.
- L'affordance d'édition n'apparaît que sur les transitions où la position du disque change réellement.
- Cette fonctionnalité fait partie du périmètre MVP mais n'est pas bloquante pour livrer une première version : elle peut être implémentée après le reste de l'éditeur/lecteur en mode "ligne droite" (voir `docs/ROADMAP.md`, Phase 6). Voir `docs/DATA_MODEL.md` §8 pour le détail du modèle.

### 4.6 Persistance

- Sauvegarde locale des actions créées (localStorage/IndexedDB), sans compte utilisateur.
- Export d'une action en fichier JSON (partage manuel) et import d'un fichier JSON.

### 4.7 Responsive & i18n

- Interface utilisable sur PC, tablette, smartphone (adaptation de la mise en page et des zones tactiles).
- Structure d'internationalisation en place dès le MVP ; contenu complet en **français**, l'anglais n'est pas nécessairement traduit au MVP (le français reste la langue de repli).

### 4.8 Disposition de l'écran d'édition

Issu des retours utilisateur post-Phase 7/8 (deux itérations d'implémentation rejetées avant celle-ci — voir le journal de décisions, `docs/ARCHITECTURE.md` §8, pour le détail de ce qui n'a pas fonctionné). Principe : le terrain est **l'action principale** (on y passe l'essentiel du temps à positionner des joueurs), tout le reste est secondaire et ne doit lui disputer de l'espace qu'à la demande.

- **Le terrain occupe tout l'espace disponible en continu.** Aucun panneau permanent ne partage l'écran avec lui ni ne le recouvre durablement — la seule exception tolérée est transitoire (voir le menu secondaire ci-dessous), jamais un état permanent.
- **Barre "Frames" : toujours visible, en espace dédié (pas en recouvrement du terrain).** Elle affiche en permanence où on se trouve dans l'action (chemin depuis la racine, options à un embranchement) et permet de naviguer (taper une frame pour y aller) et d'enchaîner rapidement la frame suivante — c'est l'action répétée en boucle en construisant un play, donc elle reste directement accessible. Les actions de frame moins fréquentes (créer une branche, renommer une branche, réordonner, supprimer, ajouter une note) sont accessibles depuis le menu secondaire plutôt que d'alourdir cette barre.
- **Bascule Éditer/Jouer : toujours visible, sous une forme compacte.** Ce n'est pas un réglage occasionnel mais un aller-retour permanent entre construire et relire un play ; elle reste donc accessible sans ouvrir le menu secondaire.
- **Un unique bouton de menu secondaire, flottant, en haut à droite du terrain.** Il donne accès (dans un panneau qui s'ouvre à la demande et se referme ensuite) à tout ce qui n'a pas besoin d'être vu en permanence : nom de l'action (affichage/édition), export JSON, nouvelle action, ajout de joueur (attaque/défense), undo/redo, bascule "frame fantôme", et les actions de frame secondaires listées ci-dessus. Fermé, ce bouton ne coûte qu'un coin d'écran ; ouvert, il peut recouvrir temporairement une partie du terrain sans que ce soit gênant, puisqu'on n'est pas en train de déplacer un joueur pendant qu'on renomme l'action.
- **Sélectionner un joueur (tap, sans le glisser) ne fait apparaître aucun panneau flottant.** Le joueur sélectionné est simplement mis en évidence visuellement ; sa suppression passe par le glisser-déposer vers la corbeille (déjà existante) ou par le menu secondaire.

### 4.8bis Orientation du terrain

Réglage manuel (pas basé sur l'orientation physique de l'appareil), disponible y compris sur PC, dans le menu secondaire (§4.8) : **Portrait** (par défaut — l'attaque progresse de bas en haut) ou **Paysage** (l'attaque progresse de gauche à droite, terrain tourné à 90°). Préférence d'affichage pure, **non persistée** : repart toujours en portrait au rechargement de la page — un choix délibéré pour garder ce réglage simple au MVP plutôt que d'ajouter un mécanisme de sauvegarde dédié.

## 5. Hors scope du MVP (post-MVP, voir `docs/ROADMAP.md`)

- Bibliothèque hiérarchisée de plays (dossiers + tags).
- Backend avec comptes utilisateurs, partage par lien, collaboration.
- Export image/PDF/GIF/vidéo d'une action.
- Mode présentation plein écran (déroulé de plusieurs actions).
- Annotations libres façon "télé-strator" (flèches/zones dessinées à main levée).
- Trajectoires courbes pour les **déplacements de joueurs** (le mécanisme de point de contrôle est déjà générique dans le modèle de données, cf. `docs/DATA_MODEL.md` §8 — seule l'UI d'édition pour les joueurs reste hors-scope). La trajectoire courbe du **disque**, elle, fait partie du MVP (§4.5).

## 6. Non-objectifs explicites

- Pas de moteur physique, pas de simulation de règles de jeu, pas de détection automatique de fautes/violations.
- Pas de temps réel multi-utilisateur au MVP.
- Pas de fusion de branches (le modèle de frames reste un arbre, jamais un graphe) : une fin de play partagée entre plusieurs options se duplique plutôt que de converger — voir `docs/DATA_MODEL.md` §9.

## 7. Critères de succès du MVP

- Un coach peut créer une action 5v5 complète (positions initiales via preset + au moins 3 frames) en moins de 5 minutes.
- L'action peut être rejouée (pas à pas et fluide) sur mobile sans latence perceptible.
- Aucune perte de données au rechargement de la page (persistance locale fiable).
- L'interface reste utilisable (cibles tactiles suffisamment grandes) sur un écran de smartphone.
