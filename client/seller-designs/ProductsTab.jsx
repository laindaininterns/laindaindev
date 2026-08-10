export default function ProductsTab({ products, setProducts, handleAdjustStock, handleToggleOutOfStock, onOpenAddModal, onOpenEditModal }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-black tracking-tight">Products & Inventory</h1>
          <p className="text-[13px] text-[#5B5B58] mt-0.5">
            Update stock levels, toggle out-of-stock visibility, and manage wholesale specifications.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="h-[40px] px-4 rounded-[12px] bg-[#A3C1BF] text-black text-[13px] font-semibold hover:bg-[#85A6A3] transition-all active:scale-[0.97]"
        >
          + Add New Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className={`bg-white p-5 rounded-[20px] border transition-all shadow-xs flex flex-col justify-between ${
              product.isOutOfStock ? "border-red-200 bg-red-50/10" : "border-[#E9E8E2]"
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  {/* Photo thumbnail */}
                  <div className="w-14 h-14 rounded-[12px] bg-[#EEF3F2] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#E9E8E2]">
                    {product.photos && product.photos.length > 0 ? (
                      <img src={product.photos[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a6 6 0 018.486 0L21.75 15.75m-18 0l-1.35-1.35a2.25 2.25 0 010-3.181l1.35-1.35m0 0a2.25 2.25 0 013.18 0l1.35 1.35m-1.35-1.35L9 9m12 6.75V19.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5v-3.75m18 0l-1.35-1.35a2.25 2.25 0 00-3.18 0l-1.35 1.35m0 0L15 15" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#5B5B58] uppercase bg-[#EEF3F2] px-2 py-0.5 rounded-full border border-[#E9E8E2]">
                      {product.cat}
                    </span>
                    <h3 className="font-semibold text-[15px] text-black mt-1 leading-tight">{product.name}</h3>
                    <p className="text-[11px] text-[#5B5B58] mt-0.5">SKU: {product.sku}</p>
                  </div>
                </div>
                
                {/* Status displayed on the top right + Edit button */}
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    product.isOutOfStock
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {product.isOutOfStock ? "Out of Stock" : "In Stock"}
                  </span>
                  <button
                    onClick={() => onOpenEditModal(product)}
                    className="text-[12px] text-[#85A6A3] hover:text-[#5B5B58] transition-colors flex items-center gap-1 font-medium"
                  >
                    Edit ✏️
                  </button>
                </div>
              </div>

              {/* Mini thumbnails preview */}
              {product.photos && product.photos.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {product.photos.map((photo, index) => (
                    <div key={index} className="w-8 h-8 rounded-[6px] overflow-hidden border border-[#E9E8E2] bg-[#EEF3F2]">
                      <img src={photo} alt={`${product.name} mini ${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 my-4 p-3 rounded-[12px] bg-[#F9F9F6] border border-[#E9E8E2]">
                <div>
                  <span className="text-[11px] text-[#5B5B58]">Wholesale Price</span>
                  <p className="font-semibold text-[15px] text-black">Rs. {product.price}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#5B5B58]">Min. Order (MOQ)</span>
                  <p className="font-semibold text-[15px] text-black">{product.moq} units</p>
                </div>
              </div>
            </div>

            {/* Out of Stock Toggle / Stock Management Controls */}
            <div className="pt-3 border-t border-[#E9E8E2] space-y-3">
              {/* Toggle switch above the stock controls */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#5B5B58]">Availability status:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!product.isOutOfStock}
                    onChange={() => handleToggleOutOfStock(product.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#E9E8E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A3C1BF]"></div>
                  <span className="ml-2 text-[12px] font-medium text-black">
                    {product.isOutOfStock ? "Set to In Stock" : "Set to Out of Stock"}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-[#5B5B58]">Stock:</span>
                  
                  {/* Manual Stock Input */}
                  <input
                    type="number"
                    disabled={product.isOutOfStock}
                    value={product.isOutOfStock ? 0 : product.stock}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const finalVal = isNaN(val) ? 0 : Math.max(0, val);
                      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: finalVal } : p));
                    }}
                    className="w-20 h-8 px-2 text-center text-[13px] font-semibold border border-[#E9E8E2] rounded-[8px] bg-white focus:outline-none focus:ring-1 focus:ring-[#85A6A3] focus:border-[#85A6A3] disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                  />
                </div>

                {/* +/- 10 Increments */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={product.isOutOfStock}
                    onClick={() => handleAdjustStock(product.id, -10)}
                    className="h-8 w-8 rounded-[8px] bg-[#EEF3F2] hover:bg-[#E9E8E2] text-black font-semibold text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-medium text-[#5B5B58] px-1">10</span>
                  <button
                    disabled={product.isOutOfStock}
                    onClick={() => handleAdjustStock(product.id, 10)}
                    className="h-8 w-8 rounded-[8px] bg-[#EEF3F2] hover:bg-[#E9E8E2] text-black font-semibold text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
