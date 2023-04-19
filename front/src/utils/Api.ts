import { DummyApi } from "./DummyApi";
import { RemoteApi } from "./RemoteApi";
import { Config } from "./Config";
import { ApiInterface } from "./types";

// En fonction de la configuration, la classe Api est fake (pour les tests) ou réelle (utilise le serveur)
export const ApiClass = Config.API_DUMMY ? DummyApi : RemoteApi;
export const Api: ApiInterface = new ApiClass();
