import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchCategories();
    fetchPosts();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  async function fetchCategories() {
    const { data } = await supabase.from("forum_categories").select("*");
    setCategories(data || []);
  }

  async function fetchPosts() {
    setLoading(true);
    let query = supabase
      .from("forum_posts")
      .select("*, forum_categories(name, icon)")
      .order("created_at", { ascending: false });

    if (activeCategory) query = query.eq("category_id", activeCategory);

    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  }

  async function submitPost() {
    if (!title.trim() || !content.trim() || !user) return;

    await supabase.from("forum_posts").insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      category_id: categoryId || null,
    });

    setTitle(""); setContent(""); setCategoryId("");
    setShowForm(false);
    fetchPosts();
  }

  async function toggleLike(post) {
    if (!user) return;

    const { data: existing } = await supabase.from("forum_likes")
      .select("id")
      .match({ post_id: post.id, user_id: user.id })
      .single();

    if (existing) {
      await supabase.from("forum_likes").delete().eq("id", existing.id);
      await supabase.from("forum_posts").update({ likes_count: Math.max(0, post.likes_count - 1) }).eq("id", post.id);
    } else {
      await supabase.from("forum_likes").insert({ post_id: post.id, user_id: user.id });
      await supabase.from("forum_posts").update({ likes_count: post.likes_count + 1 }).eq("id", post.id);
    }
    fetchPosts();
  }

  if (selected) return (
    <PostDetail
      post={selected}
      user={user}
      onBack={() => { setSelected(null); fetchPosts(); }}
    />
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{posts.length} diskusi</p>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-full"
          >
            + Tanya
          </button>
        )}
      </div>

      {/* Form Post Baru */}
      {showForm && (
        <div className="border rounded-xl p-4 mb-4 bg-blue-50">
          <p className="text-sm font-medium mb-3">Buat Pertanyaan Baru</p>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2 bg-white"
          >
            <option value="">Pilih kategori (opsional)</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul pertanyaan..."
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ceritakan lebih detail..."
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={submitPost}
              disabled={!title.trim() || !content.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-40">
              Kirim Pertanyaan
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 text-sm text-gray-500 border rounded-lg">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => setActiveCategory(null)}
          className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition
            ${!activeCategory ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
          Semua
        </button>
        {categories.map(c => (
          <button key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition
              ${activeCategory === c.id ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full mb-1" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">💬</p>
          <p className="text-gray-400 text-sm">Belum ada diskusi. Jadilah yang pertama!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="border rounded-xl p-4 cursor-pointer hover:shadow-md transition"
              onClick={() => setSelected(post)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {post.forum_categories && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mb-2 inline-block">
                      {post.forum_categories.icon} {post.forum_categories.name}
                    </span>
                  )}
                  <p className="text-sm font-medium leading-tight">{post.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                </div>
                {post.is_expert_answered && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
                    ✅ Ahli
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(post); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1">
                  ❤️ {post.likes_count}
                </button>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  💬 {post.comments_count}
                </span>
                <span className="text-xs text-gray-300 ml-auto">
                  {new Date(post.created_at).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostDetail({ post, user, onBack }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    supabase.from("forum_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at")
      .then(({ data }) => setComments(data || []));
  }, []);

  async function submitComment() {
    if (!newComment.trim() || !user) return

    await supabase.from('forum_comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim(),
    })

    // Hitung ulang jumlah komentar dari database
    const { count } = await supabase
      .from('forum_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)

    await supabase.from('forum_posts')
      .update({ comments_count: count })
      .eq('id', post.id)

    // Refresh komentar
    const { data } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at')

    setComments(data || [])
    setNewComment('')
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-blue-600 mb-4">← Kembali</button>

      <div className="border rounded-xl p-4 mb-4">
        <p className="text-base font-semibold">{post.title}</p>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{post.content}</p>
        <p className="text-xs text-gray-400 mt-3">
          {new Date(post.created_at).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}
        </p>
      </div>

      <p className="text-xs font-medium text-gray-500 mb-3">{comments.length} KOMENTAR</p>

      <div className="space-y-3 mb-4">
        {comments.map(c => (
          <div key={c.id} className={`rounded-xl p-3 text-sm ${c.is_expert ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}>
            {c.is_expert && <p className="text-xs text-green-600 font-medium mb-1">👨‍⚕️ Ahli Gizi</p>}
            <p className="text-gray-700 leading-relaxed">{c.content}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(c.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
        ))}
      </div>

      {user && (
        <div className="border-t pt-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tulis komentar atau pengalaman kamu..."
            rows={3}
            className="w-full border rounded-xl px-3 py-2 text-sm mb-2 resize-none"
          />
          <button
            onClick={submitComment}
            disabled={!newComment.trim()}
            className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm disabled:opacity-40"
          >
            Kirim Komentar
          </button>
        </div>
      )}
    </div>
  );
}