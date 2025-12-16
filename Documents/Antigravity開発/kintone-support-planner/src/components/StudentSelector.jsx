import React, { useState, useEffect } from 'react';
import { getKintoneClient } from '../api/kintoneClient';
import { ChevronDown, Check } from 'lucide-react';

export default function StudentSelector({ onSelect, selectedId, multiple = false }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const configStr = localStorage.getItem('kintoneConfig');
                if (!configStr) return;
                const config = JSON.parse(configStr);
                const tokens = [
                    config.apps.apiTokenStudent,
                    config.apps.apiTokenReport,
                    config.apps.apiTokenPlan
                ];
                const client = getKintoneClient(config.subdomain, tokens);

                if (!client || !config.apps.student) return;

                const resp = await client.record.getRecords({
                    app: config.apps.student,
                    fields: ['$id', 'studentName'],
                });

                const formatted = resp.records.map(r => ({
                    id: r.$id.value,
                    name: r.studentName.value,
                }));
                setStudents(formatted);
            } catch (err) {
                console.error("Failed to fetch students for selector", err);
                setError("児童リストの取得に失敗しました");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const [isOpen, setIsOpen] = useState(false);

    // Logic for multiple select:
    const toggleSelection = (id) => {
        if (!Array.isArray(selectedId)) return; // Should be array in multiple mode
        const newSelection = selectedId.includes(id)
            ? selectedId.filter(sid => sid !== id)
            : [...selectedId, id];
        onSelect(newSelection);
    };

    if (error) return <p className="text-red-500 text-sm">{error}</p>;
    if (loading) return <p className="text-gray-500 text-sm">Loading students...</p>;

    if (multiple) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex justify-between items-center rounded-lg border border-slate-300 shadow-sm bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <span className="truncate">
                        {selectedId.length === 0
                            ? "児童を選択 (複数可)"
                            : `${selectedId.length}名を選択中`}
                    </span>
                    <ChevronDown size={16} className="text-slate-400" />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                            {students.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => toggleSelection(s.id)}
                                    className="flex items-center px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                                >
                                    <div className={`w-4 h-4 mr-3 border rounded flex items-center justify-center ${selectedId.includes(s.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                        }`}>
                                        {selectedId.includes(s.id) && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className="text-sm text-slate-700">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <select
                value={selectedId || ''}
                onChange={(e) => onSelect(e.target.value)}
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 bg-white text-slate-700"
            >
                <option value="">児童を選択してください</option>
                {students.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
