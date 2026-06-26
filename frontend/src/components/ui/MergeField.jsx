import { motion, useTransform } from 'framer-motion';

const CommitNode = ({ commit, drawnY }) => {
  const threshold = commit.cy;
  // Node scales up exactly as the drawn line reaches its Y coordinate
  const scale = useTransform(drawnY, [Math.max(0, threshold - 150), threshold], [0, 1]);
  const opacity = useTransform(drawnY, [Math.max(0, threshold - 80), threshold], [0, 1]);

  const textX = commit.cx === 800 ? commit.cx - 40 : commit.cx + 40;
  const textAnchor = (commit.cx === 800 || commit.cx === 600) ? "end" : "start";

  return (
    <g>
      {/* Outer Ring */}
      <motion.circle
        cx={commit.cx}
        cy={commit.cy}
        r={commit.isMerge ? "18" : "14"}
        fill="var(--bg-primary)"
        stroke={commit.color}
        strokeWidth="6"
        filter="url(#premiumGlow)"
        style={{ scale, transformOrigin: `${commit.cx}px ${commit.cy}px` }}
      />
      
      {/* Inner Core */}
      <motion.circle
        cx={commit.cx}
        cy={commit.cy}
        r={commit.isMerge ? "8" : "6"}
        fill={commit.isMerge ? "var(--bg-primary)" : commit.color}
        stroke={commit.isMerge ? commit.color : "none"}
        strokeWidth={commit.isMerge ? "4" : "0"}
        style={{ scale, transformOrigin: `${commit.cx}px ${commit.cy}px` }}
      />
      
      {/* Hash Text */}
      <motion.text
        x={textX}
        y={commit.cy + 6}
        fill="#6B7280"
        fontSize="16"
        fontFamily="monospace"
        fontWeight="bold"
        textAnchor={textAnchor}
        style={{ opacity }}
      >
        {commit.hash}
      </motion.text>
    </g>
  );
};

export default function MergeField({ drawnY, className = "" }) {
  // Master path progress mapped perfectly to Y coordinates
  const pathLengthMain = useTransform(drawnY, [0, 2800], [0, 1]);
  // Blue path: cy starts at 200, ends at 1100
  const pathLengthBlue = useTransform(drawnY, [200, 1100], [0, 1]);
  // Green path: cy starts at 400, ends at 800
  const pathLengthGreen = useTransform(drawnY, [400, 800], [0, 1]);
  // Energy path: cy starts at 1200, ends at 2800
  const pathLengthEnergy = useTransform(drawnY, [1200, 2800], [0, 1]);

  const pathMain = "M 800 0 L 800.1 2800";
  const pathBlue = "M 800 200 C 800 250, 950 250, 950 300 L 950 1000 C 950 1050, 800 1050, 800 1100";
  const pathGreen = "M 950 400 C 950 450, 1100 450, 1100 500 L 1100 700 C 1100 750, 950 750, 950 800";
  
  // Wrap around the Bento grid beautifully and merge back into the main trunk
  const pathEnergy = "M 800 1200 C 800 1300, 500 1300, 500 1400 L 500.1 4500";

  const commits = [
    // Main Trunk
    { cx: 800, cy: 150, color: "url(#purpleGrad)", hash: "init" },
    { cx: 800, cy: 450, color: "url(#purpleGrad)", hash: "b4f2a9" },
    { cx: 800, cy: 1100, color: "url(#purpleGrad)", hash: "Merge feat/auth", isMerge: true },
    { cx: 800, cy: 1600, color: "url(#purpleGrad)", hash: "v1.0.0" },
    { cx: 800, cy: 2200, color: "url(#purpleGrad)", hash: "production" },

    // Blue Feature Branch
    { cx: 950, cy: 350, color: "url(#blueGrad)", hash: "feat/auth" },
    { cx: 950, cy: 600, color: "url(#blueGrad)", hash: "8c1e3d" },
    { cx: 950, cy: 800, color: "url(#blueGrad)", hash: "Merge fix/ui", isMerge: true },
    { cx: 950, cy: 950, color: "url(#blueGrad)", hash: "a1b2c3" },

    // Green Bugfix Branch
    { cx: 1100, cy: 550, color: "url(#greenGrad)", hash: "fix/ui" },
    { cx: 1100, cy: 700, color: "url(#greenGrad)", hash: "e7b210" },

    // Energy Branch (Targeting Bento Grid)
    { cx: 500, cy: 1400, color: "url(#energyGrad)", hash: "start_transfer", isMerge: true },
    { cx: 500, cy: 1800, color: "url(#energyGrad)", hash: "power_up" },
    { cx: 500, cy: 2200, color: "url(#energyGrad)", hash: "bento_active", isMerge: true },
  ];

  return (
    <div className={`absolute top-0 w-full h-full z-0 pointer-events-none flex justify-center overflow-hidden ${className}`}>
      <svg
        className="absolute w-[1200px] h-[4500px] top-[0px]"
        viewBox="0 0 1200 4500"
        fill="none"
      >
        <defs>
          <linearGradient id="purpleGrad" gradientUnits="userSpaceOnUse" x1="800" y1="0" x2="800" y2="4500">
            <stop offset="0%" stopColor="#8A2BE2" />
            <stop offset="100%" stopColor="#4A43A6" />
          </linearGradient>
          <linearGradient id="blueGrad" gradientUnits="userSpaceOnUse" x1="800" y1="200" x2="950" y2="1100">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="greenGrad" gradientUnits="userSpaceOnUse" x1="950" y1="400" x2="1100" y2="800">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="energyGrad" gradientUnits="userSpaceOnUse" x1="800" y1="1200" x2="500" y2="2600">
            <stop offset="0%" stopColor="#8A2BE2" />
            <stop offset="50%" stopColor="#DE8A75" />
            <stop offset="100%" stopColor="#83B892" />
          </linearGradient>

          <filter id="premiumGlow" filterUnits="userSpaceOnUse" x="-500" y="-500" width="2200" height="3600">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* BACKGROUND SHADOW TRACKS */}
        <path d={pathMain} stroke="rgba(0,0,0,0.03)" strokeWidth="8" strokeLinecap="round" />
        <path d={pathBlue} stroke="rgba(0,0,0,0.03)" strokeWidth="8" strokeLinecap="round" />
        <path d={pathGreen} stroke="rgba(0,0,0,0.03)" strokeWidth="8" strokeLinecap="round" />
        <path d={pathEnergy} stroke="rgba(0,0,0,0.03)" strokeWidth="8" strokeLinecap="round" />

        {/* ANIMATED TRACKS */}
        <motion.path
          d={pathMain}
          stroke="url(#purpleGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#premiumGlow)"
          style={{ pathLength: pathLengthMain }}
        />

        <motion.path
          d={pathBlue}
          stroke="url(#blueGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#premiumGlow)"
          style={{ pathLength: pathLengthBlue }}
        />

        <motion.path
          d={pathGreen}
          stroke="url(#greenGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#premiumGlow)"
          style={{ pathLength: pathLengthGreen }}
        />

        <motion.path
          d={pathEnergy}
          stroke="url(#energyGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#premiumGlow)"
          style={{ pathLength: pathLengthEnergy }}
        />

        {/* COMMITS (NODES) */}
        {commits.map((commit, i) => (
          <CommitNode key={i} commit={commit} drawnY={drawnY} />
        ))}
      </svg>
    </div>
  );
}
