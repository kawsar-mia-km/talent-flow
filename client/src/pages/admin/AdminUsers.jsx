import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Pagination from "../../components/Pagination";
import { SkeletonTableRows } from "../../components/Skeleton";

export default function AdminUsers({ onChanged }) {
  const { user } = useAuth();
  const notify = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function loadUsers() {
    setLoading(true);
    const res = await api.get("/users", { params: { page, limit: 8 } });
    setUsers(res.data.users);
    setTotalPages(res.data.totalPages);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, [page]);

  async function toggleStatus(id) {
    try {
      await api.patch(`/users/${id}/toggle-status`);
      notify("User status updated.");
      loadUsers();
      onChanged();
    } catch (err) {
      notify(err.response?.data?.message || "Couldn't update user status.", "error");
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">Users</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Activate or deactivate accounts platform-wide.</p>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={5} />
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={"text-xs font-medium px-2 py-1 rounded-full " + (u.status === "active" ? "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== user.id && (
                      <button onClick={() => toggleStatus(u.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5">
                        {u.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
