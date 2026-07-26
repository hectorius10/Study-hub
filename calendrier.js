/* ============================================================
   calendrier.js — Rendu et interactions du calendrier
   ============================================================ */

import { getSessionsPourDate, getMatieres, ajouterSession, ajouterEvenement } from "./data.js";

// État d'affichage (propre à cet écran)
let anneeAffichee;
let moisAffiche;

const NOMS_MOIS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];
const NOMS_JOURS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

// ========== FONCTIONS DE FORMAT ==========

function pad(n) { return String(n).padStart(2, "0"); }

function formatISO(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDuree(minutes) {
    if (!minutes) return "";
    const h = Math.floor(minutes / 60);
    const r = minutes % 60;
    if (h === 0) return `${r}m`;
    return r === 0 ? `${h}h` : `${h}h${r}m`;
}

function formatDateLisible(dateISO) {
    const [annee, mois, jour] = dateISO.split("-").map(Number);
    return `${jour} ${NOMS_MOIS[mois - 1]} ${annee}`;
}

// ========== CONSTRUCTION HTML ==========

function construireCellulesDuMois(annee, mois) {
    const premier = new Date(annee, mois, 1);
    const jsJour = premier.getDay();
    const decalage = (jsJour + 6) % 7;
    const debut = new Date(annee, mois, 1 - decalage);
    const dernier = new Date(annee, mois + 1, 0).getDate();
    const nbCellules = Math.ceil((decalage + dernier) / 7) * 7;
    const aujourdISO = formatISO(new Date());
    const cellules = [];

    for (let i = 0; i < nbCellules; i++) {
        const d = new Date(debut);
        d.setDate(debut.getDate() + i);
        const iso = formatISO(d);
        const jourSem = d.getDay();
        cellules.push({
            dateISO: iso,
            jour: d.getDate(),
            horsMois: d.getMonth() !== mois,
            weekend: jourSem === 0 || jourSem === 6,
            estAujourdhui: iso === aujourdISO,
            sessions: getSessionsPourDate(iso)
        });
    }
    return cellules;
}

function construireEtiquetteHTML(session) {
    const estEvenement = session.type === "evenement";
    const classe = estEvenement ? "cal-etiquette--evenement" : "cal-etiquette--session";
    const texte = estEvenement ? session.label : `${session.label} – ${formatDuree(session.duree)}`;
    return `<button type="button" class="cal-etiquette ${classe}" data-action="voir-session" data-session-id="${session.id}">${texte}</button>`;
}

function construireCelluleHTML(cellule) {
    const classes = ["cal-cellule"];
    if (cellule.horsMois) classes.push("cal-cellule--hors-mois");
    if (cellule.weekend) classes.push("cal-cellule--weekend");
    if (cellule.estAujourdhui) classes.push("cal-cellule--aujourdhui");

    const maxVisible = 3;
    const visibles = cellule.sessions.slice(0, maxVisible);
    const reste = cellule.sessions.length - visibles.length;

    const etiquettesHTML = visibles.map(s => construireEtiquetteHTML(s)).join("");
    const plusHTML = reste > 0 ? `<div class="cal-etiquette cal-etiquette--plus" data-action="voir-jour" data-date="${cellule.dateISO}">+${reste}</div>` : "";

    return `<div class="${classes.join(" ")}" data-action="clic-jour" data-date="${cellule.dateISO}">
        <div class="cal-numero-jour">
            ${cellule.jour}
            ${cellule.estAujourdhui ? '<span class="cal-point-aujourdhui" aria-hidden="true"></span>' : ""}
        </div>
        <div class="cal-etiquettes">${etiquettesHTML}${plusHTML}</div>
    </div>`;
}

function construireHTML(annee, mois) {
    const cellules = construireCellulesDuMois(annee, mois);
    const entetes = NOMS_JOURS.map((nom, i) => {
        const estWeekend = i === 5 || i === 6;
        return `<div class="cal-entete-jour${estWeekend ? " cal-entete-jour--weekend" : ""}">${nom}</div>`;
    }).join("");
    const grille = cellules.map(c => construireCelluleHTML(c)).join("");

    return `<div class="cal-screen">
        <div class="cal-header">
            <button type="button" class="cal-nav-btn" data-action="mois-precedent">‹</button>
            <h2 class="cal-titre">${NOMS_MOIS[mois]} ${annee}</h2>
            <button type="button" class="cal-nav-btn" data-action="mois-suivant">›</button>
            <button type="button" class="cal-btn-today" data-action="aujourdhui">Aujourd'hui</button>
        </div>
        <div class="cal-grille">${entetes}${grille}</div>
    </div>`;
}

// ========== POPUPS ==========

function ouvrirPopupAjout(dateISO, conteneur) {
    const matieres = getMatieres();
    const options = matieres.map(m => `<option value="${m.id}">${m.nom}</option>`).join("");

    const fond = document.createElement("div");
    fond.className = "cal-modal-fond";
    fond.innerHTML = `
        <div class="cal-modal" role="dialog" aria-modal="true">
            <button type="button" class="cal-modal-fermer" data-fermer>×</button>
            <h3>Ajouter au ${formatDateLisible(dateISO)}</h3>
            <div class="cal-modal-onglets">
                <button type="button" class="cal-modal-onglet cal-modal-onglet--actif" data-onglet="revision">Révision</button>
                <button type="button" class="cal-modal-onglet" data-onglet="echeance">Échéance</button>
            </div>
            <form data-formulaire="revision" class="cal-modal-formulaire">
                <label class="cal-modal-champ">Matière <select name="matiereId">${options}</select></label>
                <label class="cal-modal-champ">Durée (min) <input type="number" name="duree" value="25" min="5" step="5" /></label>
                <button type="submit" class="cal-modal-valider">Planifier</button>
            </form>
            <form data-formulaire="echeance" class="cal-modal-formulaire" hidden>
                <label class="cal-modal-champ">Libellé <input type="text" name="label" required /></label>
                <button type="submit" class="cal-modal-valider">Ajouter l'échéance</button>
            </form>
        </div>
    `;
    document.body.appendChild(fond);

    fond.querySelectorAll("[data-onglet]").forEach(btn => {
        btn.addEventListener("click", () => {
            fond.querySelectorAll("[data-onglet]").forEach(b => b.classList.remove("cal-modal-onglet--actif"));
            btn.classList.add("cal-modal-onglet--actif");
            fond.querySelector('[data-formulaire="revision"]').hidden = btn.dataset.onglet !== "revision";
            fond.querySelector('[data-formulaire="echeance"]').hidden = btn.dataset.onglet !== "echeance";
        });
    });

    fond.querySelector('[data-formulaire="revision"]').addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        ajouterSession({
            date: dateISO,
            duree: Number(fd.get("duree")),
            type: "pomodoro",
            matiereId: fd.get("matiereId")
        });
        fond.remove();
        renderCalendrier(conteneur);
    });

    fond.querySelector('[data-formulaire="echeance"]').addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        ajouterEvenement({ date: dateISO, label: fd.get("label") });
        fond.remove();
        renderCalendrier(conteneur);
    });

    fond.querySelector("[data-fermer]").addEventListener("click", () => fond.remove());
    fond.addEventListener("click", (e) => { if (e.target === fond) fond.remove(); });
}

function ouvrirPopupDetail(sessionId, dateISO, conteneur) {
    const session = getSessionsPourDate(dateISO).find(s => s.id === sessionId);
    if (!session) return;

    const estEvenement = session.type === "evenement";
    const fond = document.createElement("div");
    fond.className = "cal-modal-fond";
    fond.innerHTML = `
        <div class="cal-modal" role="dialog" aria-modal="true">
            <button type="button" class="cal-modal-fermer" data-fermer>×</button>
            <h3>${session.label}</h3>
            <p class="cal-modal-detail">${formatDateLisible(dateISO)}</p>
            ${estEvenement ? "" : `<p class="cal-modal-detail">Durée : ${formatDuree(session.duree)}</p>`}
        </div>
    `;
    document.body.appendChild(fond);
    fond.querySelector("[data-fermer]").addEventListener("click", () => fond.remove());
    fond.addEventListener("click", (e) => { if (e.target === fond) fond.remove(); });
}

// ========== GESTION DES ÉVÉNEMENTS (UN SEUL ÉCOUTEUR) ==========

function gestionnaireClic(e) {
    const cible = e.target.closest("[data-action]");
    if (!cible) return;

    const conteneur = e.currentTarget; // l'élément sur lequel l'écouteur est attaché

    switch (cible.dataset.action) {
        case "mois-precedent":
            moisAffiche--;
            if (moisAffiche < 0) { moisAffiche = 11; anneeAffichee--; }
            renderCalendrier(conteneur);
            break;
        case "mois-suivant":
            moisAffiche++;
            if (moisAffiche > 11) { moisAffiche = 0; anneeAffichee++; }
            renderCalendrier(conteneur);
            break;
        case "aujourdhui": {
            const maintenant = new Date();
            anneeAffichee = maintenant.getFullYear();
            moisAffiche = maintenant.getMonth();
            renderCalendrier(conteneur);
            break;
        }
        case "clic-jour":
            if (e.target.closest(".cal-etiquette")) return;
            ouvrirPopupAjout(cible.dataset.date, conteneur);
            break;
        case "voir-jour":
            ouvrirPopupAjout(cible.dataset.date, conteneur);
            break;
        case "voir-session":
            const date = cible.closest("[data-date]")?.dataset.date || formatISO(new Date());
            ouvrirPopupDetail(cible.dataset.sessionId, date, conteneur);
            break;
    }
}

// ========== EXPORTATION PRINCIPALE ==========

export function renderCalendrier(conteneur) {
    const aujourd = new Date();
    if (anneeAffichee === undefined) {
        anneeAffichee = aujourd.getFullYear();
        moisAffiche = aujourd.getMonth();
    }
    conteneur.innerHTML = construireHTML(anneeAffichee, moisAffiche);
    // L'écouteur d'événements est déjà attaché une fois (par initialiserCalendrier)
}

// Fonction d'initialisation à appeler une seule fois dans app.js
export function initialiserCalendrier(conteneur) {
    // Supprime l'écouteur s'il existe déjà (au cas où)
    conteneur.removeEventListener("click", gestionnaireClic);
    conteneur.addEventListener("click", gestionnaireClic);
}