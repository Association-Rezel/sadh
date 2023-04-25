import uvicorn

import back.env
from back import make_app

"""
Ce fichier sert à lancer directement le serveur depuis un IDE (ex: Pycharm), afin de débugger.
"""

app = make_app()
uvicorn.run(app, host="0.0.0.0", port=int(back.env.ENV.frontend_port))