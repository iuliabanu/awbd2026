import axios from 'axios';
import { userManager } from '../shared/auth';

const API_BASE_URL =
    (typeof window !== 'undefined' && window.__ENV__?.PRODUCT_API_URL) ||
    import.meta.env.VITE_PRODUCT_API_URL ||
    'http://localhost:8082/api';

const productApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

productApi.interceptors.request.use(async (config) => {
    const user = await userManager.getUser();
    if (user?.access_token) {
        config.headers.Authorization = `Bearer ${user.access_token}`;
    }
    return config;
});

export const getProducts = async ({ page = 0, size = 12, category, search }) => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(category && { category }),
        ...(search && { search }),
    });

    try {
        const response = await productApi.get(`/products?${params}`);

        if (Array.isArray(response.data)) {
            return {
                content: response.data,
                totalPages: 1,
                totalElements: response.data.length,
                number: 0,
            };
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const getProductById = async (id) => {
    try {
        const response = await productApi.get(`/products/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        throw error;
    }
};

export const getDiscountById = async (productId) => {
    try {
        const response = await productApi.get(`/discounts/${productId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching discount for product ${productId}:`, error);
        throw error;
    }
};

