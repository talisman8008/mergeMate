import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Code, BrainCircuit, GitPullRequest, ArrowRight, Activity, Zap } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

import Aurora from '../components/ui/Aurora.jsx'
import MergeField from '../components/ui/MergeField.jsx'
import SpotlightCard from '../components/ui/SpotlightCard.jsx'
import HorizontalScroller from '../components/HorizontalScroller.jsx'

// Helper for generic fade-in
const FadeIn = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const SignalRow = ({ name, percent, score, color, delay }) => {
  return (
    <motion.div 
      className="flex items-center gap-4 md:gap-6 mb-5"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="w-[180px] md:w-[280px] font-mono text-[12px] md:text-[14px] text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">{name}</div>
      <div className="flex-1 h-[2px] bg-[var(--border)] relative overflow-hidden rounded-full">
        <motion.div 
          className="absolute top-0 left-0 h-full"
          style={{ backgroundColor: `var(${color})` }}
          initial={{ width: "0%" }}
          whileInView={{ width: `${percent}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
        />
      </div>
      <div className="w-[30px] md:w-[40px] text-right font-mono text-[12px] md:text-[14px] text-[var(--text-primary)]">{score}</div>
    </motion.div>
  )
}


export default function Home({ user, signIn, signOut }) {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const drawnY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 4500]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100])

  return (
    <div className="landing min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-body relative">
      <Navbar user={user} signIn={signIn} signOut={signOut} />

      <main className="flex-1 flex flex-col w-full relative z-10">
        
        {/* MergeField SVG lives OUTSIDE the overflow-hidden hero so lines extend through the bento grid */}
        <MergeField drawnY={drawnY} className="opacity-100 z-0" />

        <section className="relative min-h-[100vh] w-full flex flex-col items-center justify-center px-6 overflow-hidden pt-20 pb-16">
          
          {/* Architectural Diagonal Stripe Wallpaper */}
          <div 
            className="absolute inset-0 z-0 opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(-45deg, var(--border) 0, var(--border) 1px, transparent 1px, transparent 32px)',
              maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)'
            }}
          />
          
          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }}
            className="relative z-10 flex flex-col items-center lg:items-start max-w-[1000px] lg:max-w-[1200px] w-full px-4 lg:px-0"
          >
            <div className="flex flex-col lg:flex-row w-full items-center lg:items-start justify-between">
              
              {/* Left Column: Text */}
              <div className="flex flex-col items-center lg:items-start max-w-[650px] text-center lg:text-left mt-20 lg:mt-0">
                <h1 className="text-[56px] md:text-[80px] lg:text-[96px] font-display font-bold leading-[0.95] tracking-[-0.04em] text-[var(--text-primary)] mb-6">
                  <FadeIn delay={0.2} className="block">Open PRs that</FadeIn>
                  <FadeIn delay={0.3} className="block text-[var(--text-primary)]">
                    actually <span className="relative inline-block">
                      <span className="relative z-10">get merged.</span>
                      <span className="absolute bottom-2 left-0 right-0 h-4 sm:h-6 bg-[var(--accent-purple)]/40 -z-10 -rotate-1 skew-x-[-10deg] scale-105 rounded-sm"></span>
                    </span>
                  </FadeIn>
                </h1>
                
                <FadeIn delay={0.4}>
                  <p className="font-display text-[18px] md:text-[22px] text-[var(--text-faint)] max-w-[750px] mb-12 leading-relaxed">
                    Stop wasting days on ignored pull requests. FirstMerge scores repository friendliness, generates step-by-step AI roadmaps, and pre-reviews your code before you even open a PR.
                  </p>
                </FadeIn>

                <FadeIn delay={0.5} className="w-full flex justify-center lg:justify-start">
                  {user ? (
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] rounded-[8px] blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="relative bg-[var(--text-primary)] text-[var(--bg-primary)] hover:scale-105 font-display text-[16px] font-bold px-8 py-4 rounded-[6px] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 w-full sm:w-auto"
                      >
                        Go to Dashboard
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] rounded-[8px] blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
                      <button
                        onClick={signIn}
                        className="relative bg-[var(--text-primary)] text-[var(--bg-primary)] hover:scale-105 font-display text-[16px] font-bold px-8 py-4 rounded-[6px] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 w-full sm:w-auto"
                      >
                        <GitHubIcon /> Continue with GitHub
                      </button>
                    </div>
                  )}
                </FadeIn>
                
                <FadeIn delay={0.6}>
                  <p className="font-mono text-[12px] text-[var(--text-faint)] mt-8 flex items-center justify-center lg:justify-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    No credit card. No setup. Just GitHub OAuth.
                  </p>
                </FadeIn>
              </div>

              {/* Right Column Spacer (The SVG graph sits natively here in the background) */}
              <div className="hidden lg:block w-[400px] h-[600px] relative pointer-events-none" />
              
            </div>
          </motion.div>
        </section>

        {/* BENTO GRID (FEATURE SHOWCASE) */}
        <section className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-[120px]">
          <Aurora className="opacity-40" />
          
          <div className="text-center mb-20 relative z-10">
            <FadeIn>
              <h2 className="font-display text-[40px] md:text-[56px] font-bold text-[var(--text-primary)] leading-[1.1] tracking-[-0.02em]">
                Everything you need to <span className="text-[var(--accent-green)]">get merged.</span>
              </h2>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 w-full">
            
            {/* The Friendliness Score (Span 8) */}
            <SpotlightCard className="md:col-span-8 p-8 md:p-12 min-h-[400px] flex flex-col justify-center">
                <h3 className="font-display text-[32px] font-bold text-[var(--text-primary)] mb-4 leading-[1.1]">
                  The Friendliness Score
                </h3>
              <p className="text-[18px] text-[var(--text-muted)] mb-10 max-w-[500px]">
                A label is just hope. We compute a 0-100 score based on maintainer response times, PR collision counts, and actual beginner merge rates.
              </p>
              
              <div className="w-full max-w-[600px] bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border)]">
                <SignalRow name="MAINTAINER RESPONSE" percent={85} score="85" color="--accent-green" delay={0.2} />
                <SignalRow name="BEGINNER MERGE RATE" percent={73} score="73" color="--accent-blue" delay={0.3} />
                <SignalRow name="PR COLLISION COUNT" percent={100} score="100" color="--accent-green" delay={0.4} />
                <div className="mt-6 pt-6 border-t border-[var(--border)] flex justify-between items-center">
                  <span className="font-mono text-[12px] text-[var(--text-muted)] uppercase tracking-widest">FINAL VERDICT</span>
                  <span className="font-display text-[24px] font-bold text-[var(--accent-green)]">87 / 100</span>
                </div>
              </div>
            </SpotlightCard>

            {/* AI Roadmap (Span 4) */}
            <SpotlightCard spotlightColor="var(--accent-purple-dim)" className="md:col-span-4 p-8 md:p-10 min-h-[400px] flex flex-col">
              <h3 className="font-display text-[28px] font-bold text-[var(--text-primary)] mb-4 leading-[1.1]">
                AI Issue Roadmap
              </h3>
              <p className="text-[16px] text-[var(--text-muted)] mb-8 flex-1">
                Found a friendly issue? Don't start coding yet. Gemini generates a step-by-step implementation plan, highlighting exact files to touch and pitfalls to avoid.
              </p>
              <div className="font-mono text-[12px] text-[var(--accent-purple)] bg-[var(--accent-purple-dim)] px-4 py-3 rounded-lg border border-[color-mix(in_srgb,var(--accent-purple)_20%,transparent)]">
                {">"} Analyzing constraints...<br/>
                {">"} Files to modify: 3<br/>
                {">"} Est. Complexity: Low
              </div>
            </SpotlightCard>

            {/* PR Quality Check (Span 5) */}
            <SpotlightCard spotlightColor="var(--accent-orange-dim)" className="md:col-span-5 p-8 md:p-10 min-h-[400px] flex flex-col">

              <h3 className="font-display text-[28px] font-bold text-[var(--text-primary)] mb-4 leading-[1.1]">
                Pre-Submit Check
              </h3>
              <p className="text-[16px] text-[var(--text-muted)] mb-8 flex-1">
                Paste your PR URL. AI acts as a senior engineer, checking your diff against the original issue and the repository's CONTRIBUTING.md.
              </p>
              <div className="border border-[var(--accent-green)] bg-[color-mix(in_srgb,var(--accent-green)_5%,transparent)] rounded-lg p-5">
                <p className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1">VERDICT</p>
                <div className="font-display text-[32px] font-bold text-[var(--accent-green)] leading-none mb-3">GENUINE</div>
                <p className="font-mono text-[12px] text-[var(--text-primary)]">"Code resolves the exact edge case requested."</p>
              </div>
            </SpotlightCard>

            {/* Heatmap (Span 7) */}
            <SpotlightCard className="md:col-span-7 p-8 md:p-10 min-h-[400px] flex flex-col justify-center overflow-hidden">

              <h3 className="font-display text-[28px] font-bold text-[var(--text-primary)] mb-4 leading-[1.1]">
                Track what gets merged.
              </h3>
              <p className="text-[16px] text-[var(--text-muted)] mb-8">
                Stop guessing what maintainers want. We analyze merge histories to show you exactly when and what gets merged.
              </p>
              <div className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-inner">
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 182 }).map((_, i) => {
                    const intensity = [0, 0, 0, 1, 1, 2, 3][Math.floor(Math.random() * 7)];
                    const colors = ['bg-[var(--border)]', 'bg-[var(--accent-green)]/30', 'bg-[var(--accent-green)]/60', 'bg-[var(--accent-green)]'];
                    return <div key={i} className={`w-3 h-3 rounded-sm ${colors[intensity]}`} />;
                  })}
                </div>
                <div className="flex justify-between mt-3">
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">133 contributions this year</span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">99 active days</span>
                </div>
              </div>
            </SpotlightCard>

            {/* Seamless Extension (Span 12) */}
            <SpotlightCard className="md:col-span-12 p-8 md:p-10 min-h-[250px] flex flex-col justify-center relative overflow-hidden group">
              <div className="relative z-10 w-full md:w-[60%]">

                <h3 className="font-display text-[32px] font-bold text-[var(--text-primary)] mb-4 leading-[1.1]">
                  Zero-Friction Extension
                </h3>
                <p className="text-[16px] text-[var(--text-muted)] mb-6 max-w-[600px]">
                  The FirstMerge Chrome extension automatically injects the AI analysis panel directly into your GitHub PR timeline. No tabs to switch. No context switching.
                </p>
                <button className="text-[18px] font-bold text-[var(--accent-blue)] flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer">
                  Get the Extension <ArrowRight size={20} />
                </button>
              </div>
              
              {/* Abstract decorative extension UI piece */}
              <motion.div 
                className="absolute right-[-5%] top-[15%] w-[450px] h-[280px] hidden md:block"
                initial={{ x: 300, rotate: 15, opacity: 0 }}
                whileInView={{ x: 0, rotate: -3, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1, delay: 0.2, type: "spring", bounce: 0.4 }}
              >
                <div className="w-full h-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-l-2xl shadow-2xl p-6 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 flex flex-col">
                  <div className="w-full h-8 flex items-center gap-2 border-b border-[var(--border)] mb-4">
                    <div className="w-3 h-3 rounded-full bg-[var(--border-selected)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--border-selected)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--border-selected)]" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="w-[80%] h-4 bg-[var(--border-selected)] rounded-full" />
                    <div className="w-[60%] h-4 bg-[var(--border-selected)] rounded-full" />
                    <div className="w-full h-20 bg-[var(--accent-blue-dim)] rounded-lg border border-[var(--accent-blue)] opacity-50 mt-6" />
                  </div>
                </div>
              </motion.div>
            </SpotlightCard>

          </div>
        </section>

        <HorizontalScroller />

      </main>
    </div>
  )
}
