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
              The sky above you right now: the grahas, Rahu and Ketu on the sidereal zodiac, and the real stars of
              the nakshatras. Look up from the ground in Earth view, or zoom out to the Sky view to see the Earth from
              outside, with a line from Earth through each graha to the constellation behind it.
            </p>
            <div className="constellation-line w-24 mx-auto mt-4" />
          </div>

          <ExploreView />

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Drag to look around, scroll or pinch to zoom, tap a graha or node for details. Positions from
            astronomy-engine, sidereal by True Chitra Paksha ayanamsa (as in your Kundli); grahas are drawn larger
            than life so they stay visible. Stars: HYG Database (CC BY-SA 4.0). Earth: NASA Visible Earth.
          </p>
        </div>
      </main>
    </div>
  )
}
