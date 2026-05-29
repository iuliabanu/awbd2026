const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

const ACCENTS = [
    { bg: '#F0FDF4', icon: '#16A34A', strip: '#16A34A' },
];


function getAccent(id) {
    return ACCENTS[(id ?? 0) % ACCENTS.length];
}

function PackageIcon({ color }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-9 h-9"
        >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
    );
}

function StockPip({ stock }) {
    if (stock === 0)  return <span className="text-[11px] font-medium" style={{ color: '#DC2626' }}>● Out of stock</span>;
    if (stock <= 5)   return <span className="text-[11px] font-medium animate-pulse" style={{ color: '#D97706' }}>● Only {stock} left</span>;
    if (stock < 10)   return <span className="text-[11px] font-medium" style={{ color: '#D97706' }}>● Low stock</span>;
    return null;
}

function ProductCard({ product, onClick, onCheckPromo }) {
    const stock      = product.quantity ?? 0;
    const outOfStock = stock === 0;
    const accent     = getAccent(product.id);

    return (
        <article
            onClick={!outOfStock ? onClick : undefined}
            className={`bg-white rounded-xl flex flex-col overflow-hidden transition-all duration-200
                ${outOfStock
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 group'}`}
            style={{ border: '1px solid #E5E7EB', fontFamily: SANS, position: 'relative' }}
        >
            {/* Stock badge — top right */}
            {(stock === 0 || stock <= 5 || stock < 10) && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1 }}>
                    <StockPip stock={stock} />
                </div>
            )}

            {/* Accent strip */}
            <div style={{ height: '3px', background: accent.strip, flexShrink: 0 }} />

            {/* Image area */}
            <div
                className="flex items-center justify-center"
                style={{ height: '10px', background: accent.bg, flexShrink: 0 }}
            >
                <div className={`transition-transform duration-300 ${!outOfStock ? 'group-hover:scale-110' : ''}`}>
                    <PackageIcon color={accent.icon} />
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 flex-1" style={{ padding: '16px 16px 20px' }}>
                <div className="flex flex-col gap-1.5 flex-1">
                    <h3
                        className="text-sm leading-snug line-clamp-2"
                        style={{
                            color: '#111827',
                            fontFamily: SERIF,
                            fontWeight: 400,
                            fontSize: '15px',
                        }}
                    >
                        {product.name}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#9CA3AF' }}>
                        {product.description}
                    </p>
                </div>

                <div style={{ height: '1px', background: '#F3F4F6' }} />

                <div className="flex items-end justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                        <span
                            className="font-bold"
                            style={{ color: accent.icon, fontSize: '20px', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: SANS }}
                        >
                            ${Number(product.price).toFixed(2)}
                        </span>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); if (!outOfStock) onCheckPromo(); }}
                        disabled={outOfStock}
                        aria-label={`Check promo for ${product.name}`}
                        className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                            background: outOfStock ? '#F9FAFB' : '#EFF6FF',
                            color:      outOfStock ? '#D1D5DB' : '#2563EB',
                            border:     `1px solid ${outOfStock ? '#E5E7EB' : '#BFDBFE'}`,
                            cursor:     outOfStock ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Promo
                    </button>
                </div>
            </div>
        </article>
    );
}

export default ProductCard;