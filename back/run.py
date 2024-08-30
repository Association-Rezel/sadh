"""
Ce fichier sert à lancer directement le serveur depuis un IDE (ex: Pycharm), afin de débugger.
"""

import uvicorn

from back import make_app  # type: ignore

app = make_app()
uvicorn.run(app, host="0.0.0.0", port=8000)
