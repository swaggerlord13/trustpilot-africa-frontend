import api from "../../api.js";

export async function adminApi(path, opts = {}) {
  const { method = "GET", body } = opts;
  try {
    const config = {};
    if (body) {
      config.data = typeof body === "string" ? JSON.parse(body) : body;
    }
    const res = await api({ url: path, method, ...config });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || "Request failed");
  }
}

export function StarDisplay({ rating }) {
  return (
    <span className="admin-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <i key={s} className={`bx ${s <= rating ? "bxs-star" : "bx-star"}`}></i>
      ))}
    </span>
  );
}

export function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Pagination({ page, setPage, total, limit = 15 }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
        <i className="bx bx-chevron-left"></i> Prev
      </button>
      <span>
        Page {page} of {pages} ({total} total)
      </span>
      <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
        Next <i className="bx bx-chevron-right"></i>
      </button>
    </div>
  );
}

export function toggleSelect(list, setList, id) {
  setList((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
}

export function toggleSelectAll(items, selected, setSelected) {
  if (selected.length === items.length) {
    setSelected([]);
  } else {
    setSelected(items.map((i) => i._id));
  }
}
