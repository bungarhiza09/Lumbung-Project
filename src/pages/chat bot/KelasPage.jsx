import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function KelasPage() {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: mods } = await supabase
      .from("kelas_modules")
      .select("*")
      .order("order_index");

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prog } = await supabase
        .from("kelas_progress")
        .select("*")
        .eq("user_id", user.id);

      const progressMap = {};
      prog?.forEach(p => { progressMap[p.module_id] = p; });
      setProgress(progressMap);
    }

    setModules(mods || []);
    setLoading(false);
  }

  const totalCompleted = Object.values(progress).filter(p => p.completed).length;
  const allDone = modules.length > 0 && totalCompleted === modules.length;

  if (selected) return (
    <ModuleDetail
      module={selected}
      progress={progress[selected.id]}
      onBack={() => { setSelected(null); fetchData(); }}
    />
  );

  return (
    <div>
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-4 text-white">
        <p className="text-sm font-medium">Progress Kelas Kader</p>
        <p className="text-3xl font-bold mt-1">{totalCompleted}/{modules.length}</p>
        <p className="text-xs opacity-80 mt-1">modul selesai</p>
        <div className="mt-3 bg-blue-500 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all"
            style={{ width: `${modules.length ? (totalCompleted / modules.length) * 100 : 0}%` }}
          />
        </div>
        {allDone && (
          <p className="text-xs mt-2 bg-white/20 rounded-lg px-3 py-1.5 inline-block">
            🎉 Selamat! Kamu berhak dapat sertifikat kader!
          </p>
        )}
      </div>

      {/* Module List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, idx) => {
            const prog = progress[mod.id];
            const isLocked = idx > 0 && !progress[modules[idx-1]?.id]?.completed;

            return (
              <div
                key={mod.id}
                onClick={() => !isLocked && setSelected(mod)}
                className={`border rounded-xl p-4 transition ${
                  isLocked
                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                    : prog?.completed
                    ? "border-green-300 bg-green-50 cursor-pointer"
                    : "cursor-pointer hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${prog?.completed ? "bg-green-500 text-white" : "bg-blue-100 text-blue-600"}`}>
                      {prog?.completed ? "✓" : idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{mod.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                    </div>
                  </div>
                  {isLocked ? (
                    <span className="text-lg">🔒</span>
                  ) : prog?.completed ? (
                    <span className="text-xs text-green-600 font-medium">Selesai ✓</span>
                  ) : (
                    <span className="text-xs text-blue-600">Mulai →</span>
                  )}
                </div>
                {prog?.quiz_score !== undefined && prog?.quiz_score !== null && (
                  <div className="mt-2 ml-11">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Skor kuis: {prog.quiz_score}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModuleDetail({ module, progress, onBack }) {
  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    supabase.from("kelas_quizzes")
      .select("*")
      .eq("module_id", module.id)
      .then(({ data }) => setQuizzes(data || []));
  }, []);

  function getYoutubeId(url) {
    const match = url?.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  async function submitQuiz() {
    let correct = 0;
    quizzes.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    const finalScore = Math.round((correct / quizzes.length) * 100);
    setScore(finalScore);
    setSubmitted(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("kelas_progress").upsert({
      user_id: user.id,
      module_id: module.id,
      completed: finalScore >= 70,
      quiz_score: finalScore,
      completed_at: finalScore >= 70 ? new Date().toISOString() : null,
    }, { onConflict: "user_id,module_id" });
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-blue-600 mb-4">← Kembali</button>

      <h2 className="text-lg font-semibold mb-1">{module.title}</h2>
      <p className="text-sm text-gray-500 mb-4">{module.description}</p>

      {/* Video */}
      {module.video_url && (
        <div className="relative w-full rounded-xl overflow-hidden mb-6" style={{ paddingTop: "56.25%" }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${getYoutubeId(module.video_url)}`}
            title={module.title}
            allowFullScreen
          />
        </div>
      )}

      {/* Quiz */}
      {quizzes.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">📝 Kuis Pemahaman</h3>

          {submitted ? (
            <div className={`rounded-xl p-4 text-center ${score >= 70 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <p className="text-3xl font-bold mb-1" style={{ color: score >= 70 ? "#16a34a" : "#dc2626" }}>
                {score}%
              </p>
              <p className="text-sm font-medium">{score >= 70 ? "🎉 Modul Selesai!" : "Belum lulus"}</p>
              <p className="text-xs text-gray-500 mt-1">
                {score >= 70 ? "Lanjut ke modul berikutnya!" : "Minimal 70% untuk lulus. Coba lagi ya!"}
              </p>
              {score < 70 && (
                <button onClick={() => { setSubmitted(false); setAnswers({}); }}
                  className="mt-3 text-xs bg-red-600 text-white px-4 py-2 rounded-full">
                  Coba Lagi
                </button>
              )}
              {score >= 70 && (
                <button onClick={onBack}
                  className="mt-3 text-xs bg-green-600 text-white px-4 py-2 rounded-full">
                  Kembali ke Daftar Modul
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((q, qi) => (
                <div key={q.id} className="border rounded-xl p-4">
                  <p className="text-sm font-medium mb-3">{qi + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                        className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition
                          ${answers[q.id] === oi
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300"}`}
                      >
                        {String.fromCharCode(65 + oi)}. {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={submitQuiz}
                disabled={Object.keys(answers).length < quizzes.length}
                className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-40"
              >
                Submit Jawaban ({Object.keys(answers).length}/{quizzes.length} dijawab)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}