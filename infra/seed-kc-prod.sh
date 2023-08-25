#!/bin/bash

cd "$(dirname "$0")"

# create admin user
docker compose exec keycloak /opt/jboss/keycloak/bin/add-user-keycloak.sh -u admin -p $KEYCLOAK_ADMIN_PASSWORD
docker compose restart keycloak

# create default data
docker compose exec keycloak bash -c "cat <<EOS | bash
while ! curl -fsL localhost:8080 -w "%{http_code}\n" -o/dev/null; do sleep 1; done
cd /opt/jboss/keycloak/bin/
./kcadm.sh config credentials --server http://localhost:8080/auth --realm master --user admin --password $KEYCLOAK_ADMIN_PASSWORD
./kcadm.sh create realms -s realm=users -s enabled=true -s registrationAllowed=true -s registrationEmailAsUsername=true
./kcadm.sh create clients -r users -s clientId=back -s standardFlowEnabled=true -s publicClient=true -s clientAuthenticatorType=client-secret -s secret=$KEYCLOAK_CLIENT_SECRET -s directAccessGrantsEnabled=true -s redirectUris="[\"http://fai.rezel.net/*\", \"https://fai.rezel.net/*\", \"http://faipp.rezel.net/*\", \"https://faipp.rezel.net/*\"]"
EOS"
