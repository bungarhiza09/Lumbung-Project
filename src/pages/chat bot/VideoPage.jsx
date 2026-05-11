import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["Semua", "MPASI", "Balita", "Ibu Hamil", "Lansia", "Kader Posyandu"];

function getYoutubeId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

export default function VideoPage() {
  const [videos, setVideos] = useState([]);
  const [category, setCategory] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [category]);

  async function fetchVideos() {
    setLoading(true);
    let query = supabase.from("education_videos").select("*");
    if (category !== "Semua") query = query.eq("category", category);
    const { data } = await query.order("created_at", { ascending: false });
    setVideos(data || []);
    setLoading(false);
  }

  return (
    <div>
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-all
              ${category === c
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Video Player */}
      {selected && (
        <div className="mb-4">
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${getYoutubeId(selected.youtube_url)}`}
              title={selected.title}
              allowFullScreen
            />
          </div>
          <div className="mt-3">
            <h3 className="font-semibold text-sm">{selected.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{selected.expert_name} · {selected.expert_title}</p>
            <p className="text-xs text-gray-600 mt-2">{selected.description}</p>
          </div>
          <hr className="my-4" />
          <p className="text-xs font-medium text-gray-500 mb-3">VIDEO LAINNYA</p>
        </div>
      )}

      {/* Video List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-32 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🎬</p>
          <p className="text-gray-400 text-sm">Belum ada video di kategori ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => {
            const ytId = getYoutubeId(v.youtube_url);
            return (
              <div key={v.id} onClick={() => setSelected(v)}
                className={`flex gap-3 cursor-pointer rounded-xl p-2 transition ${selected?.id === v.id ? "bg-purple-50 border border-purple-200" : "hover:bg-gray-50"}`}>
                <img
                  src={v.thumbnail_url || `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                  alt={v.title}
                  className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 leading-tight">{v.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{v.expert_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{v.category}</span>
                    {v.duration_minutes && (
                      <span className="text-xs text-gray-400">⏱ {v.duration_minutes} menit</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}