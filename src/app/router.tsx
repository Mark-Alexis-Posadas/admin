import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import AdminLoginPage from "../features/auth/AdminLoginPage";
import DashboardPage from "../pages/DashboardPage";
import OrdersPage from "../features/orders/OrdersPage";
import OrderDetailsPage from "../features/orders/OrderDetailsPage";
import ProductsPage from "../features/products/ProductsPage";
import ProductFormPage from "../features/products/ProductFormPage";
import InventoryHistoryPage from "../features/inventory/InventoryHistoryPage";
import CustomersPage from "../features/customers/CustomersPage";
import CustomerDetailsPage from "../features/customers/CustomerDetailsPage";

const ProtectedAdminRoute = () => {
  const token = sessionStorage.getItem("admin_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <AdminLoginPage />,
  },
  {
    element: <ProtectedAdminRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { path: "customers", element: <CustomersPage /> },
          { path: "customers/:id", element: <CustomerDetailsPage /> },
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "orders",
            element: <OrdersPage />,
          },
          {
            path: "orders/:id",
            element: <OrderDetailsPage />,
          },
          {
            path: "products",
            element: <ProductsPage />,
          },
          {
            path: "products/new",
            element: <ProductFormPage />,
          },
          {
            path: "products/:id/edit",
            element: <ProductFormPage />,
          },

          {
            path: "inventory",
            element: <InventoryHistoryPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/admin" replace />,
  },
]);
