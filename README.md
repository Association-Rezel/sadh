# Site web fai.rezel.net

Ce repository contient l'interface de gestion du FAI.  

- `./` Racine du projet
- `front/` : Le frontend, en Typescript/React
- `back/` : Le backend, en Python/FastAPI
- `Caddyfile.dev` écoute sur le port 6100 et redistribue le traffic entre le frontend et le backend (`/auth/*` et `/api/*`)
  
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

## Variables d'environnement et secrets

- Créez un fichier `.env.dev.local` dans le dossier `front/` et demandez son contenu à un membre de l'équipe.
- Créez un fichier `.env.local` dans le dossier `back/` et demandez son contenu à un membre de l'équipe.

## Installer les dépendances et lancer le projet en local

Ouvrir un shell et tapez :

```bash
make
```

Dans votre navigateur préféré, ouvrez <http://localhost:6100/>.
