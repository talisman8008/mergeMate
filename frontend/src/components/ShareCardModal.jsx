import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'

export default function ShareCardModal({ isOpen, onClose, profile, stats, languages }) {
  const cardRef = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showToast, setShowToast] = useState(false)

  if (!isOpen) return null

  const handleDownload = async () => {
    if (!cardRef.current) return
    try {
      setIsDownloading(true)
      // Small delay to ensure rendering is complete before capture
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#0C0A15', // Base background color
        useCORS: true,
      })
      
      const image = canvas.toDataURL('image/png', 1.0)
      const link = document.createElement('a')
      link.href = image
      link.download = `${profile?.login || 'firstmerge'}-stats.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to generate image', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Ensure we have some safe default languages to map over
  const topLanguages = languages?.slice(0, 3) || []

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-bold">Share Your Profile</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Card Preview Area */}
          <div className="p-6 sm:p-10 flex items-center justify-center bg-[#06050A] relative overflow-hidden">
            
            {/* The Actual Shareable Card (Landscape format for social media) */}
            <div 
              ref={cardRef} 
              className="relative w-full max-w-[800px] aspect-[1.9/1] flex flex-row items-stretch justify-between p-10 rounded-3xl overflow-hidden border shadow-[0_0_80px_rgba(91,79,227,0.15)]"
              style={{
                background: 'linear-gradient(135deg, #120F24 0%, #06050A 100%)',
                borderColor: 'rgba(91,79,227,0.4)'
              }}
            >
              {/* Background Glows */}
              <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[80%] rounded-full blur-[120px] opacity-25 pointer-events-none" style={{ backgroundColor: '#5B4FE3' }}></div>
              <div className="absolute bottom-[-30%] right-[-10%] w-[50%] h-[70%] rounded-full blur-[120px] opacity-15 pointer-events-none" style={{ backgroundColor: '#FF6240' }}></div>
              
              {/* Grid pattern overlay for tech aesthetic */}
              <div 
                className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              ></div>

              {/* Left Column: Branding & Profile */}
              <div className="flex flex-col justify-between z-10 w-1/2 pr-6 border-r" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {/* Logo / Branding */}
                <div className="flex items-center gap-2 opacity-90">
                   <img src="/logos/firstmerge-logo-dark-bg.svg" alt="FirstMerge" className="h-7 w-auto" />
                </div>

                {/* Profile Section */}
                <div className="flex flex-col items-start mt-auto mb-4">
                  <img 
                    src={profile?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'} 
                    alt="avatar" 
                    className="w-28 h-28 rounded-2xl border-2 shadow-[0_0_30px_rgba(91,79,227,0.4)] object-cover mb-5"
                    style={{ borderColor: '#5B4FE3', backgroundColor: '#16141F' }}
                    crossOrigin="anonymous" 
                  />
                  <h3 className="text-3xl font-extrabold uppercase tracking-wider mb-1 line-clamp-1" style={{ color: '#ffffff' }}>
                    {profile?.name || profile?.login || 'Developer'}
                  </h3>
                  <p className="text-md font-mono" style={{ color: '#9F97F0' }}>
                    github.com/{profile?.login || 'user'}
                  </p>
                </div>
              </div>

              {/* Right Column: Stats Grid & Languages */}
              <div className="flex flex-col justify-center z-10 w-1/2 pl-10">
                
                {/* 2x2 Stats Grid */}
                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                  <div className="flex flex-col items-start p-4 rounded-xl border backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-3xl font-mono font-bold mb-1 leading-none" style={{ color: '#ffffff' }}>{stats?.mergedPRs || 0}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold mt-1" style={{ color: '#9F97F0' }}>Merged PRs</span>
                  </div>
                  <div className="flex flex-col items-start p-4 rounded-xl border backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-3xl font-mono font-bold mb-1 leading-none" style={{ color: '#ffffff' }}>{stats?.openPRs || 0}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold mt-1" style={{ color: '#9CA3AF' }}>Open PRs</span>
                  </div>
                  <div className="flex flex-col items-start p-4 rounded-xl border backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-3xl font-mono font-bold mb-1 leading-none" style={{ color: '#ffffff' }}>{stats?.commits || 0}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold mt-1" style={{ color: '#9CA3AF' }}>Total Commits</span>
                  </div>
                  <div className="flex flex-col items-start p-4 rounded-xl border backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-3xl font-mono font-bold mb-1 leading-none" style={{ color: '#ffffff' }}>{stats?.issues || 0}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold mt-1" style={{ color: '#9CA3AF' }}>Issues Closed</span>
                  </div>
                </div>

                {/* Top Languages */}
                {topLanguages.length > 0 && (
                  <div className="w-full flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: '#6B7280' }}>Top Languages</span>
                    <div className="flex flex-wrap gap-2">
                      {topLanguages.map((lang, idx) => (
                        <span key={idx} className="px-3 py-1.5 border rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(91,79,227,0.2)', borderColor: 'rgba(91,79,227,0.4)', color: '#9F97F0' }}>
                          {lang.lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)]">
            <div className="flex gap-2">
              <button 
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out my open-source stats on FirstMerge! 🚀&url=https://www.firstmerge.app`, '_blank')} 
                className="p-2 rounded-md hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-white transition-colors" 
                title="Share on X"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              
              <button 
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://www.firstmerge.app`, '_blank')} 
                className="p-2 rounded-md hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[#0a66c2] transition-colors" 
                title="Share on LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>

              <button 
                onClick={(e) => {
                  const embedCode = `<a href="https://www.firstmerge.app">Check out my open-source stats on FirstMerge!</a>`;
                  navigator.clipboard.writeText(embedCode);
                  const el = e.currentTarget;
                  const originalHtml = el.innerHTML;
                  el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                  setShowToast(true);
                  setTimeout(() => {
                    el.innerHTML = originalHtml;
                    setShowToast(false);
                  }, 2000);
                }} 
                className="p-2 rounded-md hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" 
                title="Copy Embed Link"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md font-medium text-sm border border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-6 py-2 rounded-md font-semibold text-sm bg-[#5B4FE3] hover:bg-[#473CC4] text-white transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download Image
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#16141F] text-white px-4 py-2 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(91,79,227,0.3)] border border-[#5B4FE3]/30 z-[9999]"
              >
                Copied to clipboard!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
