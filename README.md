# Site web FAIPP

Ce dossier contient l'interface de gestion de FAIPP.

Il se divise en trois parties :

- front : Le frontend, en Typescript/React
- back : Le backend, en Python/FastAPI
- infra : Du code d'infrastructure (Docker)

## Front-end

Pour lancer le front-end, il vous faudra :

- NodeJS avec une version récente (18+)

Vous pouvez vérifier votre version de NodeJS avec `node -v` / `nodejs -v`

### Commandes

( depuis le dossier `front` )

- Installer les modules NodeJS requis pour le front-end : `npm install`  
&emsp;*(après chaque `git pull` si besoin)*
- Lancer le serveur de développement : `npm run dev`

### Ressources

- Typescript : https://www.typescriptlang.org/
- React : https://react.dev/
- Material UI : https://mui.com/material-ui/getting-started/overview/

## Back-end

Le backend dépend de plusieurs services :

- Un serveur SQL (base de donnée généraliste)
- Un serveur Keycloak (authentification centralisée)
- Un serveur Netbox (base de donnée pour équipements réseau)
- ...

Afin d'éviter la fastidieuse installation manuelle de ces composants chez chaque développeur, nous utilisons Docker, qui permet de déployer chez tout le monde les mêmes services automatiquement.

Ainsi, il vous faudra :

- Python 3
- Docker : https://docs.docker.com/get-docker/
- Docker Compose : https://docs.docker.com/compose/  

Vous pouvez vérifier si vous avez déjà Docker Compose avec `docker compose version`.
Dans ce cas, vous aurez quelque-chose du genre de `Docker Compose version v2.17.2`

### /!\ Attention /!\

Les versions de Docker Compose proposées par Debian/Ubuntu sont dépréciées. Installez manuellement (et *PAS* avec `apt install docker-compose`) en suivant les instructions du lien ci-dessus.

### Commandes

( depuis la racine du projet )

Certaines commandes ci-dessous peuvent nécessiter un lancement en `root`.
Dans ce cas, il suffit d'insérer `sudo` avant la commande. (ex: `sudo make up`)

- Lancer les conteneurs Docker : `make up`
- Initialiser Keycloak : `make seed` (à refaire à chaque lancement)
- Quitter les conteneurs Docker : `make down`

- Voir l'état des conteneurs lancés : `docker ps`
- Voir l'état des conteneurs lancés ou arrêtés : `docker ps -a`

- Installer les modules Python du back-end : `make i-back`  
&emsp;*(après chaque `git pull` si besoin)*
- Lancer le back-end : `make start-back`

Alternativement, le back-end peut être lancé avec le fichier `back/run.py`, à condition que les modules Python aient été installés par ailleurs.  
(dans le dossier `back`, faire `pip install -r requirements.txt`, après chaque `git pull` si besoin)

### Ressources

- FastAPI : https://fastapi.tiangolo.com/
- SQLAlchemy : https://www.sqlalchemy.org/
- Pydantic : https://pydantic.dev/

### Keycloak

Le Keycloak est initialisé avec le compte utilisateur suivant :

- email : `test@example.com`
- mot de passe : `test`  

Les identifiants du compte d'administration sont `admin`/`admin`

## Makefile - Scripts de lancement

(voir les sections ci-dessus pour les dépendances)

Il est possible d'initialiser rapidement le projet après un `git clone` frais :

```bash
make install
```
