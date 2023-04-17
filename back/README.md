# Backend

Pour installer les libs :

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Pour lancer le backend

```bash
python -m uvicorn --factory back:make_app
```
