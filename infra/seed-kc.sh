#!/bin/bash

cd "$(dirname "$0")"

# reset kc db
docker compose stop keycloak-postgres keycloak
docker compose rm -v -f keycloak-postgres
docker compose up --wait -d keycloak-postgres keycloak

# create admin user
docker compose exec keycloak /opt/jboss/keycloak/bin/add-user-keycloak.sh -u admin -p admin
docker compose restart keycloak

# create default data
docker compose exec keycloak bash -c 'cat <<EOS | bash
while ! curl -fsL localhost:8080 -w "%{http_code}\n" -o/dev/null; do sleep 1; done
cd /opt/jboss/keycloak/bin/
./kcadm.sh config credentials --server http://localhost:8080/auth --realm master --user admin --password admin
./kcadm.sh create realms -s realm=users -s enabled=true -s registrationAllowed=true -s registrationEmailAsUsername=true
./kcadm.sh create clients -r users -s clientId=back -s standardFlowEnabled=true -s publicClient=true -s clientAuthenticatorType=client-secret -s secret=back -s directAccessGrantsEnabled=true -s redirectUris="[\"http://localhost:5173/*\", \"http://localhost:8000/*\", \"http://127.0.0.1:8000/*\"]"
./kcadm.sh create users -r users -s username=test@example.com -s email=test@example.com -s emailVerified=true -s enabled=true -o --fields id,username
./kcadm.sh set-password -r users --username test@example.com --new-password test
EOS'
