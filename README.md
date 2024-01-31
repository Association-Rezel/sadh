# Site web fai.rezel.net
Ce repository contient l'interface de gestion du FAI.  

- `./` Racine du projet
- `front/` : Le frontend, en Typescript/React
- `back/` : Le backend, en Python/FastAPI
- `infra/` : Des fichiers de configuration pour lancer les services annexes en local (netbox, keycloak)
  
## Ouvrir le projet sous VS Code
Pour parcourir le code, ouvrez le workspace [VS-Code](https://code.visualstudio.com/insiders/) avec :
```bash
git clone git@gitlab.com:rezel/faipp/site/site.git
cd site/
code all.code-workspace
```

## Installation de l'environnement de développement
Pour savoir si vous avez déjà docker : `docker --version`. Si oui, mettez le à jour, et sinon, installez la dernière version :
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```
Installez python 3.11
```bash
sudo apt install python3.11 python3.11-venv
```
Nettoyez les anciennes versions de nodejs éventuelles puis installez la version 21 et la dernière version de npm.
```bash
sudo apt autoremove nodejs
curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash - &&\
sudo apt-get install -y nodejs npm
```
Installez `make`
```bash
sudo apt install make
```
Vous avez désormais installé tous les outils nécessaires 🎉!

Dans le dossier `site/` :
```bash
make install # Pour installer toutes les dépendances python et node
make seed # Pour créer un premier compte dans keycloak
make start-back # Pour lancer localement l'infrastructure de backend (Le back en python, netbox & keycloak)
```
Ouvrez ensuite un nouveau shell et tapez :
```bash
make start-front
```
Dans votre navigateur préféré, ouvrez http://localhost:5173/, et connectez vous avec :
**Utilisateur :** test@example.com
**Mot de passe :** test

Cliquez sur le bouton "J'adhère" pour faire une demande d'adhésion avec le compte (Cela permet de créer un compte dans la base de donnée locale du site)

Passer ensuite cet utilisateur administrateur du site en ouvrant un nouveau shell et en entrant la commande suivante :
```bash
docker exec -it infra-postgres-1 psql -U admin -d database -c "UPDATE users SET is_admin='1' WHERE email='test@example.com'"`
```
Rafraichissez la page, et vous êtes désormais administrateur du site.
## Back-end
Le backend dépend de plusieurs services :
- Un serveur PostgreSQL (base de donnée généraliste)
- Un serveur Keycloak (authentification centralisée)
- Un serveur Netbox (base de donnée pour équipements réseau)
 
C'est pour éviter la fastidieuse installation manuelle de ces composants chez chaque développeur, que nous utilisons Docker, qui permet de déployer chez tout le monde les mêmes services automatiquement.

### Keycloak
Les identifiants du compte d'administration à utiliser sur http://localhost:8080/ sont `admin`/`admin`

### Exemple de modification de la base de données du site

Pour donner les droits d'admin à un utilisateur, il faut se connecter à la base de données postgresql. La commande suivante permet d'ouvrir un shell postgreSQL dans la base de donnée du site.
```bash
docker  exec  -it  infra-postgres-1  psql  -U  admin  -d  database
```
Une fois dans la base de données :
```sql
UPDATE users SET is_admin='t' WHERE email='email@example.com';
```