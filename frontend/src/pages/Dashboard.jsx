import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import Navbar from '../components/Navbar.jsx'
import supabase from '../lib/supabase.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-6 h-6 rounded-full border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] animate-spin" />
  </div>
)

import Heatmap from '../components/Heatmap.jsx'

const DashboardSkeleton = () => (
  <div className="max-w-[2880px] mx-auto px-8 py-8 flex flex-col md:flex-row gap-8 w-full animate-pulse">
    {/* Left Sidebar Skeleton */}
    <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-[var(--border)] rounded-2xl"></div>
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-[var(--border)] rounded w-3/4"></div>
          <div className="h-3 bg-[var(--border)] rounded w-1/2"></div>
        </div>
      </div>
      <div>
        <div className="h-5 bg-[var(--border)] rounded w-1/2 mb-2"></div>
        <div className="h-24 bg-[var(--border)] rounded-md w-full"></div>
      </div>
      <div className="border-t border-[var(--border)] pt-6 space-y-4">
        <div className="h-5 bg-[var(--border)] rounded w-1/2 mb-4"></div>
        <div className="flex justify-between"><div className="h-3 bg-[var(--border)] rounded w-1/3"></div><div className="h-3 bg-[var(--border)] rounded w-8"></div></div>
        <div className="flex justify-between"><div className="h-3 bg-[var(--border)] rounded w-1/3"></div><div className="h-3 bg-[var(--border)] rounded w-8"></div></div>
        <div className="flex justify-between"><div className="h-3 bg-[var(--border)] rounded w-1/3"></div><div className="h-3 bg-[var(--border)] rounded w-8"></div></div>
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="flex-1 flex flex-col gap-6">
      <div className="rounded-xl p-6 h-[250px] bg-[var(--bg-primary)] border border-[var(--border)]"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-6 h-[200px] bg-[var(--bg-primary)] border border-[var(--border)] flex flex-col items-center justify-center gap-4">
          <div className="h-6 bg-[var(--border)] rounded w-1/2"></div>
          <div className="flex gap-8">
            <div className="w-16 h-12 bg-[var(--border)] rounded"></div>
            <div className="w-16 h-12 bg-[var(--border)] rounded"></div>
          </div>
        </div>
        <div className="rounded-xl p-6 h-[200px] bg-[var(--bg-primary)] border border-[var(--border)] space-y-3">
          <div className="h-6 bg-[var(--border)] rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-[var(--border)] rounded-sm w-full"></div>
          <div className="h-8 bg-[var(--border)] rounded-sm w-11/12"></div>
          <div className="h-8 bg-[var(--border)] rounded-sm w-full"></div>
        </div>
      </div>
      <div className="rounded-xl p-6 h-[220px] bg-[var(--bg-primary)] border border-[var(--border)]"></div>
      <div className="rounded-xl p-6 h-[200px] bg-[var(--bg-primary)] border border-[var(--border)]"></div>
    </div>
  </div>
)

export const seedActivity = {
  heatmap: Array.from({ length: 365 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (365 - i));
    const isActivity = Math.random() < (90 / 365);
    const weight = i / 365; 
    let count = 0;
    if (isActivity) {
      count = Math.floor(Math.random() * 3 * weight) + 1;
    }
    return {
      date: d.toISOString().split('T')[0],
      count: count
    };
  })
};

const seedProfile = {
  name: 'Open Source Contributor',
  login: 'os_contributor',
  avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
};

const seedDashData = {
  stats: {
    totalIssuesClosed: 42,
    totalPRsOpened: 18
  },
  split: [
    { name: 'Commits', value: 65, color: 'var(--accent-green)' },
    { name: 'PRs', value: 25, color: 'var(--accent-blue)' },
    { name: 'Issues', value: 10, color: 'var(--accent-amber)' }
  ],
  repos: [
    { name: 'facebook/react', description: 'A declarative UI library', url: 'https://github.com/facebook/react' },
    { name: 'vercel/next.js', description: 'The React Framework', url: 'https://github.com/vercel/next.js' },
    { name: 'tailwindlabs/tailwindcss', description: 'Utility-first CSS', url: 'https://github.com/tailwindlabs/tailwindcss' }
  ],
  languages: [
    { lang: 'JavaScript', percentage: 55 },
    { lang: 'TypeScript', percentage: 25 },
    { lang: 'CSS', percentage: 12 },
    { lang: 'HTML', percentage: 8 }
  ],
  savedIssues: [
    { repo_name: 'facebook/react', issue_title: 'Fix React component rendering bug', issue_url: 'https://github.com/facebook/react/issues/28000', status: 'saved' },
    { repo_name: 'tailwindlabs/tailwindcss', issue_title: 'Add dark mode toggle', issue_url: 'https://github.com/tailwindlabs/tailwindcss/issues/1420', status: 'saved' },
    { repo_name: 'vitejs/vite', issue_title: 'Migrate to Vite 5', issue_url: 'https://github.com/vitejs/vite/issues/15123', status: 'saved' }
  ],
  openPRs: [
    { repo_name: 'microsoft/vscode', issue_title: 'Add new theme settings', issue_url: 'https://github.com/microsoft/vscode/pull/4' },
    { repo_name: 'facebook/react', issue_title: 'Update documentation for hooks', issue_url: 'https://github.com/facebook/react/pull/5' }
  ],
  closedPRs: [
    { repo_name: 'vercel/next.js', issue_title: 'Fix typo in README', issue_url: 'https://github.com/vercel/next.js/pull/6' }
  ]
};

export default function Dashboard({ user, signIn, signOut }) {
  const [dashData, setDashData] = useState(null)
  const [githubData, setGithubData] = useState(null)
  const [mergedPrs, setMergedPrs] = useState({ heatmapData: {}, totalMerged: 0, recentMerged: [] })
  const [loading, setLoading] = useState(true)
  const [loadingMergedPrs, setLoadingMergedPrs] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('Saved')
  
  const [isDemoMode, setIsDemoMode] = useState(
    localStorage.getItem('dashboardMode') === 'demo'
  )

  const toggleDemoMode = async () => {
    if (!isDemoMode) {
      setIsDemoMode(true)
      localStorage.setItem('dashboardMode', 'demo')
    } else {
      setIsDemoMode(false)
      localStorage.setItem('dashboardMode', 'real')
    }
  }

  const handleUnsave = async (issueId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      const res = await fetch(`${BACKEND_URL}/api/user/issues/${issueId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDashData(prev => ({
          ...prev,
          issues: prev?.issues?.filter(issue => issue.id !== issueId) || []
        }));
      } else {
        console.error('Failed to unsave issue');
      }
    } catch (err) {
      console.error('Error unsaving issue', err);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      setLoadingMergedPrs(false)
      return
    }

    async function loadData() {
      try {
        setLoading(true)
        setLoadingMergedPrs(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error('No active session.')

        const headers = { Authorization: `Bearer ${session.access_token}` }

        const [dashRes, ghRes, mergedRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/user/dashboard`, { headers }),
          fetch(`${BACKEND_URL}/api/user/github-profile`, { headers }),
          fetch(`${BACKEND_URL}/api/user/merged-prs`, { headers }).catch(() => null)
        ])

        if (!dashRes.ok) throw new Error('Failed to load dashboard data')
        const dData = await dashRes.json()
        setDashData(dData)

        if (ghRes.ok) {
          const gData = await ghRes.json()
          setGithubData(gData)
        }

        if (mergedRes && mergedRes.ok) {
          const mData = await mergedRes.json()
          setMergedPrs(mData || { heatmapData: {}, totalMerged: 0, recentMerged: [] })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
        setLoadingMergedPrs(false)
      }
    }

    loadData()
  }, [user?.id])

  if (!user) {
    return (
      <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)]">
        <div className="bg-[var(--bg-primary)]"><Navbar user={user} signIn={signIn} signOut={signOut} /></div>
        <div className="flex justify-center py-20">
          <button onClick={signIn} className="px-4 py-2 bg-black text-[var(--text-primary)] rounded-md">Log in with GitHub</button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="bg-[var(--bg-primary)] min-h-screen">
      <div className="bg-[var(--bg-primary)]">
        <Navbar user={user} signIn={signIn} signOut={signOut} />
      </div>
      <DashboardSkeleton />
    </div>
  )



  const realProfile = githubData?.profile || {};
  const realActivity = githubData?.activity || {};

  const profile = isDemoMode ? seedProfile : realProfile;
  const currentDashIssues = dashData?.issues || [];
  const currentDashTotalDone = dashData?.totalDone || 0;

  const stats = isDemoMode ? seedDashData.stats : {
    totalIssuesClosed: realActivity.totalIssuesClosed || currentDashTotalDone || 0,
    totalPRsOpened: realActivity.totalPRs || 0
  };
  const split = isDemoMode ? seedDashData.split : (realActivity.contributionSplit || []);
  const repos = isDemoMode ? seedDashData.repos : (realActivity.topRepos || []);
  const languages = isDemoMode ? seedDashData.languages : (realActivity.languages || []);

  const getTabIssues = () => {
    if (isDemoMode) {
      if (activeTab === 'Saved') return seedDashData.savedIssues || [];
      if (activeTab === 'Open PR') return seedDashData.openPRs || [];
      if (activeTab === 'Closed PRs') return seedDashData.closedPRs || [];
    } else {
      if (activeTab === 'Saved') return currentDashIssues;
      if (activeTab === 'Closed PRs') {
        return (mergedPrs.recentMerged || []).map(pr => ({
          issue_title: pr.title,
          issue_url: pr.url,
          repo_name: pr.repo,
          status: 'merged'
        }));
      }
      if (activeTab === 'Open PR') {
        return (mergedPrs.recentOpen || []).map(pr => ({
          issue_title: pr.title,
          issue_url: pr.url,
          repo_name: pr.repo,
          status: 'open'
        }));
      }
    }
    return [];
  };

  const displayedIssues = getTabIssues();

  const totalCommits = split.find(i => i.name.toLowerCase() === 'commits')?.value || 0;
  const totalOS = stats.totalPRsOpened + stats.totalIssuesClosed;

  const heatmapArray = Array.from({ length: 365 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (365 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      date: dateStr,
      count: mergedPrs.heatmapData?.[dateStr] || 0
    };
  });

  const displayedHeatmap = isDemoMode ? seedActivity.heatmap : heatmapArray;
  const seedHeatmapTotal = seedActivity.heatmap.reduce((sum, day) => sum + day.count, 0);
  const displayedHeatmapTotal = isDemoMode ? seedHeatmapTotal : (mergedPrs.totalMerged || 0);
  const displayedHeatmapActiveDays = displayedHeatmap.filter(d => d.count > 0).length;

  const milestones = [
    { name: 'The Spark', desc: '10 Commits', image: '/medals/commit_bronze.png', achieved: totalCommits >= 10, progress: `${Math.min(totalCommits, 10)}/10`, target: 10, type: 'commits' },
    { name: 'Consistent', desc: '100 Commits', image: '/medals/commit_silver.png', achieved: totalCommits >= 100, progress: `${Math.min(totalCommits, 100)}/100`, target: 100, type: 'commits' },
    { name: 'Machine', desc: '500 Commits', image: '/medals/commit_gold.png', achieved: totalCommits >= 500, progress: `${Math.min(totalCommits, 500)}/500`, target: 500, type: 'commits' },
    { name: 'First Issue', desc: '1 OS PR/Issue', image: '/medals/os_bronze.png', achieved: totalOS >= 1, progress: `${Math.min(totalOS, 1)}/1`, target: 1, type: 'issues' },
    { name: 'Helper', desc: '10 OS PR/Issues', image: '/medals/os_silver.png', achieved: totalOS >= 10, progress: `${Math.min(totalOS, 10)}/10`, target: 10, type: 'issues' },
    { name: 'Legend', desc: '50 OS PR/Issues', image: '/medals/os_gold.png', achieved: totalOS >= 50, progress: `${Math.min(totalOS, 50)}/50`, target: 50, type: 'issues' },
  ];

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)] font-sans">
      <div className="bg-[var(--bg-primary)]">
        <Navbar user={user} signIn={signIn} signOut={signOut} />
      </div>

      {isDemoMode && (
        <div className="w-full py-1.5 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderBottom: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', fontSize: '12px' }}>
          Viewing demo data — not your real stats
        </div>
      )}

      {error && <div className="p-4 text-red-600 text-center">{error}</div>}

      <div className="max-w-[2880px] mx-auto px-8 pt-6 pb-2 flex justify-end">
        {!isDemoMode ? (
          <button onClick={toggleDemoMode} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" style={{ fontFamily: 'DM Sans', fontSize: '12px' }}>
            View Demo
          </button>
        ) : (
          <button onClick={toggleDemoMode} className="px-3 py-1.5 rounded-md border border-[var(--accent-amber)] text-[var(--accent-amber)] hover:bg-[var(--accent-amber)] hover:text-black transition-colors" style={{ fontFamily: 'DM Sans', fontSize: '12px' }}>
            Exit Demo
          </button>
        )}
      </div>

      <div className="max-w-[2880px] mx-auto px-8 pb-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col gap-8">
          
          {/* User Info */}
          <div className="flex items-center gap-4">
            {isDemoMode ? (
              <>
                <img src={seedProfile.avatar_url} alt="avatar" className="w-20 h-20 bg-[var(--border)] rounded-2xl object-cover p-2" />
                <div>
                  <h2 className="text-xl font-bold uppercase">{seedProfile.name}</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{seedProfile.login}</p>
                </div>
              </>
            ) : (
              <>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 bg-[var(--border)] rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-[var(--bg-card-hover)] rounded-2xl flex items-center justify-center text-sm text-[var(--text-muted)]">user icon</div>
                )}
                <div>
                  <h2 className="text-xl font-bold uppercase">
                    {profile.name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'GITHUB NAME'}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {profile.login || user?.user_metadata?.user_name || user?.user_metadata?.preferred_username || 'github username'}
                  </p>
                </div>
              </>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-[var(--text-muted)]">Milestones Rewards:</h3>
            <div className="border border-[var(--border)] rounded-md mt-2 p-5 grid grid-cols-3 gap-y-6 gap-x-2" style={{ backgroundColor: 'var(--bg-card)' }}>
              {milestones.map((m, idx) => {
                const isLocked = !m.achieved;
                const remaining = m.target - (m.type === 'commits' ? totalCommits : totalOS);
                const unlockText = m.type === 'commits' ? `Make ${remaining} commits to unlock` : `Close ${remaining} issues to unlock`;
                
                return (
                <div key={idx} className="h-16 flex flex-col items-center justify-center group relative cursor-help">
                  <div className={`${idx === 0 ? 'w-16 h-16' : 'w-14 h-14'} rounded-full flex items-center justify-center relative ${m.achieved ? 'bg-[var(--bg-card)] shadow-[0_0_10px_rgba(35,134,54,0.3)] ring-2 ring-[var(--accent-green)]' : 'bg-[var(--bg-primary)]'} transition-all duration-300 group-hover:scale-110`}>
                    <img 
                      src={m.image} 
                      alt={m.name} 
                      className={`${idx === 0 ? 'w-16 h-16 scale-110' : 'w-11 h-11'} object-contain transition-all duration-300 ${m.achieved ? 'drop-shadow-md' : 'grayscale opacity-40 blur-[0.5px]'}`} 
                    />
                    {isLocked && (
                      <span className="absolute text-xl drop-shadow-md z-10" title="Locked">🔒</span>
                    )}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full mt-3 w-32 bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs p-2.5 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-center pointer-events-none">
                    <p className="font-bold mb-1">{m.name}</p>
                    <p className="text-[var(--text-primary)] mb-2 text-[10px]">{m.desc}</p>
                    <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[var(--accent-amber)] h-full transition-all duration-1000" style={{ width: `${(parseInt(m.progress.split('/')[0]) / parseInt(m.progress.split('/')[1])) * 100}%` }}></div>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--text-primary)]">
                      {m.achieved ? m.progress : unlockText}
                    </p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[var(--bg-card-hover)]"></div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="text-lg font-bold text-[var(--text-muted)] mb-4">Community Stats</h3>
            <div className="space-y-4">
              <p className="flex justify-between items-center text-sm">
                <span>Total issues Closed :</span>
                <span className="font-mono text-[16px] font-medium text-[var(--text-primary)]">{stats.totalIssuesClosed}</span>
              </p>
              <p className="flex justify-between items-center text-sm">
                <span>Total PR's Opened:</span>
                <span className="font-mono text-[16px] font-medium text-[var(--text-primary)]">{stats.totalPRsOpened}</span>
              </p>

            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="text-lg font-bold text-[var(--text-muted)] mb-4">Languages</h3>
            <div className="space-y-3">
              {languages.slice(0, 3).map((lang, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-[var(--border)] rounded-full text-xs font-medium">{lang.lang}</span>
                  <span className="text-xs text-[var(--text-muted)]">{lang.percentage}%</span>
                </div>
              ))}
              {languages.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">No language data</p>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="text-lg font-bold text-[var(--text-muted)] mb-4">Type of Issue solved</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[var(--border)] rounded-full text-xs font-medium">Good First issue</span>
                <span className="text-xs text-[var(--text-muted)]">x{isDemoMode ? 30 : (currentDashTotalDone || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[var(--border)] rounded-full text-xs font-medium">Ui Fixes</span>
                <span className="text-xs text-[var(--text-muted)]">x{isDemoMode ? 12 : 0}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Stats Box (now Contribution Split) */}
            <div className="border border-[var(--border)] rounded-xl p-6 min-h-[200px] flex flex-col" style={{ backgroundColor: 'var(--bg-card)' }}>
              <h3 className="text-xl font-bold text-[var(--text-muted)] mb-2">Contribution Split</h3>
              <div className="flex flex-row items-center flex-1 w-full">
                {/* Chart Container (Left) */}
                <div className="flex-1 h-full flex items-center justify-start">
                  {split.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={split}
                          cx="35%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {split.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', padding: '4px 8px' }}
                          itemStyle={{ color: 'var(--text-primary)', fontWeight: '500' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">No recent contributions</div>
                  )}
                </div>

                {/* Legend Container (Right) */}
                <div className="flex flex-col justify-center gap-4 w-[130px] pl-4">
                  {split.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm font-medium text-[var(--text-muted)]">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Contribution */}
            <div className="border border-[var(--border)] rounded-xl p-6 min-h-[200px]" style={{ backgroundColor: 'var(--bg-card)' }}>
              <h3 className="text-xl font-bold text-[var(--text-muted)] mb-4">Top Repositories</h3>
              <div className="space-y-3">
                {repos.length > 0 ? (
                  repos.map((repo, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-md border border-[var(--border)]" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <div className="flex-1 min-w-0 pr-4">
                        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline truncate block text-[var(--text-primary)]">
                          {repo.name}
                        </a>
                        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{repo.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center font-sans text-[11px] font-medium bg-[var(--bg-selected)] text-[var(--text-primary)] border border-[var(--border-selected)] px-[10px] py-[4px] rounded-[4px] uppercase tracking-wider">
                        Contributed
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="h-8 bg-[var(--border)] rounded-sm w-full"></div>
                    <div className="h-8 bg-[var(--border)] rounded-sm w-[90%]"></div>
                    <div className="h-8 bg-[var(--border)] rounded-sm w-[95%]"></div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="border border-[var(--border)] rounded-xl pt-6 pb-6 px-4 md:px-8 flex flex-col" style={{ backgroundColor: 'var(--bg-card)' }}>
            {loadingMergedPrs && !isDemoMode ? (
              <div className="h-[200px] w-full animate-pulse bg-[var(--border)] rounded-md"></div>
            ) : (
              <Heatmap 
                data={displayedHeatmap} 
                totalIssues={displayedHeatmapTotal}
                activeDays={displayedHeatmapActiveDays}
                isDemoMode={isDemoMode}
              />
            )}
          </div>

          {/* Recent Merged PRs */}
          <div className="border border-[var(--border)] rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-xl font-bold text-[var(--text-muted)] mb-4">Recent Merged PRs</h3>
            <div className="space-y-3">
              {loadingMergedPrs ? (
                <>
                  <div className="h-8 bg-[var(--border)] rounded-sm w-full animate-pulse"></div>
                  <div className="h-8 bg-[var(--border)] rounded-sm w-[90%] animate-pulse"></div>
                  <div className="h-8 bg-[var(--border)] rounded-sm w-[95%] animate-pulse"></div>
                </>
              ) : mergedPrs.recentMerged && mergedPrs.recentMerged.length > 0 ? (
                mergedPrs.recentMerged.map((pr, idx) => {
                  const daysAgo = Math.floor((new Date() - new Date(pr.mergedAt)) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-md border border-[var(--border)]" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <div className="flex-1 min-w-0 pr-4">
                        <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline truncate block text-[var(--text-primary)]">
                          {pr.title.length > 60 ? pr.title.substring(0, 60) + '...' : pr.title}
                        </a>
                        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                          <span className="font-mono">{pr.repo}</span> • merged {daysAgo === 0 ? 'today' : `${daysAgo} days ago`}
                        </p>
                      </div>
                      <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        ↗
                      </a>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-[var(--text-muted)] py-4 flex flex-col gap-2">
                  <p>No merged PRs yet.</p>
                  <a href="/explore" className="text-[var(--accent-green)] hover:underline">Use FirstMerge to find your first issue →</a>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Tabs */}
          <div className="border border-[var(--border)] rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex gap-8 border-b border-[var(--border)] pb-4 mb-4">
              {['Saved', 'Open PR', 'Closed PRs'].map(tab => (
                <button 
                  key={tab}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(tab);
                  }}
                  className={`flex items-center gap-2 text-sm font-medium ${activeTab === tab ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
                >
                  {tab === 'Open PR' && <span className="text-lg">⑂</span>}
                  {tab === 'Closed PRs' && <span className="text-lg opacity-60">⑂</span>}
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="space-y-3">
              {(displayedIssues || []).map((issue, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 rounded-md border border-[var(--border)] group" style={{ backgroundColor: 'var(--bg-card)' }}>
                  <span className="text-sm font-medium uppercase truncate pr-4">{issue.repo_name} - {issue.issue_title}</span>
                  <div className="flex gap-4 items-center shrink-0">
                    {activeTab === 'Saved' && !isDemoMode && issue.id && (
                      <button 
                        onClick={() => handleUnsave(issue.id)}
                        className="text-[12px] font-bold text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider"
                      >
                        Unsave
                      </button>
                    )}
                    <a href={issue.issue_url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                      ↗
                    </a>
                  </div>
                </div>
              ))}
              {displayedIssues?.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] py-4 text-center">No repos to show.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
