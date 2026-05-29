import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        resolve: {
            alias: {
                '@mf/event-bus': path.resolve(__dirname, '../event-bus/index.js'),
            },
        },
    plugins: [
        tailwindcss(),
        react(),
        federation({
            name: 'productUI',
            filename: 'remoteEntry.js',
            remotes: {
                promoUI: (env.VITE_REMOTE_PROMO_UI || 'http://localhost:3002') + '/assets/remoteEntry.js',
            },
            exposes: {
                './ProductList': './src/components/ProductList.jsx',
                './ProductDetails': './src/components/ProductDetails.jsx',
            },
            shared: {
                react: {
                    requiredVersion: '^19.2.0'
                },
                'react-dom': {
                    requiredVersion: '^19.2.0'
                },
                'react-router-dom':{
                    requiredVersion: '^7.13.0'
                },
                '@tanstack/react-query': {
                    requiredVersion: '^5.90.20'
                },
                'oidc-client-ts': {
                    singleton: true,
                    requiredVersion: '^3.0.0'
                },
                '@mf/event-bus': {
                    packagePath: path.resolve(__dirname, '../event-bus/index.js'),
                    singleton: true,
                    eager: true,
                }
            }
        }),
    ],
    build: {
        target: 'esnext',
        minify: false,
        cssCodeSplit: false,
    },
    server: {
        port: 3001,
        strictPort: true,
        cors: true,
    },
    preview: {
        port: 3001,
        strictPort: true,
        cors: true,
    },
    }
})