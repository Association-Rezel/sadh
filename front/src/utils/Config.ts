export const Config = {
    API_DUMMY: import.meta.env.VITE_API_DUMMY == "TRUE" ? true : false,
    API_URL: import.meta.env.VITE_API_URL,
    ZITADEL_CLIENT_ID: import.meta.env.VITE_ZITADEL_CLIENT_ID,
    ZITADEL_ORG_ID: import.meta.env.VITE_ZITADEL_ORG_ID,
    ZITADEL_ROLE_SITE_ADMIN: import.meta.env.VITE_ZITADEL_ROLE_SITE_ADMIN,
    DOCUMENSO_BASE_URL: import.meta.env.VITE_DOCUMENSO_BASE_URL,
}
if (import.meta.env.DEV) {
    console.log("Config", Config)
}