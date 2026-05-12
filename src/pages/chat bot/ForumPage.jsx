import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function ForumPage() {
  const { profile, user } = useAuth()
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState(new Set())

  useEffect(() => {
    fetchCategories()
    fetchPosts()
    if (user) fetchMyLikes()
  }, [])

  useEffect(() => { fetchPosts() }, [activeCategory])

  async function fetchCategories() {
    const { data } = await supabase.from('forum_categories').select('*')
    setCategories(data || [])
  }

  async function fetchPosts() {
    setLoading(true)
    let query = supabase
      .from('forum_posts')
      .select(`*, forum_categories(name, icon)`)
      .order('created_at', { ascending: false })
    if (activeCategory) query = query.eq('category_id', activeCategory)
    
    const { data, error } = await query
    
    if (error) {
      console.error('Forum error:', error)
      setLoading(false)
      return
    }

    // Ambil profil user secara terpisah
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nama, avatar_url')
        .in('id', userIds)

      const profileMap = {}
      profiles?.forEach(p => { profileMap[p.id] = p })

      const postsWithProfile = data.map(post => ({
        ...post,
        profiles: profileMap[post.user_id] || null
      }))
      setPosts(postsWithProfile)
    } else {
      setPosts([])
    }
    setLoading(false)
  }

  async function fetchMyLikes() {
    const { data } = await supabase
      .from('forum_likes')
      .select('post_id')
      .eq('user_id', user.id)
    setLikedPosts(new Set(data?.map(l => l.post_id) || []))
  }

  async function toggleLike(post) {
    if (!user) return
    const isLiked = likedPosts.has(post.id)
    if (isLiked) {
      await supabase.from('forum_likes').delete().match({ post_id: post.id, user_id: user.id })
      setLikedPosts(prev => { const s = new Set(prev); s.delete(post.id); return s })
    } else {
      await supabase.from('forum_likes').insert({ post_id: post.id, user_id: user.id })
      setLikedPosts(prev => new Set([...prev, post.id]))
    }
    // Trigger otomatis update likes_count via DB trigger
    fetchPosts()
  }

  if (selected) return (
    <PostDetail post={selected} currentUser={user} currentProfile={profile}
      onBack={() => { setSelected(null); fetchPosts() }} />
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="bg-[#f0faf4] rounded-2xl p-3 flex-1 border border-[#b7e4cc] mr-2">
          <p className="text-xs font-semibold text-[#2D6A4F] mb-0.5">👥 Forum Komunitas</p>
          <p className="text-xs text-[#5a7a6a]">Diskusi dan tanya jawab seputar gizi.</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex-shrink-0 bg-[#2D6A4F] text-white text-xs font-semibold px-3 py-2 rounded-2xl flex items-center gap-1">
            <span className="text-base">+</span> Tanya
          </button>
        )}
      </div>

      {showForm && (
        <TambahPostForm
          categories={categories}
          user={user}
          profile={profile}
          onSuccess={() => { setShowForm(false); fetchPosts() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button onClick={() => setActiveCategory(null)}
          className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border font-medium transition-all ${
            !activeCategory ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-[#4a4a3a] border-[#e8e4db]'
          }`}>Semua</button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border font-medium transition-all ${
              activeCategory === c.id ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-[#4a4a3a] border-[#e8e4db]'
            }`}>{c.icon} {c.name}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="border border-[#e8e4db] rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#f0ece4]" />
                <div className="h-3 bg-[#f0ece4] rounded w-1/3" />
              </div>
              <div className="h-4 bg-[#f0ece4] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#f0ece4] rounded w-full" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-2">💬</p>
          <p className="text-sm font-medium text-[#4a4a3a]">Belum ada diskusi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const isLiked = likedPosts.has(post.id)
            const authorName = post.profiles?.nama || 'Pengguna'
            const authorAvatar = post.profiles?.avatar_url

            return (
              <div key={post.id} className="border border-[#e8e4db] rounded-2xl p-4 bg-white hover:shadow-sm transition-all">
                {/* Author info */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                    {authorAvatar
                      ? <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                      : authorName[0]?.toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1a3a2a]">{authorName}</p>
                    <p className="text-xs text-[#9a9a8a]">
                      {new Date(post.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                  {post.forum_categories && (
                    <span className="ml-auto text-xs bg-[#f0faf4] text-[#2D6A4F] border border-[#b7e4cc] px-2 py-0.5 rounded-full">
                      {post.forum_categories.icon} {post.forum_categories.name}
                    </span>
                  )}
                </div>

                {/* Konten */}
                <div onClick={() => setSelected(post)} className="cursor-pointer">
                  <p className="text-sm font-semibold text-[#1a3a2a] mb-1">{post.title}</p>
                  <p className="text-xs text-[#7a8a7a] line-clamp-2 leading-relaxed">{post.content}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f0ece4]">
                  <button onClick={() => toggleLike(post)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
                      isLiked ? 'text-red-500' : 'text-[#9a9a8a] hover:text-red-400'
                    }`}>
                    {isLiked ? '❤️' : '🤍'} {post.likes_count || 0}
                  </button>
                  <button onClick={() => setSelected(post)}
                    className="flex items-center gap-1.5 text-xs text-[#9a9a8a] hover:text-[#2D6A4F] transition-all">
                    💬 {post.comments_count || 0} komentar
                  </button>
                  {post.is_expert_answered && (
                    <span className="ml-auto text-xs bg-[#f0faf4] text-[#2D6A4F] border border-[#b7e4cc] px-2 py-0.5 rounded-full">
                      ✅ Dijawab Ahli
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TambahPostForm({ categories, user, profile, onSuccess, onCancel }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return
    setLoading(true)
    await supabase.from('forum_posts').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      category_id: categoryId || null,
      author_name: profile?.nama,
      author_avatar: profile?.avatar_url,
    })
    setLoading(false)
    onSuccess()
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 transition-all"

  return (
    <div className="border border-[#b7e4cc] bg-[#f0faf4] rounded-2xl p-4 mb-4">
      <p className="text-sm font-semibold text-[#1a3a2a] mb-3">Buat Pertanyaan Baru</p>
      <div className="space-y-3">
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
          <option value="">Pilih kategori (opsional)</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Judul pertanyaan *" className={inputClass} />
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Ceritakan lebih detail..." rows={3} className={inputClass + ' resize-none'} />
        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={loading || !title.trim() || !content.trim()}
            className="flex-1 bg-[#2D6A4F] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40">
            {loading ? 'Mengirim...' : 'Kirim Pertanyaan'}
          </button>
          <button onClick={onCancel}
            className="px-4 text-sm text-[#4a4a3a] border border-[#e8e4db] rounded-xl hover:bg-white transition-all">
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}

function PostDetail({ post, currentUser, currentProfile, onBack }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchComments() }, [])

  async function fetchComments() {
    const { data } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nama, avatar_url')
        .in('id', userIds)

      const profileMap = {}
      profiles?.forEach(p => { profileMap[p.id] = p })

      setComments(data.map(c => ({
        ...c,
        profiles: profileMap[c.user_id] || null
      })))
    } else {
      setComments([])
    }
  }

  async function submitComment() {
    if (!newComment.trim() || !currentUser) return
    setLoading(true)
    await supabase.from('forum_comments').insert({
      post_id: post.id,
      user_id: currentUser.id,
      content: newComment.trim(),
      author_name: currentProfile?.nama,
      author_avatar: currentProfile?.avatar_url,
    })
    setNewComment('')
    fetchComments()
    setLoading(false)
  }

  const postAuthorName = post.profiles?.nama || 'Pengguna'
  const postAuthorAvatar = post.profiles?.avatar_url

  return (
    <div>
      <button onClick={onBack} className="text-sm text-[#2D6A4F] font-medium mb-4">← Kembali ke Forum</button>

      {/* Post */}
      <div className="border border-[#e8e4db] rounded-2xl p-4 mb-4 bg-white">
        {/* Author post */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
            {postAuthorAvatar
              ? <img src={postAuthorAvatar} className="w-full h-full object-cover" alt={postAuthorName} />
              : postAuthorName[0]?.toUpperCase()
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a3a2a]">{postAuthorName}</p>
            <p className="text-xs text-[#9a9a8a]">
              {new Date(post.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
        </div>
        <p className="text-base font-bold text-[#1a3a2a] mb-2">{post.title}</p>
        <p className="text-sm text-[#4a4a3a] leading-relaxed">{post.content}</p>
      </div>

      {/* Comments */}
      <p className="text-xs font-semibold text-[#9a9a8a] mb-3">{comments.length} KOMENTAR</p>
      <div className="space-y-3 mb-4">
        {comments.map(c => {
          const cName = c.profiles?.nama || c.author_name || 'Pengguna'
          const cAvatar = c.profiles?.avatar_url || c.author_avatar

          return (
            <div key={c.id} className={`rounded-2xl p-3 ${c.is_expert ? 'bg-[#f0faf4] border border-[#b7e4cc]' : 'bg-[#faf9f7] border border-[#f0ece4]'}`}>
              {/* Author komentar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                  {cAvatar
                    ? <img src={cAvatar} className="w-full h-full object-cover" alt={cName} />
                    : cName[0]?.toUpperCase()
                  }
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1a3a2a]">
                    {cName}
                    {c.is_expert && <span className="ml-1 text-xs bg-[#2D6A4F] text-white px-1.5 py-0.5 rounded-full">Ahli Gizi</span>}
                  </p>
                  <p className="text-xs text-[#9a9a8a]">
                    {new Date(c.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#4a4a3a] leading-relaxed">{c.content}</p>
            </div>
          )
        })}

        {comments.length === 0 && (
          <p className="text-center text-xs text-[#9a9a8a] py-4">Belum ada komentar. Jadilah yang pertama!</p>
        )}
      </div>

      {/* Input Komentar */}
      {currentUser ? (
        <div className="border-t border-[#f0ece4] pt-4">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 overflow-hidden">
              {currentProfile?.avatar_url
                ? <img src={currentProfile.avatar_url} className="w-full h-full object-cover" />
                : currentProfile?.nama?.[0]?.toUpperCase() || 'U'
              }
            </div>
            <div className="flex-1">
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Tulis komentar..." rows={2}
                className="w-full border border-[#e8e4db] rounded-2xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all" />
              <button onClick={submitComment} disabled={!newComment.trim() || loading}
                className="mt-2 bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all">
                {loading ? 'Mengirim...' : 'Kirim Komentar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-[#9a9a8a] pt-4 border-t border-[#f0ece4]">
          Login untuk berkomentar
        </p>
      )}
    </div>
  )
}