import { apiClient } from "./client";

// Auth API
export const authApi = {
  login: async (username, password) => {
    const res = await apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    return res.json();
  },
  getMe: async () => {
    const res = await apiClient("/auth/me");
    if (!res.ok) throw new Error("Failed to fetch current user");
    return res.json();
  },
  changePassword: async (old_password, new_password) => {
    let payload = {};
    if (typeof old_password === "object" && old_password !== null) {
      payload = {
        old_password: old_password.old_password || old_password.current_password,
        new_password: old_password.new_password,
      };
    } else {
      payload = { old_password, new_password };
    }
    const res = await apiClient("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Password change failed" }));
      throw new Error(err.detail || "Password change failed");
    }
    return res.json();
  }
};

// Admissions API
export const admissionsApi = {
  submit: async (data) => {
    const res = await apiClient("/admissions/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Submission failed");
    return res.json();
  },
  getAll: async () => {
    const res = await apiClient("/admissions/");
    if (!res.ok) throw new Error("Failed to load admissions");
    return res.json();
  },
  updateFeeStatus: async (id, fee_status) => {
    const res = await apiClient(`/admissions/${id}/fee-status`, {
      method: "PATCH",
      body: JSON.stringify({ fee_status }),
    });
    if (!res.ok) throw new Error("Failed to update fee status");
    return res.json();
  },
  sendFeeEmail: async (id) => {
    const res = await apiClient(`/admissions/${id}/send-fee-email`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to send fee email");
    return res.json();
  },
  approve: async (id) => {
    const res = await apiClient(`/admissions/${id}/approve`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to approve admission");
    return res.json();
  },
  cancel: async (id) => {
    const res = await apiClient(`/admissions/${id}/cancel`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to cancel admission");
    return res.json();
  }
};

// Students API
export const studentsApi = {
  getAll: async () => {
    const res = await apiClient("/students/");
    if (!res.ok) throw new Error("Failed to load students");
    return res.json();
  },
  getProfile: async () => {
    const res = await apiClient("/students/profile");
    if (!res.ok) throw new Error("Failed to load student profile");
    return res.json();
  },
  getStudentProfile: async (studentId) => {
    const res = await apiClient(`/students/${studentId}/profile`);
    if (!res.ok) throw new Error("Failed to load student profile");
    return res.json();
  },
  updateProfile: async (profileData) => {
    const res = await apiClient("/students/profile", {
      method: "PATCH",
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },
  getDashboardSummary: async () => {
    const res = await apiClient("/students/dashboard-summary");
    if (!res.ok) throw new Error("Failed to load dashboard summary");
    return res.json();
  },
  getMyCourses: async () => {
    const res = await apiClient("/students/my-courses");
    if (!res.ok) throw new Error("Failed to load enrolled courses");
    return res.json();
  },
  assign: async (studentId, slot, instructor) => {
    const res = await apiClient(
      `/students/${studentId}/assign?slot=${encodeURIComponent(slot)}&instructor=${encodeURIComponent(instructor)}`,
      { method: "PATCH" }
    );
    if (!res.ok) throw new Error("Failed to assign class details");
    return res.json();
  }
};

// Upload / Storage API
export const uploadApi = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    const res = await fetch("/api/upload/", {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload file");
    }
    return res.json();
  }
};

// Instructors API
export const instructorsApi = {
  getAll: async () => {
    const res = await apiClient("/instructors/");
    if (!res.ok) throw new Error("Failed to load instructors");
    return res.json();
  },
  getMyProfile: async () => {
    const res = await apiClient("/instructors/me");
    if (!res.ok) throw new Error("Failed to load instructor profile");
    return res.json();
  },
  updateMyProfile: async (formData) => {
    const res = await apiClient("/instructors/profile", {
      method: "PATCH",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },
  getDashboardStats: async () => {
    const res = await apiClient("/instructors/dashboard-stats");
    if (!res.ok) throw new Error("Failed to load dashboard statistics");
    return res.json();
  },
  getMyStudents: async () => {
    const res = await apiClient("/instructors/my-students");
    if (!res.ok) throw new Error("Failed to load assigned students");
    return res.json();
  },
  getMyClasses: async () => {
    const res = await apiClient("/instructors/my-classes");
    if (!res.ok) throw new Error("Failed to load assigned classes");
    return res.json();
  },
  create: async (formData) => {
    const res = await apiClient("/instructors/", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to create instructor");
    return res.json();
  },
  update: async (id, formData) => {
    const res = await apiClient(`/instructors/${id}`, {
      method: "PUT",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update instructor");
    return res.json();
  },
  delete: async (id) => {
    const res = await apiClient(`/instructors/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete instructor");
    return res.json();
  }
};

// Modules API
export const modulesApi = {
  getAll: async () => {
    const res = await apiClient("/modules/");
    if (!res.ok) throw new Error("Failed to load modules");
    return res.json();
  },
  create: async (formData) => {
    const res = await apiClient("/modules/", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to create module");
    return res.json();
  },
  update: async (id, formData) => {
    const res = await apiClient(`/modules/${id}`, {
      method: "PUT",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update module");
    return res.json();
  },
  delete: async (id) => {
    const res = await apiClient(`/modules/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete module");
    return res.json();
  }
};

// Slots API
export const slotsApi = {
  getAll: async (status = null) => {
    const url = status ? `/slots/?status=${encodeURIComponent(status)}` : "/slots/";
    const res = await apiClient(url);
    if (!res.ok) throw new Error("Failed to load slots");
    return res.json();
  },
  create: async (formData) => {
    const res = await apiClient("/slots/", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to create slot");
    return res.json();
  },
  update: async (id, formData) => {
    const res = await apiClient(`/slots/${id}`, {
      method: "PUT",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update slot");
    return res.json();
  },
  delete: async (id) => {
    const res = await apiClient(`/slots/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete slot");
    return res.json();
  }
};

// Enrollments API
export const enrollmentsApi = {
  getAll: async () => {
    const res = await apiClient("/enrollments/");
    if (!res.ok) throw new Error("Failed to load enrollments");
    return res.json();
  },
  create: async (data) => {
    const res = await apiClient("/enrollments/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create enrollment");
    return res.json();
  }
};

// Tasks API
export const tasksApi = {
  getAll: async (moduleId = null) => {
    const url = moduleId ? `/tasks/?module_id=${encodeURIComponent(moduleId)}` : "/tasks/";
    const res = await apiClient(url);
    if (!res.ok) throw new Error("Failed to load tasks");
    return res.json();
  },
  create: async (data) => {
    const res = await apiClient("/tasks/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },
  delete: async (id) => {
    const res = await apiClient(`/tasks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete task");
    return res.json();
  }
};

// Submissions API
export const submissionsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.task_id) query.append("task_id", params.task_id);
    if (params.status) query.append("status", params.status);
    if (params.student_id) query.append("student_id", params.student_id);
    const qs = query.toString();
    const res = await apiClient(qs ? `/submissions/?${qs}` : "/submissions/");
    if (!res.ok) throw new Error("Failed to load submissions");
    return res.json();
  },
  submit: async (data) => {
    const res = await apiClient("/submissions/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit task");
    return res.json();
  }
};

// Assessments API
export const assessmentsApi = {
  getAll: async () => {
    const res = await apiClient("/assessments/");
    if (!res.ok) throw new Error("Failed to load assessments");
    return res.json();
  },
  grade: async (data) => {
    const res = await apiClient("/assessments/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save grade");
    return res.json();
  }
};

// Attendance API
export const attendanceApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append("date", params.date);
    if (params.student_id) query.append("student_id", params.student_id);
    if (params.slot_id) query.append("slot_id", params.slot_id);
    const qs = query.toString();
    const res = await apiClient(qs ? `/attendance/?${qs}` : "/attendance/");
    if (!res.ok) throw new Error("Failed to load attendance");
    return res.json();
  },
  record: async (data) => {
    const res = await apiClient("/attendance/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to record attendance");
    return res.json();
  },
  bulkRecord: async (records) => {
    const res = await apiClient("/attendance/bulk", {
      method: "POST",
      body: JSON.stringify(records),
    });
    if (!res.ok) throw new Error("Failed to record bulk attendance");
    return res.json();
  }
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    const res = await apiClient("/notifications/");
    if (!res.ok) throw new Error("Failed to load notifications");
    return res.json();
  },
  markRead: async (id) => {
    const res = await apiClient(`/notifications/${id}/read`, { method: "PATCH" });
    if (!res.ok) throw new Error("Failed to mark notification read");
    return res.json();
  },
  markAllRead: async () => {
    const res = await apiClient("/notifications/read-all", { method: "PATCH" });
    if (!res.ok) throw new Error("Failed to mark all notifications read");
    return res.json();
  }
};

// Resources API
export const resourcesApi = {
  getAll: async (moduleId = null) => {
    const url = moduleId ? `/resources/?module_id=${encodeURIComponent(moduleId)}` : "/resources/";
    const res = await apiClient(url);
    if (!res.ok) throw new Error("Failed to load resources");
    return res.json();
  },
  create: async (data) => {
    const res = await apiClient("/resources/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create resource");
    return res.json();
  },
  delete: async (id) => {
    const res = await apiClient(`/resources/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete resource");
    return res.json();
  }
};

// Reports API
export const reportsApi = {
  getMyReport: async () => {
    const res = await apiClient("/reports/me");
    if (!res.ok) throw new Error("Failed to load student progress report");
    return res.json();
  },
  getStudentReport: async (studentId) => {
    const res = await apiClient(`/reports/student/${studentId}`);
    if (!res.ok) throw new Error("Failed to load student progress report");
    return res.json();
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const res = await apiClient("/dashboard/stats");
    if (!res.ok) throw new Error("Failed to load stats");
    return res.json();
  }
};

// Contact API
export const contactApi = {
  submit: async (data) => {
    const res = await apiClient("/contact/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to send contact message");
    return res.json();
  },
  getAll: async () => {
    const res = await apiClient("/contact/");
    if (!res.ok) throw new Error("Failed to load contact messages");
    return res.json();
  }
};
