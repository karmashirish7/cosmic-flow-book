import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import ExploreView from '@/components/explore/ExploreView'

export default function Explore() {
  useEffect(() => {
    document.documentElement.classList.add('theme-astrokarmaz')
    document.title = 'Explore the Sky · Astrokarmaz'
    return () => document.documentElement.classList.remove('theme-astrokarmaz')
  }, [])

  return (
    <div className="min-h-screen bg-cosmic">
      <Navbar />
      <div className="h-24 md:h-32" />

      <main className="px-3 sm:px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to consultations
          </Link>

          <div className="text-center mb-6 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3">
              Explore the <span className="gradient-gold-text">Sky</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Where the grahas are right now, on the sidereal zodiac. Switch between the Vedic (Earth-centred)
              and the Sun-centred view, follow Rahu and Ketu, and scrub through time.
            </p>
            <div className="constellation-line w-24 mx-auto mt-4" />
          </div>

          <ExploreView />

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Drag to rotate, scroll or pinch to zoom, tap a graha or node for details. Positions from astronomy-engine,
            sidereal by True Chitra Paksha ayanamsa (as in your Kundli). Distances and sizes are compressed so every
            graha stays visible.
          </p>
        </div>
      </main>
    </div>
  )
}
