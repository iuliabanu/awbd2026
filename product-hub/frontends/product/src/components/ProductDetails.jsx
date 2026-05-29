import { Suspense, lazy, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById, getDiscountById } from '../api/productApi';
import { eventBus, EVENTS } from '@mf/event-bus';

const DiscountBadge = lazy(() => import('promoUI/DiscountBadge'));

const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

const ACCENT = { bg: '#F0FDF4', icon: '#16A34A', text: '#15803D', light: '#DCFCE7' };

function getAccent() {
    return ACCENT;
}

function PackageIcon({ color, size = 64 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
             stroke={color} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"
             aria-hidden="true">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
    );
}

function StockBadge({ stock }) {
    if (stock === 0) {
        return (
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                Out of stock
            </span>
        );
    }
    if (stock < 10) {
        return (
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                Only {stock} left
            </span>
        );
    }
    return (
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
            In stock
        </span>
    );
}

function MetaField({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#9CA3AF' }}>
                {label}
            </p>
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>
                {value}
            </p>
        </div>
    );
}


function DetailSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-md"
             style={{ border: '1px solid #E5E7EB' }}>
            <div className="animate-pulse" style={{ minHeight: '360px', background: '#F9FAFB' }} />
            <div className="p-8 flex flex-col gap-10">
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" style={{ width: '40%' }} />
                <div className="h-5 rounded bg-gray-100 animate-pulse" style={{ width: '25%' }} />
                <div className="space-y-2">
                    <div className="h-3 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 rounded bg-gray-100 animate-pulse" style={{ width: '85%' }} />
                    <div className="h-3 rounded bg-gray-100 animate-pulse" style={{ width: '70%' }} />
                </div>
                <div className="h-12 rounded-xl bg-gray-100 animate-pulse mt-auto" />
            </div>
        </div>
    );
}


function BackButton({ navigate }) {
    return (
        <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-1.5 text-sm transition-colors mb-6"
            style={{ color: '#6B7280', fontFamily: SANS, cursor: 'pointer' }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Products
        </button>
    );
}

function ProductDetails() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn:  () => getProductById(id),
    });

    const { data: discount, isLoading: discountLoading } = useQuery({
        queryKey: ['discount', id],
        queryFn:  () => getDiscountById(id),
        enabled:  !!id,
    });

    const [promoApplied, setPromoApplied] = useState(false);

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto" style={{ fontFamily: SANS }}>
                <BackButton navigate={navigate} />
                <DetailSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto" style={{ fontFamily: SANS }}>
                <BackButton navigate={navigate} />
                <div className="bg-white rounded-xl p-10 flex flex-col items-center gap-4 shadow-sm"
                     style={{ border: '1px solid #FEE2E2' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                         stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"
                         strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="font-medium text-sm" style={{ color: '#EF4444' }}>{error.message}</p>
                </div>
            </div>
        );
    }

    const stock  = product.quantity ?? product.stock ?? 0;
    const accent = getAccent();

    const discountPct   = discount?.percentage ?? 0;
    const originalPrice = Number(product.price);
    const displayPrice  = promoApplied && discountPct > 0
        ? originalPrice * (1 - discountPct / 100)
        : originalPrice;


    return (
        <div className="max-w-2xl mx-auto" style={{ fontFamily: SANS }}>
            <BackButton navigate={navigate} />

            <div
                className="bg-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-md"
                style={{ border: '1px solid #E5E7EB' }}
            >
                {/* ── Left: image panel ── */}
                <div
                    className="relative flex flex-col items-center justify-center"
                    style={{ background: accent.bg, minHeight: '160px', padding: '20px 20px' }}
                >
                    {/* Accent strip top */}
                    <div className="absolute top-0 left-0 right-0" style={{ height: '3px', background: accent.icon }} />

                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="flex items-center justify-center rounded-xl"
                            style={{ width: '52px', height: '52px', background: accent.light, border: `1px solid ${accent.icon}20` }}
                        >
                            <PackageIcon color={accent.icon} size={64} />
                        </div>

                        <div className="text-center" style={{ maxWidth: '200px' }}>
                            <h1 style={{ fontFamily: SERIF, fontSize: '16px', color: accent.text, lineHeight: 1.2, fontWeight: 400, letterSpacing: '-0.01em' }}>
                                {product.name}
                            </h1>
                            <p style={{ color: accent.icon, fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>
                                Product #{product.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Right: info panel ── */}
                <div className="flex flex-col gap-7" style={{ padding: '20px 20px 24px' }}>

                    {/* Price */}
                    <div>
                        <p style={{ color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: '4px' }}>
                            Price
                        </p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <p style={{ fontFamily: SERIF, fontSize: '24px', color: accent.icon, lineHeight: 1, letterSpacing: '-0.03em', fontWeight: 400 }}>
                                ${displayPrice.toFixed(2)}
                            </p>
                            {promoApplied && discountPct > 0 && (
                                <p style={{ fontFamily: SERIF, fontSize: '16px', color: '#9CA3AF', textDecoration: 'line-through', lineHeight: 1 }}>
                                    ${originalPrice.toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stock */}
                    <div><StockBadge stock={stock} /></div>

                    {/* Description */}
                    <div className="flex-1 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <p style={{ color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: '6px' }}>
                            Description
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
                            {product.description || 'No description available.'}
                        </p>
                    </div>

                    {/* Meta grid */}
                    <div className="pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <MetaField label="Quantity" value={`${stock} units`} />
                    </div>

                    {/* Promo badge */}
                    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                        <div style={{ padding: '8px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Promotion
                            </span>
                            {discountPct > 0 && !promoApplied && (
                                <button
                                    onClick={() => setPromoApplied(true)}
                                    style={{
                                        fontSize: '11px', fontWeight: 600, padding: '3px 10px',
                                        borderRadius: '9999px', border: '1px solid #BFDBFE',
                                        background: '#EFF6FF', color: '#2563EB', cursor: 'pointer',
                                    }}>
                                    Apply promo
                                </button>
                            )}
                            {promoApplied && discountPct > 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#16A34A' }}>
                                    ✓ Applied
                                </span>
                            )}
                        </div>
                        {discountLoading ? (
                            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '12px' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #E5E7EB', borderTopColor: '#2563EB', animation: 'spin 0.7s linear infinite' }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                Checking…
                            </div>
                        ) : (
                            <Suspense fallback={<div style={{ height: '60px' }} />}>
                                <DiscountBadge discount={discount ?? {}} />
                            </Suspense>
                        )}
                    </div>

                    {/* CTA */}
                    <button
                        disabled={stock === 0}
                        onClick={() => {
                            if (stock > 0) {
                                eventBus.publish(EVENTS.CART_UPDATED, {
                                    id:            product.id,
                                    name:          product.name,
                                    originalPrice: originalPrice,
                                    displayPrice:  displayPrice,
                                    discountPct:   promoApplied ? discountPct : 0,
                                    quantity:      1,
                                });
                            }
                        }}
                        className="w-full py-3 rounded-full text-sm font-semibold transition-colors"
                        style={{
                            background: stock === 0 ? '#F9FAFB' : '#2563EB',
                            color:      stock === 0 ? '#9CA3AF' : 'white',
                            border:     `1px solid ${stock === 0 ? '#E5E7EB' : '#2563EB'}`,
                            cursor:     stock === 0 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductDetails;