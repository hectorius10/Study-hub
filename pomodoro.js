/* Study Hub - Minuteur Pomodoro & Sessions Focus */

import * as Data from "./data.js";

/* --- Profils de productivité (durées en minutes) --- */

const PROFILS_POMODORO = {
    micro: {
        travail: 15, // Idéal pour démarrer sans blocage
        pause_courte: 3,
        pause_longue: 10,
    },
    classique: {
        travail: 25, // Le format standard pour les révisions
        pause_courte: 5,
        pause_longue: 15,
    },
    etendu: {
        travail: 50, // Pour le travail en profondeur (code, rédaction)
        pause_courte: 10,
        pause_longue: 30,
    },
};

/* --- État interne du minuteur --- */

let profilActif = "classique";
let typeSession = "pomodoro"; // "pomodoro" | "pause_courte" | "pause_longue"
let compteurCycles = 0; // Pause longue au bout de 4 cycles

let dureeMinutes = PROFILS_POMODORO[profilActif].travail;
let secondesRestantes = dureeMinutes * 60;

let intervalId = null;
let enCours = false;

// Liens avec la matière et la tâche sélectionnées
let matiereActiveId = null;
let moduleActifId = null;
let tacheActiveId = null;

// Son de fin de cycle (activé par défaut)
let sonActive = true;
let contexteAudio = null;

/* --- Éléments du DOM --- */

const popupFond = document.getElementById("popup-pomodoro");
const boutonsOnglets = document.querySelectorAll(".onglet-duree");
const affichageMinuteur = document.getElementById("minuteur-affichage");
const statutMinuteur = document.getElementById("minuteur-statut");
const selectMatiereActive = document.getElementById("select-matiere-active");
const boutonReinitialiser = document.getElementById("btn-reinitialiser-minuteur");
const boutonDemarrerPause = document.getElementById("btn-demarrer-pause");
const boutonTerminerTache = document.getElementById("btn-terminer-tache");
const boutonFermer = document.getElementById("btn-fermer-popup");
const boutonSon = document.getElementById("btn-son-pomodoro");
const indicateurFlottant = document.getElementById("indicateur-flottant");
const indicateurFlottantIcone = document.getElementById("indicateur-flottant-icone");
const indicateurFlottantTemps = document.getElementById("indicateur-flottant-temps");

const TITRE_PAGE_PAR_DEFAUT = document.title;

/* --- Initialisation --- */

export function initPomodoro() {
    boutonsOnglets.forEach((bouton) => {
        bouton.addEventListener("click", () => changerProfil(bouton));
    });

    boutonDemarrerPause.addEventListener("click", () => {
        enCours ? mettreEnPause() : demarrer();
    });

    boutonReinitialiser.addEventListener("click", reinitialiserMinuteur);
    boutonTerminerTache.addEventListener("click", terminerTache);
    boutonFermer.addEventListener("click", fermerPopup);
    boutonSon.addEventListener("click", basculerSon);

    selectMatiereActive.addEventListener("change", (e) => {
        matiereActiveId = e.target.value || null;
    });

    popupFond.addEventListener("click", (e) => {
        if (e.target === popupFond) fermerPopup();
    });

    // Cliquer sur l'indicateur flottant rouvre la popup sur la session en cours
    indicateurFlottant.addEventListener("click", () => {
        popupFond.hidden = false;
        mettreAJourIndicateurFlottant();
    });

    mettreAJourAffichage();
}

/* --- Son de fin de cycle --- */

function basculerSon() {
    sonActive = !sonActive;
    boutonSon.textContent = sonActive ? "🔊" : "🔇";
    boutonSon.setAttribute("aria-label", sonActive ? "Couper le son" : "Activer le son");
    boutonSon.title = sonActive ? "Couper le son" : "Activer le son";
}

// Crée le contexte audio à la demande (évite les blocages "autoplay" des navigateurs)
function obtenirContexteAudio() {
    if (!contexteAudio) {
        const AudioContextRef = window.AudioContext || window.webkitAudioContext;
        contexteAudio = new AudioContextRef();
    }
    if (contexteAudio.state === "suspended") {
        contexteAudio.resume();
    }
    return contexteAudio;
}

// Joue un petit carillon (3 notes ascendantes) pour signaler la fin d'un cycle
function jouerSonFinDeCycle() {
    if (!sonActive) return;

    try {
        const ctx = obtenirContexteAudio();
        const maintenant = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // Do5, Mi5, Sol5

        notes.forEach((frequence, index) => {
            const oscillateur = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillateur.type = "sine";
            oscillateur.frequency.value = frequence;

            const debut = maintenant + index * 0.15;
            gain.gain.setValueAtTime(0, debut);
            gain.gain.linearRampToValueAtTime(0.25, debut + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, debut + 0.35);

            oscillateur.connect(gain);
            gain.connect(ctx.destination);
            oscillateur.start(debut);
            oscillateur.stop(debut + 0.4);
        });
    } catch (erreur) {
        console.warn("[StudyHub] Impossible de jouer le son de fin de cycle :", erreur);
    }
}

/* --- Gestion de la popup (Ouverture / Fermeture) --- */

export function ouvrirPopupPomodoro({ matiereId = null, moduleId = null, tacheId = null } = {}) {
    if (!enCours) {
        matiereActiveId = matiereId;
        moduleActifId = moduleId;
        tacheActiveId = tacheId;

        remplirSelectMatiereActive();
        boutonTerminerTache.hidden = !tacheId;

        // On repart sur une session de travail neuve tout en gardant le profil actif
        typeSession = "pomodoro";
        compteurCycles = 0;
        dureeMinutes = PROFILS_POMODORO[profilActif].travail;
        reinitialiserMinuteur();
    }

    popupFond.hidden = false;
    mettreAJourIndicateurFlottant();
}

function fermerPopup() {
    popupFond.hidden = true;
    mettreAJourIndicateurFlottant();
}

/* --- Sélecteur de matière --- */

function remplirSelectMatiereActive() {
    const optionLibre = `<option value="">— Révision libre —</option>`;
    const optionsMatieres = Data.getMatieres()
        .map((m) => `<option value="${m.id}">${m.nom}</option>`)
        .join("");

    selectMatiereActive.innerHTML = optionLibre + optionsMatieres;
    selectMatiereActive.value = matiereActiveId || "";
}

/* --- Changement de profil (Micro / Classique / Étendu) --- */

function changerProfil(boutonClique) {
    boutonsOnglets.forEach((b) => b.classList.toggle("actif", b === boutonClique));

    profilActif = boutonClique.dataset.profil;

    typeSession = "pomodoro";
    compteurCycles = 0;
    dureeMinutes = PROFILS_POMODORO[profilActif].travail;

    reinitialiserMinuteur();
}

/* --- Logique du minuteur & cycles --- */

function demarrer() {
    enCours = true;
    boutonDemarrerPause.textContent = "Pause";
    intervalId = window.setInterval(tick, 1000);
    mettreAJourAffichage();
}

function mettreEnPause() {
    enCours = false;
    boutonDemarrerPause.textContent = "Démarrer";
    window.clearInterval(intervalId);
    mettreAJourAffichage();
}

function reinitialiserMinuteur() {
    mettreEnPause();
    secondesRestantes = dureeMinutes * 60;
    mettreAJourAffichage();
}

// S'exécute chaque seconde : enregistre le temps si terminé et bascule le cycle
function tick() {
    secondesRestantes--;

    if (secondesRestantes <= 0) {
        jouerSonFinDeCycle();
        enregistrerSessionEcoulee();
        basculerCycleAutomatique();
    }

    mettreAJourAffichage();
}

// Détermine la phase suivante selon les règles Pomodoro (travail -> pause -> travail...)
function basculerCycleAutomatique() {
    if (typeSession === "pomodoro") {
        compteurCycles++;

        // Tous les 4 cycles de travail, on déclenche une pause longue
        if (compteurCycles > 0 && compteurCycles % 4 === 0) {
            typeSession = "pause_longue";
            dureeMinutes = PROFILS_POMODORO[profilActif].pause_longue;
        } else {
            typeSession = "pause_courte";
            dureeMinutes = PROFILS_POMODORO[profilActif].pause_courte;
        }
    } else {
        typeSession = "pomodoro";
        dureeMinutes = PROFILS_POMODORO[profilActif].travail;
    }

    secondesRestantes = dureeMinutes * 60;
}

/* --- Marquer la tâche comme terminée --- */

function terminerTache() {
    enregistrerSessionEcoulee();

    if (matiereActiveId && moduleActifId && tacheActiveId) {
        Data.basculerTache(matiereActiveId, moduleActifId, tacheActiveId);
    }

    mettreEnPause();
    fermerPopup();
}

/* --- Enregistrement des sessions (Historique / Calendrier) --- */

function enregistrerSessionEcoulee() {
    if (typeSession !== "pomodoro") return;

    const secondesEcoulees = dureeMinutes * 60 - secondesRestantes;
    const dureeReelle = Math.round(secondesEcoulees / 60);
    if (dureeReelle <= 0) return;

    Data.ajouterSession({
        date: formatDateISO(new Date()),
        duree: dureeReelle,
        type: typeSession,
        matiereId: matiereActiveId,
        tacheId: tacheActiveId,
    });
}

function formatDateISO(date) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, "0");
    const jour = String(date.getDate()).padStart(2, "0");
    return `${annee}-${mois}-${jour}`;
}

/* --- Rendu dynamique de l'interface --- */

function mettreAJourAffichage() {
    const minutes = Math.floor(secondesRestantes / 60);
    const secondes = secondesRestantes % 60;
    affichageMinuteur.textContent = `${String(minutes).padStart(2, "0")}:${String(secondes).padStart(2, "0")}`;

    let texteStatut = "";

    if (enCours) {
        if (typeSession === "pomodoro") texteStatut = "FOCUS ACTIF";
        else if (typeSession === "pause_courte") texteStatut = "PAUSE COURTE EN COURS";
        else texteStatut = "PAUSE LONGUE EN COURS";
    } else if (secondesRestantes === dureeMinutes * 60) {
        if (typeSession === "pomodoro") texteStatut = "PRÊT À DÉMARRER";
        else texteStatut = "PAUSE PRÊTE";
    } else {
        texteStatut = "EN PAUSE";
    }

    statutMinuteur.textContent = texteStatut;

    mettreAJourTitrePage();
    mettreAJourIndicateurFlottant();
}

/* --- Signaux "tourne en arrière-plan" (titre d'onglet & pastille flottante) --- */

// Affiche le compte à rebours directement dans le titre de l'onglet du navigateur
function mettreAJourTitrePage() {
    if (!enCours) {
        document.title = TITRE_PAGE_PAR_DEFAUT;
        return;
    }

    const minutes = Math.floor(secondesRestantes / 60);
    const secondes = secondesRestantes % 60;
    const icone = typeSession === "pomodoro" ? "🍅" : "☕";
    document.title = `${icone} ${String(minutes).padStart(2, "0")}:${String(secondes).padStart(2, "0")} — Study Hub`;
}

// Affiche/masque la pastille flottante : uniquement visible quand ça tourne ET que la popup est fermée
function mettreAJourIndicateurFlottant() {
    const doitAfficher = enCours && popupFond.hidden;
    indicateurFlottant.hidden = !doitAfficher;

    if (!doitAfficher) return;

    const minutes = Math.floor(secondesRestantes / 60);
    const secondes = secondesRestantes % 60;
    indicateurFlottantTemps.textContent = `${String(minutes).padStart(2, "0")}:${String(secondes).padStart(2, "0")}`;
    indicateurFlottantIcone.textContent = typeSession === "pomodoro" ? "🍅" : "☕";
}