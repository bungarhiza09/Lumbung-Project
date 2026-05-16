import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}