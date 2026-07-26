# Study Hub

Application web (HTML / CSS / JavaScript Vanilla) pour organiser des révisions : matières, modules, tâches, séances de travail chronométrées et calendrier de suivi.

---

## 1. Le concept

Trois niveaux emboîtés structurent tout le contenu :

```
Matière (ex. Maîtrise de JavaScript)
  └── Module (ex. Module 1 : Fondamentaux ES6+)
        └── Tâche / chapitre (ex. 1.3 Promesses & Async/Await)
```

Une **session Pomodoro** peut être liée à une tâche précise, ou lancée librement depuis n'importe où (« Commencer Focus »). Le **Calendrier** journalise toutes les sessions et permet aussi d'en planifier à l'avance.

Parcours type : **Bibliothèque → Matière → Tâche → Pomodoro → tâche cochée → % mis à jour**.

---

## 2. Les quatre écrans

### Écran 1 — La Bibliothèque (`#vue-bibliotheque`)
Écran d'accueil et point d'entrée unique de l'application.

| Élément | Rôle |
|---|---|
| Barre de recherche | Filtre les matières par nom en temps réel |
| Onglets Matières / Calendrier | Bascule entre les deux vues principales |
| Bouton « Commencer Focus » | Ouvre le popup Pomodoro sans tâche pré-liée (session « révision libre ») |
| Menu « Trier par » | Réordonne les cartes (récents / alphabétique / progression) |
| Carte de matière | Titre, description, barre de progression, nombre de modules — clic → ouvre la matière |
| Carte « Créer une archive » | Toujours en dernière position — ouvre le formulaire de création d'une matière |

**Nouvelle matière :** créée avec 0 module et 0 % de progression, elle apparaît immédiatement dans la grille.

### Écran 2 — La page d'une matière (`#vue-matiere`)
Vue de travail principale : afficher, déplier et cocher le contenu d'une matière.

| Élément | Rôle |
|---|---|
| Fil d'ariane | Retour rapide vers la Bibliothèque |
| Bloc module | % + titre + description ; clic sur le chevron replie/déplie ses tâches |
| Ligne de tâche | Case à cocher + titre ; clic sur le texte ouvre le Pomodoro lié, clic sur la case coche directement |
| Panneau « Ajout rapide de tâche » | Sélecteurs Matière / Module + champ texte → ajoute une tâche en fin de module |
| Bloc « Progression du cours » | % global, statut, date d'achèvement estimée, compteurs (modules, tâches, heures) |

**Les trois états visuels d'une tâche :**

| État | Apparence | Origine |
|---|---|---|
| **Faite** | Coche verte, texte barré | `statut === "faite"` (stocké) |
| **En cours** | Ligne surlignée | *calculé* : la première tâche non cochée de la liste — un seul élément à la fois |
| **À faire** | Cercle vide | `statut === "a_faire"` (stocké) |

> Le statut « en cours » n'est pas une donnée en base : c'est une déduction faite au rendu (voir `render.js`), ce qui évite d'avoir à la synchroniser manuellement.

### Écran 3 — Le popup Pomodoro (« Session de Travail Profond »)
S'ouvre en superposition depuis une tâche (matière + tâche pré-remplies) ou depuis « Commencer Focus » (champ libre).

Contrairement à un minuteur Pomodoro classique à onglets fixes, l'implémentation actuelle propose **trois profils de productivité**, chacun avec son propre couple travail/pause :

| Profil | Travail | Pause courte | Pause longue |
|---|---|---|---|
| Micro | 15 min | 3 min | 10 min |
| Classique | 25 min | 5 min | 15 min |
| Étendu | 50 min | 10 min | 30 min |

Le minuteur tourne en boucle (travail → pause courte → ... → pause longue tous les 4 cycles) tant que l'utilisateur ne clique pas sur « Terminer & Cocher ». Fermer le popup avec la croix ne stoppe pas le minuteur, qui continue en arrière-plan.

### Écran 4 — Le Calendrier (`#vue-calendrier`)
Vue mensuelle qui journalise le passé et permet de planifier l'avenir.

| Élément | Rôle |
|---|---|
| En-tête du mois + flèches | Navigation mois précédent / suivant, bouton « Aujourd'hui » |
| Jours hors mois | Grisés, cliquables (basculent vers le mois correspondant) |
| Colonne week-end | Fond distinct (samedi/dimanche) |
| Étiquette de session | `Matière – durée`, ajoutée automatiquement à la fin d'une session Pomodoro |
| Étiquette « + n » | Résume les sessions au-delà d'un certain nombre dans une même case |

---

## 3. Modèle de données

Source unique de vérité, définie et manipulée dans `data.js` — aucun autre fichier ne modifie l'état directement.

```
MATIÈRE          MODULE              TÂCHE                 SESSION POMODORO
 id                id                  id                    id
 nom               titre               titre                 date, durée
 description       description         statut (faite/a_faire) matiereId
 progres (%)        progres (%)        module parent          tacheId (optionnel)
 creeLe             taches[]
 modules[]
```

### Calcul de la progression (cascade)

```js
progresModule  = (tâches faites du module) / (total tâches du module) * 100
progresMatiere = moyenne des progresModule de tous les modules de la matière
```

**Exemple :** dans *Maîtrise de JavaScript*, le Module 1 passe de 2/4 à 3/4 tâches cochées.
→ Module 1 : 50 % → **75 %**
→ Progression de la matière recalculée en cascade (moyenne de tous ses modules)
→ Répercussions immédiates : barre du module, carte dans la Bibliothèque, compteur « Tâches complétées », date d'achèvement estimée.

---

## 4. Architecture technique

Le projet suit une boucle simple, sans framework :

```
Données  →  Affichage  →  Interaction
 (data.js)   (render.js)   (app.js, pomodoro.js, calendrier.js)
    ↑___________________________________|
       (une interaction modifie les données, puis relance l'affichage)
```

1. **Les données** (`data.js`) : un objet JS unique (matières, modules, tâches, sessions), chargé/sauvegardé dans `localStorage` sous la clé `studyhub`.
2. **L'affichage** (`render.js`) : des fonctions qui lisent les données et génèrent le HTML correspondant — jamais l'inverse.
3. **Les interactions** (`app.js`, `pomodoro.js`, `calendrier.js`) : les écouteurs de clics modifient les données puis redemandent l'affichage. Rien ne touche le HTML « à la main ».

Les trois vues (`#vue-bibliotheque`, `#vue-matiere`, `#vue-calendrier`) sont trois `<section>` du même `index.html` ; `afficherVue(nomVue, options)` masque la vue courante, affiche la bonne et appelle son rendu — sans rechargement de page.

---

## 5. Structure des fichiers

```
Web-Project-group-11/
├── index.html       # squelette de page + les 3 vues + popup Pomodoro
├── style.css        # système de design (palette navy/or/crème), mise en page
├── data.js          # source unique de vérité : données + localStorage + calculs de %
├── render.js        # fonctions de rendu (bibliothèque, matière, calendrier)
├── app.js           # navigation entre vues, écouteurs de clics, point d'entrée
├── pomodoro.js       # minuteur (profils, cycle, enregistrement de session)
└── calendrier.js     # génération de la grille du mois + sessions du jour
```

## 6. Lancer le projet

Aucune dépendance ni build : ouvrir `index.html` dans un navigateur suffit. Pour éviter d'éventuelles restrictions de module ES (`type="module"` dans `index.html`), servir le dossier via un petit serveur local, par exemple :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Les données sont conservées dans le `localStorage` du navigateur : elles persistent d'une session à l'autre sur le même appareil, mais ne sont pas partagées entre appareils (pas de backend).

---

## 7. Règles de gestion notables

| Situation | Comportement |
|---|---|
| Pomodoro fermé (croix) pendant qu'il tourne | Continue en arrière-plan |
| « Commencer Focus » sans tâche liée | Session enregistrée au Calendrier comme « révision libre » |
| Tâche décochée après coup | % du module/matière recalculés à la baisse ; aucune session retirée du Calendrier |
| Module supprimé avec des tâches faites | Confirmation demandée ; % de la matière recalculé sans ce module |
| Toutes les tâches d'un module cochées | Module à 100 %, reste visible (pas d'archivage automatique) |
| Nouvelle matière sans module | Carte à 0 %, invite directement à « Ajouter un module » |
| Plusieurs sessions le même jour | Étiquettes empilées dans la case ; au-delà d'un certain nombre, un « +n » résume |
