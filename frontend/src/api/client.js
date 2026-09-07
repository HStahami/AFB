export const API_BASE = import.meta.env.VITE_API_BASE || "/api";
export const BACKEND_URL = API_BASE.startsWith("http") ? API_BASE.replace(/\/api\/?$/, "") : "";

export const getAvatarUrl = (avatarUrl, name) => {
  if (!avatarUrl) {
    const encoded = encodeURIComponent(name || "Instructor");
    return `https://ui-avatars.com/api/?name=${encoded}&background=C5E5E8&color=072224&size=150&font-size=0.33&bold=true`;
  }
  if (avatarUrl.startsWith("/uploads")) {
    return `${BACKEND_URL}${avatarUrl}`;
  }
  return avatarUrl;
};

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
  const headers = {
    ...(options.headers || {}),
  };

  // Only set JSON Content-Type if body is not FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (!endpoint.includes("/auth/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-expired"));
    }
  }

  return response;
};
