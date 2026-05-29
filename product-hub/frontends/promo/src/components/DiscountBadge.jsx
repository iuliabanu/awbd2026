const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

function DiscountBadge({ discount }) {
    const pct    = discount?.percentage ?? discount?.discountPercentage ?? 0;
    const detail = discount?.description ?? '';
    const expiry = discount?.expiryDate;

    if (!pct) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px 24px', background: '#F9FAFB', fontFamily: SANS }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 500, fontSize: '14px', color: '#374151', margin: 0 }}>No active promotions</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Check back later for deals.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: SANS }}>
            {/* Discount band */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#EFF6FF', padding: '28px 24px 20px' }}>
                <span style={{ fontFamily: SERIF, fontSize: '56px', color: '#2563EB', lineHeight: 1, letterSpacing: '-0.03em' }}>
                    -{pct}%
                </span>
                <span style={{ color: '#60A5FA', fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    discount
                </span>
            </div>

            {/* Tear line */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#EFF6FF' }}>
                <div style={{ position: 'absolute', left: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'white' }} />
                <div style={{ flex: 1, margin: '0 16px', borderTop: '2px dashed #BFDBFE' }} />
                <div style={{ position: 'absolute', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'white' }} />
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px', background: '#EFF6FF' }}>
                {detail && <p style={{ fontWeight: 600, fontSize: '14px', color: '#1E40AF', margin: 0 }}>{detail}</p>}
                {expiry && (
                    <p style={{ fontSize: '12px', color: '#93C5FD', margin: 0 }}>
                        Expires {new Date(expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                )}
            </div>
        </div>
    );
}

export default DiscountBadge;

