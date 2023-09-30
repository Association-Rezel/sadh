import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        define: {
            'process.env.API_URL': JSON.stringify(env.REACT_APP_API_URL),
            'process.env.KC_URL': JSON.stringify(env.REACT_APP_KC_URL),
            'process.env.API_DUMMY': JSON.stringify(env.REACT_APP_API_DUMMY),
        },
        plugins: [react()],
    }
})
