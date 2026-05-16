import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Layout from "../../components/Layout";

export default function DaftarWarung() {
  const [warung, setWarung] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWarung();
  }, []);

  async function fetchWarung() {
    const { data, error } = await supabase
      .from('warung_profiles')
      .select(`
        *,
        user:profiles!warung_profiles_user_id_fkey(
          nama,
          kota,
          kabupaten
        )
      `)
      .order('total_donasi', { ascending: false })

    console.log(data)
    console.log(error)

    setWarung(data || [])
    setLoading(false)
  }

  const filtered = warung.filter(
    (w) =>
      !search ||
      w.nama_warung?.toLowerCase().includes(search.toLowerCase()) ||
      w.jenis_makanan?.toLowerCase().includes(search.toLowerCase()) ||
      w.user?.kota?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout>
      <div className="w-full px-4">
        {/* Header */}
        <div className="mb-5">
          <Link
            to="/food-rescue"
            className="text-sm text-[#2D6A4F] font-medium flex items-center gap-1 mb-3"
          >
            ← Kembali
          </Link>
          <h1 className="text-2xl font-bold text-[#1a3a2a]">
            🏪 Daftar Warung
          </h1>
          <p className="text-sm text-[#7a8a7a] mt-1">
            Warung mitra donasi makanan di sekitarmu
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama warung, jenis makanan, kota..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          />
          <span className="absolute left-3.5 top-3.5 text-[#9a9a8a] text-sm">
            🔍
          </span>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 animate-bounce">🏪</div>
            <p className="text-sm text-[#9a9a8a]">Memuat daftar warung...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#e8e4db]">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-sm font-semibold text-[#4a4a3a]">
              Warung tidak ditemukan
            </p>
            <p className="text-xs text-[#9a9a8a] mt-1">Coba kata kunci lain</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((w) => (
            <Link
              key={w.id}
              to={`/warung/${w.id}`}
              className="bg-white rounded-2xl border border-[#e8e4db] p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
            >
              {/* Foto / Avatar */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-[#fef3e7] flex items-center justify-center">
                {w.foto_url ? (
                  <img
                    src={w.foto_url}
                    alt={w.nama_warung}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">🍜</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[#1a3a2a] truncate">
                    {w.nama_warung}
                  </p>
                  {w.is_verified && (
                    <span className="text-xs bg-[#f0faf4] text-[#2D6A4F] border border-[#b7e4cc] px-1.5 py-0.5 rounded-full flex-shrink-0">
                      ✅ Verified
                    </span>
                  )}
                </div>

                {w.jenis_makanan && (
                  <p className="text-xs text-[#7a8a7a] truncate">
                    {w.jenis_makanan}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1.5">
                  {w.user?.kota && (
                    <span className="text-[10px] text-[#9a9a8a] flex items-center gap-0.5">
                      📍 {w.user.kota}
                    </span>
                  )}
                  <span className="text-[10px] text-[#9a9a8a]">
                    📤 {w.total_donasi || 0} donasi
                  </span>
                  {w.rating_avg > 0 && (
                    <span className="text-[10px] text-[#9a9a8a]">
                      ⭐ {w.rating_avg?.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[#9a9a8a] text-lg flex-shrink-0">›</span>
            </Link>
          ))}
        </div>

        <div className="h-6" />
      </div>
    </Layout>
  );
}
