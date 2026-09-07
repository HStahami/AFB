with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# lines are 0-indexed, so line 623 is index 622, line 1574 is index 1574
dashboard_lines = lines[622:1574]
dashboard_content = "".join(dashboard_lines)

# Export AdminDashboard
dashboard_content = dashboard_content.replace("function AdminDashboard({ onLogout }) {", "export function AdminDashboard({ onLogout }) {", 1)

header = """import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, LogOut } from 'lucide-react';
import { API_BASE, getAvatarUrl } from '../../api/client';
import { inputStyle } from '../../components/common/styles';

"""

with open("frontend/src/pages/admin/AdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(header + dashboard_content)

print("Extracted AdminDashboard.jsx successfully!")
