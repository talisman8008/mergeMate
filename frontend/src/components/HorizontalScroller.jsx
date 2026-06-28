import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';

const screenshots = [
  { src: '/screenshots/58b8bdf2-2546-4768-95e8-ff29d608a83a.jpg', alt: 'Screenshot 1', caption: 'Reddit post — Beginner struggling to find projects to contribute to' },
  { src: '/screenshots/86089123-19df-488a-8b9f-e63a8da82a5a.jpg', alt: 'Screenshot 2', caption: 'Tweet — PR spam destroying open source credibility' },
  { src: '/screenshots/f4f6cec9cb761109ef05f697fada89293d384351-958x627.avif', alt: 'Screenshot 3', caption: 'The Apna College effect — repos flooded with copy-paste README PRs' },
  { src: '/screenshots/gsoc_mentor_suggestion.jpg', alt: 'Screenshot 4', caption: 'GSoC mentor suggesting AI-assisted PR guidance for beginners' },
  { src: '/screenshots/tweet_farming_prs.png', alt: 'Screenshot 5', caption: 'Tweet — Contributors farming issues with raw ChatGPT output as PRs' },
];

const ScreenshotNode = ({ shot, i }) => {
  const nodeRef = useRef(null);
  const [isFilled, setIsFilled] = useState(false);
  const isFilledRef = useRef(false);

  useEffect(() => {
    let animationFrameId;
    const checkPosition = () => {
      if (nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        const targetX = (window.innerWidth / 2) - 100;
        const nodeCenterX = rect.left + rect.width / 2;
        
        const shouldFill = nodeCenterX <= targetX + 15;
        if (shouldFill !== isFilledRef.current) {
          isFilledRef.current = shouldFill;
          setIsFilled(shouldFill);
        }
      }
      animationFrameId = requestAnimationFrame(checkPosition);
    };
    checkPosition();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative flex-shrink-0 flex flex-col items-center w-[85vw] md:w-[450px]">
      {/* The Commit Node sitting perfectly on the track */}
      <motion.div 
        ref={nodeRef}
        className="absolute top-[23px] w-7 h-7 rounded-full border-[5px] border-[var(--accent-purple)] z-10 transition-colors duration-300"
        style={{ 
          backgroundColor: isFilled ? 'var(--accent-purple)' : 'var(--bg-primary)',
          boxShadow: isFilled ? '0 0 30px rgba(138,43,226,1)' : '0 0 20px rgba(138,43,226,0.5)' 
        }}
      />
      
      {/* Hash Text below the node */}
      <motion.div 
        className="absolute top-[45px] z-20 text-[var(--text-muted)] font-mono text-[14px] font-bold"
      >
        {`evidence_${i+1}`}
      </motion.div>
      
      <motion.div 
        className="mt-[65px] h-[200px] md:h-[300px] w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden relative z-10 shadow-2xl transition-transform hover:scale-105 duration-500"
      >
        <img src={shot.src} alt={shot.alt} className="h-full w-full object-contain p-2" loading="eager" />
      </motion.div>
      <motion.p 
        className="mt-4 text-center font-display text-[14px] md:text-[16px] text-[var(--text-muted)] italic max-w-[400px]"
      >
        {shot.caption}
      </motion.p>
    </div>
  );
};

const HorizontalScroller = () => {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  // Standard smooth spring to avoid rubber-banding/jerkiness
  const smooth = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  });

  // Slide perfectly to the end
  const x = useTransform(smooth, (val) => `calc(-${val * 100}% + ${val * 100}vw)`);
  
  // Fade out the title when the 5th card disappears and CTA enters
  const titleOpacity = useTransform(smooth, [0.65, 0.75], [1, 0]);
  const titleY = useTransform(smooth, [0.65, 0.75], [0, -50]);

  // Animate the purple line drawing in as you start scrolling
  const purplePathLength = useTransform(smooth, [0, 0.2], [0, 1]);

  return (
    <section ref={sectionRef} className="relative z-20" style={{ height: '300vh' }}>
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-center items-center z-30">
        {/* The Solid Background that permanently hides MergeField */}
        <motion.div 
           className="absolute inset-0 z-0 bg-[var(--bg-primary)] pointer-events-none"
        />

        <div className="w-full h-full relative flex flex-col justify-center items-center z-10">
          
          {/* A rigid container mapping 1:1 with the SVG viewBox */}
          <div className="relative w-full h-[600px]">
            
            {/* Fixed SVG Background for the connective curve */}
            <motion.div className="absolute inset-0 flex justify-center pointer-events-none z-0">
              <svg width="1200" height="600" viewBox="0 0 1200 600" className="overflow-visible">
                {/* Overlapping green trunk from MergeField coming straight down slightly left of center */}
                <path 
                  d="M 500 -1000 L 500 50" 
                  fill="none" 
                  stroke="#83B892" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  filter="url(#premiumGlowScroller)" 
                />
                
                {/* Overlapping purple trunk from MergeField curving from right into the merge node */}
                <path 
                  d="M 800 -1000 L 800 0 C 800 50, 500 50, 500 50" 
                  fill="none" 
                  stroke="#4A43A6" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  filter="url(#premiumGlowScroller)"
                />
                
                {/* Merge Node perfectly positioned to drop between words */}
                <circle cx="500" cy="50" r="14" fill="var(--bg-primary)" stroke="#8A2BE2" strokeWidth="5" />
                <text x="470" y="55" fill="#8B949E" fontSize="14" fontFamily="monospace" textAnchor="end">Merge bento_features</text>
                
                {/* Single line dropping straight down PAST the title into the horizontal track at Y=140 */}
                <path 
                  d="M 500 64 L 500 140" 
                  fill="none" 
                  stroke="#4A43A6" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  filter="url(#premiumGlowScroller)" 
                />

                <defs>
                  <linearGradient id="energyGradTrack" gradientUnits="userSpaceOnUse" x1="500" y1="-500" x2="800" y2="100">
                     <stop offset="0%" stopColor="#83B892" />
                     <stop offset="100%" stopColor="#DE8A75" />
                  </linearGradient>

                  <filter id="premiumGlowScroller" filterUnits="userSpaceOnUse" x="-500" y="-1200" width="2200" height="2000">
                    <feGaussianBlur stdDeviation="12" result="blur1" />
                    <feGaussianBlur stdDeviation="24" result="blur2" />
                    <feMerge result="blur">
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                    </feMerge>
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
              </svg>
            </motion.div>

            {/* Title - positioned safely below the node and above the swoop */}
            <motion.div 
              style={{ opacity: titleOpacity, y: titleY }}
              className="absolute top-[70px] left-0 w-full z-10 pointer-events-none text-center"
            >
              <h2 className="font-display text-[40px] md:text-[56px] font-bold text-[var(--text-primary)] leading-tight px-6">
                What <span className="text-[var(--accent-orange)]">motivated</span> us.
              </h2>
            </motion.div>

            {/* Sliding Screenshots - wrapper positioned at Y=103 */}
            <div className="absolute top-[103px] left-0 w-full h-full z-20 pointer-events-auto">
              <motion.div
                style={{ x }}
                className="flex gap-8 md:gap-12 items-start w-max relative max-md:pl-[7.5vw] md:pl-[calc(50vw-325px)]"
              >
                {/* The horizontal track that slides WITH the screenshots */}
                <div 
                  className="absolute top-[37px] right-0 h-[3px] rounded-full bg-gradient-to-r from-[var(--accent-purple)] via-[var(--accent-blue)] to-[var(--accent-green)] z-0 left-[calc(50vw-100px)]" 
                  style={{ 
                    boxShadow: '0 0 40px rgba(138,43,226,0.5)' 
                  }} 
                />

                {screenshots.map((shot, i) => (
                  <ScreenshotNode key={i} shot={shot} i={i} />
                ))}
                
                {/* Spacer to push the CTA far enough right so the 5th slide disappears first */}
                <div className="w-[100vw] flex-shrink-0" />

                {/* Cinematic Open CTA Area */}
                <div className="relative flex-shrink-0 flex flex-col items-center justify-center w-[100vw] h-[300px] mt-[65px]">
                  <h3 className="font-display text-4xl md:text-6xl font-bold text-[var(--text-primary)] text-center mb-10 leading-[1.1] tracking-tight">
                    Ready to make an <br/>
                    <span className="text-[var(--accent-green)]">impact?</span>
                  </h3>
                  <Link to="/explore">
                    <button className="group relative px-10 py-5 bg-[var(--accent-green)] text-[var(--bg-primary)] text-lg font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(131,184,146,0.5)] cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative flex items-center gap-3">
                        Explore Issues
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </span>
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HorizontalScroller;
