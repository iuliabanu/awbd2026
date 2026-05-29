import { useEffect, useState } from 'react';
import axios from 'axios';

function PromoBanner() {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    const apiBase =
        (typeof window !== 'undefined' && window.__ENV__?.PRODUCT_API_URL) ||
        import.meta.env.VITE_PRODUCT_API_URL ||
        'http://localhost:8082/api';

    useEffect(() => {
        axios
            .get(`${apiBase}/discounts`)
            .then((res) => {
                setDiscounts(Array.isArray(res.data) ? res.data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error('PromoBanner: failed to fetch discounts', err);
                setError('Could not load promotions.');
                setLoading(false);
            });
    }, [apiBase]);

    if (loading) {
        return (
            <div className="flex justify-center py-4 text-gray-500 text-sm">
                Loading promotions…
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded px-4 py-2 text-sm">
                {error}
            </div>
        );
    }

    if (!discounts.length) return null;

    return (
        <div className="w-full bg-yellow-400 text-yellow-900 py-3 px-6 rounded-lg shadow flex flex-wrap gap-4 items-center justify-center">
            <span className="font-bold text-lg">🏷️ Current Promotions</span>
            {discounts.map((d) => (
                <DiscountBadge key={d.id ?? d.productId} discount={d} />
            ))}
        </div>
    );
}

export default PromoBanner;

