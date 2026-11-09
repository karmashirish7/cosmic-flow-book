import { useEffect } from 'react'
import { BookOpen } from 'lucide-react'

// Private reading list. Not linked from anywhere on the site and marked noindex;
// reachable only by typing /books. Each book is a static page in public/books/.
interface Book {
  title: string
  original: string
  subtitle: string
  description: string
  href: string
}

const BOOKS: Book[] = [
  {
    title: 'Laghu Parashari Made Plain',
    original: 'लघुपाराशरी · मध्यपाराशरी',
    subtitle: "Based on Pt. Sitaram Jha's commentary, Tattvārtha Prakāśikā",
    description:
      'A chapter-by-chapter plain-English rewrite of the Laghu and Madhya Parashari: good and bad lords, yogas, longevity and marakas, and how dashas give results. Each rule is restated, shown in an example, and worked through famous charts.',
    href: '/books/laghu-parashari.html',
  },
  {
    title: 'Navamsha Made Plain',
    original: 'नवांश · D9 · the chart of fortune',
    subtitle: 'Study notes from the Astro IITians “नवांशा” lecture series',
    description:
      'The D9 read one sign at a time, Aries to Pisces: core traits, every planet, all twelve houses and source signs, with remedies and worked examples. Includes a Navamsha calculator, the 108-pada map, and a tool that reads your own D9.',
    href: '/books/navamsha.html',
  },
]

const Books = () => {
  useEffect(() => {
    document.documentElement.classList.add('theme-astrokarmaz')
    document.title = 'Books · Astrokarmaz'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    return () => {
      document.documentElement.classList.remove('theme-astrokarmaz')
      robots.remove()
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-gold">Books</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {BOOKS.length} {BOOKS.length === 1 ? 'book' : 'books'}
        </p>

        <ol className="mt-8 space-y-4">
          {BOOKS.map((book, i) => (
            <li key={book.href}>
              {/* Plain <a>: books are standalone HTML pages, not app routes. */}
              <a
                href={book.href}
                className="group flex gap-4 rounded-xl border border-border/50 bg-card/60 p-5 transition-colors hover:border-primary/60"
              >
                <span className="mt-1 font-mono text-sm text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-xl font-semibold text-foreground group-hover:text-gold">
                    {book.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-gold-light">{book.original}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{book.subtitle}</p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">{book.description}</p>
                </div>
                <BookOpen className="mt-1 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-gold" />
              </a>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}

export default Books
