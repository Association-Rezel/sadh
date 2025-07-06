# Site web fai.rezel.net
Ce repository contient l'interface de gestion du FAI.  

- `./` Racine du projet
- `front/` : Le frontend, en Typescript/React
- `back/` : Le backend, en Python/FastAPI
  
## Ouvrir le projet sous VS Code
Pour parcourir le code, ouvrez le workspace [VS-Code](https://code.visualstudio.com/insiders/) avec :
```bash
git clone git@gitlab.core.rezel.net:rezel/sadh.git
cd sadh
code .
```

## Installation de l'environnement de développement

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

Dans le dossier `sadh/` :
```bash
make install # Pour installer toutes les dépendances python et node
```

## Variables d'environnement et secrets
* Créez un fichier `.env.dev.local` dans le dossier `front/` et demandez son contenu à un membre de l'équipe.
* Créez un fichier `.env.local` dans le dossier `back/` et demandez son contenu à un membre de l'équipe.

## Lancer le projet en local
Ouvrir un premier shell et tapez :
```bash	
make start-back # Pour lancer localement l'infrastructure de backend (Le back en python)
```
Ouvrez ensuite un nouveau shell et tapez :
```bash
make start-front
```
Dans votre navigateur préféré, ouvrez http://localhost:5173/, et connectez vous avec :
**Utilisateur :** test@example.com
**Mot de passe :** test