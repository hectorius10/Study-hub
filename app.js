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
    const nom = window.prompt("Nom de la nouvelle matière :");
    if (!nom?.trim()) return;
    const description = window.prompt("Description (facultative) :") || "";
    const matiere = Data.ajouterMatiere({
        nom: nom.trim(),
        description: description.trim(),
    });
    afficherVue("matiere", { matiereId: matiere.id });
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
    const matiere = Data.getMatiere(matiereOuverteId);
    if (!matiere) return;

    const nom = window.prompt("Nouveau nom :", matiere.nom);
    if (!nom?.trim()) return;

    const description =
        window.prompt(
            "Nouvelle description (facultative) :",
            matiere.description,
        ) || "";
    Data.modifierMatiere(matiere.id, {
        nom: nom.trim(),
        description: description.trim(),
    });
});

on("btn-ajouter-module", "click", () => {
    const titre = window.prompt("Titre du nouveau module :");
    if (titre?.trim())
        Data.ajouterModule(matiereOuverteId, { titre: titre.trim() });
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
    const matiere = Data.getMatiere(matiereOuverteId);
    if (!matiere?.modules?.length) {
        window.alert("Cette matière ne contient encore aucun module à modifier.");
        return;
    }

    let message = "Quel module souhaitez-vous modifier ? Entrez son numéro :\n\n";
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

    const moduleCible = matiere.modules[index];
    const nouveauTitre = window.prompt(
        "Corrigez le titre du module :",
        moduleCible.titre,
    );
    if (nouveauTitre === null) return;

    const nouvelleDescription = window.prompt(
        "Modifiez la description (facultatif) :",
        moduleCible.description,
    );
    const descriptionFinale =
        nouvelleDescription !== null
            ? nouvelleDescription
            : moduleCible.description;

    if (nouveauTitre.trim()) {
        Data.modifierModule(matiereOuverteId, moduleCible.id, {
            titre: nouveauTitre.trim(),
            description: descriptionFinale,
        });
    } else {
        window.alert("Le titre d'un module ne peut pas être vide.");
    }
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
