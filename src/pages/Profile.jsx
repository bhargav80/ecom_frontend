import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ||"http://localhost:3000/api";

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const errorData = contentType.includes("application/json") ? await response.json() : {};
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but received ${contentType}`);
  }

  return response.json();
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'password'
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form States
  const [profileForm, setProfileForm] = useState({ userName: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    passwordConfirm: "",
  });

  // Fetch current user details on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await fetchJson(`${API_URL}/auth/me`, { credentials: "include" });
        
        if (result?.user) {
          setUser(result.user);
          setProfileForm({
            userName: result.user.userName || "",
            email: result.user.email || "",
          });
        } else {
          // No user session found, bounce to login
          navigate("/login", { state: { from: "/profile" } });
        }
      } catch (err) {
        setError("Failed to load user profile session.");
        navigate("/login", { state: { from: "/profile" } });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Handle Profile (Name/Email) Update Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await fetchJson(`${API_URL}/auth/update-me`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: profileForm.userName,
          email: profileForm.email,
        }),
      });

      setSuccessMessage(result.message || "Profile updated successfully!");
      // Update local state context
      setUser((prev) => ({ ...prev, ...result.user }));
    } catch (err) {
      setError(err.message || "Could not update profile information.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Update Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await fetchJson(`${API_URL}/auth/update-password`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      setSuccessMessage(result.message || "Password updated successfully!");
      // Reset password form fields
      setPasswordForm({ currentPassword: "", password: "", passwordConfirm: "" });
    } catch (err) {
      setError(err.message || "Could not update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-10">
        <div className="max-w-3xl mx-auto px-4 animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 rounded-2xl w-1/4" />
          <div className="h-96 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 antialiased py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Summary section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your credentials, preferences, and security options.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-white shadow-sm shadow-slate-900/10">
            {user?.role}
          </span>
        </div>

        {/* Global Alert Notices Framework */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl">
            {successMessage}
          </div>
        )}

        {/* Outer Split Navigation Layout & Settings Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-4">
          
          {/* Internal Sidebar Tab Array Selector */}
          <div className="p-4 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200/60 flex flex-row md:flex-col gap-1 overflow-x-auto">
            <button
              onClick={() => { setActiveTab("profile"); setError(""); setSuccessMessage(""); }}
              className={`flex-1 md:flex-initial text-left px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === "profile"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Public Profile
            </button>
            <button
              onClick={() => { setActiveTab("password"); setError(""); setSuccessMessage(""); }}
              className={`flex-1 md:flex-initial text-left px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === "password"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Security Keys
            </button>
          </div>

          {/* Form Context Workspaces */}
          <div className="p-6 sm:p-8 md:col-span-3">
            
            {/* TAB ONE: PUBLIC PROFILE MODIFICATION */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">
                  Profile Details
                </h3>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    User Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.userName}
                    onChange={(e) => setProfileForm({ ...profileForm, userName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="name@domain.com"
                  />
                </div>

                {/* Vendor-Specific Meta Parameters Layout */}
                {user?.role === "vendor" && (
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/40 mt-6 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Merchant Registry Data (Read-Only)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-slate-400 font-medium">Business Title</span>
                        <span className="font-bold text-slate-700">{user.businessName || "Not Provided"}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">Approval Verification Status</span>
                        <span className={`font-bold ${user.isApproved ? "text-emerald-600" : "text-amber-500"}`}>
                          {user.isApproved ? "Approved Merchant" : "Pending Review"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="block text-slate-400 font-medium">Corporate Physical Location Address</span>
                        <span className="font-bold text-slate-700">{user.businessAddress || "Not Provided"}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-40 transition shadow-md shadow-slate-900/10"
                  >
                    {profileLoading ? "Saving Updates..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB TWO: PASSWORD SYSTEM ADJUSTMENT */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">
                  Change Password Credentials
                </h3>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Current Active Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.passwordConfirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, passwordConfirm: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-40 transition shadow-md shadow-slate-900/10"
                  >
                    {passwordLoading ? "Updating Key..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;