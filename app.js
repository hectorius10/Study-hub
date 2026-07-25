import * as Data from "./data.js";
import { renderBibliotheque, renderMatiere, remplirSelectModules } from "./render.js";
import { initPomodoro, ouvrirPopupPomodoro } from "./pomodoro.js";
import { renderCalendrier } from "./calendrier.js";

// State global de l'app
let vueActuelle = "bibliotheque"; // "bibliotheque" | "matiere" | "calendrier"
let matiereOuverteId = null;
let filtreRecherche = "";
let triActuel = "recents";
let moisAffiche = new Date();

// --- NAVIGATION ---

function afficherVue(nomVue, options = {}) {
    vueActuelle = nomVue;
    if (nomVue === "matiere" && options.matiereId) {
        matiereOuverteId = options.matiereId;
    }

    document.querySelectorAll(".vue").forEach((section) => {
        section.hidden = section.id !== `vue-${nomVue}`;
    });

    document.querySelectorAll(".onglet-vue").forEach((bouton) => {
        bouton.classList.toggle("actif", bouton.dataset.vue === nomVue);
    });

    redessinerVueActuelle();
}

function redessinerVueActuelle() {
    if (vueActuelle === "bibliotheque") {
        renderBibliotheque({ recherche: filtreRecherche, tri: triActuel });
    } else if (vueActuelle === "matiere" && matiereOuverteId) {
        renderMatiere(matiereOuverteId);
    } else if (vueActuelle === "calendrier") {
        renderCalendrier(moisAffiche);
    }
}

// --- EVENTS HEADER ---

document.querySelectorAll(".onglet-vue").forEach((bouton) => {
    bouton.addEventListener("click", () => afficherVue(bouton.dataset.vue));
});

document.getElementById("recherche-matieres").addEventListener("input", (e) => {
    filtreRecherche = e.target.value.trim();
    if (vueActuelle === "bibliotheque") {
        renderBibliotheque({ recherche: filtreRecherche, tri: triActuel });
    }
});

document.getElementById("btn-commencer-focus").addEventListener("click", () => {
    ouvrirPopupPomodoro({});
});

document.getElementById("btn-profil").addEventListener("click", () => {
    // TODO: Implémenter le menu profil
    console.log("Menu profil : à implémenter.");
});

// --- VUE BIBLIOTHÈQUE ---

document.getElementById("tri-matieres").addEventListener("change", (e) => {
    triActuel = e.target.value;
    renderBibliotheque({ recherche: filtreRecherche, tri: triActuel });
});

document.getElementById("grille-matieres").addEventListener("click", (e) => {
    const carteMatiere = e.target.closest("[data-matiere-id]");
    if (carteMatiere) {
        afficherVue("matiere", { matiereId: carteMatiere.dataset.matiereId });
        return;
    }
    if (e.target.closest("#carte-creer-matiere")) {
        creerNouvelleMatiere();
    }
});

function creerNouvelleMatiere() {
    const nom = window.prompt("Nom de la nouvelle matière :");
    if (!nom || nom.trim() === "") return;

    const description = window.prompt("Description (facultative) :") || "";
    const matiere = Data.ajouterMatiere({ nom: nom.trim(), description: description.trim() });

    afficherVue("matiere", { matiereId: matiere.id });
}

document.getElementById("btn-supprimer-matiere").addEventListener("click", () => {
    const matieres = Data.getMatieres();
    if (!matieres || matieres.length === 0) {
        window.alert("Votre bibliothèque est actuellement vide.");
        return;
    }

    const listeMatieres = matieres.map((m, i) => `${i + 1}. ${m.nom}`).join("\n");
    const saisie = window.prompt(`⚠️ ZONE DE DANGER : Supprimer une matière.\n\n${listeMatieres}\n\nEntrez le numéro correspondant :`);

    if (saisie === null) return;

    const indexChoisi = parseInt(saisie.trim(), 10) - 1;
    if (isNaN(indexChoisi) || indexChoisi < 0 || indexChoisi >= matieres.length) {
        window.alert("Le numéro saisi est invalide.");
        return;
    }

    const matiereCible = matieres[indexChoisi];
    if (window.confirm(`Êtes-vous sûr de supprimer définitivement "${matiereCible.nom}" ?`)) {
        Data.supprimerMatiere(matiereCible.id);
    }
});

// --- VUE MATIÈRE ---

document.getElementById("btn-retour-bibliotheque").addEventListener("click", () => {
    afficherVue("bibliotheque");
});

document.getElementById("btn-modifier-matiere").addEventListener("click", () => {
    const matiere = Data.getMatiere(matiereOuverteId);
    if (!matiere) return;

    const nom = window.prompt("Nouveau nom :", matiere.nom);
    if (nom && nom.trim() !== "") {
        const description = window.prompt("Nouvelle description :", matiere.description) || "";
        Data.modifierMatiere(matiere.id, { nom: nom.trim(), description: description.trim() });
    }
});

document.getElementById("btn-ajouter-module").addEventListener("click", () => {
    const titre = window.prompt("Titre du nouveau module :");
    const description = window.prompt("Description du nouveau module :");
    if (titre && titre.trim() !== "") {
        Data.ajouterModule(matiereOuverteId, { titre: titre.trim(), description: description.trim() });
    }
});

document.getElementById("btn-modifier-module").addEventListener("click", () => {
    const matiere = Data.getMatiere(matiereOuverteId);
    if (!matiere || !matiere.modules || matiere.modules.length === 0) {
        window.alert("Cette matière ne contient aucun module à modifier.");
        return;
    }

    const listeModules = matiere.modules.map((m, i) => `${i + 1}. ${m.titre}`).join("\n");
    const saisie = window.prompt(`Quel module modifier ? Entrez son numéro :\n\n${listeModules}`);
    if (saisie === null) return;

    const indexChoisi = parseInt(saisie.trim(), 10) - 1;
    if (isNaN(indexChoisi) || indexChoisi < 0 || indexChoisi >= matiere.modules.length) {
        window.alert("Numéro de module invalide.");
        return;
    }

    const moduleCible = matiere.modules[indexChoisi];
    const nouveauTitre = window.prompt("Corrigez le titre du module :", moduleCible.titre);

    if (nouveauTitre === null || nouveauTitre.trim() === "") {
        window.alert("Le titre du module ne peut pas être vide.");
        return;
    }

    const nouvelleDescription = window.prompt("Modifiez la description :", moduleCible.description);
    Data.modifierModule(matiereOuverteId, moduleCible.id, {
        titre: nouveauTitre.trim(),
        description: nouvelleDescription !== null ? nouvelleDescription.trim() : moduleCible.description
    });
});

document.getElementById("btn-supprimer-module").addEventListener("click", () => {
    const matiere = Data.getMatiere(matiereOuverteId);
    if (!matiere || !matiere.modules || matiere.modules.length === 0) {
        window.alert("Aucun module à supprimer pour cette matière.");
        return;
    }

    const listeModules = matiere.modules.map((m, i) => `${i + 1}. ${m.titre}`).join("\n");
    const saisie = window.prompt(`Quel module supprimer ? Entrez son numéro :\n\n${listeModules}`);
    if (saisie === null) return;

    const indexChoisi = parseInt(saisie.trim(), 10) - 1;
    if (isNaN(indexChoisi) || indexChoisi < 0 || indexChoisi >= matiere.modules.length) {
        window.alert("Numéro de module invalide.");
        return;
    }

    const moduleCible = matiere.modules[indexChoisi];
    if (window.confirm(`Supprimer définitivement le module "${moduleCible.titre}" ?`)) {
        Data.supprimerModule(matiereOuverteId, moduleCible.id);
    }
});

document.getElementById("ajout-select-matiere").addEventListener("change", (e) => {
    remplirSelectModules(e.target.value);
});

document.getElementById("btn-ajouter-tache").addEventListener("click", () => {
    const matiereId = document.getElementById("ajout-select-matiere").value;
    const moduleId = document.getElementById("ajout-select-module").value;
    const champTitre = document.getElementById("ajout-input-tache");

    if (!matiereId || !moduleId || !champTitre.value.trim()) return;

    Data.ajouterTache(matiereId, moduleId, champTitre.value.trim());
    champTitre.value = "";
});

document.getElementById("liste-modules").addEventListener("click", (e) => {
    const caseACocher = e.target.closest("[data-case-tache]");
    if (caseACocher) {
        const { moduleId, tacheId } = caseACocher.dataset;
        Data.basculerTache(matiereOuverteId, moduleId, tacheId);
        return;
    }

    const ligneTache = e.target.closest("[data-tache-id]");
    if (ligneTache) {
        const { moduleId, tacheId } = ligneTache.dataset;
        ouvrirPopupPomodoro({ matiereId: matiereOuverteId, moduleId, tacheId });
        return;
    }

    const entete = e.target.closest("[data-module-toggle]");
    if (entete) {
        entete.closest(".bloc-module").classList.toggle("replie");
    }
});

// --- VUE CALENDRIER ---

document.getElementById("btn-mois-precedent").addEventListener("click", () => {
    moisAffiche = new Date(moisAffiche.getFullYear(), moisAffiche.getMonth() - 1, 1);
    renderCalendrier(moisAffiche);
});

document.getElementById("btn-mois-suivant").addEventListener("click", () => {
    moisAffiche = new Date(moisAffiche.getFullYear(), moisAffiche.getMonth() + 1, 1);
    renderCalendrier(moisAffiche);
});

document.getElementById("btn-aujourdhui").addEventListener("click", () => {
    moisAffiche = new Date();
    renderCalendrier(moisAffiche);
});

document.getElementById("grille-calendrier").addEventListener("click", (evenement) => {
    const caseJour = evenement.target.closest(".case-jour");
    if (!caseJour) return;

    ouvrirInterfacePlanification(caseJour.dataset.date);
});

// --- POPUPS & MODALES ---

export function ouvrirInterfacePlanification(dateISO) {
    const ancienneModale = document.getElementById("popup-planification");
    if (ancienneModale) ancienneModale.remove();

    const [annee, mois, jour] = dateISO.split("-");
    const dateObj = new Date(parseInt(annee, 10), parseInt(mois, 10) - 1, parseInt(jour, 10));

    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateBruteFormatee = dateObj.toLocaleDateString('fr-FR', optionsDate);
    const dateLisible = dateBruteFormatee.charAt(0).toUpperCase() + dateBruteFormatee.slice(1);

    const matieres = Data.getMatieres();
    const optionsMatieresHtml = `<option value="">-- Aucune matière (Révision libre) --</option>` +
        matieres.map(m => `<option value="${m.id}">${m.nom}</option>`).join("");

    const fondModale = document.createElement("div");
    fondModale.id = "popup-planification";
    fondModale.className = "popup-fond";

    fondModale.innerHTML = `
        <div class="popup-pomodoro" role="dialog" aria-modal="true" aria-labelledby="titre-modale-planif">
            <div class="popup-entete">
                <h2 id="titre-modale-planif">Planifier une journée</h2>
                <button class="btn-fermer" id="btn-fermer-planif" aria-label="Fermer la fenêtre">&times;</button>
            </div>

            <p style="font-size: 0.85rem; color: var(--ink-muted); margin-bottom: 18px; text-align: left;">
                Date ciblée : <strong style="color: var(--navy);">${dateLisible}</strong>
            </p>

            <form id="form-planification">
                <label for="planif-label">Intention ou tâche à accomplir :</label>
                <input type="text" id="planif-label" placeholder="Ex: Réviser..." required autocomplete="off" class="popup-input" />

                <label for="planif-matiere" style="margin-top: 14px;">Matière associée (facultatif) :</label>
                <select id="planif-matiere">${optionsMatieresHtml}</select>

                <label for="planif-duree" style="margin-top: 14px;">Durée estimée (minutes) :</label>
                <input type="number" id="planif-duree" value="45" min="5" step="5" style="width: 100%; padding: 9px 11px; border: 1px solid var(--line); border-radius: var(--rayon-petit); background: white; margin-bottom: 22px;" />

                <div class="boutons-minuteur">
                    <button type="button" class="btn btn-secondaire" id="btn-annuler-planif">Annuler</button>
                    <button type="submit" class="btn btn-principal">Enregistrer</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(fondModale);
    const inputLabel = document.getElementById("planif-label");
    inputLabel.focus();

    const fermerModale = () => {
        fondModale.remove();
        window.removeEventListener("keydown", gererToucheEchap);
    };

    document.getElementById("btn-fermer-planif").addEventListener("click", fermerModale);
    document.getElementById("btn-annuler-planif").addEventListener("click", fermerModale);

    fondModale.addEventListener("click", (e) => {
        if (e.target === fondModale) fermerModale();
    });

    const gererToucheEchap = (e) => {
        if (e.key === "Escape") fermerModale();
    };
    window.addEventListener("keydown", gererToucheEchap);

    document.getElementById("form-planification").addEventListener("submit", (e) => {
        e.preventDefault();
        const libelleSaisi = inputLabel.value.trim();
        const matiereIdSaisie = document.getElementById("planif-matiere").value;
        const dureeSaisie = parseInt(document.getElementById("planif-duree").value, 10) || 0;

        if (!libelleSaisi) return;

        Data.ajouterSession({
            date: dateISO,
            duree: dureeSaisie,
            type: "planifiee",
            matiereId: matiereIdSaisie !== "" ? matiereIdSaisie : null,
            label: libelleSaisi
        });

        fermerModale();
    });
}

// --- INIT & AUTO-REFRESH ---

window.addEventListener("studyhub:donnees-modifiees", redessinerVueActuelle);

// Lancement
Data.charger();
initPomodoro();
afficherVue("bibliotheque");