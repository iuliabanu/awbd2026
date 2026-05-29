import axios from 'axios';
import { userManager } from '../shared/auth';
import { env } from '../shared/env';

const cartClient = axios.create({
    baseURL: env.CART_API_URL,
});

// Attach Bearer token
cartClient.interceptors.request.use(async (config) => {
    const user = await userManager.getUser();
    if (user?.access_token) {
        config.headers.Authorization = `Bearer ${user.access_token}`;
    }
    return config;
});

/**
 * POST /cart/checkout
 * @param {Array<{productId, productName, quantity, unitPrice}>} items
 * @returns {Promise<{orderId, status, totalAmount, pointsAwarded, totalPoints, items, message}>}
 */
export async function checkout(items) {
    const response = await cartClient.post('/cart/checkout', { items });
    return response.data;
}

