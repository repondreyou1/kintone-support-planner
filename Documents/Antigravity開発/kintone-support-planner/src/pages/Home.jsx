import React from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Calendar, ArrowRight } from 'lucide-react';

export default function Home() {
    return (
        <div className="space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
                <p className="text-slate-500">本日の業務を始めましょう</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/reports" className="group block p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                            <FileText size={24} className="text-green-600" />
                        </div>
                        <ArrowRight size={20} className="text-slate-300 group-hover:text-green-600 transition-colors" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">日報集約</h2>
                    <p className="text-sm text-slate-500">日々の活動記録を確認・検索</p>
                </Link>

                <Link to="/plans" className="group block p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <Calendar size={24} className="text-purple-600" />
                        </div>
                        <ArrowRight size={20} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">支援計画作成</h2>
                    <p className="text-sm text-slate-500">AIによる要約と計画案の作成</p>
                </Link>

                <Link to="/students" className="group block p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Users size={24} className="text-blue-600" />
                        </div>
                        <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">児童一覧</h2>
                    <p className="text-sm text-slate-500">児童情報の管理・閲覧</p>
                </Link>
            </div>

            {/* Placeholder for Recent Activity or Notifications could go here */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                <h3 className="text-indigo-900 font-bold mb-2">お知らせ</h3>
                <p className="text-indigo-700 text-sm">
                    システムがアップデートされました。新しい「支援計画作成」機能をぜひお試しください。
                </p>
            </div>
        </div>
    );
}
