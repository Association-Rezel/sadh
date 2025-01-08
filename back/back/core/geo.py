from common_models.user_models import Residence


def get_postal_address(residence: Residence) -> str:
    if residence is Residence.ALJT:
        return "28 Bd Gaspard Monge, 91120 Palaiseau"

    if residence is Residence.HACKER_HOUSE:
        return "20 Bd Thomas Gobert, 91120 Palaiseau"

    if residence is Residence.KLEY:
        return "1 Pl. Marguerite Perey, 91120 Palaiseau"

    if residence is Residence.TWENTY_CAMPUS:
        return "44 Cr Pierre Vasseur, 91120 Palaiseau"

    return ValueError("Unknown residence")
