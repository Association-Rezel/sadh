"""
Ce fichier sert à lancer directement le serveur depuis un IDE (ex: Pycharm), afin de débugger.
"""
import uvicorn

from back import make_app
from back.env import ENV


app = make_app()
uvicorn.run(app, host="0.0.0.0", port=int(ENV.frontend_port))
