import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { tambahPoin } from '../../lib/poinHelper'

export default function KelasPage() {
  const { profile, user } = useAuth()
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState({})
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: mods } = await supabase
      .from('kelas_modules')
      .select('*')
      .order('order_index')

    if (user) {
      const { data: prog } = await supabase
        .from('kelas_progress')
        .select('*')
        .eq('user_id', user.id)
      const map = {}
      prog?.forEach(p => { map[p.module_id] = p })
      setProgress(map)
    }

    setModules(mods || [])
    setLoading(false)
  }

  const totalCompleted = Object.values(progress).filter(p => p.completed).length

  if (showForm) {
    return (
      <>
        <TambahModulForm
          onSuccess={() => {
            setShowSuccess(true)
            fetchData()

            setTimeout(() => {
              setShowSuccess(false)
            }, 3000)
          }}
          onBack={() => {
            setShowForm(false)
            fetchData()
          }}
        />

        {/* Popup Success */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-[fadeIn_.2s_ease]">

              <div className="w-16 h-16 rounded-full bg-[#f0faf4] flex items-center justify-center text-3xl mx-auto mb-4">
                🎉
              </div>

              <h3 className="text-base font-bold text-center text-[#1a3a2a]">
                Topik Kuis Berhasil Ditambahkan!
              </h3>

              <p className="text-sm text-[#6b7b70] text-center mt-2 leading-relaxed">
                Terima kasih sudah menambahkan topik edukasi 📚
                <br />
                Kamu mendapat <span className="font-bold text-[#2D6A4F]">+10 poin</span>
              </p>

              <button
                onClick={() => {
                  setShowSuccess(false)
                  setShowForm(false)
                }}
                className="w-full mt-5 bg-[#2D6A4F] hover:bg-[#235c43] text-white py-3 rounded-2xl text-sm font-semibold transition-all"
              >
                Oke
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  if (selected) return (
    <ModuleDetail
      module={selected}
      progress={progress[selected.id]}
      user={user}
      isKader={profile?.role === 'kader'}
      onBack={() => { setSelected(null); fetchData() }}
    />
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="bg-[#f0faf4] rounded-2xl p-3 flex-1 border border-[#b7e4cc] mr-2">
          <p className="text-xs font-semibold text-[#2D6A4F] mb-0.5">🎓 Kuis Pengetahuan Gizi</p>
          <p className="text-xs text-[#5a7a6a]">Uji pengetahuan gizimu! Selesaikan semua topik untuk dapat sertifikat.</p>
          <div className="mt-2 inline-flex items-center gap-1 bg-[#fff7d6] text-[#8a6d1f] border border-[#ffe58f] px-2 py-1 rounded-full text-[11px] font-semibold">
            ⭐ Tambah topik kuis = +10 poin
          </div>

        </div>
        {profile?.role === 'kader' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex-shrink-0 bg-[#2D6A4F] text-white text-xs font-semibold px-3 py-2 rounded-2xl flex items-center gap-1 shadow-md shadow-[#2D6A4F]/20"
          >
            <span className="text-base">+</span> Tambah
          </button>
        )}
      </div>

      {/* Progress Banner */}
      <div className="bg-gradient-to-r from-[#2D6A4F] to-[#3a8a66] rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium opacity-80">Progres Kuis</p>
            <p className="text-3xl font-bold mt-1">
              {totalCompleted}
              <span className="text-lg opacity-70">/{modules.length}</span>
            </p>
            <p className="text-xs opacity-70">topik selesai</p>
          </div>
          <div className="text-right">
            <p className="text-4xl">🧠</p>
            {totalCompleted === modules.length && modules.length > 0 && (
              <p className="text-xs mt-1 bg-white/20 px-2 py-1 rounded-full">🏆 Semua Selesai!</p>
            )}
          </div>
        </div>
        <div className="mt-3 bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${modules.length ? (totalCompleted / modules.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Module List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="border border-[#e8e4db] rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-[#f0ece4] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#f0ece4] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-2">📝</p>
          <p className="text-sm font-medium text-[#4a4a3a]">Belum ada topik kuis</p>
          {profile?.role === 'kader' && (
            <p className="text-xs text-[#9a9a8a] mt-1">Klik "+ Tambah" untuk buat topik kuis pertama</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, idx) => {
            const prog = progress[mod.id]
            return (
              <div
                key={mod.id}
                onClick={() => setSelected(mod)}
                className={`border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-sm ${
                  prog?.completed
                    ? 'border-[#b7e4cc] bg-[#f0faf4]'
                    : 'border-[#e8e4db] bg-white hover:border-[#b7e4cc]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                      prog?.completed ? 'bg-[#2D6A4F] text-white' : 'bg-[#f0faf4] border border-[#b7e4cc]'
                    }`}>
                      {prog?.completed ? '✓' : mod.icon || '📚'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a3a2a]">{mod.title}</p>
                      <p className="text-xs text-[#7a8a7a] mt-0.5 line-clamp-1">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {prog?.completed ? (
                      <span className="text-xs text-[#2D6A4F] font-semibold bg-[#f0faf4] px-2 py-1 rounded-full border border-[#b7e4cc]">
                        ✓ Selesai
                      </span>
                    ) : (
                      <span className="text-xs text-[#2D6A4F] font-medium">Mulai →</span>
                    )}
                    {prog?.quiz_score !== undefined && prog?.quiz_score !== null && (
                      <span className="text-xs text-[#9a9a8a]">Skor: {prog.quiz_score}%</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Form Tambah Modul (khusus kader) ───────────────────────────
function TambahModulForm({ onBack, onSuccess }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1) // step 1: info modul, step 2: tambah soal kuis
  const [loading, setLoading] = useState(false)
  const [modulId, setModulId] = useState(null)

  const [modulForm, setModulForm] = useState({
    title: '',
    description: '',
    icon: '📚',
    video_url: '',
  })

  const [quizzes, setQuizzes] = useState([
    { question: '', options: ['', '', '', ''], correct_answer: 0 }
  ])

  const ICON_OPTIONS = ['📚','🥗','🍼','👶','🫀','🧠','🌿','🍎','💪','🏥']

  async function saveModul() {
    if (!modulForm.title) return
    setLoading(true)

    // Hitung order_index
    const { count } = await supabase
      .from('kelas_modules')
      .select('*', { count: 'exact', head: true })

    const { data, error } = await supabase
      .from('kelas_modules')
      .insert({
        title: modulForm.title,
        description: modulForm.description,
        order_index: (count || 0) + 1,
        video_url: modulForm.video_url || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (!error && data) {
      setModulId(data.id)
      setStep(2) // lanjut ke tambah soal
    }
    setLoading(false)
  }

  async function saveKuis() {
    if (!modulId) return
    setLoading(true)

    // Filter soal yang sudah diisi lengkap
    const validQuizzes = quizzes.filter(q =>
      q.question.trim() && q.options.every(o => o.trim())
    )

    if (validQuizzes.length > 0) {
      await supabase.from('kelas_quizzes').insert(
        validQuizzes.map(q => ({
          module_id: modulId,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
        }))
      )
    }
    await tambahPoin(
      user.id,
      'upload_kelas',
      `Menambahkan topik kuis: ${modulForm.title}`
    )

    setLoading(false)

    if (onSuccess) {
      onSuccess()
    }

    setTimeout(() => {
        onBack?.()
      }, 5000)
  }

  function updateQuiz(idx, field, val) {
    const arr = [...quizzes]
    arr[idx][field] = val
    setQuizzes(arr)
  }

  function updateOption(qIdx, oIdx, val) {
    const arr = [...quizzes]
    arr[qIdx].options[oIdx] = val
    setQuizzes(arr)
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"

  return (
    <div>
      <button onClick={onBack} className="text-sm text-[#2D6A4F] font-medium mb-4">← Batal</button>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-5">
        {['Info Topik', 'Soal Kuis'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === i + 1 ? 'bg-[#2D6A4F] text-white' :
              step > i + 1 ? 'bg-[#b7e4cc] text-[#2D6A4F]' : 'bg-[#f0ece4] text-[#9a9a8a]'
            }`}>{step > i + 1 ? '✓' : i + 1}</div>
            <span className={`text-xs font-medium ${step === i + 1 ? 'text-[#1a3a2a]' : 'text-[#9a9a8a]'}`}>{s}</span>
            {i < 1 && <span className="text-[#e8e4db] mx-1">→</span>}
          </div>
        ))}
      </div>

      {/* STEP 1: Info Modul */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#1a3a2a]">Info Topik Kuis</h2>

          {/* Pilih Icon */}
          <div>
            <p className="text-xs font-semibold text-[#4a4a3a] mb-2">Ikon Topik</p>
            <div className="flex gap-2 flex-wrap">
              {ICON_OPTIONS.map(ic => (
                <button key={ic} onClick={() => setModulForm(f => ({...f, icon: ic}))}
                  className={`text-xl w-10 h-10 rounded-xl border-2 transition-all ${
                    modulForm.icon === ic ? 'border-[#2D6A4F] bg-[#f0faf4]' : 'border-[#e8e4db]'
                  }`}>{ic}
                </button>
              ))}
            </div>
          </div>

          <input
            value={modulForm.title}
            onChange={e => setModulForm(f => ({...f, title: e.target.value}))}
            placeholder="Judul topik * (contoh: Gizi Seimbang Balita)"
            className={inputClass}
          />

          <textarea
            value={modulForm.description}
            onChange={e => setModulForm(f => ({...f, description: e.target.value}))}
            placeholder="Deskripsi singkat topik ini..."
            rows={2}
            className={inputClass + ' resize-none'}
          />

          <div>
            <p className="text-xs font-semibold text-[#4a4a3a] mb-1.5">Link Video (opsional)</p>
            <input
              value={modulForm.video_url}
              onChange={e => setModulForm(f => ({...f, video_url: e.target.value}))}
              placeholder="https://youtube.com/watch?v=..."
              className={inputClass}
            />
            <p className="text-xs text-[#9a9a8a] mt-1">Video edukasi sebelum kuis dimulai</p>
          </div>

          <button
            onClick={saveModul}
            disabled={loading || !modulForm.title.trim()}
            className="w-full bg-[#2D6A4F] text-white py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-40 shadow-md shadow-[#2D6A4F]/20"
          >
            {loading ? 'Menyimpan...' : 'Lanjut → Buat Soal Kuis'}
          </button>
        </div>
      )}

      {/* STEP 2: Tambah Soal Kuis */}
      {step === 2 && (
        <div>
          <h2 className="text-base font-bold text-[#1a3a2a] mb-1">Buat Soal Kuis</h2>
          <p className="text-xs text-[#9a9a8a] mb-4">Minimal 1 soal. Tandai jawaban yang benar dengan menekan tombol di sebelah kiri.</p>

          <div className="space-y-4">
            {quizzes.map((q, qi) => (
              <div key={qi} className="border border-[#e8e4db] rounded-2xl p-4 bg-[#faf9f7]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-[#2D6A4F]">Soal {qi + 1}</p>
                  {quizzes.length > 1 && (
                    <button
                      onClick={() => setQuizzes(arr => arr.filter((_, i) => i !== qi))}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <textarea
                  value={q.question}
                  onChange={e => updateQuiz(qi, 'question', e.target.value)}
                  placeholder="Tulis pertanyaan..."
                  rows={2}
                  className={inputClass + ' resize-none mb-3'}
                />

                <p className="text-xs text-[#9a9a8a] mb-2">Pilihan jawaban (tekan ● untuk tandai jawaban benar):</p>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => updateQuiz(qi, 'correct_answer', oi)}
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center text-xs ${
                        q.correct_answer === oi
                          ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                          : 'border-[#e8e4db] bg-white text-[#9a9a8a]'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}
                    </button>
                    <input
                      value={opt}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Pilihan ${String.fromCharCode(65 + oi)}`}
                      className={inputClass}
                    />
                  </div>
                ))}

                <p className="text-xs text-[#2D6A4F] mt-2 font-medium">
                  ✓ Jawaban benar: Pilihan {String.fromCharCode(65 + q.correct_answer)}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setQuizzes(arr => [...arr, { question: '', options: ['','','',''], correct_answer: 0 }])}
            className="w-full border border-dashed border-[#b7e4cc] text-[#2D6A4F] text-xs font-semibold py-3 rounded-2xl mt-3 hover:bg-[#f0faf4] transition-all"
          >
            + Tambah Soal Lagi
          </button>

          <button
            onClick={saveKuis}
            disabled={loading}
            className="w-full bg-[#2D6A4F] text-white py-3.5 rounded-2xl text-sm font-semibold mt-3 disabled:opacity-40 shadow-md shadow-[#2D6A4F]/20"
          >
            {loading ? 'Menyimpan...' : '✅ Simpan Topik & Kuis'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Detail Modul + Kuis ─────────────────────────────────────────
function ModuleDetail({ module, progress, user, isKader, onBack }) {
  const [quizzes, setQuizzes] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loadingQuiz, setLoadingQuiz] = useState(true)

  useEffect(() => {
    supabase.from('kelas_quizzes').select('*').eq('module_id', module.id)
      .then(({ data }) => { setQuizzes(data || []); setLoadingQuiz(false) })

    // Kalau sudah pernah selesai, tampilkan skor
    if (progress?.completed) {
      setSubmitted(true)
      setScore(progress.quiz_score || 0)
    }
  }, [])

  function getYoutubeId(url) {
    const match = url?.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  async function submitQuiz() {
    let correct = 0
    quizzes.forEach(q => { if (answers[q.id] === q.correct_answer) correct++ })
    const finalScore = Math.round((correct / quizzes.length) * 100)
    setScore(finalScore)
    setSubmitted(true)

    if (!user) return
    await supabase.from('kelas_progress').upsert({
      user_id: user.id,
      module_id: module.id,
      completed: finalScore >= 70,
      quiz_score: finalScore,
      completed_at: finalScore >= 70 ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,module_id' })
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-[#2D6A4F] font-medium mb-4 flex items-center gap-1">
        ← Kembali ke Daftar Topik
      </button>

      {/* Header Modul */}
      <div className="bg-gradient-to-br from-[#f0faf4] to-[#e8f7ef] rounded-2xl p-4 mb-4 border border-[#b7e4cc]">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{module.icon || '📚'}</span>
          <div>
            <h2 className="text-base font-bold text-[#1a3a2a]">{module.title}</h2>
            <p className="text-xs text-[#5a7a6a] mt-0.5 leading-relaxed">{module.description}</p>
          </div>
        </div>
      </div>

      {/* Video (kalau ada) */}
      {module.video_url && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#4a4a3a] mb-2">📺 Video Materi</p>
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#e8e4db]" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${getYoutubeId(module.video_url)}`}
              title={module.title}
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Kuis */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-[#2D6A4F] rounded-full" />
        <h3 className="text-sm font-bold text-[#1a3a2a]">
          Kuis Pengetahuan {quizzes.length > 0 && `(${quizzes.length} soal)`}
        </h3>
      </div>

      {loadingQuiz ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 bg-[#f0ece4] rounded-2xl animate-pulse" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-[#e8e4db] rounded-2xl">
          <p className="text-2xl mb-2">📝</p>
          <p className="text-xs text-[#9a9a8a]">Belum ada soal kuis untuk topik ini</p>
        </div>
      ) : submitted ? (
        // Hasil Kuis
        <div className={`rounded-2xl p-5 text-center border ${
          score >= 70 ? 'bg-[#f0faf4] border-[#b7e4cc]' : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-5xl mb-2">{score >= 70 ? '🎉' : '😅'}</p>
          <p className={`text-4xl font-bold mb-1 ${score >= 70 ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
            {score}%
          </p>
          <p className="text-sm font-semibold text-[#1a3a2a] mb-1">
            {score >= 70 ? 'Lulus! Pengetahuan gizi kamu bagus!' : 'Belum Lulus'}
          </p>
          <p className="text-xs text-[#7a8a7a]">
            {score >= 70
              ? 'Kamu memahami topik ini dengan baik 👍'
              : 'Minimal skor 70% untuk lulus. Pelajari lagi dan coba lagi ya!'}
          </p>

          {/* Review Jawaban */}
          {Object.keys(answers).length > 0 && (
            <div className="mt-4 text-left space-y-2">
              <p className="text-xs font-semibold text-[#4a4a3a]">Review Jawaban:</p>
              {quizzes.map((q, qi) => {
                const userAnswer = answers[q.id]
                const isCorrect = userAnswer === q.correct_answer
                return (
                  <div key={q.id} className={`rounded-xl p-3 text-xs ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="font-medium text-[#1a3a2a] mb-1">{qi+1}. {q.question}</p>
                    <p className={isCorrect ? 'text-green-600' : 'text-red-500'}>
                      Jawabanmu: {userAnswer !== undefined ? q.options[userAnswer] : 'Tidak dijawab'}
                      {isCorrect ? ' ✓' : ` ✗ (Benar: ${q.options[q.correct_answer]})`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {score < 70 && (
            <button
              onClick={() => { setSubmitted(false); setAnswers({}) }}
              className="mt-4 bg-[#2D6A4F] text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              Coba Lagi
            </button>
          )}
          {score >= 70 && (
            <button
              onClick={onBack}
              className="mt-4 bg-[#2D6A4F] text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              Kembali ke Daftar Topik
            </button>
          )}
        </div>
      ) : (
        // Soal Kuis
        <div className="space-y-4">
          {quizzes.map((q, qi) => (
            <div key={q.id} className="border border-[#e8e4db] rounded-2xl p-4 bg-[#faf9f7]">
              <p className="text-sm font-semibold text-[#1a3a2a] mb-3">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all ${
                      answers[q.id] === oi
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-white text-[#4a4a3a] border-[#e8e4db] hover:border-[#b7e4cc] hover:bg-[#f0faf4]'
                    }`}
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
            className="w-full bg-[#2D6A4F] hover:bg-[#235c43] text-white py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-40 transition-all shadow-md shadow-[#2D6A4F]/20"
          >
            Submit Jawaban ({Object.keys(answers).length}/{quizzes.length} dijawab)
          </button>
        </div>
      )}
    </div>
  )
}