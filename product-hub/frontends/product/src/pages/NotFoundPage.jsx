import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className="text-center py-20">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">Page not found</p>
            <Link
                to="/"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
                Go Home
            </Link>
        </div>
    );
}

export default NotFoundPage;