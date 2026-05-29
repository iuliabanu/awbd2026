import { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProducts, getDiscountById } from '../api/productApi.jsx';
import ProductCard from './ProductCard';

const DiscountBadge = lazy(() => import('promoUI/DiscountBadge'));

const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";


function SearchIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
             aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
    );
}


function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div style={{ height: '3px', background: '#E5E7EB' }} />
            <div className="animate-pulse" style={{ height: '148px', background: '#F9FAFB' }} />
            <div className="p-5 flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                    <div className="h-4 rounded-md animate-pulse bg-gray-100" style={{ width: '65%' }} />
                    <div className="h-3 rounded animate-pulse bg-gray-100" />
                    <div className="h-3 rounded animate-pulse bg-gray-100" style={{ width: '75%' }} />
                </div>
                <div style={{ height: '1px', background: '#F3F4F6' }} />
                <div className="flex justify-between items-end">
                    <div className="h-5 w-16 rounded animate-pulse bg-gray-100" />
                    <div className="h-7 w-16 rounded-lg animate-pulse bg-gray-100" />
                </div>
            </div>
        </div>
    );
}


function PromoPanel({ product, discount, isLoading, onClose }) {
    return (
        <div
            style={{
                marginTop: '1.5rem',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                background: 'white',
                fontFamily: SANS,
            }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Promo · <span style={{ color: '#111827', fontFamily: SERIF, fontSize: '14px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{product.name}</span>
                </span>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px', lineHeight: 1, padding: '0 2px' }}
                >×</button>
            </div>

            {/* Body — DiscountBadge from promoUI */}
            {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9CA3AF', fontSize: '13px', padding: '24px 20px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #E5E7EB', borderTopColor: '#2563EB', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    Checking promotions…
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <Suspense fallback={<div style={{ height: '80px' }} />}>
                    <DiscountBadge discount={discount ?? {}} />
                </Suspense>
            )}
        </div>
    );
}


function PaginationBtn({ onClick, disabled, label, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            style={{
                width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '10px',
                fontSize: '18px',
                fontWeight: 500,
                background: 'white',
                border: '1px solid #E5E7EB',
                color: disabled ? '#D1D5DB' : '#374151',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
            }}
        >
            {children}
        </button>
    );
}


function ProductList() {
    const navigate = useNavigate();
    const [page, setPage]                     = useState(0);
    const [search, setSearch]                 = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);

    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: ['products', page, search],
        queryFn:  () => getProducts({ page, size: 6, search }),
        keepPreviousData: true,
    });

    const products   = data?.content    ?? [];
    const totalPages = data?.totalPages ?? 0;

    const { data: discount, isLoading: discountLoading } = useQuery({
        queryKey: ['discount', selectedProduct?.id],
        queryFn:  () => getDiscountById(selectedProduct.id),
        enabled:  !!selectedProduct,
    });

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl py-16 bg-white"
                 style={{ border: '1px solid #FEE2E2', fontFamily: SANS }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                     aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="font-medium text-sm" style={{ color: '#EF4444' }}>{error.message}</p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: SANS }}>

            {/* ── Page header ── */}
            <div className="flex items-center gap-3 mb-8">
                {/* Search */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <span style={{
                        position: 'absolute', top: 0, bottom: 0, left: '10px',
                        display: 'flex', alignItems: 'center', pointerEvents: 'none',
                        color: '#9CA3AF',
                    }}>
                        <SearchIcon />
                    </span>
                    <input
                        type="search"
                        placeholder="Search products…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        style={{
                            width: '220px', outline: 'none',
                            borderRadius: '8px', padding: '10px 16px 10px 32px',
                            fontSize: '14px', background: 'white',
                            border: '1px solid #E5E7EB', color: '#111827',
                            fontFamily: SANS,
                        }}
                    />
                </div>

                {/* Item count */}
                {data && !isLoading && (
                    <span style={{ color: '#9CA3AF', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {data.totalElements} item{data.totalElements !== 1 ? 's' : ''}
                        {search && <> matching <em>"{search}"</em></>}
                    </span>
                )}
            </div>


            {/* ── Card grid ── */}
            <style>{`
                .product-grid {
                    display: grid;
                    gap: 1.25rem;
                    grid-template-columns: 1fr;
                }
                @media (min-width: 640px)  { .product-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1024px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
            `}</style>
            <div className={`product-grid transition-opacity duration-150 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
                {isLoading
                    ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                    : products.length > 0
                        ? products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={() => navigate(`/products/${product.id}`)}
                                onCheckPromo={() => setSelectedProduct(product)}
                            />
                        ))
                        : (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 gap-3">
                                <p className="font-medium text-sm" style={{ color: '#6B7280' }}>No products found</p>
                                {search && (
                                    <button onClick={() => setSearch('')} className="text-xs" style={{ color: '#2563EB' }}>
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )
                }
            </div>

            {/* ── Inline promo panel ── */}
            {selectedProduct && (
                <PromoPanel
                    product={selectedProduct}
                    discount={discount}
                    isLoading={discountLoading}
                    onClose={() => setSelectedProduct(null)}
                />
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-8">
                    <PaginationBtn onClick={() => setPage(0)} disabled={page === 0} label="First">«</PaginationBtn>
                    <PaginationBtn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} label="Previous">‹</PaginationBtn>

                    <span
                        className="px-4 py-2 rounded-lg text-sm font-semibold select-none"
                        style={{
                            background: '#2563EB',
                            color:      'white',
                            minWidth:   '80px',
                            textAlign:  'center',
                        }}
                    >
                        {page + 1} / {totalPages}
                    </span>

                    <PaginationBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} label="Next">›</PaginationBtn>
                    <PaginationBtn onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} label="Last">»</PaginationBtn>
                </div>
            )}
        </div>
    );
}

export default ProductList;