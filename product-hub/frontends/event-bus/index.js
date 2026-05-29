// event-bus — shared singleton event bus for micro-frontends
// Both host and remotes declare this as a MF shared singleton,
// so Module Federation guarantees only one instance is loaded.

class EventBus {
    constructor() {
        this._events = {};
    }

    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    subscribe(event, callback) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(callback);

        // return unsubscribe
        return () => {
            this._events[event] = this._events[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Publish an event with optional payload.
     * @param {string} event
     * @param {*} data
     */
    publish(event, data) {
        if (this._events[event]) {
            this._events[event].forEach(callback => callback(data));
        }
    }
}

export const eventBus = new EventBus();

export const EVENTS = {
    /** Fired by productUI when user clicks "Add to Cart".
     *  Payload: { id, name, price, quantity }
     */
    CART_UPDATED: 'cart:updated',

    /** Fired by productUI when a promo is displayed.
     *  Payload: { productId, percentage, description }
     */
    PROMO_APPLIED: 'promo:applied',

    /** Fired by productUI when user selects a product.
     *  Payload: { id, name }
     */
    PRODUCT_SELECTED: 'product:selected',
};

