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
EOS'
