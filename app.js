/* Study Hub - Point d'entrée & Orchestration de l'application */

import * as Data from "./data.js";
import {
    renderBibliotheque,
    renderMatiere,
    remplirSelectModules,
} from "./render.js";
import { initPomodoro, ouvrirPopupPomodoro } from "./pomodoro.js";
import { renderCalendrier } from "./calendrier.js";

// Utilitaire pour attacher facilement un écouteur d'événement
function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
    else console.warn(`[StudyHub] Élément introuvable : #${id}`);
}

/* --- État global de l'application --- */

let vueActuelle = "bibliotheque";
let matiereOuverteId = null;
let filtreRecherche = "";
let triActuel = "recents";
let moisAffiche = new Date();

/* --- Navigation & Gestion des vues --- */

function afficherVue(nomVue, options = {}) {
    vueActuelle = nomVue;
    if (nomVue === "matiere" && options?.matiereId) {
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

/* --- Événements globaux & En-tête --- */

on("recherche-matieres", "input", (e) => {
    filtreRecherche = e.target.value;
    if (vueActuelle === "bibliotheque") {
        renderBibliotheque({ recherche: filtreRecherche, tri: triActuel });
    }
});

on("btn-commencer-focus", "click", () => {
    ouvrirPopupPomodoro({});
});

on("btn-profil", "click", () => {
    console.log("Menu profil : à implémenter.");
});

document.querySelectorAll(".onglet-vue").forEach((bouton) => {
    bouton.addEventListener("click", () => afficherVue(bouton.dataset.vue));
});

/* --- Actions Bibliothèque (Matières) --- */

on("tri-matieres", "change", (e) => {
    triActuel = e.target.value;
    renderBibliotheque({ recherche: filtreRecherche, tri: triActuel });
});

on("grille-matieres", "click", (e) => {
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
    ouvrirModalMatiere({ mode: "creation" });
}

on("btn-supprimer-matiere", "click", () => {
    const matieres = Data.getMatieres();
    if (!matieres?.length) {
        window.alert("Votre bibliothèque est actuellement vide.");
        return;
    }

    let message =
        "⚠️ Quelle matière souhaitez-vous supprimer définitivement ?\n\n" +
        "Attention : cela effacera de manière irréversible tous ses modules et toutes ses tâches.\n\n" +
        "Entrez le numéro correspondant :\n\n";

    matieres.forEach((matiere, index) => {
        message += `${index + 1}. ${matiere.nom}\n`;
    });

    const saisie = window.prompt(message);
    if (saisie === null) return;

    const index = parseInt(saisie.trim(), 10) - 1;
    if (isNaN(index) || index < 0 || index >= matieres.length) {
        window.alert("Numéro invalide. Opération annulée.");
        return;
    }

    const cible = matieres[index];
    const confirmation = window.confirm(
        `Êtes-vous sûr de vouloir supprimer "${cible.nom}" ?\n\nTout son contenu sera perdu.`,
    );

    if (confirmation) {
        Data.supprimerMatiere(cible.id);
    }
});

/* --- Actions Vue Matières (Modules & Tâches) --- */

on("btn-retour-bibliotheque", "click", () => afficherVue("bibliotheque"));

on("btn-modifier-matiere", "click", () => {
    ouvrirModalMatiere({ mode: "edition", matiereId: matiereOuverteId });
});

on("btn-ajouter-module", "click", () => {
    ouvrirModalModule({ mode: "creation", matiereId: matiereOuverteId });
});

on("ajout-select-matiere", "change", (e) => {
    remplirSelectModules(e.target.value);
});

on("btn-ajouter-tache", "click", () => {
    const matiereId = document.getElementById("ajout-select-matiere")?.value;
    const moduleId = document.getElementById("ajout-select-module")?.value;
    const champ = document.getElementById("ajout-input-tache");

    if (!matiereId || !moduleId || !champ?.value.trim()) return;

    Data.ajouterTache(matiereId, moduleId, champ.value.trim());
    champ.value = "";
});

on("liste-modules", "click", (e) => {
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
        entete.closest(".bloc-module")?.classList.toggle("replie");
    }
});

on("btn-modifier-module", "click", () => {
    ouvrirModalModule({ mode: "edition", matiereId: matiereOuverteId });
});

on("btn-supprimer-module", "click", () => {
    const matiere = Data.getMatiere(matiereOuverteId);
    if (!matiere?.modules?.length) {
        window.alert("Aucun module à supprimer pour cette matière.");
        return;
    }

    let message =
        "Quel module souhaitez-vous supprimer ? Entrez son numéro :\n\n";
    matiere.modules.forEach((mod, index) => {
        message += `${index + 1}. ${mod.titre}\n`;
    });

    const saisie = window.prompt(message);
    if (saisie === null) return;

    const index = parseInt(saisie.trim(), 10) - 1;
    if (isNaN(index) || index < 0 || index >= matiere.modules.length) {
        window.alert("Numéro de module invalide.");
        return;
    }

    const cible = matiere.modules[index];
    const confirmation = window.confirm(
        `Supprimer définitivement le module "${cible.titre}" et toutes ses tâches ?`,
    );

    if (confirmation) {
        Data.supprimerModule(matiereOuverteId, cible.id);
    }
});

/* --- Popups / Modales Formulaires (Matières & Modules) --- */

function ouvrirModalMatiere({ mode = "creation", matiereId = null } = {}) {
    document.getElementById("popup-form-matiere")?.remove();

    const estEdition = mode === "edition";
    const matiere = estEdition ? Data.getMatiere(matiereId) : null;
    if (estEdition && !matiere) return;

    const titreModal = estEdition ? "Modifier la matière" : "Nouvelle matière";
    const nomInitial = estEdition ? matiere.nom : "";
    const descInitial = estEdition ? (matiere.description || "") : "";

    const fond = document.createElement("div");
    fond.id = "popup-form-matiere";
    fond.className = "popup-fond";

    fond.innerHTML = `
        <div class="popup-pomodoro" role="dialog" aria-modal="true" aria-labelledby="titre-modale-matiere">
            <div class="popup-entete">
                <h2 id="titre-modale-matiere">${titreModal}</h2>
                <button class="btn-fermer" id="btn-fermer-form-matiere" aria-label="Fermer">&times;</button>
            </div>
            <form id="form-matiere" style="margin-top: 15px;">
                <label for="matiere-nom">Nom de la matière :</label>
                <input type="text" id="matiere-nom" value="${nomInitial.replace(/"/g, '&quot;')}" placeholder="Ex: Mathématiques, Histoire..." required autocomplete="off" class="popup-input" />

                <label for="matiere-desc" style="margin-top: 14px; display: block;">Description (facultative) :</label>
                <textarea id="matiere-desc" placeholder="Résumé du programme, objectifs..." class="popup-input" style="width: 100%; min-height: 80px; resize: vertical; padding: 9px 11px; border: 1px solid var(--line); border-radius: var(--rayon-petit); background: white; margin-bottom: 22px;">${descInitial}</textarea>

                <div class="boutons-minuteur">
                    <button type="button" class="btn btn-secondaire" id="btn-annuler-form-matiere">Annuler</button>
                    <button type="submit" class="btn btn-principal">${estEdition ? "Enregistrer" : "Créer"}</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(fond);

    const inputNom = document.getElementById("matiere-nom");
    inputNom?.focus();

    const fermer = () => {
        fond.remove();
        window.removeEventListener("keydown", onEscape);
    };

    const onEscape = (ev) => {
        if (ev.key === "Escape") fermer();
    };

    on("btn-fermer-form-matiere", "click", fermer);
    on("btn-annuler-form-matiere", "click", fermer);
    window.addEventListener("keydown", onEscape);

    fond.addEventListener("click", (e) => {
        if (e.target === fond) fermer();
    });

    on("form-matiere", "submit", (e) => {
        e.preventDefault();
        const nom = inputNom?.value.trim();
        const description = document.getElementById("matiere-desc")?.value.trim() || "";

        if (!nom) return;

        if (estEdition) {
            Data.modifierMatiere(matiereId, { nom, description });
        } else {
            const nouvelleMatiere = Data.ajouterMatiere({ nom, description });
            if (nouvelleMatiere?.id) {
                afficherVue("matiere", { matiereId: nouvelleMatiere.id });
            }
        }

        fermer();
    });
}

function ouvrirModalModule({ mode = "creation", matiereId, moduleId = null } = {}) {
    document.getElementById("popup-form-module")?.remove();

    const matiere = Data.getMatiere(matiereId);
    if (!matiere) return;

    const estEdition = mode === "edition";
    if (estEdition && (!matiere.modules || matiere.modules.length === 0)) {
        window.alert("Cette matière ne contient encore aucun module à modifier.");
        return;
    }

    let moduleActuel = estEdition
        ? (moduleId ? matiere.modules.find((m) => m.id === moduleId) : matiere.modules[0])
        : null;

    const titreModal = estEdition ? "Modifier un module" : "Nouveau module";

    let selectModuleHtml = "";
    if (estEdition) {
        selectModuleHtml = `
            <label for="module-select-edition">Module à modifier :</label>
            <select id="module-select-edition" class="popup-input" style="width: 100%; margin-bottom: 14px; padding: 9px 11px; border: 1px solid var(--line); border-radius: var(--rayon-petit); background: white;">
                ${matiere.modules.map((m) => `<option value="${m.id}" ${m.id === moduleActuel.id ? "selected" : ""}>${m.titre}</option>`).join("")}
            </select>
        `;
    }

    const fond = document.createElement("div");
    fond.id = "popup-form-module";
    fond.className = "popup-fond";

    fond.innerHTML = `
        <div class="popup-pomodoro" role="dialog" aria-modal="true" aria-labelledby="titre-modale-module">
            <div class="popup-entete">
                <h2 id="titre-modale-module">${titreModal}</h2>
                <button class="btn-fermer" id="btn-fermer-form-module" aria-label="Fermer">&times;</button>
            </div>
            <form id="form-module" style="margin-top: 15px;">
                ${selectModuleHtml}

                <label for="module-titre">Titre du module :</label>
                <input type="text" id="module-titre" value="${estEdition ? moduleActuel.titre.replace(/"/g, '&quot;') : ""}" placeholder="Ex: Chapitre 1 - Introduction..." required autocomplete="off" class="popup-input" />

                <label for="module-desc" style="margin-top: 14px; display: block;">Description (facultative) :</label>
                <textarea id="module-desc" placeholder="Détails, objectifs du module..." class="popup-input" style="width: 100%; min-height: 80px; resize: vertical; padding: 9px 11px; border: 1px solid var(--line); border-radius: var(--rayon-petit); background: white; margin-bottom: 22px;">${estEdition ? (moduleActuel.description || "") : ""}</textarea>

                <div class="boutons-minuteur">
                    <button type="button" class="btn btn-secondaire" id="btn-annuler-form-module">Annuler</button>
                    <button type="submit" class="btn btn-principal">${estEdition ? "Enregistrer" : "Ajouter"}</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(fond);

    const inputTitre = document.getElementById("module-titre");
    const inputDesc = document.getElementById("module-desc");
    const selectModule = document.getElementById("module-select-edition");

    inputTitre?.focus();

    if (selectModule) {
        selectModule.addEventListener("change", (e) => {
            const mod = matiere.modules.find((m) => m.id === e.target.value);
            if (mod) {
                moduleActuel = mod;
                inputTitre.value = mod.titre;
                inputDesc.value = mod.description || "";
            }
        });
    }

    const fermer = () => {
        fond.remove();
        window.removeEventListener("keydown", onEscape);
    };

    const onEscape = (ev) => {
        if (ev.key === "Escape") fermer();
    };

    on("btn-fermer-form-module", "click", fermer);
    on("btn-annuler-form-module", "click", fermer);
    window.addEventListener("keydown", onEscape);

    fond.addEventListener("click", (e) => {
        if (e.target === fond) fermer();
    });

    on("form-module", "submit", (e) => {
        e.preventDefault();
        const titre = inputTitre?.value.trim();
        const description = inputDesc?.value.trim() || "";

        if (!titre) return;

        if (estEdition) {
            const targetId = selectModule ? selectModule.value : moduleActuel.id;
            Data.modifierModule(matiereOuverteId, targetId, { titre, description });
        } else {
            Data.ajouterModule(matiereOuverteId, { titre, description });
        }

        fermer();
    });
}

/* --- Actions Vue Calendrier --- */

on("btn-mois-precedent", "click", () => {
    moisAffiche = new Date(
        moisAffiche.getFullYear(),
        moisAffiche.getMonth() - 1,
        1,
    );
    renderCalendrier(moisAffiche);
});

on("btn-mois-suivant", "click", () => {
    moisAffiche = new Date(
        moisAffiche.getFullYear(),
        moisAffiche.getMonth() + 1,
        1,
    );
    renderCalendrier(moisAffiche);
});

on("btn-aujourdhui", "click", () => {
    moisAffiche = new Date();
    renderCalendrier(moisAffiche);
});

/* --- Utilitaires de dates --- */

function formaterDateISO(date) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, "0");
    const jour = String(date.getDate()).padStart(2, "0");
    return `${annee}-${mois}-${jour}`;
}

function formaterDateLisible(dateISO) {
    const [annee, mois, jour] = dateISO.split("-");
    const dateObj = new Date(parseInt(annee, 10), parseInt(mois, 10) - 1, parseInt(jour, 10));
    return dateObj.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatDuree(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const heures = Math.floor(minutes / 60);
    const reste = minutes % 60;
    return reste === 0 ? `${heures}h` : `${heures}h${reste}m`;
}

/* --- Modales & Interactions du Calendrier --- */

on("grille-calendrier", "click", (e) => {
    const caseJour = e.target.closest(".case-jour");
    if (!caseJour) return;

    const dateSelectionnee = caseJour.dataset.date;
    if (!dateSelectionnee) return;

    const aujourdhuiISO = formaterDateISO(new Date());
    const estPasse = dateSelectionnee < aujourdhuiISO;

    if (estPasse) {
        ouvrirInterfaceHistorique(dateSelectionnee);
    } else {
        const sessionsJour = Data.getSessionsPourDate(dateSelectionnee);

        if (sessionsJour && sessionsJour.length > 0) {
            const choix = window.prompt(
                `📅 Gestion de la journée du ${formaterDateLisible(dateSelectionnee)}\n\n` +
                `Il y a déjà ${sessionsJour.length} session(s) programmée(s) ce jour-là.\n\n` +
                `Que souhaitez-vous faire ?\n` +
                `1. Ajouter une session\n` +
                `2. Supprimer une session\n\n` +
                `Entrez 1 ou 2 :`
            );

            if (choix === "1") {
                ouvrirInterfacePlanification(dateSelectionnee);
            } else if (choix === "2") {
                supprimerSessionInteractive(dateSelectionnee, sessionsJour);
            }
        } else {
            ouvrirInterfacePlanification(dateSelectionnee);
        }
    }
});

function ouvrirInterfaceHistorique(dateISO) {
    document.getElementById("popup-historique")?.remove();

    const sessions = Data.getSessionsPourDate(dateISO) || [];
    const dateLisible = formaterDateLisible(dateISO);

    let contenuSessionsHtml = "";
    if (sessions.length === 0) {
        contenuSessionsHtml = `<p style="color: var(--ink-muted); font-style: italic;">Aucune session enregistrée pour cette date passée.</p>`;
    } else {
        contenuSessionsHtml = `<ul style="list-style-type: none; padding: 0; margin: 0;">`;
        sessions.forEach((s) => {
            contenuSessionsHtml += `
        <li style="padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid var(--navy, #1e293b);">
            <strong>${s.label}</strong><br>
            <span style="font-size: 0.85rem; color: var(--ink-muted);">Durée : ${formatDuree(s.duree)} ${s.type ? `(${s.type})` : ''}</span>
        </li>`;
        });
        contenuSessionsHtml += `</ul>`;
    }

    const fond = document.createElement("div");
    fond.id = "popup-historique";
    fond.className = "popup-fond";

    fond.innerHTML = `
        <div class="popup-pomodoro" role="dialog" aria-modal="true" aria-labelledby="titre-modale-histo">
            <div class="popup-entete">
                <h2 id="titre-modale-histo">Historique de la journée</h2>
                <button class="btn-fermer" id="btn-fermer-histo" aria-label="Fermer">&times;</button>
            </div>
            <p style="font-size: 0.85rem; color: var(--ink-muted); margin-bottom: 18px;">
                Date passée : <strong style="color: var(--navy);">${dateLisible}</strong>
            </p>
            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                ${contenuSessionsHtml}
            </div>
            <div class="boutons-minuteur" style="display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-principal" id="btn-fermer-histo-action">Fermer</button>
            </div>
        </div>
    `;

    document.body.appendChild(fond);

    const fermer = () => {
        fond.remove();
        window.removeEventListener("keydown", onEscape);
    };

    const onEscape = (ev) => {
        if (ev.key === "Escape") fermer();
    };

    on("btn-fermer-histo", "click", fermer);
    on("btn-fermer-histo-action", "click", fermer);
    window.addEventListener("keydown", onEscape);

    fond.addEventListener("click", (e) => {
        if (e.target === fond) fermer();
    });
}

function supprimerSessionInteractive(dateISO, sessions) {
    let message = `🗑️ Supprimer une session pour le ${formaterDateLisible(dateISO)}\n\nEntrez le numéro de la session à supprimer :\n\n`;
    sessions.forEach((s, index) => {
        message += `${index + 1}. ${s.label} (${formatDuree(s.duree)})\n`;
    });

    const saisie = window.prompt(message);
    if (saisie === null) return;

    const index = parseInt(saisie.trim(), 10) - 1;
    if (isNaN(index) || index < 0 || index >= sessions.length) {
        window.alert("Numéro de session invalide. Opération annulée.");
        return;
    }

    const sessionCible = sessions[index];
    const confirmation = window.confirm(
        `Êtes-vous sûr de vouloir supprimer la session "${sessionCible.label}" ?`
    );

    if (confirmation) {
        if (typeof Data.supprimerSession === "function") {
            Data.supprimerSession(sessionCible.id);
        } else {
            console.warn("[StudyHub] La méthode Data.supprimerSession doit être implémentée dans data.js pour supprimer la session ID :", sessionCible.id);
        }
    }
}

function ouvrirInterfacePlanification(dateISO) {
    document.getElementById("popup-planification")?.remove();

    const dateLisible = formaterDateLisible(dateISO);
    const matieres = Data.getMatieres();
    let optionsMatieresHtml = `<option value="">-- Aucune matière (Révision libre) --</option>`;
    matieres.forEach((m) => {
        optionsMatieresHtml += `<option value="${m.id}">${m.nom}</option>`;
    });

    const fond = document.createElement("div");
    fond.id = "popup-planification";
    fond.className = "popup-fond";

    fond.innerHTML = `
        <div class="popup-pomodoro" role="dialog" aria-modal="true" aria-labelledby="titre-modale-planif">
            <div class="popup-entete">
                <h2 id="titre-modale-planif">Planifier une journée</h2>
                <button class="btn-fermer" id="btn-fermer-planif" aria-label="Fermer">&times;</button>
            </div>
            <p style="font-size: 0.85rem; color: var(--ink-muted); margin-bottom: 18px;">
                Date : <strong style="color: var(--navy);">${dateLisible}</strong>
            </p>
            <form id="form-planification">
                <label for="planif-label">Intention ou tâche :</label>
                <input type="text" id="planif-label" placeholder="Ex: Réviser les chapitres 1 et 2…"
                       required autocomplete="off" class="popup-input" />

                <label for="planif-matiere" style="margin-top: 14px;">Matière associée (facultatif) :</label>
                <select id="planif-matiere">${optionsMatieresHtml}</select>

                <label for="planif-duree" style="margin-top: 14px;">Durée estimée (min) :</label>
                <input type="number" id="planif-duree" value="45" min="5" step="5"
                       style="width: 100%; padding: 9px 11px; border: 1px solid var(--line);
                              border-radius: var(--rayon-petit); background: white; margin-bottom: 22px;" />

                <div class="boutons-minuteur">
                    <button type="button" class="btn btn-secondaire" id="btn-annuler-planif">Annuler</button>
                    <button type="submit" class="btn btn-principal">Enregistrer</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(fond);

    const inputLabel = document.getElementById("planif-label");
    inputLabel?.focus();

    const fermer = () => {
        fond.remove();
        window.removeEventListener("keydown", onEscape);
    };

    const onEscape = (ev) => {
        if (ev.key === "Escape") fermer();
    };

    on("btn-fermer-planif", "click", fermer);
    on("btn-annuler-planif", "click", fermer);
    window.addEventListener("keydown", onEscape);

    fond.addEventListener("click", (e) => {
        if (e.target === fond) fermer();
    });

    on("form-planification", "submit", (e) => {
        e.preventDefault();
        const label = inputLabel?.value.trim();
        const matiereId = document.getElementById("planif-matiere")?.value || null;
        const duree =
            parseInt(document.getElementById("planif-duree")?.value, 10) || 0;

        if (!label) return;

        Data.ajouterSession({
            date: dateISO,
            duree,
            type: "planifiee",
            matiereId: matiereId || null,
            label,
        });

        fermer();
    });
}

/* --- Événements réactifs & Démarrage --- */

window.addEventListener("studyhub:donnees-modifiees", redessinerVueActuelle);

Data.charger();
initPomodoro();
afficherVue("bibliotheque");
