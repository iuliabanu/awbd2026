import { Link } from 'react-router-dom';

function HomePage() {
    return (
        <div className="text-center py-20">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Welcome to ProductHub
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Discover products and exclusive promo codes.
                Built with Vite + Module Federation for lightning-fast development.
            </p>
            <div className="flex justify-center space-x-4">
                <Link
                    to="/products"
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Browse Products
                </Link>
                <a
                    href="https://vitejs.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                    Learn About Vite
                </a>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="text-3xl mb-4">⚡</div>
                    <h3 className="font-bold text-lg mb-2">Lightning Fast</h3>
                    <p className="text-gray-600 text-sm">
                        Vite provides instant HMR and fast cold starts
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="text-3xl mb-4">🎯</div>
                    <h3 className="font-bold text-lg mb-2">Module Federation</h3>
                    <p className="text-gray-600 text-sm">
                        Independent micro frontends with shared dependencies
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="text-3xl mb-4">🚀</div>
                    <h3 className="font-bold text-lg mb-2">Production Ready</h3>
                    <p className="text-gray-600 text-sm">
                        Optimized builds with Rollup for best performance
                    </p>
                </div>
            </div>
        </div>
    );
}

export default HomePage;