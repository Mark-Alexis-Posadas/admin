import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

type LoginResponse = {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  };
};

const AdminLoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      if (!data.user.isAdmin) {
        setError("This account does not have admin access.");
        return;
      }

      sessionStorage.setItem("admin_token", data.token);

      navigate("/admin", { replace: true });
    } catch {
      setError("Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-3xl font-bold text-indigo-600">
            ShopSphere
          </div>

          <h1 className="text-2xl font-semibold">Admin Login</h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your store.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AdminLoginPage;
