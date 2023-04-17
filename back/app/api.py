from typing import Union, Annotated
from fastapi import Depends, FastAPI, HTTPException, Request, Response, UploadFile
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
import random, string, os, datetime, json
from dotenv import load_dotenv
from keycloak import KeycloakOpenID
from app.database import User
load_dotenv()

keycloak_openid = KeycloakOpenID(server_url=os.getenv("keycloak_server_url"),
                                 client_id=os.getenv("keycloak_client_id"),
                                 realm_name=os.getenv("keycloak_realm_name"),
                                 client_secret_key=os.getenv("keycloak_client_secret_key"))


app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



###
### Fonctions utilitaires
###

def generate_token():
    return ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + "1234567890", k=64))

def authenticate_user(request : Request) -> User:
    if "Authorization" not in request.headers and "bearer_token" not in request.cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if "Authorization" in request.headers:
        bearer_token = request.headers["Authorization"].split(" ")[1]
    else:
        bearer_token = request.cookies["bearer_token"]
    # Séparation de l'identifiant de l'utilisateur et du token
    bearer_token = bearer_token.split(":")
    if len(bearer_token) != 2:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = bearer_token[0]
    bearer_token = bearer_token[1]
    if user_id == "ROBOT" and bearer_token == os.getenv("ROBOT_TOKEN"):
        return User(id=-1, name="ROBOT")
    iuser =  User.get_and_check_bearer_token(user_id, bearer_token)
    if iuser is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return iuser

def authenticate_admin_user(request):
    user = authenticate_user(request)
    if not user.isAdmin:
        return None
    return user


###
### Routes
###

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

def body_to_dict(body: str) -> dict:
    # On transforme le body en dictionnaire
    body = body.decode("utf-8")
    body = body.split("&")
    body = {i.split("=")[0]:i.split("=")[1] for i in body}
    return body

@app.get("/api/test")
def test(token: Annotated[str, Depends(oauth2_scheme)]):
    return {"token": token}

@app.get("/api/user")
def get_users(request: Request, page: int = None, pageLength: int = None):
    if(authenticate_admin_user(request) is None):
        raise HTTPException(status_code=401, detail="Not authenticated")
    # On prend toutes les blagues
    users = session.query(User).all()
    users = [user.to_dict() for user in users]
    if page is not None and pageLength is None:
        users = users[min(max(0, (page-1)*30), len(users)):min(max(0, page*30), len(users))]
    elif page is not None and pageLength is not None:
        users = users[min(max(0, (page-1)*pageLength), len(users)):min(max(0, page*pageLength), len(users))]
    # On les transforme en dictionnaire
    return users

@app.delete("/api/user")
def delete_user(user_id: str, request: Request):
    if(authenticate_admin_user(request) is None):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = User.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"success": True}

###
### Authentification
###

@app.get("/api/auth/state")
def auth_state(request: Request):
    try:
        user = authenticate_user(request)
    except:
        user = None
    return {"logged": (user is not None), "admin": (user is not None and user.isAdmin)}

@app.get("/api/auth/logout")
def auth_logout(request: Request, response: Response):
    user = authenticate_user(request)
    response.delete_cookie("bearer_token")
    response.delete_cookie("name")
    response.delete_cookie("email")
    if user is None:
        return {"message": "not logged in"}
    user.delete_bearer_token()
    response.body = {"message": "logged out"}
    return response

@app.get("/api/auth/login")
def auth_login(request: Request, callbackUrl: str = ""):
    # On vérifie que l'utilisateur n'est pas déjà connecté
    try:
        user = authenticate_user(request)
    except:
        user = None
    if user is not None:
        response = RedirectResponse(url="/")
        cookie_expiration = (user.bearer_expiration-datetime.datetime.now()).seconds
        response.set_cookie("bearer_token", user.bearer, domain=os.getenv("WEB_DOMAIN"), expires=cookie_expiration)
        response.set_cookie("name", user.name, domain=os.getenv("WEB_DOMAIN"), expires=cookie_expiration)
        return response
    auth_url = keycloak_openid.auth_url(
        redirect_uri=os.getenv("keycloak_redirect_uri") + (("?callbackUrl="+callbackUrl) if callbackUrl != "" else ""),
        scope="openid profile email"
    )
    return RedirectResponse(auth_url)

@app.get("/api/auth/keycloak/callback")
def auth_callback(code: str, state: str="", session_state: str="", callbackUrl: str = ""):
    # On vérifie que le code est valide 
    # On récupère le token
    try:
        access_token = keycloak_openid.token(
        grant_type='authorization_code',
        code=code,
        redirect_uri=os.getenv("keycloak_redirect_uri") + (("?callbackUrl="+callbackUrl) if callbackUrl != "" else "")
        )
        # On récupère les infos de l'utilisateur
        user_info = keycloak_openid.userinfo(token = access_token["access_token"])
    except:
        raise HTTPException(status_code=401, detail="Invalid code")
    user_info["refresh_token"] = access_token["refresh_token"]
    user_info["refresh_expires_in"] = access_token["refresh_expires_in"]
    # On génère un bearer token
    user_info["bearer_token"] = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=128))
    try:
        while User.get_by_bearer_token(user_info["bearer_token"]):
            user_info["bearer_token"] = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=128))
        # On crée un compte si besoin
        User.create_if_not_exists(user_info)
    except:
        session.rollback()
        while User.get_by_bearer_token(user_info["bearer_token"]):
            user_info["bearer_token"] = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=128))
        # On crée un compte si besoin
        User.create_if_not_exists(user_info)
    # On connecte l'utilisateur en mettant le bearer token dans un cookie
    if callbackUrl != "":
        response = RedirectResponse(url=callbackUrl)
    else:
        response = RedirectResponse(url="/")
    response.set_cookie("bearer_token", user_info["sub"]+':'+user_info["bearer_token"], domain=os.getenv("WEB_DOMAIN"), expires=43200)
    response.set_cookie("name", user_info["name"], domain=os.getenv("WEB_DOMAIN"), expires=43200)
    response.set_cookie("email", user_info["email"], domain=os.getenv("WEB_DOMAIN"), expires=43200)
    return response

def analyse_images():
    while True:
        # On récupère les robots qui ont besoin d'être analysés
        robots = session.query(Robot).filter(Robot.needsAnalysis == True).all()
        for robot in robots:
            robot.analyse()
        session.commit()
        time.sleep(60)


    

# uvicorn main:app --reload --port 80 --host