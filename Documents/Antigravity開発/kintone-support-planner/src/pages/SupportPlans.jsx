import React, { useState, useEffect } from 'react';
import StudentSelector from '../components/StudentSelector';
import { getKintoneClient } from '../api/kintoneClient';
import { generateSummary } from '../api/aiClient';
import { Wand2, Save, AlertCircle, FileText, Calendar, List, PlusCircle, Search, X, ExternalLink } from 'lucide-react';

export default function SupportPlans() {
    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'list'
    const [studentId, setStudentId] = useState('');
    const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [draft, setDraft] = useState({
        achievements: '',
        supportPlan: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // List State
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [listLoading, setListLoading] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({
        studentIds: [], // Changed from string studentId to array
        startMonth: '',
        endMonth: ''
    });

    // Fetch plans when tab changes to list
    useEffect(() => {
        if (activeTab === 'list') {
            fetchPlans();
        }
    }, [activeTab]);

    const fetchPlans = async () => {
        setListLoading(true);
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

            if (!client || !config.apps.plan) throw new Error("kintone設定が不足しています");

            // Kintone Query: Filter by Student only (Server-side)
            // Note: targetMonth range query might fail if field is Dropdown/Radio (GAIA_IQ03),
            // so we handle date filtering heavily on client-side.
            let query = 'order by targetMonth desc limit 500';
            const conditions = [];

            if (historyFilters.studentIds && historyFilters.studentIds.length > 0) {
                const ids = historyFilters.studentIds.map(id => `"${id}"`).join(', ');
                conditions.push(`studentId in (${ids})`);
            }

            // Note: Date filtering moved to post-fetch to avoid field type limitations

            if (conditions.length > 0) {
                query = `${conditions.join(' and ')} ${query}`;
            }

            // console.log("Fetching plans with query:", query);

            const resp = await client.record.getRecords({
                app: config.apps.plan,
                query: query,
                fields: ['$id', 'targetMonth', 'studentName', 'achievements', 'supportPlan']
            });

            // Client-side Filtering for Date Range
            const filteredRecords = resp.records.filter(r => {
                const m = r.targetMonth.value;
                if (historyFilters.startMonth && m < historyFilters.startMonth) return false;
                if (historyFilters.endMonth && m > historyFilters.endMonth) return false;
                return true;
            });

            const formatted = filteredRecords.map(r => ({
                id: r.$id.value,
                targetMonth: r.targetMonth.value,
                studentName: r.studentName.value,
                achievements: r.achievements.value,
                supportPlan: r.supportPlan.value
            }));
            setPlans(formatted);

        } catch (err) {
            console.error(err);
        } finally {
            setListLoading(false);
        }
    };

    const getStudentName = async (config, id) => {
        const tokens = [
            config.apps.apiTokenStudent,
            config.apps.apiTokenReport,
            config.apps.apiTokenPlan
        ];
        const client = getKintoneClient(config.subdomain, tokens);
        const resp = await client.record.getRecord({
            app: config.apps.student,
            id: id
        });
        return resp.record.studentName.value;
    };

    const getKintoneRecordUrl = (recordId) => {
        try {
            const configStr = localStorage.getItem('kintoneConfig');
            if (!configStr) return null;
            const config = JSON.parse(configStr);
            if (!config.subdomain || !config.apps.plan) return null;

            return `https://${config.subdomain}.cybozu.com/k/${config.apps.plan}/show#record=${recordId}`;
        } catch (e) {
            console.error("Failed to generate Kintone URL", e);
            return null;
        }
    };

    const handleGenerate = async () => {
        if (!studentId) {
            setMsg({ type: 'error', text: '児童を選択してください' });
            return;
        }

        setLoading(true);
        setMsg({ type: 'info', text: '日報を取得してAI要約を生成中...' });

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

            if (!client || !config.apps.report) throw new Error("kintone設定が不足しています");
            if (!config.geminiApiKey) throw new Error("Gemini APIキーが設定されていません");

            // Calculate date range for the month
            const [year, month] = targetMonth.split('-');
            const startDate = `${targetMonth}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${targetMonth}-${lastDay}`;

            // Fetch reports
            const query = `studentId = "${studentId}" and reportDate >= "${startDate}" and reportDate <= "${endDate}" order by reportDate desc limit 100`;
            const resp = await client.record.getRecords({
                app: config.apps.report,
                query: query,
                fields: ['reportDate', 'activityType', 'content']
            });

            if (resp.records.length === 0) {
                throw new Error("対象期間の日報が見つかりません");
            }

            const reports = resp.records.map(r => ({
                date: r.reportDate.value,
                type: r.activityType.value,
                content: r.content.value
            }));

            // Get student name
            const studentName = await getStudentName(config, studentId);

            // Generate with AI
            const aiResult = await generateSummary(config.geminiApiKey, reports, studentName);

            setDraft({
                achievements: aiResult.achievements || '',
                supportPlan: aiResult.plan || ''
            });
            setMsg({ type: 'success', text: 'AI要約の生成が完了しました。内容を確認・編集してください。' });

        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!studentId || !draft.achievements || !draft.supportPlan) {
            setMsg({ type: 'error', text: '必須項目が入力されていません' });
            return;
        }

        setLoading(true);
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

            const studentName = await getStudentName(config, studentId);

            await client.record.addRecord({
                app: config.apps.plan,
                record: {
                    targetMonth: { value: targetMonth },
                    studentId: { value: studentId }, // Lookup key
                    studentName: { value: studentName },
                    achievements: { value: draft.achievements },
                    supportPlan: { value: draft.supportPlan }
                }
            });

            setMsg({ type: 'success', text: 'kintoneに保存しました！' });
            // Switch to list and Reset filters to show the new one?
            // Or just switch
            setActiveTab('list');
            fetchPlans(); // Refresh list to likely show the new item
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: '保存に失敗しました: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">支援計画</h1>
                    <p className="text-slate-500 text-sm">児童ごとの支援計画の作成と管理を行います</p>
                </div>
                {activeTab === 'create' && (
                    <StudentSelector selectedId={studentId} onSelect={setStudentId} />
                )}
            </header>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'create'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <PlusCircle size={16} className="mr-2" />
                    新規作成
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'list'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <List size={16} className="mr-2" />
                    過去の計画
                </button>
            </div>

            {msg.text && activeTab === 'create' && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <span>{msg.text}</span>
                </div>
            )}

            {activeTab === 'create' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
                            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                                作成設定
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">対象月</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <input
                                            type="month"
                                            value={targetMonth}
                                            onChange={(e) => setTargetMonth(e.target.value)}
                                            className="block w-full rounded-lg border-slate-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5"
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
                                    <p>・右上の検索ボックスで児童を選択してください</p>
                                    <p className="mt-1">・対象月の前月1日から末日までの日報データを参照して要約を作成します</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                                >
                                    <Wand2 size={20} className="mr-2" />
                                    AI生成を実行
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 min-h-[600px] flex flex-col">
                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <FileText size={16} className="text-blue-500" />
                                        活動実績
                                    </label>
                                    <textarea
                                        value={draft.achievements}
                                        onChange={(e) => setDraft({ ...draft, achievements: e.target.value })}
                                        rows={8}
                                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base leading-relaxed p-4 bg-slate-50 focus:bg-white transition-colors"
                                        placeholder="AI生成ボタンを押すと、ここに日報の要約が表示されます。"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Calendar size={16} className="text-purple-500" />
                                        支援計画
                                    </label>
                                    <textarea
                                        value={draft.supportPlan}
                                        onChange={(e) => setDraft({ ...draft, supportPlan: e.target.value })}
                                        rows={10}
                                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base leading-relaxed p-4 bg-slate-50 focus:bg-white transition-colors"
                                        placeholder="AI生成された計画案が表示されます。必要に応じて修正してください。"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-300 shadow-lg transform active:scale-95 transition-all"
                                >
                                    <Save size={20} className="mr-2" />
                                    kintoneに保存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // LIST VIEW
                <div className="space-y-6">
                    {/* Search Filters */}
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">児童で絞り込み</label>
                                <StudentSelector
                                    selectedId={historyFilters.studentIds}
                                    onSelect={(val) => setHistoryFilters(prev => ({ ...prev, studentIds: val }))}
                                    multiple={true}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">対象月 範囲</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="month"
                                        value={historyFilters.startMonth}
                                        onChange={(e) => setHistoryFilters(prev => ({ ...prev, startMonth: e.target.value }))}
                                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 bg-slate-50"
                                    />
                                    <span className="text-slate-400">~</span>
                                    <input
                                        type="month"
                                        value={historyFilters.endMonth}
                                        onChange={(e) => setHistoryFilters(prev => ({ ...prev, endMonth: e.target.value }))}
                                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 bg-slate-50"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <button
                                    onClick={fetchPlans}
                                    disabled={listLoading}
                                    className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 shadow-sm"
                                >
                                    <Search size={18} className="mr-2" />
                                    検索
                                </button>
                            </div>
                        </div>
                    </div>

                    {listLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>)}
                        </div>
                    ) : plans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map(plan => (
                                <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="block text-xs font-bold text-indigo-500 mb-1">{plan.targetMonth}</span>
                                            <h3 className="font-bold text-lg text-slate-800">{plan.studentName}</h3>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 mb-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase">活動実績</h4>
                                            <p className="text-sm text-slate-600 line-clamp-3">{plan.achievements}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase">支援計画</h4>
                                            <p className="text-sm text-slate-600 line-clamp-3">{plan.supportPlan}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 mt-auto">
                                        <button
                                            onClick={() => setSelectedPlan(plan)}
                                            className="w-full text-center text-sm font-bold text-indigo-600 hover:text-indigo-800"
                                        >
                                            詳細を見る
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-xl">
                            <p className="text-slate-400">
                                条件に一致する支援計画は見つかりませんでした
                            </p>
                            <button onClick={() => {
                                setHistoryFilters({ studentIds: [], startMonth: '', endMonth: '' });
                                fetchPlans();
                            }} className="mt-4 text-indigo-600 font-bold hover:underline">
                                検索条件をクリア
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedPlan(null)}>
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mb-2">
                                    {selectedPlan.targetMonth}
                                </span>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    {selectedPlan.studentName}
                                    <span className="text-base font-normal text-slate-500">さんの支援計画</span>
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-indigo-100">
                                    <FileText className="text-blue-500" size={24} />
                                    活動実績
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedPlan.achievements}
                                </div>
                            </div>

                            <div>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-purple-100">
                                    <Calendar className="text-purple-500" size={24} />
                                    支援計画
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedPlan.supportPlan}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                            {getKintoneRecordUrl(selectedPlan.id) && (
                                <a
                                    href={getKintoneRecordUrl(selectedPlan.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                                >
                                    <ExternalLink size={18} className="mr-2" />
                                    kintoneで開く
                                </a>
                            )}
                            <button
                                onClick={() => setSelectedPlan(null)}
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
