import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#e8e4db] mt-10">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Top */}
        <div className="grid md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white text-lg shadow-md">
                🌾
              </div>

              <div>
                <h2 className="font-bold text-[#1a3a2a]">
                  Lumbung
                </h2>
                <p className="text-xs text-[#7a8a7a]">
                  Food Rescue Platform
                </p>
              </div>
            </div>

            <p className="text-sm text-[#7a8a7a] leading-relaxed">
              Platform digital untuk membantu distribusi makanan,
              mengurangi food waste, dan meningkatkan kepedulian sosial masyarakat.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-[#1a3a2a] mb-3">
              Navigasi
            </h3>

            <div className="flex flex-col gap-2 text-sm">
              <Link
                to="/"
                className="text-[#7a8a7a] hover:text-[#2D6A4F] transition-colors"
              >
                Beranda
              </Link>

              <Link
                to="/food-rescue"
                className="text-[#7a8a7a] hover:text-[#2D6A4F] transition-colors"
              >
                Food Rescue
              </Link>

              <Link
                to="/nutrisi-ai"
                className="text-[#7a8a7a] hover:text-[#2D6A4F] transition-colors"
              >
                AI Nutrisi
              </Link>

              <Link
                to="/gamifikasi"
                className="text-[#7a8a7a] hover:text-[#2D6A4F] transition-colors"
              >
                Gamifikasi
              </Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-[#1a3a2a] mb-3">
              Tentang
            </h3>

            <div className="space-y-2 text-sm text-[#7a8a7a]">
              <p>
                🍱 Mendukung gerakan food rescue
              </p>

              <p>
                🤖 AI analisis gizi makanan
              </p>

              <p>
                👨‍👩‍👧 Kolaborasi keluarga, warung & kader
              </p>

              <p>
                🌱 Mengurangi limbah makanan
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-5 border-t border-[#e8e4db] flex flex-col md:flex-row items-center justify-between gap-3">

          <p className="text-xs text-[#9a9a8a] text-center md:text-left">
            © {new Date().getFullYear()} Lumbung Project · Dibuat untuk membantu distribusi pangan masyarakat.
          </p>

          <div className="flex items-center gap-3 text-xs text-[#9a9a8a]">
            <span className="bg-[#f0faf4] text-[#2D6A4F] px-2 py-1 rounded-full border border-[#b7e4cc]">
              🌾 Sustainable
            </span>

            <span className="bg-[#fef3e7] text-[#d4720a] px-2 py-1 rounded-full border border-[#f9d4a7]">
              🍱 Food Rescue
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}