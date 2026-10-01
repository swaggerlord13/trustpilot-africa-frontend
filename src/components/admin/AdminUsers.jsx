import { useState, useEffect, useCallback } from "react";
import { adminApi, formatDate, Pagination, toggleSelect, toggleSelectAll } from "./adminHelpers.jsx";
import { useToast } from "../Toast.jsx";
import Loader from "../Loader.jsx";
import UserAvatar from "../UserAvatar";

export default function AdminUsers() {
  const showToast = useToast();
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (pg, search) => {
    setLoading(true);
    try {
      const data = await adminApi(`/admin/users?page=${pg}&limit=15&search=${encodeURIComponent(search)}`);
      setUsers(data.users);
      setUsersTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(usersPage, usersSearch);
  }, [usersPage]);

  useEffect(() => {
    const t = setTimeout(() => { setUsersPage(1); fetchUsers(1, usersSearch); }, 400);
    return () => clearTimeout(t);
  }, [usersSearch]);

  const toggleAdmin = async (userId) => {
    try {
      await adminApi(`/admin/users/${userId}/toggle-admin`, { method: "PUT" });
      showToast("Admin status updated", "success");
      fetchUsers(usersPage, usersSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`Delete ${selectedUsers.length} user(s) and all their reviews? This cannot be undone.`)) return;
    try {
      await adminApi("/admin/users/bulk", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedUsers }),
      });
      showToast(`${selectedUsers.length} user(s) deleted`, "success");
      setSelectedUsers([]);
      fetchUsers(usersPage, usersSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={usersSearch}
            onChange={(e) => setUsersSearch(e.target.value)}
          />
        </div>
        {selectedUsers.length > 0 && (
          <button className="admin-bulk-btn admin-bulk-delete" onClick={bulkDeleteUsers}>
            <i className="bx bx-trash"></i> Delete {selectedUsers.length} selected
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={() => toggleSelectAll(users, selectedUsers, setSelectedUsers)}
                  />
                </th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Provider</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className={selectedUsers.includes(u._id) ? "selected" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u._id)}
                      onChange={() => toggleSelect(selectedUsers, setSelectedUsers, u._id)}
                    />
                  </td>
                  <td>
                    <div className="admin-user-cell">
                      <UserAvatar
                        src={u.profileImage}
                        className="admin-avatar"
                      />
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="admin-email-cell">{u.email}</td>
                  <td>
                    <span className={`admin-badge ${u.isAdmin ? "admin-badge-admin" : "admin-badge-user"}`}>
                      {u.isAdmin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td>{u.authProvider || "email"}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <button
                      className="admin-action-btn"
                      title={u.isAdmin ? "Remove admin" : "Make admin"}
                      onClick={() => toggleAdmin(u._id)}
                    >
                      <i className={`bx ${u.isAdmin ? "bx-shield-minus" : "bx-shield-plus"}`}></i>
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="7" className="admin-empty">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={usersPage} setPage={setUsersPage} total={usersTotal} />
    </div>
  );
}
