import React, { useState } from 'react';
import StudentSelector from '../components/StudentSelector';
import { getKintoneClient } from '../api/kintoneClient';
import { Calendar, Search, Clock, User, X, ExternalLink } from 'lucide-react';

export default function DailyReports() {
    const [filters, setFilters] = useState({
        studentId: '',
        startDate: '',
        endDate: ''
    });
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getKintoneRecordUrl = (recordId) => {
        try {
            const configStr = localStorage.getItem('kintoneConfig');
            if (!configStr) return null;
            const config = JSON.parse(configStr);
            if (!config.subdomain || !config.apps.report) return null;

            return `https://${config.subdomain}.cybozu.com/k/${config.apps.report}/show#record=${recordId}`;
        } catch (e) {
            console.error("Failed to generate Kintone URL", e);
            return null;
        }
    };

    const handleSearch = async () => {
        if (!filters.studentId) {
            alert("児童を選択してください");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const configStr = localStorage.getItem('kintoneConfig');
            if (!configStr) throw new Error("設定が見つかりません");

            const config = JSON.parse(configStr);
            const tokens = [
                config.apps.apiTokenStudent,
                config.apps.apiTokenReport,
                config.apps.apiTokenPlan
            ];
            const client = getKintoneClient(config.subdomain, tokens);

            if (!client || !config.apps.report) throw new Error("日報アプリIDが設定されていません");

            // Build query
            let query = `studentId = "${filters.studentId}"`;
            if (filters.startDate) {
                query += ` and reportDate >= "${filters.startDate}"`;
            }
            if (filters.endDate) {
                query += ` and reportDate <= "${filters.endDate}"`;
            }
            query += ' order by reportDate desc limit 100';

            const resp = await client.record.getRecords({
                app: config.apps.report,
                query: query,
                fields: ['$id', 'reportDate', 'activityType', 'content', 'staff'],
            });

            const formatted = resp.records.map(r => ({
                id: r.$id.value,
                date: r.reportDate.value,
                type: r.activityType.value,
                content: r.content.value,
                staff: r.staff.value[0]?.name || '不明' // User selection field is an array
            }));
            setReports(formatted);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">日報集約</h1>
                <p className="text-slate-500 text-sm">児童ごとの日報活動記録を検索・閲覧します</p>
            </header>

            {/* Filters */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">児童を選択</label>
                        <StudentSelector
                            selectedId={filters.studentId}
                            onSelect={(val) => setFilters(prev => ({ ...prev, studentId: val }))}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">期間</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 bg-slate-50"
                            />
                            <span className="text-slate-400">~</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 bg-slate-50"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 shadow-sm"
                        >
                            <Search size={18} className="mr-2" />
                            検索
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-8">
                    {reports.length > 0 ? (
                        reports.map(report => (
                            <div key={report.id} className="ml-6 relative">
                                {/* Dot on timeline */}
                                <div className="absolute -left-[31px] top-6 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center text-slate-700 font-bold text-lg">
                                                <Calendar size={18} className="mr-2 text-indigo-500" />
                                                {report.date}
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {report.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                                            <User size={14} className="mr-1.5" />
                                            {report.staff}
                                        </div>
                                    </div>
                                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-3">
                                        {report.content}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                                        >
                                            詳細を見る
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        filters.studentId && !error && (
                            <div className="ml-6 py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                                条件に一致する日報はありません
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${selectedReport.type === '個別' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                    {selectedReport.type}
                                </span>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar className="text-indigo-500" size={24} />
                                    {selectedReport.date}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 flex items-center">
                                    <User size={14} className="mr-1" />
                                    記入者: {selectedReport.staff}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">活動内容・報告</h3>
                            <div className="bg-slate-50 rounded-lg p-6 text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                                {selectedReport.content}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                            {getKintoneRecordUrl(selectedReport.id) && (
                                <a
                                    href={getKintoneRecordUrl(selectedReport.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                                >
                                    <ExternalLink size={18} className="mr-2" />
                                    kintoneで開く
                                </a>
                            )}
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
