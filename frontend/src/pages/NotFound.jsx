import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6 font-body">
      
      {/* Background decoration to match the web app */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(-45deg, var(--border) 0, var(--border) 1px, transparent 1px, transparent 32px)',
        }}
      />

      {/* The Extension UI Box - Scaled Up */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-[480px] md:max-w-[540px] bg-[#17151F] text-[#F2F1F7] p-8 md:p-10 flex flex-col gap-6 rounded-2xl shadow-2xl border border-[#322F42]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Header */}
        <Link to="/" className="flex items-center gap-5 mb-2 hover:opacity-80 transition-opacity">
          <img src="/logos/firstmerge-icon.svg" alt="FirstMerge Logo" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-lg" />
          <h2 className="text-[32px] md:text-[40px] font-bold m-0 leading-none tracking-tight">FirstMerge</h2>
        </Link>
        
        {/* Subtitle / Error Content */}
        <p className="text-[16px] md:text-[18px] text-[#9C99AD] m-0 leading-relaxed">
          <span className="font-bold text-[20px] md:text-[24px] text-[#DE8A75] block mb-2">This page opened a trivial PR.</span>
          Our own AI flagged it. Embarrassing. <br/><br/>
          We're writing a genuine fix right now.
        </p>

        {/* Auth Status / Action Area */}
        <div className="mt-4 p-4 rounded-xl bg-[#211F2E] text-center">
          <Link to="/" className="w-full">
            <button className="w-full py-4 bg-transparent text-[#F2F1F7] border border-[#45415A] rounded-xl font-bold text-[16px] hover:bg-white/5 transition-colors flex items-center justify-center gap-3 cursor-pointer">
              <ArrowLeft size={20} />
              Go back somewhere that works
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
