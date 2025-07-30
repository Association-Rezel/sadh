export const Config = {
    DOCUMENSO_BASE_URL: import.meta.env.VITE_DOCUMENSO_BASE_URL,
    
}
if (import.meta.env.DEV) {
    console.log("Config", Config)
}