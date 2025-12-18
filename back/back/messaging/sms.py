import ovh
from back.env import ENV
from back.messaging.matrix import send_matrix_message

enabled = ENV.ovh_enabled
missing_env_variable = (
    not ENV.ovh_application_key
    or not ENV.ovh_application_secret
    or not ENV.ovh_consumer_key
    or not ENV.ovh_service_name
    or not ENV.ovh_enabled
)
if not missing_env_variable:
    client = ovh.Client(
        endpoint="ovh-eu",
        application_key=ENV.ovh_application_key,
        application_secret=ENV.ovh_application_secret,
        consumer_key=ENV.ovh_consumer_key,
    )
    service_name = ENV.ovh_service_name


def send_code(phone_number, code) -> None:
    if not enabled:
        return None
    if missing_env_variable:
        raise Exception("Missing env variables")
    try:
        result = client.post(
            f"/sms/{service_name}/jobs",
            sender="38082",
            message="Code de verification Rezel : " + str(code),
            receivers=[phone_number],
            noStopClause=True,
        )
    except Exception as e:
        send_matrix_message(
            f"❌ Erreur lors de l'envoi du SMS au {phone_number}, Message: Code de verification : {str(code)}",
            "```",
            str(e),
            "```",
        )
        raise e
