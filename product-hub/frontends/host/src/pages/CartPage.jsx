import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../shared/CartContext';
import { checkout } from '../api/cartApi';

const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

function CartPage() {
    const navigate = useNavigate();
    const { cartItems, clearCart } = useCart();

    const [checkoutState, setCheckoutState] = useState('idle'); // idle | loading | success | error
    const [orderResult, setOrderResult]     = useState(null);
    const [errorMsg, setErrorMsg]           = useState('');

    const total = cartItems.reduce((sum, item) => sum + item.displayPrice * item.quantity, 0);
    const originalTotal = cartItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
    const hasDiscount = originalTotal > total;

    async function handleCheckout() {
        setCheckoutState('loading');
        setErrorMsg('');
        try {
            const items = cartItems.map(item => ({
                productId:   item.id,
                productName: item.name,
                quantity:    item.quantity,
                unitPrice:   item.displayPrice,
            }));
            const result = await checkout(items);
            setOrderResult(result);
            setCheckoutState('success');
            clearCart();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error   ||
                err?.message                 ||
                'Checkout failed. Please try again.';
            setErrorMsg(msg);
            setCheckoutState('error');
        }
    }

    if (cartItems.length === 0 && checkoutState !== 'success') {
        return (
            <div className="max-w-2xl mx-auto text-center" style={{ fontFamily: SANS, paddingTop: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
                <h2 style={{ fontFamily: SERIF, fontSize: '24px', color: '#111827', fontWeight: 400 }}>Your cart is empty</h2>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '8px' }}>Add some products to get started.</p>
                <button
                    onClick={() => navigate('/products')}
                    style={{
                        marginTop: '24px', padding: '10px 24px', borderRadius: '9999px',
                        background: '#2563EB', color: 'white', border: 'none',
                        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    Browse products
                </button>
            </div>
        );
    }

    // ── Order confirmed screen ──────────────────────────────────────────
    if (checkoutState === 'success' && orderResult) {
        return (
            <div className="max-w-2xl mx-auto text-center" style={{ fontFamily: SANS, paddingTop: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ fontFamily: SERIF, fontSize: '24px', color: '#111827', fontWeight: 400 }}>
                    Order Confirmed!
                </h2>
                <div style={{
                    background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB',
                    padding: '24px', marginTop: '24px', textAlign: 'left',
                }}>
                    <Row label="Order ID"      value={`#${orderResult.orderId}`} />
                    <Row label="Status"        value={orderResult.status} color="#16A34A" />
                    <Row label="Total"         value={`$${Number(orderResult.totalAmount).toFixed(2)}`} serif />
                    <Row label="Points earned" value={`+${orderResult.pointsAwarded} pts`} color="#2563EB" />
                    <Row label="Total points"  value={`${orderResult.totalPoints} pts`} />
                    {orderResult.message && (
                        <p style={{ marginTop: '16px', fontSize: '13px', color: '#6B7280', textAlign: 'center' }}>
                            {orderResult.message}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => { setCheckoutState('idle'); navigate('/products'); }}
                    style={{
                        marginTop: '24px', padding: '10px 24px', borderRadius: '9999px',
                        background: '#2563EB', color: 'white', border: 'none',
                        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    Continue shopping
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto" style={{ fontFamily: SANS }}>

            {/* Back */}
            <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center gap-1.5 text-sm mb-6"
                style={{ color: '#6B7280', cursor: 'pointer', background: 'none', border: 'none' }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Products
            </button>

            <h1 style={{ fontFamily: SERIF, fontSize: '22px', color: '#111827', fontWeight: 400, marginBottom: '20px' }}>
                Your Cart
            </h1>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {cartItems.map((item, idx) => {
                    const promoOn = item.displayPrice < item.originalPrice;
                    const lineTotal = item.displayPrice * item.quantity;
                    return (
                        <div key={idx} style={{
                            background: 'white', borderRadius: '12px',
                            border: '1px solid #E5E7EB', padding: '14px 18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                        }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: '14px', color: '#111827', margin: 0 }}>{item.name}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: 500 }}>
                                        ${item.displayPrice.toFixed(2)}
                                    </span>
                                    {promoOn && (
                                        <span style={{ fontSize: '12px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                                            ${item.originalPrice.toFixed(2)}
                                        </span>
                                    )}
                                    {promoOn && (
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '9999px', padding: '1px 7px' }}>
                                            -{item.discountPct}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', color: '#6B7280' }}>×{item.quantity}</span>
                                <span style={{ fontFamily: SERIF, fontSize: '16px', color: '#111827', fontWeight: 400, minWidth: '60px', textAlign: 'right' }}>
                                    ${lineTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Total */}
            <div style={{
                background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB',
                padding: '20px 24px',
            }}>
                {hasDiscount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Original total</span>
                        <span style={{ fontSize: '13px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                            ${originalTotal.toFixed(2)}
                        </span>
                    </div>
                )}
                {hasDiscount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600 }}>Promo savings</span>
                        <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600 }}>
                            -${(originalTotal - total).toFixed(2)}
                        </span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: hasDiscount ? '1px solid #F3F4F6' : 'none', paddingTop: hasDiscount ? '12px' : 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: '#111827' }}>Total</span>
                    <span style={{ fontFamily: SERIF, fontSize: '28px', color: '#111827', letterSpacing: '-0.02em' }}>
                        ${total.toFixed(2)}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                        onClick={clearCart}
                        disabled={checkoutState === 'loading'}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '9999px',
                            background: 'white', color: '#6B7280',
                            border: '1px solid #E5E7EB', fontSize: '13px',
                            fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Clear cart
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={checkoutState === 'loading'}
                        style={{
                            flex: 2, padding: '10px', borderRadius: '9999px',
                            background: checkoutState === 'loading' ? '#93C5FD' : '#2563EB',
                            color: 'white', border: 'none', fontSize: '13px',
                            fontWeight: 600, cursor: checkoutState === 'loading' ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        {checkoutState === 'loading' ? 'Processing…' : 'Checkout'}
                    </button>
                </div>

                {/* Error message */}
                {checkoutState === 'error' && (
                    <div style={{
                        marginTop: '14px', padding: '10px 14px', borderRadius: '8px',
                        background: '#FEF2F2', border: '1px solid #FECACA',
                        fontSize: '13px', color: '#B91C1C',
                    }}>
                        ⚠️ {errorMsg}
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({ label, value, color, serif }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
            <span style={{
                fontSize: serif ? '18px' : '14px',
                fontFamily: serif ? SERIF : SANS,
                color: color || '#111827',
                fontWeight: 600,
            }}>{value}</span>
        </div>
    );
}

export default CartPage;

