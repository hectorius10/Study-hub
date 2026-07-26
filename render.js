/* Study Hub - Rendu HTML & Vues (Bibliothèque & Matière) */

import * as Data from "./data.js";

/* --- Vue Bibliothèque --- */

// Affiche la grille de matières selon les filtres et le tri
export function renderBibliotheque({ recherche = "", tri = "recents" } = {}) {
    const conteneur = document.getElementById("grille-matieres");
    conteneur.innerHTML = "";

    const matieres = filtrerEtTrier(Data.getMatieres(), recherche, tri);
    matieres.forEach((matiere) => {
        conteneur.appendChild(creerCarteMatiere(matiere));
    });

    // La carte d'ajout reste toujours en fin de grille
    conteneur.appendChild(creerCarteCreerMatiere());
}

// Filtre par nom et trie sans modifier le tableau source
function filtrerEtTrier(matieres, recherche, tri) {
    const texteRecherche = recherche.trim().toLowerCase();

    const filtrees = texteRecherche
        ? matieres.filter((m) => m.nom.toLowerCase().includes(texteRecherche))
        : matieres.slice();

    const comparateurs = {
        recents: (a, b) => b.creeLe - a.creeLe,
        alphabetique: (a, b) => a.nom.localeCompare(b.nom, "fr"),
        progression: (a, b) => b.progres - a.progres,
    };

    return filtrees.sort(comparateurs[tri] || comparateurs.recents);
}

// Génère l'élément HTML d'une carte de matière
function creerCarteMatiere(matiere) {
    const carte = document.createElement("article");
    carte.className = "carte-matiere";
    carte.dataset.matiereId = matiere.id;

    const nbModules = matiere.modules.length;
    const libelleModules = nbModules <= 1 ? "Module" : "Modules";

    carte.innerHTML = `
    <h3>${echapper(matiere.nom)}</h3>
    <p class="description-matiere">${echapper(matiere.description)}</p>
    <div class="progres-matiere">
      <div class="ligne-progres">
        <span>Progrès</span>
        <span>${matiere.progres}%</span>
      </div>
      <div class="barre-progres">
        <span style="width: ${matiere.progres}%"></span>
      </div>
    </div>
    <p class="nb-modules">📂 ${nbModules} ${libelleModules}</p>
  `;

    return carte;
}

// Carte d'action d'ajout (toujours placée à la fin de la grille)
function creerCarteCreerMatiere() {
    const carte = document.createElement("article");
    carte.id = "carte-creer-matiere";
    carte.className = "carte-matiere carte-creer";

    carte.innerHTML = `
    <span class="icone-plus" aria-hidden="true">⊕</span>
    <h3>Créer une archive</h3>
    <p class="description-matiere">Ajouter un nouveau sujet d'étude à votre index.</p>
  `;

    return carte;
}

/* --- Vue Matière (Détails, Modules & Statistiques) --- */

// Dessine toute la page d'une matière spécifique
export function renderMatiere(matiereId) {
    const matiere = Data.getMatiere(matiereId);
    if (!matiere) return;

    document.getElementById("fil-ariane-matiere").textContent = matiere.nom;
    document.getElementById("titre-matiere").textContent = matiere.nom;

    const conteneurModules = document.getElementById("liste-modules");
    conteneurModules.innerHTML = "";
    matiere.modules.forEach((module) => {
        conteneurModules.appendChild(creerBlocModule(module));
    });

    remplirSelectMatieres(matiereId);
    remplirSelectModules(matiereId);

    const { total, faites } = compterTaches(matiere);
    document.getElementById("progres-pourcentage").textContent = `${matiere.progres}%`;
    document.getElementById("date-echeance").textContent = estimerDateAchevement(matiere);
    document.getElementById("stat-total-modules").textContent = matiere.modules.length;
    document.getElementById("stat-taches-completees").textContent = `${faites} / ${total}`;
    document.getElementById("stat-heures").textContent = `${calculerHeuresTravail(matiere)} h`;
}

// Construit le bloc HTML d'un module avec ses tâches
function creerBlocModule(module) {
    const bloc = document.createElement("div");
    bloc.className = "bloc-module";
    bloc.dataset.moduleId = module.id;

    const entete = document.createElement("div");
    entete.className = "entete-module";
    entete.dataset.moduleToggle = "";
    entete.innerHTML = `
    <span class="pourcentage-module">${module.progres}%</span>
    <div class="titre-module">
      <h3>${echapper(module.titre)}</h3>
      <p>${echapper(module.description)}</p>
    </div>
    <span class="chevron-module" aria-hidden="true">⌄</span>
  `;
    bloc.appendChild(entete);

    const liste = document.createElement("ul");
    liste.className = "liste-taches";

    // Marque la première tâche non terminée comme "en cours"
    let tacheEnCoursDejaTrouvee = false;
    module.taches.forEach((tache) => {
        const estEnCours = !tacheEnCoursDejaTrouvee && tache.statut !== "faite";
        if (estEnCours) tacheEnCoursDejaTrouvee = true;
        liste.appendChild(creerLigneTache(tache, module, estEnCours));
    });

    bloc.appendChild(liste);
    return bloc;
}

// Construit la ligne d'une tâche (case à cocher + titre)
function creerLigneTache(tache, module, estEnCours) {
    const li = document.createElement("li");
    li.className = "ligne-tache";
    if (tache.statut === "faite") li.classList.add("faite");
    if (estEnCours) li.classList.add("en-cours");
    li.dataset.tacheId = tache.id;
    li.dataset.moduleId = module.id;

    const estFaite = tache.statut === "faite";

    li.innerHTML = `
    <button
      class="case-tache"
      data-case-tache
      data-module-id="${module.id}"
      data-tache-id="${tache.id}"
      aria-label="${estFaite ? "Décocher" : "Cocher"} la tâche"
    >${estFaite ? "✓" : ""}</button>
    <span class="titre-tache">${echapper(tache.titre)}</span>
  `;

    return li;
}

/* --- Panneau latéral & Sélecteurs --- */

// Remplit le menu déroulant des matières
function remplirSelectMatieres(matiereSelectionneeId) {
    const select = document.getElementById("ajout-select-matiere");
    select.innerHTML = Data.getMatieres()
        .map((m) => `<option value="${m.id}">${echapper(m.nom)}</option>`)
        .join("");
    select.value = matiereSelectionneeId;
}

// Remplit le menu déroulant des modules d'une matière
export function remplirSelectModules(matiereId) {
    const select = document.getElementById("ajout-select-module");
    const matiere = Data.getMatiere(matiereId);
    if (!matiere) {
        select.innerHTML = "";
        return;
    }
    select.innerHTML = matiere.modules
        .map((m) => `<option value="${m.id}">${echapper(m.titre)}</option>`)
        .join("");
}

/* --- Calculs de synthèses & Statistiques --- */

function compterTaches(matiere) {
    let total = 0;
    let faites = 0;
    matiere.modules.forEach((m) => {
        total += m.taches.length;
        faites += m.taches.filter((t) => t.statut === "faite").length;
    });
    return { total, faites };
}

// Convertit le temps d'étude accumulé en heures
function calculerHeuresTravail(matiere) {
    const minutes = Data.getSessions()
        .filter((s) => s.matiereId === matiere.id && s.type === "pomodoro")
        .reduce((somme, s) => somme + s.duree, 0);
    return (minutes / 60).toFixed(1);
}

// Estime la date de fin basée sur un rythme moyen de 2 tâches/semaine
function estimerDateAchevement(matiere) {
    const { total, faites } = compterTaches(matiere);
    if (total === 0) return "—";

    const restantes = total - faites;
    if (restantes === 0) return "Terminé 🎉";

    const RYTHME_TACHES_PAR_SEMAINE = 2;
    const semainesRestantes = Math.ceil(restantes / RYTHME_TACHES_PAR_SEMAINE);

    const dateEstimee = new Date();
    dateEstimee.setDate(dateEstimee.getDate() + semainesRestantes * 7);
    return dateEstimee.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/* --- Sécurité --- */

// Échappe le HTML pour éviter les failles XSS
function echapper(texte) {
    const div = document.createElement("div");
    div.textContent = texte ?? "";
    return div.innerHTML;
}
