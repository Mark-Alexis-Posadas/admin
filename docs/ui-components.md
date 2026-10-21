# Admin UI composition

The Sales Analytics implementation was validated before this extraction began. This refactor changes presentation ownership only; pages retain their state, queries, mutations, validation, routes, and metric definitions. It adds no dependencies and changes no backend API or schema.

## Ownership

```text
src/
  components/
    AdminLayout.tsx               # Existing application shell, unchanged
    ui/
      PageHeader.tsx              # Plain and hero page headings; actions/eyebrow slots
      SectionHeader.tsx           # Section heading, description, optional icon/actions
      Card.tsx                    # Semantic section/div/article container
      StatCard.tsx                # Metric, stacked, and simple statistic presentations
      Button.tsx                  # Native button props; primary/secondary/ghost/inverse
      RefreshButton.tsx           # Button + refresh icon; caller owns fetching
      Badge.tsx                   # Visual tones; caller owns status interpretation
      SearchInput.tsx             # Native input props, accessible label, optional action
      Pagination.tsx              # Page bounds/buttons; caller owns fetching and totals
      FormField.tsx               # Label and hint around a single native control
      LoadingState.tsx            # Status region
      EmptyState.tsx              # Optional icon/title/action slots
      ErrorState.tsx              # Alert region with caller-supplied recovery action
  features/
    customers/components/CustomerHeader.tsx
    products/components/ProductFormSection.tsx
    ...                           # Pages and feature-specific composition
  lib/formatters.ts               # Currency, date, datetime, reporting date helpers
```

Previously, Products and Inventory each declared a local StatCard, ProductForm declared its own Field/Section shells, customer utilities exported generic UI class strings, and Analytics imported those customer styles. These shared concerns now live in `components/ui` and `lib`; customer/product-specific wrappers live with their features. The former `CustomerComponents.tsx` is removed, and `customer.utils.ts` retains only its spending definition.

## Reuse

| Primitive                 | Consumers                                                                        |
| ------------------------- | -------------------------------------------------------------------------------- |
| PageHeader                | Dashboard, Orders, Inventory, Analytics, customer header wrapper                 |
| SectionHeader / Card      | Analytics, customer details, Inventory; product form section wrapper             |
| StatCard                  | Dashboard, Products, Inventory, customer details, Analytics                      |
| LoadingState / ErrorState | Dashboard, Orders/details, customer list/details, Inventory, Analytics           |
| EmptyState                | Customer list/details, Inventory, Analytics                                      |
| Button / RefreshButton    | Customer list/details, Products refresh, Inventory, Analytics                    |
| Badge                     | Products, Orders/details, customer order history, recent sales                   |
| SearchInput               | Products, Inventory, Customers                                                   |
| Pagination                | Inventory, customer list/details                                                 |
| FormField                 | Product form, Analytics filters                                                  |
| Formatters                | Dashboard, Products/form, Orders/details, Inventory, Customers, Analytics/charts |

## Usage rules

- Pass ReactNode content for icons/actions; do not add feature flags to primitives. Keep permission checks, status-to-tone mapping, numeric calculations, filtering, and API calls in pages/features.
- Button defaults to `type="button"` to prevent accidental form submissions. Explicitly use `type="submit"` for search/save/apply controls. Native disabled, ARIA, and event props are forwarded.
- Pagination does not fetch or clamp the current page. Pass the page used by the existing query, total pages, busy state, and callback. `summary` and label slots preserve feature-specific text and arrow icons.
- FormField implicitly labels its single child control. Keep `required`, input limits, patterns, disabled state, and event handlers on the actual input/select/textarea. Do not wrap multiple independent inputs or action buttons in it.
- LoadingState has `role="status"`; ErrorState has `role="alert"`. Supply the appropriate retry, navigation, or other recovery action from the page.
- Card applies presentation only. The `as` prop preserves useful section/div/article semantics. Keep responsive grids and horizontal table scrolling in the caller.
- Currency defaults to PHP. Customer/reporting dates retain Manila boundaries. Existing order list/details intentionally use `formatDate(value, {})` / `formatDateTime(value, {})` to preserve their former browser-local presentation. Products retain their existing non-finite-price fallback.

## Intentionally feature-specific

There is no generic DataTable, Modal, action-menu system, or navigation framework. Tables have materially different rows, widths, actions, skeletons, stock gauges, and address/order layouts. The stock dialog is the only modal and retains its dismissal and pending-state logic. Product thumbnails, image previews, stock controls, product hero/form header, native confirmation prompts, and analytics charts stay with their features. Filters retain their existing draft/applied behavior. AdminLayout stays at its current path to avoid an unrelated import migration.

## Validation

From `admin/`, run `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run lint`. The test runner uses Node's built-in test API, React's server renderer, and the already-installed TypeScript compiler. No test framework was added.

Rendering regressions cover native button semantics, pagination bounds, labels/live regions, formatting/timezones, product actions/creation constraints, stock-dialog constraints, orders/transitions, customer links/pagination, inventory audit content, and analytics KPIs/filter options/exact data. They do not execute browser events, network mutations, effects, or responsive layout. Exercise CRUD/stock/order flows in a controlled browser environment before release; the current session had no browser available for visual verification.
