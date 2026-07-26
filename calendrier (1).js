import * as Data from "./data.js";

const NOMS_JOURS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MAX_ETIQUETTES_VISIBLES = 3;

/* --- Affichage principal --- */

export function renderCalendrier(date) {
    document.getElementById("titre-mois").textContent = formatTitreMois(date);

    const conteneur = document.getElementById("grille-calendrier");
    conteneur.innerHTML = "";

    NOMS_JOURS.forEach((nom) => {
        const entete = document.createElement("div");
        entete.className = "entete-jour-semaine";
        entete.textContent = nom;
        conteneur.appendChild(entete);
    });

    construireJoursDuMois(date.getFullYear(), date.getMonth()).forEach((jour) => {
        conteneur.appendChild(creerCaseJour(jour));
    });
}

/* --- Grille du mois --- */

function construireJoursDuMois(annee, mois) {
    const premierJourMois = new Date(annee, mois, 1);
    const decalageDebut = (premierJourMois.getDay() + 6) % 7;
    const nbJoursMois = new Date(annee, mois + 1, 0).getDate();

    const jours = [];

    for (let i = decalageDebut; i > 0; i--) {
        jours.push({ date: new Date(annee, mois, 1 - i), horsMois: true });
    }

    for (let jour = 1; jour <= nbJoursMois; jour++) {
        jours.push({ date: new Date(annee, mois, jour), horsMois: false });
    }

    const casesRestantes = (7 - (jours.length % 7)) % 7;
    for (let jour = 1; jour <= casesRestantes; jour++) {
        jours.push({ date: new Date(annee, mois + 1, jour), horsMois: true });
    }

    return jours;
}

/* --- Composants de case --- */

function creerCaseJour({ date, horsMois }) {
    const dateISO = formatDateISO(date);
    const aujourdhuiISO = formatDateISO(new Date());

    const estWeekend = date.getDay() === 0 || date.getDay() === 6;
    const estAujourdhui = dateISO === aujourdhuiISO;

    const case_ = document.createElement("div");
    case_.className = "case-jour";
    case_.dataset.date = dateISO;

    if (horsMois) case_.classList.add("hors-mois");
    if (estWeekend) case_.classList.add("weekend");

    if (dateISO < aujourdhuiISO) {
        case_.classList.add("passe");
    } else if (dateISO > aujourdhuiISO) {
        case_.classList.add("futur");
    }

    const numero = document.createElement("span");
    numero.className = "numero-jour";
    if (estAujourdhui) numero.classList.add("aujourdhui");
    numero.textContent = date.getDate();
    case_.appendChild(numero);

    const sessions = Data.getSessionsPourDate(dateISO);
    sessions.slice(0, MAX_ETIQUETTES_VISIBLES).forEach((session) => {
        case_.appendChild(creerEtiquetteSession(session));
    });

    const sessionsCachees = sessions.length - MAX_ETIQUETTES_VISIBLES;
    if (sessionsCachees > 0) {
        const compteur = document.createElement("span");
        compteur.className = "etiquette-session etiquette-plus";
        compteur.textContent = `+${sessionsCachees}`;
        case_.appendChild(compteur);
    }

    return case_;
}

function creerEtiquetteSession(session) {
    const etiquette = document.createElement("span");
    etiquette.className = "etiquette-session";
    etiquette.textContent = `${session.label} – ${formatDuree(session.duree)}`;
    return etiquette;
}

/* --- Helpers de formatage --- */

function formatTitreMois(date) {
    const texte = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function formatDateISO(date) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, "0");
    const jour = String(date.getDate()).padStart(2, "0");
    return `${annee}-${mois}-${jour}`;
}

function formatDuree(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const heures = Math.floor(minutes / 60);
    const reste = minutes % 60;
    return reste === 0 ? `${heures}h` : `${heures}h${reste}m`;
}