# Ultimate Playbook

Application web pour créer, consulter et rejouer des actions (plays) d'Ultimate Frisbee : positions des joueurs des deux équipes, position du disque, et animation de l'action image par image ou en fluide.

Usage prioritaire : Ultimate **indoor 5v5**, mais l'outil reste générique (effectifs et types de terrain configurables).

## Documentation

Ce projet est développé en mode "agentifié" : la documentation ci-dessous fait office de spécification pour guider l'implémentation par des agents IA (ou par un humain).

- [`docs/PRD.md`](docs/PRD.md) — Vision produit, scope du MVP, hors-scope, critères de succès.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — Modèle de données (terrain, joueurs, frames, actions, presets).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Stack technique, structure du projet, déploiement.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Découpage en phases et tâches actionnables.
- [`CLAUDE.md`](CLAUDE.md) — Conventions et instructions pour les agents IA travaillant sur ce repo.

## Démarrer en local

```
npm install
npm run dev      # serveur de dev
npm run test     # tests unitaires (Vitest)
npm run lint     # ESLint
npm run format   # Prettier
npm run build    # build de production
```

## Déploiement

Déployé automatiquement sur GitHub Pages à chaque push sur `main` (voir `.github/workflows/deploy.yml`) : **https://ludodem.github.io/ultimate-playbook/**

## État du projet

✅ **Phases 0 à 7** terminées (bootstrap, modèle de données, rendu du terrain, édition des positions, timeline & branches, mode lecture pas à pas/fluide, trajectoire courbe du disque, persistance locale). 🚧 Prochaine étape : Phase 8 (responsive & polish tactile) — voir `docs/ROADMAP.md`.

## Licence

Non définie pour l'instant (à ajouter si le projet est amené à être partagé publiquement).
