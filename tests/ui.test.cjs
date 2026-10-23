const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const ts = require("typescript");

// Use the project's installed compiler and Node test runner; no new test dependency.
// Rendering tests exercise composition/semantics, not CSS implementation details.
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    const result = ts.transpileModule(readFileSync(filename, "utf8"), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    });
    module._compile(result.outputText, filename);
  };
}
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { MemoryRouter, Route, Routes } = require("react-router-dom");
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
const h = React.createElement;
const component = (file) => require(`../src/${file}.tsx`).default;
const formatters = require("../src/lib/formatters.ts");
const id = "abcdef012345abcdef012345";
const productId = "012345abcdef012345abcdef";
const createdAt = "2026-09-30T16:00:00.000Z";
const pagination = { page: 1, limit: 10, total: 1, totalPages: 1 };
const customer = {
  _id: id,
  name: "Jane Fixture",
  email: "jane@example.test",
  createdAt,
};
const product = {
  _id: productId,
  name: "Fixture product",
  slug: "fixture-product",
  sku: "FIX-1",
  description: "Fixture description",
  shortDescription: "Fixture summary",
  price: 100,
  compareAtPrice: null,
  category: "Fixtures",
  brand: "ShopSphere",
  stock: 8,
  lowStockThreshold: 5,
  images: [],
  tags: [],
  weight: null,
  isActive: true,
  isFeatured: false,
  createdAt,
  updatedAt: createdAt,
};
const order = {
  _id: id,
  user: customer,
  items: [
    {
      product: productId,
      name: product.name,
      sku: product.sku,
      price: 100,
      quantity: 2,
    },
  ],
  shippingAddress: {
    fullName: customer.name,
    phone: "000",
    addressLine1: "Fixture Street",
    city: "Manila",
    province: "Metro Manila",
    postalCode: "0000",
  },
  paymentMethod: "COD",
  paymentStatus: "paid",
  orderStatus: "pending",
  subtotal: 200,
  shippingFee: 25,
  total: 225,
  createdAt,
  updatedAt: createdAt,
};
const report = {
  filters: {
    range: "30d",
    interval: "day",
    startDate: "2026-10-01",
    endDate: "2026-10-21",
    start: createdAt,
    endExclusive: "2026-10-21T16:00:00Z",
    timezone: "Asia/Manila",
  },
  currency: "PHP",
  revenueBasis: "Paid orders only.",
  summary: {
    totalOrders: 1,
    totalRevenue: 225,
    salesCount: 1,
    unitsSold: 2,
    averageOrderValue: 225,
    paidOrderShare: 100,
  },
  ordersByStatus: [
    { status: "pending", count: 1 },
    { status: "cancelled", count: 0 },
  ],
  trend: [{ date: "2026-10-01", revenue: 225, salesCount: 1 }],
  topProducts: [
    {
      productId,
      name: product.name,
      sku: product.sku,
      quantitySold: 2,
      revenue: 200,
    },
  ],
  recentSales: [
    { _id: id, createdAt, total: 225, orderStatus: "pending", quantity: 2 },
  ],
};

function page(file, path, data = [], route = path) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  for (const [key, value] of data) client.setQueryData(key, value);
  try {
    return renderToStaticMarkup(
      h(
        QueryClientProvider,
        { client },
        h(
          MemoryRouter,
          { initialEntries: [path] },
          h(
            Routes,
            null,
            h(Route, { path: route, element: h(component(file)) }),
          ),
        ),
      ),
    );
  } finally {
    client.clear();
  }
}

test("shared actions preserve native button semantics and disabled pagination boundaries", () => {
  const Button = component("components/ui/Button");
  const Pagination = component("components/ui/Pagination");
  assert.match(
    renderToStaticMarkup(h(Button, null, "Cancel")),
    /type="button"/,
  );
  assert.match(
    renderToStaticMarkup(h(Button, { type: "submit" }, "Save")),
    /type="submit"/,
  );
  for (const [pageNumber, totalPages, busy, expectedDisabled] of [
    [1, 0, false, 2],
    [1, 3, false, 1],
    [2, 3, false, 0],
    [3, 3, false, 1],
    [2, 3, true, 2],
  ]) {
    const markup = renderToStaticMarkup(
      h(Pagination, {
        page: pageNumber,
        totalPages,
        busy,
        onPageChange: () => {},
      }),
    );
    assert.match(markup, /aria-label="Pagination"/);
    assert.equal((markup.match(/disabled=""/g) ?? []).length, expectedDisabled);
  }
});

test("shared field/search/state primitives retain accessible labels and live roles", () => {
  const Field = component("components/ui/FormField");
  const Search = component("components/ui/SearchInput");
  const Loading = component("components/ui/LoadingState");
  const ErrorState = component("components/ui/ErrorState");
  assert.match(
    renderToStaticMarkup(
      h(
        Field,
        { label: "SKU", required: true },
        h("input", { required: true }),
      ),
    ),
    /<label[\s\S]*SKU[\s\S]*<input[^>]*required=""[\s\S]*<\/label>/,
  );
  assert.match(
    renderToStaticMarkup(
      h(Search, {
        label: "Search products",
        defaultValue: "fixture",
        maxLength: 100,
      }),
    ),
    /aria-label="Search products"/,
  );
  assert.match(
    renderToStaticMarkup(h(Loading, null, "Loading")),
    /role="status"/,
  );
  assert.match(
    renderToStaticMarkup(h(ErrorState, null, "Failed")),
    /role="alert"/,
  );
});

test("formatters preserve PHP output, Manila midnight, and explicit browser-local date options", () => {
  assert.equal(
    formatters.formatCurrency(1234.5),
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(1234.5),
  );
  assert.equal(
    formatters.formatDate(createdAt),
    new Date(createdAt).toLocaleDateString("en-PH", {
      dateStyle: "medium",
      timeZone: "Asia/Manila",
    }),
  );
  assert.equal(
    formatters.formatReportDate("2026-10-01"),
    formatters.formatReportDate(createdAt),
  );
  assert.equal(
    formatters.formatDate(createdAt, {}),
    new Date(createdAt).toLocaleDateString("en-PH"),
  );
  assert.equal(
    formatters.formatDateTime(createdAt, {}),
    new Date(createdAt).toLocaleString("en-PH"),
  );
});

test("products retain edit/create/history/stock actions and active status", () => {
  const html = page("features/products/ProductsPage", "/admin/products", [
    [["admin", "products"], [product]],
  ]);
  for (const href of [
    "/admin/products/new",
    `/admin/products/${productId}/edit`,
    `/admin/inventory?productId=${productId}`,
  ])
    assert.ok(html.includes(`href="${href}"`));
  for (const text of [
    "Fixture product",
    "FIX-1",
    "Adjust stock",
    "Deactivate",
    "Active",
    "Search products",
  ])
    assert.ok(html.includes(text), text);
});

test("product creation retains required fields, monetary constraints, and submit/cancel behavior", () => {
  const html = page("features/products/ProductFormPage", "/admin/products/new");
  for (const text of [
    "Product name",
    "URL slug",
    "SKU",
    "Full description",
    "Initial stock",
    "Inventory safety",
  ])
    assert.ok(html.includes(text), text);
  assert.match(html, /step="0.01"/);
  assert.match(html, /<button[^>]*type="submit"[^>]*>[\s\S]*Create product/);
  assert.ok(html.includes('href="/admin/products"'));
});

test("stock dialog retains dialog labels, quantity/reason constraints, and disabled initial submission", () => {
  const client = new QueryClient();
  const Modal = component("features/products/AdjustStockModal");
  try {
    const html = renderToStaticMarkup(
      h(
        QueryClientProvider,
        { client },
        h(Modal, { product, onClose: () => {}, onSuccess: () => {} }),
      ),
    );
    assert.match(
      html,
      /role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby=/,
    );
    assert.ok(html.includes('id="stock-quantity"'));
    assert.ok(html.includes('minLength="3"') || html.includes('minlength="3"'));
    assert.ok(
      html.includes('maxLength="500"') || html.includes('maxlength="500"'),
    );
    assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""/);
  } finally {
    client.clear();
  }
});

test("orders and order details retain customer, totals, detail links and allowed transition actions", () => {
  const list = page("features/orders/OrdersPage", "/admin/orders", [
    [["admin", "orders"], [order]],
  ]);
  assert.ok(list.includes(customer.email));
  assert.ok(list.includes(`href="/admin/orders/${id}"`));
  const details = page(
    "features/orders/OrderDetailsPage",
    `/admin/orders/${id}`,
    [[["admin", "orders", id], order]],
    "/admin/orders/:id",
  );
  for (const text of ["Mark as confirmed", "Fixture Street", "COD", "paid"])
    assert.ok(details.includes(text), text);
  assert.ok(
    !details.includes("Cancel Order"),
    "paid orders cannot be cancelled",
  );
  const unpaid = page(
    "features/orders/OrderDetailsPage",
    `/admin/orders/${id}`,
    [[["admin", "orders", id], { ...order, paymentStatus: "unpaid" }]],
    "/admin/orders/:id",
  );
  assert.ok(
    unpaid.includes("Cancel Order"),
    "unpaid pending orders retain cancellation",
  );
  const delivered = page(
    "features/orders/OrderDetailsPage",
    `/admin/orders/${id}`,
    [[["admin", "orders", id], { ...order, orderStatus: "delivered" }]],
    "/admin/orders/:id",
  );
  assert.ok(delivered.includes("No further status changes are allowed."));
  assert.ok(!delivered.includes("Cancel Order"));
});

test("dashboard preserves non-cancelled order value and existing order navigation", () => {
  const html = page("pages/DashboardPage", "/admin", [
    [
      ["admin", "orders"],
      [
        order,
        { ...order, _id: productId, total: 999, orderStatus: "cancelled" },
      ],
    ],
  ]);
  assert.ok(html.includes("Non-cancelled Order Value"));
  assert.ok(html.includes(formatters.formatCurrency(225)));
  assert.ok(!html.includes(formatters.formatCurrency(1224)));
  assert.ok(html.includes('href="/admin/orders"'));
});

test("inventory preserves audit details, filters, and page statistics", () => {
  const movement = {
    _id: id,
    product,
    admin: customer,
    adjustment: 3,
    previousStock: 5,
    newStock: 8,
    reason: "Fixture restock",
    createdAt,
  };
  const html = page(
    "features/inventory/InventoryHistoryPage",
    "/admin/inventory",
    [
      [
        ["admin", "inventory", "movements", 1, "", "all", undefined],
        { movements: [movement], pagination },
      ],
    ],
  );
  for (const text of [
    "Fixture restock",
    "FIX-1",
    "View product history",
    "All movements",
    "Units added on this page",
    "+3",
    "Search product name or SKU",
  ])
    assert.ok(html.includes(text), text);
});

test("customer list and profile preserve spending, pagination, and order links", () => {
  const html = page("features/customers/CustomersPage", "/admin/customers", [
    [
      ["admin", "customers", "list", { page: 1, search: "" }],
      {
        customers: [{ ...customer, orderCount: 1, totalSpending: 225 }],
        pagination,
      },
    ],
  ]);
  assert.ok(html.includes(customer.email));
  assert.ok(html.includes(`href="/admin/customers/${id}"`));
  assert.match(html, /aria-label="Pagination"/);
  const details = page(
    "features/customers/CustomerDetailsPage",
    `/admin/customers/${id}`,
    [
      [
        ["admin", "customers", "detail", id, 1],
        {
          customer,
          summary: {
            orderCount: 1,
            totalSpending: 225,
            cancelledOrderCount: 0,
          },
          orders: [order],
          pagination,
        },
      ],
    ],
    "/admin/customers/:id",
  );
  assert.ok(details.includes(`href="/admin/orders/${id}"`));
  assert.ok(details.includes("Order counts include cancellations."));
});

test("analytics retains KPI definitions, filter options, exact chart data and recent order links", () => {
  const html = page(
    "features/analytics/SalesAnalyticsPage",
    "/admin/analytics",
    [[["admin", "analytics", { range: "30d", interval: "day" }], report]],
  );
  for (const text of [
    "Paid revenue",
    "Average order value",
    "Units sold",
    "Last 7 days",
    "Last 90 days",
    "Custom range",
    "View chart data",
    "Top-selling products",
    "FIX-1",
    "Customer Management spending",
  ])
    assert.ok(html.includes(text), text);
  assert.ok(html.includes(`href="/admin/orders/${id}"`));
  assert.ok(html.includes(formatters.formatCurrency(225)));
  assert.ok(html.includes(formatters.formatCurrency(200)));
});

test("customer and analytics loading and empty states remain distinct", () => {
  assert.match(
    page("features/customers/CustomersPage", "/admin/customers"),
    /role="status"/,
  );
  const empty = page("features/customers/CustomersPage", "/admin/customers", [
    [
      ["admin", "customers", "list", { page: 1, search: "" }],
      { customers: [], pagination: { ...pagination, total: 0, totalPages: 0 } },
    ],
  ]);
  assert.ok(empty.includes("No customers yet"));
  const noOrders = page(
    "features/analytics/SalesAnalyticsPage",
    "/admin/analytics",
    [
      [
        ["admin", "analytics", { range: "30d", interval: "day" }],
        {
          ...report,
          summary: {
            totalOrders: 0,
            totalRevenue: 0,
            salesCount: 0,
            unitsSold: 0,
            averageOrderValue: 0,
            paidOrderShare: 0,
          },
          topProducts: [],
          recentSales: [],
        },
      ],
    ],
  );
  assert.ok(noOrders.includes("No orders in this date range"));
});

test("COD collection action is delivered-only, unpaid-only, and displays admin audit details", () => {
  const details = (value) =>
    page(
      "features/orders/OrderDetailsPage",
      `/admin/orders/${id}`,
      [[["admin", "orders", id], value]],
      "/admin/orders/:id",
    );
  assert.match(
    details({ ...order, orderStatus: "delivered", paymentStatus: "unpaid" }),
    />Confirm COD Collection</,
  );
  for (const orderStatus of ["pending", "confirmed", "shipped", "cancelled"]) {
    assert.ok(
      !details({ ...order, orderStatus, paymentStatus: "unpaid" }).includes(
        "Confirm COD Collection",
      ),
    );
  }
  const paid = details({
    ...order,
    orderStatus: "delivered",
    paymentStatus: "paid",
    paidAt: createdAt,
    paymentCollectedBy: id,
  });
  assert.ok(!paid.includes("Confirm COD Collection"));
  assert.ok(paid.includes("Collection confirmed:"));
  assert.ok(paid.includes(`Confirmed by administrator ID: ${id}`));
  assert.ok(
    details({ ...order, orderStatus: "delivered" }).includes(
      "Legacy paid order",
    ),
  );
});

test("COD API sends explicit confirmation without an authoritative amount or actor", async (t) => {
  const { api } = require("../src/lib/api.ts");
  const { orderApi } = require("../src/features/orders/order.api.ts");
  const paid = {
    ...order,
    paymentStatus: "paid",
    paidAt: createdAt,
    paymentCollectedBy: id,
  };
  const post = t.mock.method(api, "post", async (path, payload) => {
    assert.equal(path, `/admin/orders/${id}/collect-cod`);
    assert.deepEqual(payload, { confirmed: true });
    return { data: { message: "Confirmed", order: paid } };
  });
  assert.deepEqual(await orderApi.collectCod(id), paid);
  assert.equal(post.mock.callCount(), 1);
});

test("collection-date reporting remains visible when the creation-date cohort is empty", () => {
  const html = page(
    "features/analytics/SalesAnalyticsPage",
    "/admin/analytics",
    [
      [
        ["admin", "analytics", { range: "30d", interval: "day" }],
        {
          ...report,
          summary: {
            ...report.summary,
            totalOrders: 0,
            totalRevenue: 0,
            salesCount: 0,
          },
          collections: {
            basis: "COD collections by paidAt",
            totalRevenue: 255,
            collectionCount: 1,
            trend: [{ date: "2026-10-01", revenue: 255, collectionCount: 1 }],
          },
        },
      ],
    ],
  );
  assert.ok(html.includes("No orders in this date range"));
  assert.ok(html.includes("COD collections by confirmation date"));
  assert.ok(html.includes("COD collections by paidAt"));
  assert.ok(html.includes(formatters.formatCurrency(255)));
});
