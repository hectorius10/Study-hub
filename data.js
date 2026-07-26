/* Study Hub - Gestion des données & LocalStorage */

const STORAGE_KEY = "studyhub";
const UN_JOUR_MS = 1000 * 60 * 60 * 24;

/* --- Données initiales (premier lancement) --- */

const donneesInitiales = {
    matieres: [
        {
            id: "mat-1",
            
            nom: "Maîtrise de JavaScript",
            description: "Structures de données avancées, closures et programmation asynchrone.",
            progres: 0,
            creeLe: Date.now() - 25 * UN_JOUR_MS,
            modules: [
                {
                    id: "mod-1-1",
                    titre: "Module 1 : Fondamentaux ES6+",
                    description: "Arrow functions, destructuring, spread operators, et syntaxe moderne.",
                    progres: 0,
                    taches: [
                        { id: "t-1-1-1", titre: "1.1 Fonctions Fléchées en Profondeur", statut: "faite" },
                        { id: "t-1-1-2", titre: "1.2 Déstructuration d'Objets & Tableaux", statut: "faite" },
                        { id: "t-1-1-3", titre: "1.3 Promesses & Async/Await", statut: "faite" },
                        { id: "t-1-1-4", titre: "1.4 Modules & Imports ES6", statut: "faite" },
                    ],
                },
                {
                    id: "mod-1-2",
                    titre: "Module 2 : Manipulation Avancée du DOM",
                    description: "Événements, délégation et concepts du DOM virtuel.",
                    progres: 0,
                    taches: [
                        { id: "t-1-2-1", titre: "2.1 Délégation d'Événements", statut: "faite" },
                        { id: "t-1-2-2", titre: "2.2 Observer les Mutations du DOM", statut: "a_faire" },
                        { id: "t-1-2-3", titre: "2.3 Optimisation des Redraws & Reflows", statut: "a_faire" },
                    ],
                },
                {
                    id: "mod-1-3",
                    titre: "Module 3 : Event Loop & Asynchronisme",
                    description: "Call stack, Microtasks, Macrotasks et Web Workers.",
                    progres: 0,
                    taches: [
                        { id: "t-1-3-1", titre: "3.1 Comprendre la Call Stack et l'Event Loop", statut: "faite" },
                        { id: "t-1-3-2", titre: "3.2 Microtasks vs Macrotasks", statut: "a_faire" },
                        { id: "t-1-3-3", titre: "3.3 Multithreading avec les Web Workers", statut: "a_faire" },
                    ],
                },
            ],
        },
        {
            id: "mat-2",
            nom: "Calcul Avancé",
            description: "Intégrales multiples, théorèmes de Green, Stokes et divergence.",
            progres: 0,
            creeLe: Date.now() - 20 * UN_JOUR_MS,
            modules: [
                {
                    id: "mod-2-1",
                    titre: "Module 1 : Intégrales Multiples",
                    description: "Intégrales doubles et triples, changement de variables.",
                    progres: 0,
                    taches: [
                        { id: "t-2-1-1", titre: "1.1 Intégrales Doubles", statut: "faite" },
                        { id: "t-2-1-2", titre: "1.2 Coordonnées Polaires & Cylindriques", statut: "faite" },
                        { id: "t-2-1-3", titre: "1.3 Intégrales Triples & Sphériques", statut: "a_faire" },
                    ],
                },
                {
                    id: "mod-2-2",
                    titre: "Module 2 : Théorèmes d'Analyse Vectorielle",
                    description: "Champs de vecteurs, Théorèmes de Green, Stokes et de la Divergence.",
                    progres: 0,
                    taches: [
                        { id: "t-2-2-1", titre: "2.1 Théorème de Green dans le Plan", statut: "a_faire" },
                        { id: "t-2-2-2", titre: "2.2 Calcul du Rotor et de la Divergence", statut: "a_faire" },
                        { id: "t-2-2-3", titre: "2.3 Théorème de Stokes en 3D", statut: "a_faire" },
                    ],
                },
            ],
        },
        {
            id: "mat-3",
            nom: "Chimie Organique",
            description: "Mécanismes de réaction, stéréochimie et synthèse moléculaire.",
            progres: 0,
            creeLe: Date.now() - 15 * UN_JOUR_MS,
            modules: [
                {
                    id: "mod-3-1",
                    titre: "Module 1 : Mécanismes Réactionnels",
                    description: "Substitutions, additions et éliminations.",
                    progres: 0,
                    taches: [
                        { id: "t-3-1-1", titre: "1.1 Substitution Nucléophile (SN1 / SN2)", statut: "faite" },
                        { id: "t-3-1-2", titre: "1.2 Élimination (E1 / E2)", statut: "a_faire" },
                        { id: "t-3-1-3", titre: "1.3 Addition Électrophile sur Alcènes", statut: "a_faire" },
                    ],
                },
                {
                    id: "mod-3-2",
                    titre: "Module 2 : Stéréochimie & Isomérie",
                    description: "Chiralité, énantiomères, représentations de Cram et Newman.",
                    progres: 0,
                    taches: [
                        { id: "t-3-2-1", titre: "2.1 Stéréocentres et Configuration R/S", statut: "a_faire" },
                        { id: "t-3-2-2", titre: "2.2 Conformations de Newman et Chaise", statut: "a_faire" },
                    ],
                },
            ],
        },
    ],

    /* --- Sessions d'étude planifiées et effectuées (Juillet 2026) --- */
    sessions: [
        {
            id: "sess-01",
            date: "2026-07-02",
            duree: 50,
            type: "pomodoro",
            matiereId: "mat-1",
            tacheId: "t-1-1-1",
            label: "Revision ES6 - Fonctions Fléchées",
        },
        {
            id: "sess-02",
            date: "2026-07-04",
            duree: 25,
            type: "pomodoro",
            matiereId: "mat-2",
            tacheId: "t-2-1-1",
            label: "Calcul - Intégrales Doubles",
        },
        {
            id: "sess-03",
            date: "2026-07-07",
            duree: 75,
            type: "pomodoro",
            matiereId: "mat-1",
            tacheId: "t-1-1-3",
            label: "JS Async/Await & Promesses",
        },
        {
            id: "sess-04",
            date: "2026-07-10",
            duree: 50,
            type: "pomodoro",
            matiereId: "mat-3",
            tacheId: "t-3-1-1",
            label: "Chimie - SN1 vs SN2",
        },
        {
            id: "sess-05",
            date: "2026-07-13",
            duree: 50,
            type: "pomodoro",
            matiereId: "mat-2",
            tacheId: "t-2-1-2",
            label: "Coordonnées Polaires & Cylindriques",
        },
        {
            id: "sess-06",
            date: "2026-07-16",
            duree: 25,
            type: "pomodoro",
            matiereId: "mat-1",
            tacheId: "t-1-2-1",
            label: "Délégation d'événements DOM",
        },
        {
            id: "sess-07",
            date: "2026-07-19",
            duree: 50,
            type: "pomodoro",
            matiereId: "mat-1",
            tacheId: "t-1-3-1",
            label: "Event Loop & Call Stack",
        },
        {
            id: "sess-08",
            date: "2026-07-22",
            duree: 50,
            type: "pomodoro",
            matiereId: "mat-3",
            tacheId: "t-3-1-2",
            label: "Mécanismes d'Élimination E1/E2",
        },
        {
            id: "sess-09",
            date: "2026-07-25",
            duree: 50,
            type: "pomodoro",
            matiereId: "mat-1",
            tacheId: "t-1-3-2",
            label: "Microtasks & Macrotasks",
        },
        {
            id: "sess-10",
            date: "2026-07-27",
            duree: 0,
            type: "planifiee",
            matiereId: "mat-2",
            tacheId: "t-2-2-1",
            label: "Théorème de Green dans le Plan",
        },
        {
            id: "sess-11",
            date: "2026-07-29",
            duree: 0,
            type: "planifiee",
            matiereId: "mat-3",
            tacheId: "t-3-2-1",
            label: "Stéréochimie & Configurations R/S",
        },
        {
            id: "sess-12",
            date: "2026-07-31",
            duree: 0,
            type: "planifiee",
            matiereId: "mat-1",
            tacheId: "t-1-3-3",
            label: "Web Workers & Parallélisme JS",
        },
    ],
};

/* --- Gestion du State & LocalStorage --- */

let etat = null;

export function charger() {
    const brut = window.localStorage.getItem(STORAGE_KEY);
    if (brut) {
        try {
            etat = JSON.parse(brut);
        } catch {
            etat = structuredClone(donneesInitiales);
        }
    } else {
        etat = structuredClone(donneesInitiales);
    }

    etat.matieres.forEach(recalculerProgres);
    sauvegarder();
    return etat;
}

function sauvegarder() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(etat));
    window.dispatchEvent(new CustomEvent("studyhub:donnees-modifiees"));
}

export function reinitialiser() {
    etat = structuredClone(donneesInitiales);
    etat.matieres.forEach(recalculerProgres);
    sauvegarder();
    return etat;
}

/* --- Calculs de progression --- */

function calculerProgresModule(module) {
    if (!module.taches || module.taches.length === 0) return 0;
    const faites = module.taches.filter((t) => t.statut === "faite").length;
    return Math.round((faites / module.taches.length) * 100);
}

function calculerProgresMatiere(matiere) {
    if (!matiere.modules || matiere.modules.length === 0) return 0;
    const somme = matiere.modules.reduce((acc, m) => acc + m.progres, 0);
    return Math.round(somme / matiere.modules.length);
}

function recalculerProgres(matiere) {
    matiere.modules.forEach((m) => (m.progres = calculerProgresModule(m)));
    matiere.progres = calculerProgresMatiere(matiere);
}

/* --- Utilitaires --- */

function genId(prefixe) {
    return `${prefixe}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/* --- Getters (lecture) --- */

export function getEtat() {
    return etat;
}

export function getMatieres() {
    return etat?.matieres || [];
}

export function getMatiere(matiereId) {
    return etat?.matieres.find((m) => m.id === matiereId) || null;
}

export function getModule(matiereId, moduleId) {
    const matiere = getMatiere(matiereId);
    return matiere ? matiere.modules.find((m) => m.id === moduleId) || null : null;
}

export function getTache(matiereId, moduleId, tacheId) {
    const module = getModule(matiereId, moduleId);
    return module ? module.taches.find((t) => t.id === tacheId) || null : null;
}

export function getSessions() {
    return etat?.sessions || [];
}

export function getSessionsPourDate(dateISO) {
    return etat?.sessions.filter((s) => s.date === dateISO) || [];
}

/* --- Actions & Mutations --- */

export function ajouterMatiere({ nom, description }) {
    const matiere = {
        id: genId("mat"),
        nom: nom || "Nouvelle matière",
        description: description || "",
        progres: 0,
        creeLe: Date.now(),
        modules: [],
    };
    etat.matieres.push(matiere);
    sauvegarder();
    return matiere;
}

export function modifierMatiere(matiereId, { nom, description }) {
    const matiere = getMatiere(matiereId);
    if (!matiere) return null;
    if (nom !== undefined) matiere.nom = nom;
    if (description !== undefined) matiere.description = description;
    sauvegarder();
    return matiere;
}

export function ajouterModule(matiereId, { titre, description }) {
    const matiere = getMatiere(matiereId);
    if (!matiere) return null;
    const module = {
        id: genId("mod"),
        titre: titre || "Nouveau module",
        description: description || "",
        progres: 0,
        taches: [],
    };
    matiere.modules.push(module);
    recalculerProgres(matiere);
    sauvegarder();
    return module;
}

export function modifierModule(matiereId, moduleId, { titre, description }) {
    const module = getModule(matiereId, moduleId);
    if (!module) {
        console.error(`[StudyHub] Module ${moduleId} introuvable.`);
        return null;
    }

    if (titre !== undefined) module.titre = titre;
    if (description !== undefined) module.description = description;

    sauvegarder();
    return module;
}

export function supprimerMatiere(matiereId) {
    const matiereExiste = etat.matieres.some((m) => m.id === matiereId);
    if (!matiereExiste) {
        console.error("[StudyHub] La matière à supprimer n'existe pas.");
        return false;
    }

    etat.matieres = etat.matieres.filter((m) => m.id !== matiereId);
    sauvegarder();
    return true;
}

export function supprimerModule(matiereId, moduleId) {
    const matiere = getMatiere(matiereId);
    if (!matiere) return false;
    matiere.modules = matiere.modules.filter((m) => m.id !== moduleId);
    recalculerProgres(matiere);
    sauvegarder();
    return true;
}

export function ajouterTache(matiereId, moduleId, titre) {
    const matiere = getMatiere(matiereId);
    const module = getModule(matiereId, moduleId);
    if (!matiere || !module || !titre) return null;

    const tache = { id: genId("t"), titre, statut: "a_faire" };
    module.taches.push(tache);
    recalculerProgres(matiere);
    sauvegarder();
    return tache;
}

export function basculerTache(matiereId, moduleId, tacheId) {
    const matiere = getMatiere(matiereId);
    const tache = getTache(matiereId, moduleId, tacheId);
    if (!matiere || !tache) return null;

    tache.statut = tache.statut === "faite" ? "a_faire" : "faite";
    recalculerProgres(matiere);
    sauvegarder();
    return tache;
}

export function ajouterSession({
    date,
    duree = 0,
    type = "planifiee",
    matiereId = null,
    tacheId = null,
    label = null,
}) {
    const matiere = matiereId ? getMatiere(matiereId) : null;

    const session = {
        id: genId("sess"),
        date,
        duree,
        type,
        matiereId,
        tacheId,
        label: label || (matiere ? matiere.nom : "Session planifiée"),
    };

    etat.sessions.push(session);
    sauvegarder();
    return session;
}

export function ajouterEvenement({ date, label }) {
    if (!date || !label) {
        console.error("[StudyHub] Date et libellé requis pour ajouter un événement.");
        return null;
    }

    const evenement = {
        id: genId("evt"),
        date,
        duree: 0,
        type: "evenement",
        matiereId: null,
        tacheId: null,
        label,
    };

    etat.sessions.push(evenement);
    sauvegarder();
    return evenement;
}

export function supprimerSession(sessionId) {
    if (!etat?.sessions) {
        console.error("[StudyHub] Liste des sessions introuvable.");
        return false;
    }

    const index = etat.sessions.findIndex((s) => s.id === sessionId);
    if (index === -1) {
        console.warn(`[StudyHub] Session non trouvée : ${sessionId}`);
        return false;
    }

    etat.sessions.splice(index, 1);
    sauvegarder();
    return true;
}
