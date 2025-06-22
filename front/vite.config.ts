import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    if (mode === 'dev') {
        return {
            plugins: [react()],
            server: {
                watch: {
                    usePolling: true,
                    interval: 100,
                },
            },
        }
    }
    return {
        plugins: [react()],
    }
})
