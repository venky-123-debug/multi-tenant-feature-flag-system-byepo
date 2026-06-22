import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  Plus,
  LogOut,
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const API_BASE_URL = "/api/org-admin";

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const [flagKey, setFlagKey] = useState("");
  const [flagEnabled, setFlagEnabled] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: 'success' | 'error'

  // Feature Flags query state
  const [features, setFeatures] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");

  // Search parameters (temp input bindings)
  const [sname, setSname] = useState("");
  const [sdate, setSdate] = useState("");
  const [edate, setEdate] = useState("");

  // Active filter state (applied to API request)
  const [activeSname, setActiveSname] = useState("");
  const [activeSdate, setActiveSdate] = useState("");
  const [activeEdate, setActiveEdate] = useState("");

  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(-1); // -1 for desc, 1 for asc
  const [sortBy, setSortBy] = useState("date");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Editing state for a single flag row
  const [editingId, setEditingId] = useState(null);
  const [editingKey, setEditingKey] = useState("");

  // Fetch function
  const fetchFeatures = useCallback(async () => {
    setLoadingList(true);
    setListError("");
    try {
      const queryParams = new URLSearchParams();
      if (activeSname) queryParams.append("sname", activeSname);
      if (activeSdate) queryParams.append("sdate", activeSdate);
      if (activeEdate) queryParams.append("edate", activeEdate);
      queryParams.append("limit", limit);
      queryParams.append("page", page);
      queryParams.append("sortBy", sortBy);
      queryParams.append("sort", sort);

      const res = await fetch(
        `${API_BASE_URL}/features?${queryParams.toString()}`,
        {
          headers: {
            "access-token": token,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load feature flags");
      }

      setFeatures(data.featureFlags || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("Fetch features error:", err);
      setListError(err.message || "Unable to retrieve feature flags list");
    } finally {
      setLoadingList(false);
    }
  }, [token, activeSname, activeSdate, activeEdate, limit, page, sort, sortBy, refreshTrigger]);

  // Fetch when filters or page changes
  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Apply filters action
  const handleApplyFilters = () => {
    setActiveSname(sname);
    setActiveSdate(sdate);
    setActiveEdate(edate);
    setPage(1);
  };

  // Reset filters helper
  const handleRefresh = () => {
    setSname("");
    setSdate("");
    setEdate("");
    setActiveSname("");
    setActiveSdate("");
    setActiveEdate("");
    setLimit(10);
    setPage(1);
    setSort(-1);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Create a new feature flag
  const handleCreateFlag = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!flagKey.trim()) {
      setMessage({ text: "Feature flag key name is required", type: "error" });
      return;
    }

    // Basic format validation: only alphanumeric and underscores
    const keyPattern = /^[a-zA-Z0-9_]+$/;
    if (!keyPattern.test(flagKey)) {
      setMessage({ text: "Key name must contain only alphanumeric characters and underscores", type: "error" });
      return;
    }

    setLoadingCreate(true);
    try {
      const res = await fetch(`${API_BASE_URL}/features`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access-token": token,
        },
        body: JSON.stringify({ key: flagKey, enabled: flagEnabled }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create feature flag");
      }

      setMessage({
        text: `Feature flag '${data.featureFlag.key}' created successfully!`,
        type: "success",
      });
      setFlagKey("");
      setFlagEnabled(false);
      setPage(1);
      fetchFeatures(); // reload flags list
    } catch (err) {
      console.error(err);
      setMessage({
        text: err.message || "Failed to create feature flag",
        type: "error",
      });
    } finally {
      setLoadingCreate(false);
    }
  };

  // Toggle active status in list directly
  const handleToggleStatus = async (flag) => {
    try {
      const res = await fetch(`${API_BASE_URL}/features/${flag._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "access-token": token,
        },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to toggle feature flag");
      }

      // Update state locally in features array
      setFeatures((prev) =>
        prev.map((f) => (f._id === flag._id ? { ...f, enabled: data.featureFlag.enabled } : f))
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update feature flag status");
    }
  };

  // Start editing a row
  const startEdit = (flag) => {
    setEditingId(flag._id);
    setEditingKey(flag.key);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingKey("");
  };

  // Save edited key name
  const saveEdit = async (flag) => {
    if (!editingKey.trim()) {
      alert("Flag key name cannot be empty");
      return;
    }

    const keyPattern = /^[a-zA-Z0-9_]+$/;
    if (!keyPattern.test(editingKey)) {
      alert("Key name must contain only alphanumeric characters and underscores");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/features/${flag._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "access-token": token,
        },
        body: JSON.stringify({ key: editingKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to rename feature flag");
      }

      setFeatures((prev) =>
        prev.map((f) => (f._id === flag._id ? { ...f, key: data.featureFlag.key } : f))
      );
      setEditingId(null);
      setEditingKey("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to rename feature flag");
    }
  };

  // Delete feature flag
  const handleDeleteFlag = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feature flag?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/features/${id}`, {
        method: "DELETE",
        headers: {
          "access-token": token,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete feature flag");
      }

      fetchFeatures(); // reload list
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete feature flag");
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-200">
      {/* Navbar header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.05)]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Byepo SaaS Console
              </h1>
              <p className="text-xs text-slate-500">
                Organization Flag Administrator Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-300">
                {user?.email}
              </span>
              <span className="text-xs text-blue-400 uppercase tracking-wider font-bold">
                Org: {user?.orgName}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-slate-800 hover:border-red-500/30 hover:bg-red-950/10 hover:text-red-400 text-slate-400 font-semibold rounded-xl text-sm transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Metric Info cards */}
        <section className="mb-8">
          <div className="max-w-xs bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Flags
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {totalCount}
              </h3>
            </div>
          </div>
        </section>

        {/* Dashboard Split Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create flag form card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-white">
                  Create Feature Flag
                </h2>
              </div>

              {message.text && (
                <div
                  className={`p-3 rounded-xl border mb-6 text-sm flex items-start gap-2 ${
                    message.type === "success"
                      ? "bg-green-950/20 border-green-500/30 text-green-400"
                      : "bg-red-950/20 border-red-500/30 text-red-400"
                  }`}
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateFlag} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Flag Key Name
                  </label>
                  <input
                    type="text"
                    value={flagKey}
                    onChange={(e) => setFlagKey(e.target.value)}
                    placeholder="e.g. enable_beta_features"
                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    disabled={loadingCreate}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="flagEnabled"
                    checked={flagEnabled}
                    onChange={(e) => setFlagEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-850 focus:ring-blue-500/40 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="flagEnabled" className="text-sm font-semibold text-slate-300 cursor-pointer select-none">
                    Initially Enabled
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loadingCreate}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-500/30"
                >
                  {loadingCreate ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Register Feature Flag</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Feature list and filters */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
              {/* Filters bar */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name Filter */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={sname}
                      onChange={(e) => setSname(e.target.value)}
                      placeholder="Search by flag key..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Start Date */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      value={sdate}
                      onChange={(e) => setSdate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* End Date */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      value={edate}
                      onChange={(e) => setEdate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  {/* Sorting & Limits */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Sort:</span>
                      <select
                        value={sort}
                        onChange={(e) => {
                          setSort(Number(e.target.value));
                          setPage(1);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                      >
                        <option value={-1}>Newest first</option>
                        <option value={1}>Oldest first</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Limit:</span>
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApplyFilters}
                      className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
                      disabled={loadingList}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Apply Filters</span>
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                      disabled={loadingList}
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`}
                      />
                      <span>Reset filters</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                {loadingList ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-slate-500">
                      Querying database...
                    </span>
                  </div>
                ) : listError ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3 text-red-400">
                    <AlertCircle className="w-8 h-8" />
                    <span>{listError}</span>
                  </div>
                ) : features.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 gap-2">
                    <Layers className="w-10 h-10 opacity-20" />
                    <p className="font-semibold">
                      No feature flags registered yet
                    </p>
                    <p className="text-xs text-slate-600">
                      Change filters or create one on the left
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                          <th className="px-6 py-4">Flag Key</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-center">Toggled State</th>
                          <th className="px-6 py-4">Created Date</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {features.map((flag) => (
                          <tr
                            key={flag._id}
                            className="hover:bg-slate-900/30 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-white">
                              {editingId === flag._id ? (
                                <input
                                  type="text"
                                  value={editingKey}
                                  onChange={(e) => setEditingKey(e.target.value)}
                                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span className="font-mono text-xs bg-slate-950 px-2 py-1 rounded border border-slate-900">{flag.key}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {flag.enabled ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-950/40 text-green-400 border border-green-500/20">
                                  Enabled
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/40 text-red-400 border border-red-500/20">
                                  Disabled
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleToggleStatus(flag)}
                                className="focus:outline-none text-slate-400 hover:text-white transition-colors"
                              >
                                {flag.enabled ? (
                                  <ToggleRight className="w-8 h-8 text-green-500 cursor-pointer" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-slate-600 cursor-pointer" />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {new Date(flag.created).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {editingId === flag._id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(flag)}
                                      className="p-1 text-green-500 hover:text-green-400 transition-colors"
                                      title="Save Key"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="p-1 text-slate-500 hover:text-slate-400 transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEdit(flag)}
                                      className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                                      title="Rename Key"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFlag(flag._id)}
                                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                      title="Delete Flag"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xs text-slate-500">
                    Showing Page{" "}
                    <strong className="text-slate-300">{page}</strong> of{" "}
                    <strong className="text-slate-300">{totalPages}</strong> (
                    {totalCount} total)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
