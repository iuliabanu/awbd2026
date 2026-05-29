import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import NotFoundPage from './pages/NotFoundPage';
import CallbackPage from './pages/CallbackPage';
import { userManager } from './shared/auth';
import { CartProvider } from './shared/CartContext';

// Lazy load remote modules
const ProductList = lazy(() => import('productUI/ProductList'));
const ProductDetails = lazy(() => import('productUI/ProductDetails'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

function PrivateRoute({ children }) {
    const [checked, setChecked] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        userManager.getUser().then((user) => {
            if (user && !user.expired) {
                setAuthenticated(true);
            } else {
                userManager.signinRedirect();
            }
            setChecked(true);
        });
    }, []);

    if (!checked) return null;
    return authenticated ? children : null;
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <CartProvider>
            <BrowserRouter>
                <div className="min-h-screen flex flex-col bg-gray-50">
                    <Header />

                    <main className="flex-grow container mx-auto px-4 py-8">
                        <Suspense fallback={
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        }>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/callback" element={<CallbackPage />} />
                                <Route path="/products" element={<PrivateRoute><ProductList /></PrivateRoute>} />
                                <Route path="/products/:id" element={<PrivateRoute><ProductDetails /></PrivateRoute>} />
                                <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
                                <Route path="/404" element={<NotFoundPage />} />
                                <Route path="*" element={<Navigate to="/404" replace />} />
                            </Routes>
                        </Suspense>
                    </main>

                    <Footer />
                </div>
            </BrowserRouter>
            </CartProvider>
        </QueryClientProvider>
    );
}

export default App;