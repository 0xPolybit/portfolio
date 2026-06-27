import { useEffect, useRef, useState } from 'react'
import {
  FiVolume2,
  FiVolumeX,
  FiUser,
  FiBriefcase,
  FiFolder,
  FiMail,
  FiGithub,
  FiLinkedin,
} from 'react-icons/fi'
import './App.css'

function App() {
  const sectionsRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeSection, setActiveSection] = useState(0) // 0: About, 1: Experience, 2: Projects, 3: Contact

  useEffect(() => {
    // create audio element that points to public/pronounciation.mp3
    const audio = new Audio('/pronounciation.mp3')
    audio.preload = 'metadata'
    audioRef.current = audio

    // Drive isPlaying from the audio element so it stays the source of truth
    const onPlay = () => setIsPlaying(true)
    const onStop = () => setIsPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onStop)
    audio.addEventListener('ended', onStop)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onStop)
      audio.removeEventListener('ended', onStop)
      audio.pause()
      audioRef.current = null
    }
  }, [])

  // Handle section navigation with smooth animation.
  // The actual translate (and its vh/dvh fallback) lives in CSS; we just
  // expose the active index so the math works on any viewport-height unit.
  const navigateToSection = (sectionIndex: number) => {
    setActiveSection(sectionIndex)
    sectionsRef.current?.style.setProperty('--active-section', String(sectionIndex))
  }

  return (
    <div className="app-container">
      <DotGrid />

      {/* Navigation */}
      <NavigationButtons activeSection={activeSection} onNavigate={navigateToSection} />

      {/* Sections Container */}
      <div ref={sectionsRef} className="sections-container">
        <AboutSection audioRef={audioRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        <ExperienceSection />
        <ProjectsSection />
        <ContactSection />
      </div>
    </div>
  )
}

// Animated dot-grid background. Dots brighten as the cursor nears (spotlight)
// and are pushed away from it (warp). Rendered on a canvas so each dot can move
// independently — something the old CSS gradient grid couldn't do.
function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DOT_RADIUS = 1.3 // base dot size in px
    const REPEL_RADIUS = 130 // how close the cursor must be to push a dot
    const REPEL_STRENGTH = 30 // max distance a dot is pushed, in px
    const SPOTLIGHT_RADIUS = 220 // how far the cursor brightens dots
    const BASE_ALPHA = 0.12 // resting dot opacity
    const HOVER_ALPHA = 0.65 // dot opacity right under the cursor
    const EASE = 0.12 // how quickly the warp follows the cursor (0-1)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let spacing = 32
    let raf = 0
    let running = false
    const mouse = { x: -9999, y: -9999 } // raw cursor target
    const eased = { x: -9999, y: -9999 } // smoothed position that drives the warp

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const cols = Math.ceil(width / spacing) + 1
      const rows = Math.ceil(height / spacing) + 1

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const gx = i * spacing
          const gy = j * spacing
          const dx = gx - eased.x
          const dy = gy - eased.y
          const dist = Math.hypot(dx, dy)

          let x = gx
          let y = gy
          let alpha = BASE_ALPHA

          if (dist < REPEL_RADIUS && dist > 0.001) {
            const t = 1 - dist / REPEL_RADIUS
            const push = t * t * REPEL_STRENGTH // ease-in falloff for an organic bulge
            x += (dx / dist) * push
            y += (dy / dist) * push
          }
          if (dist < SPOTLIGHT_RADIUS) {
            alpha = BASE_ALPHA + (1 - dist / SPOTLIGHT_RADIUS) * (HOVER_ALPHA - BASE_ALPHA)
          }

          ctx.beginPath()
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
          ctx.fill()
        }
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      spacing = width < 768 ? 24 : 32
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!running) draw()
    }

    const render = () => {
      eased.x += (mouse.x - eased.x) * EASE
      eased.y += (mouse.y - eased.y) * EASE
      draw()

      // When the cursor has left and the warp has glided off-screen, the grid is
      // back at rest — stop the loop until the next interaction to save battery.
      const offscreen =
        eased.x < -REPEL_RADIUS ||
        eased.x > width + REPEL_RADIUS ||
        eased.y < -REPEL_RADIUS ||
        eased.y > height + REPEL_RADIUS
      if (mouse.x < -9000 && offscreen) {
        running = false
        return
      }
      raf = requestAnimationFrame(render)
    }

    const start = () => {
      if (!running) {
        running = true
        raf = requestAnimationFrame(render)
      }
    }

    const onMove = (e: MouseEvent) => {
      // Snap on first entry so the warp doesn't sweep in from off-screen.
      if (mouse.x < -9000) {
        eased.x = e.clientX
        eased.y = e.clientY
      }
      mouse.x = e.clientX
      mouse.y = e.clientY
      start()
    }

    const onOut = (e: MouseEvent) => {
      // relatedTarget is null only when the cursor actually leaves the window.
      if (!e.relatedTarget) {
        mouse.x = -9999
        mouse.y = -9999
        start()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    if (!reduceMotion) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseout', onOut)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onOut)
    }
  }, [])

  return <canvas ref={canvasRef} className="grid-background" aria-hidden="true" />
}

function USFlag() {
  return (
    <svg
      width="28"
      height="20"
      viewBox="0 0 19 12"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="19" height="14" fill="#b22234" />
      <g fill="#fff">
        <rect y="1" width="19" height="1" />
        <rect y="3" width="19" height="1" />
        <rect y="5" width="19" height="1" />
        <rect y="7" width="19" height="1" />
        <rect y="9" width="19" height="1" />
        <rect y="11" width="19" height="1" />
      </g>
      <rect x="-1" width="10" height="7" fill="#3c3b6e" />
    </svg>
  )
}

function INFlag() {
  return (
    <svg
      width="28"
      height="20"
      viewBox="0 0 24 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="16" fill="#ff9933" />
      <rect y="5.33" width="24" height="5.34" fill="#fff" />
      <rect y="10.66" width="24" height="5.34" fill="#138808" />
      <circle cx="12" cy="8" r="2.5" fill="#000080" />
      <circle cx="12" cy="8" r="1.5" fill="#fff" />
      <circle cx="12" cy="8" r="1" fill="#000080" />
    </svg>
  )
}

function FlagsAndAddresses() {
  const [selected, setSelected] = useState<'us' | 'in' | null>('us')

  return (
    <div className="inline-row" role="group" aria-label="Country addresses">
      {/* US Flag */}
      <button
        className={`flag-btn ${selected === 'us' ? 'active' : ''}`}
        onClick={() => setSelected('us')}
        aria-pressed={selected === 'us'}
        aria-label="Show United States address"
        title="Show United States address"
      >
        <USFlag />
      </button>

      {/* US Address box - expands when selected */}
      <div
        className={`addr-box us ${selected === 'us' ? 'expanded animate-in-left' : 'collapsed'}`}
        role="region"
        aria-label="US address"
        aria-hidden={selected !== 'us'}
      >
        <div className="addr-text">Wilmington, Delaware, United States</div>
      </div>

      {/* India Flag */}
      <button
        className={`flag-btn ${selected === 'in' ? 'active' : ''}`}
        onClick={() => setSelected('in')}
        aria-pressed={selected === 'in'}
        aria-label="Show India address"
        title="Show India address"
      >
        <INFlag />
      </button>

      {/* India Address box - expands when selected */}
      <div
        className={`addr-box in ${selected === 'in' ? 'expanded animate-in-right' : 'collapsed'}`}
        role="region"
        aria-label="India address"
        aria-hidden={selected !== 'in'}
      >
        <div className="addr-text">Kolkata, West Bengal, India</div>
      </div>
    </div>
  )
}

// Navigation Buttons Component
function NavigationButtons({
  activeSection,
  onNavigate,
}: {
  activeSection: number
  onNavigate: (index: number) => void
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const navItems = [
    { icon: FiUser, label: 'About', index: 0 },
    { icon: FiBriefcase, label: 'Experience', index: 1 },
    { icon: FiFolder, label: 'Projects', index: 2 },
    { icon: FiMail, label: 'Contact', index: 3 },
  ]

  return (
    <nav className="navigation" role="navigation" aria-label="Page sections">
      {navItems.map((item) => (
        <div key={item.index} className="nav-item-container">
          {hoveredIndex === item.index && <div className="nav-label">{item.label}</div>}
          <button
            className={`nav-btn ${activeSection === item.index ? 'active' : ''}`}
            onClick={() => onNavigate(item.index)}
            onMouseEnter={() => setHoveredIndex(item.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            aria-label={`Navigate to ${item.label} section`}
            aria-pressed={activeSection === item.index}
          >
            <item.icon size={20} />
          </button>
        </div>
      ))}
    </nav>
  )
}

// About Section (contains the original content)
function AboutSection({
  audioRef,
  isPlaying,
  setIsPlaying,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
}) {
  return (
    <section className="section about-section">
      <div className="content">
        <div className="title-block">
          <h1 className="name-heading">
            SWASTIK
            <span className="name-row">
              BISWAS
              <button
                className={'audio-btn ' + (isPlaying ? 'playing' : '')}
                onClick={() => {
                  const audio = audioRef.current
                  if (!audio) return
                  if (isPlaying) {
                    audio.pause()
                  } else {
                    audio.play().catch(() => setIsPlaying(false))
                  }
                }}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pause pronunciation' : 'Play pronunciation'}
                title={isPlaying ? 'Pause pronunciation' : 'Play pronunciation'}
              >
                {isPlaying ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
              </button>
            </span>
          </h1>
        </div>
        <p className="subtitle">
          KIIT University, Class of 2028
          <br />
          B.Tech, Computer Science and Engineering
        </p>
        <FlagsAndAddresses />
        <p className="subtitle">
          Interested in <span className="highlight">Data Science</span>,{' '}
          <span className="highlight">Machine Learning</span>
        </p>
      </div>
    </section>
  )
}

// Experience Section
const experiences = [
  {
    role: 'Artificial Intelligence Intern',
    company: 'Exavalu',
    type: 'Internship',
    period: 'May 2026 – Jun 2026',
    location: 'Kolkata, West Bengal, India · Hybrid',
    skills: ['Artificial Intelligence', 'Engineering'],
  },
  {
    role: 'Artificial Intelligence Intern',
    company: 'Indian Statistical Institute, Kolkata',
    type: 'Internship',
    period: 'Apr 2026 – Jun 2026',
    location: 'Kolkata, West Bengal, India · Remote',
    skills: ['Artificial Intelligence', 'Python'],
  },
]

function ExperienceSection() {
  return (
    <section className="section experience-section">
      <div className="content">
        <h2>Experience</h2>
        <ul className="experience-list">
          {experiences.map((exp) => (
            <li key={`${exp.role}-${exp.company}`} className="experience-item">
              <div className="experience-head">
                <h3 className="experience-role">{exp.role}</h3>
                <span className="experience-period">{exp.period}</span>
              </div>
              <p className="experience-company">
                {exp.company} · {exp.type}
              </p>
              <p className="experience-location">{exp.location}</p>
              <ul className="experience-skills">
                {exp.skills.map((skill) => (
                  <li key={skill} className="skill-tag">
                    {skill}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// Projects Section (blank for now)
function ProjectsSection() {
  return (
    <section className="section projects-section">
      <div className="content">
        <h2>Projects</h2>
        <p>Coming soon...</p>
      </div>
    </section>
  )
}

// Contact Section
const contactLinks = [
  {
    icon: FiMail,
    label: 'swastikbiswas962@gmail.com',
    href: 'mailto:swastikbiswas962@gmail.com',
    external: false,
  },
  {
    icon: FiGithub,
    label: 'github.com/0xPolybit',
    href: 'https://github.com/0xPolybit',
    external: true,
  },
  {
    icon: FiLinkedin,
    label: 'linkedin.com/in/polybit',
    href: 'https://www.linkedin.com/in/polybit/',
    external: true,
  },
]

function ContactSection() {
  return (
    <section className="section contact-section">
      <div className="content">
        <h2>Contact</h2>
        <p className="contact-intro">
          Open to internships and collaboration — let's build something.
        </p>
        <ul className="contact-list">
          {contactLinks.map((link) => (
            <li key={link.href}>
              <a
                className="contact-link"
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              >
                <link.icon size={20} aria-hidden="true" />
                <span>{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default App
