import React, { useState, useMemo } from "react";

export default function SummaryTab({ products = [], orders = [] }) {
  // 1. Sales Summary Range (7 days, 1 month, 3 months)
  const [salesRange, setSalesRange] = useState("3m"); // default to "3m" to show more mock orders

  // 2. Chart Filter State (7d, 1m, 3m, 6m, 1y, custom)
  const [chartRange, setChartRange] = useState("3m");
  const [customStartDate, setCustomStartDate] = useState("2026-07-01");
  const [customEndDate, setCustomEndDate] = useState("2026-08-12");

  // State to hold hovered chart coordinate details
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Helper to filter items based on date range from target date (2026-08-12)
  const filterByDateRange = (items, rangeStr, startStr, endStr) => {
    const baseDate = new Date("2026-08-12");
    return items.filter((item) => {
      const itemDate = new Date(item.date);
      if (rangeStr === "7d") {
        const diffTime = Math.abs(baseDate - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (rangeStr === "1m") {
        const diffTime = Math.abs(baseDate - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      if (rangeStr === "3m") {
        const diffTime = Math.abs(baseDate - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 90;
      }
      if (rangeStr === "6m") {
        const diffTime = Math.abs(baseDate - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 180;
      }
      if (rangeStr === "1y") {
        const diffTime = Math.abs(baseDate - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 365;
      }
      if (rangeStr === "custom") {
        const start = new Date(startStr);
        const end = new Date(endStr);
        return itemDate >= start && itemDate <= end;
      }
      return true;
    });
  };

  // Filtered orders for Summary metrics card
  const filteredSummaryOrders = useMemo(() => {
    return filterByDateRange(orders, salesRange);
  }, [orders, salesRange]);

  // Aggregate stats based on active orders
  const stats = useMemo(() => {
    let grossSales = 0;
    let cost = 0;
    let fees = 0;
    let shipping = 0;
    let returns = 0;

    filteredSummaryOrders.forEach((o) => {
      grossSales += o.total || 0;
      cost += o.cogs ?? 0;
      fees += o.fees ?? 0;
      shipping += o.shipping ?? 0;
      returns += o.returns ?? 0;
    });

    const estimatedProfit = grossSales - cost - fees - shipping - returns;
    const profitMargin = grossSales > 0 ? (estimatedProfit / grossSales) * 100 : 0;
    const orderCount = filteredSummaryOrders.length;
    const avgOrderValue = orderCount > 0 ? Math.round(grossSales / orderCount) : 0;

    return {
      grossSales,
      cost,
      fees,
      shipping,
      returns,
      estimatedProfit,
      profitMargin,
      orderCount,
      avgOrderValue,
    };
  }, [filteredSummaryOrders]);

  // Best Selling Products matching simulated catalog sales
  const bestSellers = useMemo(() => {
    const baseProducts = products.length > 0 ? products : [];
    const factor = salesRange === "7d" ? 1 : salesRange === "1m" ? 3 : 8;

    return baseProducts.map((p, idx) => {
      const qtySold = Math.max(1, Math.floor((12 - idx * 2.5) * factor));
      const revenue = qtySold * p.price;
      return {
        ...p,
        qtySold,
        revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [products, salesRange]);

  // Filtered orders for the Performance Chart
  const chartOrders = useMemo(() => {
    return filterByDateRange(orders, chartRange, customStartDate, customEndDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [orders, chartRange, customStartDate, customEndDate]);

  // Map orders to daily timeline coordinates
  const svgMetrics = useMemo(() => {
    if (chartOrders.length === 0) return { pointsList: [], gridLines: [], xLabels: [], yLabels: [] };

    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 75 };

    // Group sales by date
    const dailySales = {};
    chartOrders.forEach((o) => {
      dailySales[o.date] = (dailySales[o.date] || 0) + o.total;
    });

    const dates = Object.keys(dailySales).sort();
    const maxVal = Math.max(...Object.values(dailySales)) * 1.15 || 50000;
    const minVal = 0;

    const getX = (index) => padding.left + (index / (dates.length - 1 || 1)) * (width - padding.left - padding.right);
    const getY = (value) => height - padding.bottom - ((value - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

    const pointsList = dates.map((dateStr, idx) => {
      const val = dailySales[dateStr];
      const dObj = new Date(dateStr);
      const displayDate = dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        x: getX(idx),
        y: getY(val),
        val,
        date: displayDate,
        fullDate: dateStr,
      };
    });

    const linePath = pointsList.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = pointsList.length > 0 
      ? `${linePath} L ${pointsList[pointsList.length - 1].x} ${height - padding.bottom} L ${pointsList[0].x} ${height - padding.bottom} Z`
      : "";

    // Grid lines
    const yGridCount = 4;
    const yLabels = [];
    const gridLines = [];
    for (let i = 0; i <= yGridCount; i++) {
      const val = minVal + (maxVal - minVal) * (i / yGridCount);
      const y = getY(val);
      yLabels.push({
        y: y + 4,
        label: val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`,
      });
      gridLines.push({
        y1: y,
        y2: y,
        x1: padding.left,
        x2: width - padding.right,
      });
    }

    const xLabels = pointsList.map((p) => ({
      x: p.x,
      label: p.date,
    }));

    return {
      pointsList,
      linePath,
      areaPath,
      gridLines,
      xLabels,
      yLabels,
      width,
      height,
    };
  }, [chartOrders]);

  // Inventory breakdown calculation
  const inventoryStats = useMemo(() => {
    const total = products.length;
    let healthy = 0;
    let low = 0;
    let out = 0;

    products.forEach((p) => {
      if (p.stock === 0 || p.isOutOfStock) {
        out++;
      } else if (p.stock < 10) {
        low++;
      } else {
        healthy++;
      }
    });

    return { total, healthy, low, out };
  }, [products]);

  const formatPKR = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="flex flex-col gap-1.5 border-b border-[#E9E8E2] pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-[#111110]">Dashboard Overview</h1>
        <p className="text-[14px] text-[#5B5B58]">
          Review performance metrics, sales margins, graphs, and inventory health.
        </p>
      </div>

      {/* 1. SALES SUMMARY SECTION */}
      <section className="bg-white rounded-2xl border border-[#E9E8E2] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111110]">Sales Summary</h2>
            <p className="text-xs text-[#5B5B58] mt-0.5">Quick lookup of overall sales metrics</p>
          </div>
          <div className="inline-flex rounded-lg bg-[#F5F5F0] p-1 self-start">
            {[
              { id: "7d", label: "7 Days" },
              { id: "1m", label: "1 Month" },
              { id: "3m", label: "3 Months" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSalesRange(btn.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  salesRange === btn.id
                    ? "bg-[#A3C1BF] text-black shadow-sm"
                    : "text-[#5B5B58] hover:text-[#111110]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sales Stats KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#EEF3F2]/50 border border-[#85A6A3]/20 rounded-xl p-5">
            <span className="text-xs text-[#5B5B58] font-medium uppercase tracking-wider block">Total Sales</span>
            <span className="text-2xl font-extrabold text-[#111110] block mt-1">
              {formatPKR(stats.grossSales)}
            </span>
            <span className="text-[11px] text-[#85A6A3] font-semibold mt-1 inline-block">
              {salesRange === "7d" ? "Past week" : salesRange === "1m" ? "Past 30 days" : "Past 90 days"}
            </span>
          </div>

          <div className="bg-[#EEF3F2]/50 border border-[#85A6A3]/20 rounded-xl p-5">
            <span className="text-xs text-[#5B5B58] font-medium uppercase tracking-wider block">Total Orders</span>
            <span className="text-2xl font-extrabold text-[#111110] block mt-1">
              {stats.orderCount}
            </span>
            <span className="text-[11px] text-[#85A6A3] font-semibold mt-1 inline-block">
              Transactions list
            </span>
          </div>

          <div className="bg-[#EEF3F2]/50 border border-[#85A6A3]/20 rounded-xl p-5">
            <span className="text-xs text-[#5B5B58] font-medium uppercase tracking-wider block">Avg. Order Value</span>
            <span className="text-2xl font-extrabold text-[#111110] block mt-1">
              {formatPKR(stats.avgOrderValue)}
            </span>
            <span className="text-[11px] text-[#85A6A3] font-semibold mt-1 inline-block">
              Active average value
            </span>
          </div>
        </div>

        {/* Best Selling Products Sub-section */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#5B5B58] mb-4">Best Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#E9E8E2] text-xs text-[#5B5B58] uppercase font-semibold">
                  <th className="py-2.5">Product Name</th>
                  <th className="py-2.5">SKU</th>
                  <th className="py-2.5 text-right">Units Sold</th>
                  <th className="py-2.5 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E8E2]">
                {bestSellers.map((item) => (
                  <tr key={item.id} className="text-sm hover:bg-[#F9F9F6]/50 transition-colors">
                    <td className="py-3 font-semibold text-[#111110]">
                      <div className="flex items-center gap-3">
                        {item.photos && item.photos[0] ? (
                          <img
                            src={item.photos[0]}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg border border-[#E9E8E2]"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#EEF3F2] flex items-center justify-center rounded-lg border border-[#E9E8E2] text-xs font-bold text-black">
                            LD
                          </div>
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-[#5B5B58] font-mono">{item.sku}</td>
                    <td className="py-3 text-right font-medium">{item.qtySold} pcs</td>
                    <td className="py-3 text-right font-bold text-emerald-800">{formatPKR(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 2. PROFITABILITY SECTION */}
      <section className="bg-white rounded-2xl border border-[#E9E8E2] p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#111110]">Profitability Metrics</h2>
          <p className="text-xs text-[#5B5B58] mt-0.5">Financial breakdown & margins calculated dynamically from your order data sheet</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#F5F5F0]/60 p-4 rounded-xl border border-[#E9E8E2]">
            <span className="text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider block">Gross Sales</span>
            <span className="text-lg font-bold text-[#111110] block mt-1">{formatPKR(stats.grossSales)}</span>
          </div>

          <div className="bg-[#F5F5F0]/60 p-4 rounded-xl border border-[#E9E8E2]">
            <span className="text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider block">Product Cost (COGS)</span>
            <span className="text-lg font-bold text-[#A84A3B] block mt-1">-{formatPKR(stats.cost)}</span>
          </div>

          <div className="bg-[#F5F5F0]/60 p-4 rounded-xl border border-[#E9E8E2]">
            <span className="text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider block">Marketplace Fees</span>
            <span className="text-lg font-bold text-[#A84A3B] block mt-1">-{formatPKR(stats.fees)}</span>
          </div>

          <div className="bg-[#F5F5F0]/60 p-4 rounded-xl border border-[#E9E8E2]">
            <span className="text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider block">Shipping Costs</span>
            <span className="text-lg font-bold text-[#A84A3B] block mt-1">-{formatPKR(stats.shipping)}</span>
          </div>

          <div className="bg-[#F5F5F0]/60 p-4 rounded-xl border border-[#E9E8E2]">
            <span className="text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider block">Returns & Refunds</span>
            <span className="text-lg font-bold text-[#A84A3B] block mt-1">-{formatPKR(stats.returns)}</span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 col-span-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Estimated Profit</span>
                <span className="text-xl font-black text-emerald-950 block mt-0.5">{formatPKR(stats.estimatedProfit)}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Profit Margin</span>
                <span className="text-xl font-black text-emerald-950 block mt-0.5">{stats.profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SALES PERFORMANCE CHART SECTION */}
      <section className="bg-white rounded-2xl border border-[#E9E8E2] p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111110]">Sales Performance</h2>
            <p className="text-xs text-[#5B5B58] mt-0.5">Timeline chart representing overall revenue growth</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Range Selectors */}
            <div className="inline-flex rounded-lg bg-[#F5F5F0] p-1">
              {[
                { id: "7d", label: "7D" },
                { id: "1m", label: "1M" },
                { id: "3m", label: "3M" },
                { id: "6m", label: "6M" },
                { id: "1y", label: "1Y" },
                { id: "custom", label: "Custom" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setChartRange(btn.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    chartRange === btn.id
                      ? "bg-[#A3C1BF] text-black shadow-sm"
                      : "text-[#5B5B58] hover:text-[#111110]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Custom Range Picker */}
            {chartRange === "custom" && (
              <div className="flex items-center gap-2 bg-[#F5F5F0] p-1 rounded-lg">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold px-2 focus:outline-none focus:ring-0"
                />
                <span className="text-xs text-[#5B5B58]">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold px-2 focus:outline-none focus:ring-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Basic SVG Line Chart */}
        <div className="relative w-full overflow-x-auto">
          {chartOrders.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-[#5B5B58] text-sm">
              No sales data found for the selected time range.
            </div>
          ) : (
            <div className="min-w-[800px] relative">
              <svg
                viewBox={`0 0 ${svgMetrics.width || 800} ${svgMetrics.height || 300}`}
                className="w-full h-auto overflow-visible select-none"
              >
                {/* Y Grid Lines */}
                {svgMetrics.gridLines?.map((line, idx) => (
                  <line
                    key={idx}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="#E9E8E2"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? "0" : "4 4"}
                  />
                ))}

                {/* Y Axis Labels */}
                {svgMetrics.yLabels?.map((lbl, idx) => (
                  <text
                    key={idx}
                    x={65}
                    y={lbl.y}
                    className="text-[10px] font-semibold text-[#5B5B58]"
                    textAnchor="end"
                  >
                    {lbl.label}
                  </text>
                ))}

                {/* X Axis Labels */}
                {svgMetrics.xLabels?.map((lbl, idx) => (
                  <text
                    key={idx}
                    x={lbl.x}
                    y={(svgMetrics.height || 300) - 10}
                    className="text-[10px] font-semibold text-[#5B5B58]"
                    textAnchor="middle"
                  >
                    {lbl.label}
                  </text>
                ))}

                {/* Gradient Definition for Area */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A3C1BF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#A3C1BF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area under the line */}
                <path d={svgMetrics.areaPath} fill="url(#chartGradient)" />

                {/* Line Path */}
                <path
                  d={svgMetrics.linePath}
                  fill="none"
                  stroke="#85A6A3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data point hover dots */}
                {svgMetrics.pointsList?.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.idx === idx ? 6 : 3.5}
                    fill={hoveredPoint?.idx === idx ? "#111110" : "#85A6A3"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint({ ...pt, idx })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute bg-white border border-[#E9E8E2] rounded-lg shadow-md p-2.5 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10"
                  style={{
                    left: `${(hoveredPoint.x / (svgMetrics.width || 800)) * 100}%`,
                    top: `${(hoveredPoint.y / (svgMetrics.height || 300)) * 100 - 10}px`,
                  }}
                >
                  <p className="text-[10px] text-[#5B5B58] font-bold uppercase tracking-wider">
                    {hoveredPoint.date}
                  </p>
                  <p className="text-sm font-extrabold text-[#111110] mt-0.5">
                    {formatPKR(hoveredPoint.val)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. INVENTORY HEALTH SECTION */}
      <section className="bg-white rounded-2xl border border-[#E9E8E2] p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#111110]">Inventory Health</h2>
          <p className="text-xs text-[#5B5B58] mt-0.5">Realtime monitoring of product availability levels</p>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#F5F5F0] p-4 rounded-xl border border-[#E9E8E2]">
            <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider block">Total Products</span>
            <span className="text-2xl font-black text-[#111110] block mt-1">{inventoryStats.total}</span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Healthy Stock (≥10)</span>
            <span className="text-2xl font-black text-emerald-950 block mt-1">{inventoryStats.healthy}</span>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Low Stock (&lt;10)</span>
            <span className="text-2xl font-black text-amber-950 block mt-1">{inventoryStats.low}</span>
          </div>

          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Out of Stock (0)</span>
            <span className="text-2xl font-black text-rose-950 block mt-1">{inventoryStats.out}</span>
          </div>
        </div>

        {/* Detailed Alerts List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B5B58] mb-3">Attention Required</h3>
          <div className="space-y-2">
            {products.filter((p) => p.stock < 10 || p.isOutOfStock).map((p) => {
              const isOut = p.stock === 0 || p.isOutOfStock;
              return (
                <div
                  key={p.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border text-sm transition-colors ${
                    isOut
                      ? "bg-rose-50/50 border-rose-150 text-rose-950"
                      : "bg-amber-50/50 border-amber-150 text-amber-950"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isOut ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <div>
                      <span className="font-bold">{p.name}</span>
                      <span className="text-xs text-[#5B5B58] font-mono block sm:inline sm:ml-2">({p.sku})</span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 font-extrabold text-right">
                    {isOut ? (
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                        {p.stock} units left
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {products.filter((p) => p.stock < 10 || p.isOutOfStock).length === 0 && (
              <div className="text-center py-6 text-sm text-[#5B5B58] bg-[#F5F5F0]/40 rounded-xl border border-dashed border-[#E9E8E2]">
                ✓ All items are healthy and fully stocked!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
