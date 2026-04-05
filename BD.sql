-- ============================================================
--  FatouraAI — Base de Données PostgreSQL
--  ISIMM · Projet de Fin d'Année 2025-2026
--  Encadrant : M. Nafaa Hafar
--  Équipe : Islem Trojet, Houda Essalmi, Fatma Boujdaria,
--           Youssef Nouira, Idris Jlidi
-- ============================================================
 
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 
CREATE TYPE role_utilisateur  AS ENUM ('admin', 'commercant', 'comptable');
CREATE TYPE statut_facture     AS ENUM ('brouillon', 'confirmee', 'signee', 'envoyee_ttn', 'acceptee', 'refusee', 'annulee');
CREATE TYPE type_facture       AS ENUM ('facture', 'avoir');
CREATE TYPE taux_tva           AS ENUM ('0', '7', '13', '19');
CREATE TYPE statut_ttn         AS ENUM ('envoye', 'accepte', 'refuse', 'erreur');
CREATE TYPE statut_reclamation AS ENUM ('ouverte', 'en_cours', 'resolue', 'fermee');
CREATE TYPE type_client        AS ENUM ('particulier', 'entreprise');
CREATE TYPE statut_avoir       AS ENUM ('brouillon', 'confirme', 'annule');
CREATE TYPE role_ia            AS ENUM ('user', 'assistant');

CREATE TABLE Utilisateur (
    id_utilisateur  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255) NOT NULL,
    telephone       VARCHAR(20),
    role            role_utilisateur NOT NULL DEFAULT 'commercant',
    date_inscription TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    est_actif       BOOLEAN      NOT NULL DEFAULT TRUE
);
 
CREATE INDEX idx_utilisateur_email ON Utilisateur(email);

CREATE TABLE Entreprise (
    id_entreprise   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_utilisateur  UUID         NOT NULL REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
    raison_sociale  VARCHAR(255) NOT NULL,
    matricule_fiscal VARCHAR(50),
    adresse         TEXT,
    code_postal     VARCHAR(10),
    ville           VARCHAR(100),
    pays            VARCHAR(100) NOT NULL DEFAULT 'Tunisie',
    telephone       VARCHAR(20),
    logo_url        VARCHAR(500)
);
 
CREATE INDEX idx_entreprise_utilisateur ON Entreprise(id_utilisateur);

CREATE TABLE Client (
    id_client       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_entreprise   UUID         NOT NULL REFERENCES Entreprise(id_entreprise) ON DELETE CASCADE,
    nom             VARCHAR(255) NOT NULL,
    matricule_fiscal VARCHAR(100),
    email           VARCHAR(255),
    telephone       VARCHAR(20),
    adresse         TEXT,
    type_client     type_client  NOT NULL DEFAULT 'entreprise',
    est_actif       BOOLEAN      NOT NULL DEFAULT TRUE
);
 
CREATE INDEX idx_client_entreprise ON Client(id_entreprise);

CREATE TABLE Produit (
    id_produit      UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_entreprise   UUID           NOT NULL REFERENCES Entreprise(id_entreprise) ON DELETE CASCADE,
    reference       VARCHAR(100),
    designation     TEXT           NOT NULL,
    unite           VARCHAR(50)    NOT NULL DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(12,3) NOT NULL DEFAULT 0,
    taux_tva        taux_tva       NOT NULL DEFAULT '19',
    est_actif       BOOLEAN        NOT NULL DEFAULT TRUE
);
 
CREATE INDEX idx_produit_entreprise ON Produit(id_entreprise);

CREATE TABLE Facture (
    id_facture      UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_facture  VARCHAR(50)    NOT NULL,
    id_entreprise   UUID           NOT NULL REFERENCES Entreprise(id_entreprise) ON DELETE CASCADE,
    id_client       UUID           NOT NULL REFERENCES Client(id_client),
    date_emission   DATE           NOT NULL DEFAULT CURRENT_DATE,
    date_echeance   DATE,
    montant_ht      DECIMAL(14,3)  NOT NULL DEFAULT 0,
    montant_tva     DECIMAL(14,3)  NOT NULL DEFAULT 0,
    montant_ttc     DECIMAL(14,3)  NOT NULL DEFAULT 0,
    statut          statut_facture NOT NULL DEFAULT 'brouillon',
    signature_elec  TEXT,
    url_pdf         VARCHAR(500),
    url_xml         VARCHAR(500),
    date_creation   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
 
    UNIQUE (id_entreprise, numero_facture)
);
 
CREATE INDEX idx_facture_entreprise ON Facture(id_entreprise);
CREATE INDEX idx_facture_client     ON Facture(id_client);
CREATE INDEX idx_facture_statut     ON Facture(statut);

CREATE TABLE LigneFacture (
    id_ligne        UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_facture      UUID           NOT NULL REFERENCES Facture(id_facture) ON DELETE CASCADE,
    id_produit      UUID           REFERENCES Produit(id_produit) ON DELETE SET NULL,
    designation     TEXT           NOT NULL,
    quantite        DECIMAL(10,3)  NOT NULL DEFAULT 1,
    prix_unitaire_ht DECIMAL(12,3) NOT NULL DEFAULT 0,
    taux_tva        taux_tva       NOT NULL DEFAULT '19',
    montant_ht      DECIMAL(14,3)  NOT NULL DEFAULT 0,
    montant_tva     DECIMAL(14,3)  NOT NULL DEFAULT 0,
    montant_ttc     DECIMAL(14,3)  NOT NULL DEFAULT 0
);
 
CREATE INDEX idx_ligne_facture ON LigneFacture(id_facture);

CREATE TABLE Avoir (
    id_avoir        UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_facture_orig UUID           NOT NULL REFERENCES Facture(id_facture),
    numero_avoir    VARCHAR(50)    NOT NULL,
    date_emission   DATE           NOT NULL DEFAULT CURRENT_DATE,
    motif           TEXT,
    montant_ht      DECIMAL(14,3)  NOT NULL DEFAULT 0,
    montant_tva     DECIMAL(14,3)  NOT NULL DEFAULT 0,
    montant_ttc     DECIMAL(14,3)  NOT NULL DEFAULT 0,
    statut          statut_avoir   NOT NULL DEFAULT 'brouillon',
    date_creation   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
 
CREATE INDEX idx_avoir_facture ON Avoir(id_facture_orig);
 
CREATE TABLE SoumissionTTN (
    id_soumission   UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_facture      UUID           NOT NULL REFERENCES Facture(id_facture) ON DELETE CASCADE,
    date_soumission TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    statut_ttn      statut_ttn     NOT NULL DEFAULT 'envoye',
    reference_ttn   VARCHAR(100),
    reponse_ttn     TEXT,
    nb_tentatives   INT            NOT NULL DEFAULT 1,
    date_reponse    TIMESTAMPTZ
);
 
CREATE INDEX idx_soumission_facture ON SoumissionTTN(id_facture);
 
CREATE TABLE HistoriqueStatut (
    id_historique   UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_facture      UUID           NOT NULL REFERENCES Facture(id_facture) ON DELETE CASCADE,
    ancien_statut   statut_facture,
    nouveau_statut  statut_facture NOT NULL,
    date_changement TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    id_utilisateur  UUID           REFERENCES Utilisateur(id_utilisateur),
    commentaire     TEXT
);
 
CREATE INDEX idx_historique_facture ON HistoriqueStatut(id_facture);

CREATE TABLE Reclamation (
    id_reclamation  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_facture      UUID           NOT NULL REFERENCES Facture(id_facture),
    id_utilisateur  UUID           NOT NULL REFERENCES Utilisateur(id_utilisateur),
    description     TEXT           NOT NULL,
    statut          statut_reclamation NOT NULL DEFAULT 'ouverte',
    date_soumission TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    date_resolution TIMESTAMPTZ
);
 
CREATE INDEX idx_reclamation_facture ON Reclamation(id_facture);
CREATE INDEX idx_reclamation_user    ON Reclamation(id_utilisateur);

CREATE TABLE Notification (
    id_notification UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_utilisateur  UUID           NOT NULL REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
    id_facture      UUID           REFERENCES Facture(id_facture) ON DELETE CASCADE,
    type_notif      VARCHAR(50)    NOT NULL,
    message         TEXT           NOT NULL,
    est_lue         BOOLEAN        NOT NULL DEFAULT FALSE,
    date_envoi      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
 
CREATE INDEX idx_notification_user ON Notification(id_utilisateur)
    WHERE est_lue = FALSE;
 
CREATE TABLE Abonnement (
    id_abonnement   UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_entreprise   UUID           NOT NULL REFERENCES Entreprise(id_entreprise) ON DELETE CASCADE,
    plan            VARCHAR(50)    NOT NULL DEFAULT 'starter',
    date_debut      DATE           NOT NULL DEFAULT CURRENT_DATE,
    date_fin        DATE,
    est_actif       BOOLEAN        NOT NULL DEFAULT TRUE,
    nb_factures_max INT,
    nb_clients_max  INT
);
 
CREATE INDEX idx_abonnement_entreprise ON Abonnement(id_entreprise);
 
CREATE TABLE ConversationIA (
    id_conversation UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_utilisateur  UUID           NOT NULL REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
    id_entreprise   UUID           NOT NULL REFERENCES Entreprise(id_entreprise) ON DELETE CASCADE,
    titre           VARCHAR(255),
    date_creation   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    date_mise_a_jour TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
 
CREATE INDEX idx_conv_ia_user ON ConversationIA(id_utilisateur);

CREATE TABLE MessageIA (
    id_message      UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_conversation UUID           NOT NULL REFERENCES ConversationIA(id_conversation) ON DELETE CASCADE,
    role            role_ia        NOT NULL,
    contenu         TEXT           NOT NULL,
    id_facture_gen  UUID           REFERENCES Facture(id_facture),
    date_creation   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
 
CREATE INDEX idx_message_ia_conv ON MessageIA(id_conversation);

CREATE TABLE JournalAudit (
    id_log          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_utilisateur  UUID           REFERENCES Utilisateur(id_utilisateur) ON DELETE SET NULL,
    action          VARCHAR(100)   NOT NULL,
    entite          VARCHAR(50),
    id_entite       UUID,
    details         JSON,
    adresse_ip      VARCHAR(45),
    date_action     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
 
CREATE INDEX idx_audit_user     ON JournalAudit(id_utilisateur);
CREATE INDEX idx_audit_entite   ON JournalAudit(entite, id_entite);
CREATE INDEX idx_audit_date     ON JournalAudit(date_action DESC);

CREATE OR REPLACE FUNCTION maj_date_modification()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_mise_a_jour = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER trg_conv_ia_maj
    BEFORE UPDATE ON ConversationIA
    FOR EACH ROW EXECUTE FUNCTION maj_date_modification();
 
CREATE OR REPLACE FUNCTION calculer_totaux_ligne()
RETURNS TRIGGER AS $$
DECLARE
    taux NUMERIC;
BEGIN
    taux := NEW.taux_tva::TEXT::NUMERIC / 100.0;
    NEW.montant_ht  := ROUND(NEW.quantite * NEW.prix_unitaire_ht, 3);
    NEW.montant_tva := ROUND(NEW.montant_ht * taux, 3);
    NEW.montant_ttc := NEW.montant_ht + NEW.montant_tva;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER trg_calculer_totaux_ligne
    BEFORE INSERT OR UPDATE ON LigneFacture
    FOR EACH ROW EXECUTE FUNCTION calculer_totaux_ligne();
 
CREATE OR REPLACE FUNCTION sync_totaux_facture()
RETURNS TRIGGER AS $$
DECLARE
    fac_id UUID;
BEGIN
    fac_id := COALESCE(NEW.id_facture, OLD.id_facture);
    UPDATE Facture
    SET
        montant_ht  = (SELECT COALESCE(SUM(montant_ht),  0) FROM LigneFacture WHERE id_facture = fac_id),
        montant_tva = (SELECT COALESCE(SUM(montant_tva), 0) FROM LigneFacture WHERE id_facture = fac_id),
        montant_ttc = (SELECT COALESCE(SUM(montant_ttc), 0) FROM LigneFacture WHERE id_facture = fac_id)
    WHERE id_facture = fac_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER trg_sync_totaux_facture
    AFTER INSERT OR UPDATE OR DELETE ON LigneFacture
    FOR EACH ROW EXECUTE FUNCTION sync_totaux_facture();
 
CREATE OR REPLACE FUNCTION bloquer_modif_facture_confirmee()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.statut NOT IN ('brouillon') THEN
        IF (OLD.montant_ht     <> NEW.montant_ht     OR
            OLD.montant_ttc    <> NEW.montant_ttc    OR
            OLD.id_client      <> NEW.id_client      OR
            OLD.numero_facture <> NEW.numero_facture) THEN
            RAISE EXCEPTION
                'Impossible de modifier une facture confirmée (id: %)', OLD.id_facture;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER trg_bloquer_modif_confirmee
    BEFORE UPDATE ON Facture
    FOR EACH ROW EXECUTE FUNCTION bloquer_modif_facture_confirmee();
 
CREATE OR REPLACE FUNCTION enregistrer_historique_statut()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.statut <> NEW.statut THEN
        INSERT INTO HistoriqueStatut (id_facture, ancien_statut, nouveau_statut)
        VALUES (NEW.id_facture, OLD.statut, NEW.statut);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER trg_historique_statut
    AFTER UPDATE ON Facture
    FOR EACH ROW EXECUTE FUNCTION enregistrer_historique_statut();
  
CREATE TABLE SequenceFacture (
    id_entreprise   UUID    PRIMARY KEY REFERENCES Entreprise(id_entreprise) ON DELETE CASCADE,
    annee           INT     NOT NULL,
    dernier_numero  INT     NOT NULL DEFAULT 0
);
 
CREATE OR REPLACE FUNCTION generer_numero_facture(p_id_entreprise UUID)
RETURNS TEXT AS $$
DECLARE
    annee_courante INT := EXTRACT(YEAR FROM NOW());
    num            INT;
BEGIN
    INSERT INTO SequenceFacture(id_entreprise, annee, dernier_numero)
    VALUES (p_id_entreprise, annee_courante, 1)
    ON CONFLICT (id_entreprise) DO UPDATE
        SET dernier_numero = CASE
            WHEN SequenceFacture.annee < annee_courante THEN 1
            ELSE SequenceFacture.dernier_numero + 1
        END,
        annee = annee_courante
    RETURNING dernier_numero INTO num;
 
    RETURN 'FAT-' || annee_courante || '-' || LPAD(num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE VIEW v_resume_factures AS
SELECT
    f.id_facture,
    f.numero_facture,
    f.date_emission,
    f.date_echeance,
    f.statut,
    f.montant_ht,
    f.montant_tva,
    f.montant_ttc,
    c.nom            AS nom_client,
    c.matricule_fiscal AS mf_client,
    e.raison_sociale AS entreprise,
    u.nom || ' ' || u.prenom AS createur
FROM Facture f
JOIN Client      c ON c.id_client     = f.id_client
JOIN Entreprise  e ON e.id_entreprise = f.id_entreprise
JOIN Utilisateur u ON u.id_utilisateur = e.id_utilisateur;

CREATE VIEW v_stats_dashboard AS
SELECT
    f.id_entreprise,
    COUNT(*)                                              AS total_factures,
    COUNT(*) FILTER (WHERE f.statut = 'acceptee')         AS acceptees,
    COUNT(*) FILTER (WHERE f.statut = 'refusee')          AS refusees,
    COUNT(*) FILTER (WHERE f.statut = 'brouillon')        AS brouillons,
    COUNT(*) FILTER (WHERE f.statut = 'envoyee_ttn')      AS en_attente_ttn,
    COALESCE(SUM(f.montant_ttc) FILTER (
        WHERE f.statut = 'acceptee'), 0)                  AS ca_total_ttc
FROM Facture f
GROUP BY f.id_entreprise;
