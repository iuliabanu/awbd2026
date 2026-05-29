import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
    plugins: [
        react(),
        federation({
            name: 'promoUI',
            filename: 'remoteEntry.js',
            exposes: {
                './PromoBanner':  './src/components/PromoBanner.jsx',
                './DiscountBadge': './src/components/DiscountBadge.jsx',
            },
            shared: {
                react: {
                    requiredVersion: '^19.2.0'
                },
                'react-dom': {
                    requiredVersion: '^19.2.0'
                },
            },
        }),
    ],
    build: {
        target: 'esnext',
        minify: false,
        cssCodeSplit: false,
    },
    server: {
        port: 3002,
        strictPort: true,
        cors: true,
    },
    preview: {
        port: 3002,
        strictPort: true,
        cors: true,
    },
})

