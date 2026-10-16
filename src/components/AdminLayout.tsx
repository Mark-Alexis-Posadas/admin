import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  LogOut,
  Store,
} from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();

  const logout = () => {
    sessionStorage.removeItem("admin_token");
    navigate("/login", { replace: true });
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="border-b border-slate-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8 flex items-center gap-2">
          <Store className="text-indigo-600" size={28} />
          <span className="text-xl font-bold">ShopSphere</span>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Management
        </p>

        <nav className="space-y-2">
          <NavLink to="/admin" end className={navClass}>
            <LayoutDashboard size={19} />
            Dashboard
          </NavLink>

          <NavLink to="/admin/orders" className={navClass}>
            <ShoppingBag size={19} />
            Orders
          </NavLink>
          <NavLink to="/admin/products" className={navClass}>
            <Package size={19} />
            Products
          </NavLink>
        </nav>

        <button
          onClick={logout}
          className="mt-8 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-6 py-5">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </header>

        <main className="p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
