import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Key, Save } from 'lucide-react';

export default function Settings() {
    const [config, setConfig] = useState({
        subdomain: '',
        geminiApiKey: '',
        apps: {
            student: '',
            apiTokenStudent: '',
            report: '',
            apiTokenReport: '',
            plan: '',
            apiTokenPlan: ''
        }
    });

    useEffect(() => {
        const saved = localStorage.getItem('kintoneConfig');
        if (saved) {
            setConfig(JSON.parse(saved));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('app_')) {
            const appKey = name.replace('app_', '');
            setConfig(prev => ({
                ...prev,
                apps: { ...prev.apps, [appKey]: value }
            }));
        } else {
            setConfig(prev => ({ ...prev, [name]: value }));
        }
    };

    const saveConfig = () => {
        localStorage.setItem('kintoneConfig', JSON.stringify(config));
        alert('設定を保存しました');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">設定</h1>
                <p className="text-slate-500 text-sm">アプリケーションの接続設定を管理します</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Connection Info */}
                <div className="space-y-6">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Database size={20} className="text-indigo-500" />
                            基本接続設定
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">サブドメイン</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm">https://</span>
                                    <input
                                        type="text"
                                        name="subdomain"
                                        value={config.subdomain}
                                        onChange={handleChange}
                                        placeholder="example"
                                        className="flex-1 rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <span className="text-slate-400 text-sm">.cybozu.com</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API キー</label>
                                <input
                                    type="password"
                                    name="geminiApiKey"
                                    value={config.geminiApiKey || ''}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="AI Studio API Key"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>
                                    から取得
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <SettingsIcon size={20} className="text-gray-500" />
                            アプリID設定
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">児童台帳アプリID</label>
                                <input
                                    type="number"
                                    name="app_student"
                                    value={config.apps.student}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">日報アプリID</label>
                                <input
                                    type="number"
                                    name="app_report"
                                    value={config.apps.report}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">支援計画アプリID</label>
                                <input
                                    type="number"
                                    name="app_plan"
                                    value={config.apps.plan}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: API Tokens */}
                <div className="space-y-6">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 h-full flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Key size={20} className="text-yellow-500" />
                            APIトークン
                        </h2>
                        <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded">
                            セキュリティのため、各アプリの設定画面でAPIトークンを発行し、
                            <span className="font-bold text-slate-700">「レコード閲覧」「レコード追加」</span>
                            の権限を付与してください。
                        </p>

                        <div className="space-y-5 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">児童台帳アプリ トークン</label>
                                <input
                                    type="password"
                                    name="apiTokenStudent"
                                    value={config.apps.apiTokenStudent || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, apps: { ...prev.apps, apiTokenStudent: e.target.value } }))}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">日報アプリ トークン</label>
                                <input
                                    type="password"
                                    name="apiTokenReport"
                                    value={config.apps.apiTokenReport || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, apps: { ...prev.apps, apiTokenReport: e.target.value } }))}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">支援計画アプリ トークン</label>
                                <input
                                    type="password"
                                    name="apiTokenPlan"
                                    value={config.apps.apiTokenPlan || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, apps: { ...prev.apps, apiTokenPlan: e.target.value } }))}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <button
                                onClick={saveConfig}
                                className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 transition-all"
                            >
                                <Save size={20} className="mr-2" />
                                設定を保存
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
