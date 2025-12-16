import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Calendar, Settings as SettingsIcon } from 'lucide-react';
import Home from './pages/Home';
import StudentList from './pages/StudentList';
import DailyReports from './pages/DailyReports';
import SupportPlans from './pages/SupportPlans';
import Settings from './pages/Settings';

function App() {
  const navItems = [
    { path: '/', label: 'ホーム', icon: LayoutDashboard },
    { path: '/students', label: '児童一覧', icon: Users },
    { path: '/reports', label: '日報集約', icon: FileText },
    { path: '/plans', label: '支援計画', icon: Calendar },
    { path: '/settings', label: '設定', icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <nav className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 mb-2">
          <h1 className="font-bold text-xl text-indigo-600 flex items-center gap-2">
            <span>kintone Planner</span>
          </h1>
        </div>

        <div className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
          v0.1.0 Beta
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/reports" element={<DailyReports />} />
            <Route path="/plans" element={<SupportPlans />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
