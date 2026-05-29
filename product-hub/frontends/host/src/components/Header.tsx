import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { userManager } from '../shared/auth';
import { useCart } from '../shared/CartContext';

function CartIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             aria-hidden="true">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
    );
}

function Header() {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const { cartItems } = useCart();
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

    useEffect(() => {
        userManager.getUser().then(setUser);
        const onUserLoaded = (u) => setUser(u);
        const onUserUnloaded = () => setUser(null);
        userManager.events.addUserLoaded(onUserLoaded);
        userManager.events.addUserUnloaded(onUserUnloaded);

        return () => {
            userManager.events.removeUserLoaded(onUserLoaded);
            userManager.events.removeUserUnloaded(onUserUnloaded);
        };
    }, []);

    const isActive = (path) => location.pathname === path;

    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">ProductHub</span>
                    </Link>

                    <nav className="flex items-center space-x-8">
                        <Link
                            to="/"
                            className={`${
                                isActive('/')
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-blue-600'
                            } pb-1 transition-colors`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/products"
                            className={`${
                                isActive('/products')
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-blue-600'
                            } pb-1 transition-colors`}
                        >
                            Products
                        </Link>

                        {user ? (
                            <div className="flex items-center space-x-3">
                                {/* Cart badge */}
                                <Link to="/cart" style={{ position: 'relative', color: '#374151', textDecoration: 'none' }}>
                                    <CartIcon />
                                    {cartCount > 0 && (
                                        <span style={{
                                            position: 'absolute', top: '-7px', right: '-8px',
                                            background: '#2563EB', color: 'white',
                                            fontSize: '10px', fontWeight: 700,
                                            borderRadius: '9999px', minWidth: '16px', height: '16px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '0 3px', lineHeight: 1,
                                        }}>
                                            {cartCount > 99 ? '99+' : cartCount}
                                        </span>
                                    )}
                                </Link>
                                <span className="text-sm text-gray-600">
                                    {user.profile?.preferred_username ?? user.profile?.sub}
                                </span>
                                <button
                                    onClick={() => userManager.signoutRedirect()}
                                    className="text-sm px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => userManager.signinRedirect()}
                                className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Login
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;