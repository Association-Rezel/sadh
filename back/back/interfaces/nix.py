from pydantic import BaseModel


class CommandeAccesInfo(BaseModel):
    nom_adherent: str  # Exemple : Dupont
    prenom_adherent: str  # Exemple : Jean
    email_adherent: str  # Exemple : jean.dupont@gmail.com
    telephone_adherent: str  # Exemple : 06 00 00 00 00

    residence: str  # Exemple : Kley
    date_installation: str  # Exemple : 20230427 15:00
    e_rdv: str  # Exemple : F10-DGO-*-*-ERDV

    pm_rack: str  # Rack au PM
    pm_tiroir: str  # Tiroir au PM
    pm_port: str  # Port sur le MEC128 Exemple : A1

    ref_interne_rezel_commande: str  # Au Format Residence-Numero Appartement-YYYYMMDD-ID. Exemple : KLEY-101-20232808-1
    ref_logement: str  # Exemple : 101 ou 3101 (Kley)
    ref_pto: str = ""  # Sur le PTO. Exemple : FI-5015-1795
    pto_existant: bool  # True si le PTO existe déjà, False sinon

    numero_sequence: str = "1"  # Normalement 1, sauf si ce n'est pas le premier CSV envoyé aujourd'hui
