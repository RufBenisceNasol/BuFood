import React, { useMemo, useState, useEffect } from 'react';

/*
 * ProductOptionsModal
 * - Bottom sheet style chooser for variants/options and quantity
 * - Works even if product has no variants: shows only quantity
 * - Variant data supported (any that exist will be rendered):
 *   - product.variants: [{ id, name, price, image }]
 *   - product.options: { Color: ['Black','Silver'], Size: ['S','M'] }
 */
export default function ProductOptionsModal({
  open,
  product,
  initialQuantity = 1,
  action = 'cart', // 'cart' | 'favorite'
  onClose,
  onConfirm,
}) {
  const [qty, setQty] = useState(initialQuantity);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    setQty(initialQuantity || 1);
  }, [initialQuantity, open]);

  const variants = useMemo(() => Array.isArray(product?.variants) ? product.variants : [], [product]);
  const optionGroups = useMemo(() => {
    if (product && product.options && typeof product.options === 'object' && !Array.isArray(product.options)) {
      // Normalize into array of { name, values[] }
      return Object.entries(product.options).map(([name, values]) => ({
        name,
        values: Array.isArray(values) ? values : [],
      }));
    }
    return [];
  }, [product]);

  const hasChoices = variants.length > 0 || optionGroups.length > 0;

  const handleSelectOption = (groupName, value) => {
    setSelectedOptions(prev => ({ ...prev, [groupName]: value }));
  };

  const handleConfirm = () => {
    const payload = {
      quantity: qty,
      selectedVariantId: variants.length ? selectedVariantId : null,
      selectedOptions: optionGroups.length ? selectedOptions : {},
    };
    onConfirm?.(payload);
  };

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={product?.image}
              alt={product?.name || 'Product'}
              style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.style.opacity = 0.4; }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#222' }}>{product?.name || 'Product'}</div>
              <div style={{ fontWeight: 600, color: '#ff8c00' }}>₱{Number(product?.price || 0).toFixed(2)}</div>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close chooser">✕</button>
        </div>

        {/* Variants */}
        {variants.length > 0 && (
          <div style={styles.block}>
            <div style={styles.blockTitle}>Variant</div>
            <div style={styles.chips}>
              {variants.map(v => (
                <button
                  key={v.id || v._id || v.name}
                  style={{
                    ...styles.chip,
                    ...(selectedVariantId === (v.id || v._id || v.name) ? styles.chipActive : {}),
                  }}
                  onClick={() => setSelectedVariantId(v.id || v._id || v.name)}
                >
                  {v.name || 'Option'}{typeof v.price === 'number' ? ` · ₱${v.price.toFixed(0)}` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Option groups */}
        {optionGroups.map(group => (
          <div key={group.name} style={styles.block}>
            <div style={styles.blockTitle}>{group.name}</div>
            <div style={styles.chips}>
              {group.values.map(val => {
                const active = selectedOptions[group.name] === val;
                return (
                  <button
                    key={val}
                    style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                    onClick={() => handleSelectOption(group.name, val)}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quantity */}
        <div style={styles.block}>
          <div style={styles.blockTitle}>Quantity</div>
          <div style={styles.qtyRow}>
            <button style={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <div style={styles.qtyValue}>{qty}</div>
            <button style={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>＋</button>
          </div>
        </div>

        {/* Footer actions */}
        <div style={styles.footer}>
          {action === 'favorite' ? (
            <button style={styles.primary} onClick={handleConfirm}>Add to Favorites</button>
          ) : (
            <button style={styles.primary} onClick={handleConfirm}>Add to Cart</button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 3000,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
  },
  sheet: {
    width: '100%', maxWidth: 520, background: '#fff', borderRadius: '16px 16px 0 0',
    boxShadow: '0 -8px 24px rgba(0,0,0,0.18)', padding: 16, maxHeight: '85vh', overflowY: 'auto'
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer'
  },
  block: { marginTop: 10 },
  blockTitle: { fontWeight: 700, marginBottom: 8, color: '#333' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: {
    border: '1px solid #e0e0e0', background: '#fff', padding: '8px 12px', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, color: '#444'
  },
  chipActive: {
    borderColor: '#ff8c00', background: 'rgba(255,140,0,0.08)', color: '#ff8c00'
  },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 18
  },
  qtyValue: { minWidth: 28, textAlign: 'center', fontWeight: 700 },
  footer: { position: 'sticky', bottom: 0, paddingTop: 10 },
  primary: {
    width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, #fbaa39, #fc753b)', color: '#fff',
    border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
  }
};
