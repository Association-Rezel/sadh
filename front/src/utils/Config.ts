export const Config = {
    API_DUMMY: import.meta.env.VITE_API_DUMMY == "TRUE" ? true : false,
    API_URL: import.meta.env.VITE_API_URL,
    OIDC_ISSUER: import.meta.env.VITE_OIDC_ISSUER,
    OIDC_CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID,
    ADMIN_ENTITLEMENT: import.meta.env.VITE_OIDC_ADMIN_ENTITLEMENT,
    DOCUMENSO_BASE_URL: import.meta.env.VITE_DOCUMENSO_BASE_URL,
    
}
if (import.meta.env.DEV) {
    console.log("Config", Config)
}