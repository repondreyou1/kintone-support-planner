import React, { useState, useEffect } from 'react';
import { getKintoneClient } from '../api/kintoneClient';
import { X, ExternalLink } from 'lucide-react';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getKintoneRecordUrl = (recordId) => {
    try {
      const configStr = localStorage.getItem('kintoneConfig');
      if (!configStr) return null;
      const config = JSON.parse(configStr);
      if (!config.subdomain || !config.apps.student) return null;

      return `https://${config.subdomain}.cybozu.com/k/${config.apps.student}/show#record=${recordId}`;
    } catch (e) {
      console.error("Failed to generate Kintone URL", e);
      return null;
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const configStr = localStorage.getItem('kintoneConfig');
      if (!configStr) {
        throw new Error("設定が保存されていません。設定ページでkintone接続情報を入力してください。");
      }
      const config = JSON.parse(configStr);

      // Collect all tokens
      const tokens = [
        config.apps.apiTokenStudent,
        config.apps.apiTokenReport,
        config.apps.apiTokenPlan
      ];

      const client = getKintoneClient(config.subdomain, tokens);

      if (!client || !config.apps.student) {
        throw new Error("kintone設定または児童台帳アプリIDが不足しています。");
      }

      const resp = await client.record.getRecords({
        app: config.apps.student,
        fields: ['$id', 'studentName', 'grade', 'status'],
      });

      const formatted = resp.records.map(r => ({
        id: r.$id.value,
        name: r.studentName.value,
        grade: r.grade.value,
        status: r.status.value
      }));
      setStudents(formatted);
    } catch (err) {
      console.error(err);
      setError(err.message);
      // Fallback for demo if auth fails or no config (optional, maybe better to show error)
      if (err.message.includes("設定")) {
        // keep empty or show specific message
      } else {
        // maybe use mock data if it's just a network error? No, better be explicit.
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">児童一覧</h1>
          <p className="text-slate-500 text-sm">登録されている児童の管理用台帳</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          新規登録
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.length === 0 && !error ? (
            <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
              データがありません。設定を確認してください。
            </div>
          ) : (
            students.map((student) => (
              <div key={student.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                      {student.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{student.name}</h3>
                      <p className="text-xs text-slate-500">{student.grade}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${student.status === '在籍中' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {student.status}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="w-full py-2 text-sm text-slate-600 hover:bg-slate-50 rounded bg-white border border-slate-200 font-medium font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    詳細を見る
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-indigo-50">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold text-2xl shadow-sm border border-indigo-100">
                  {selectedStudent.name.slice(0, 1)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                  <p className="text-slate-500 font-medium">{selectedStudent.grade}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">在籍ステータス</span>
                <span className={`px-2.5 py-0.5 text-sm font-bold rounded-full ${selectedStudent.status === '在籍中' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {selectedStudent.status}
                </span>
              </div>
              {/* Add more fields here as needed (e.g. birthday, class, etc from Kintone) */}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              {getKintoneRecordUrl(selectedStudent.id) && (
                <a
                  href={getKintoneRecordUrl(selectedStudent.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                >
                  <ExternalLink size={18} className="mr-2" />
                  kintoneで開く
                </a>
              )}
              <button
                onClick={() => setSelectedStudent(null)}
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
