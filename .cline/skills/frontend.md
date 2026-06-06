# Frontend Design Skill

## Aesthetic Direction
GitHub dark mode — premium developer tool. Clean, sharp, trustworthy.
Not a startup landing page. Not a student project. A real product.

## Colors — Always Use These
- Background: #0a0a0a
- Card: #161b22
- Border: #30363d  
- Green accent: #238636
- Text: #f0f6fc
- Muted text: #8b949e
- Red/error: #f85149

## Typography
- Headings: Space Mono (monospace, feels like code)
- Body: DM Sans (clean, readable)
- Code snippets: Space Mono

## Component Rules
- Cards: bg-[#161b22] border border-[#30363d] rounded-lg p-4
- Buttons primary: bg-[#238636] hover:bg-[#2ea043] text-white rounded-md px-4 py-2
- Buttons secondary: border border-[#30363d] text-[#f0f6fc] hover:bg-[#161b22]
- Inputs: bg-[#0d1117] border border-[#30363d] rounded-md text-[#f0f6fc]
- Badges: small, rounded-full, colored by status

## Layout Rules
- Max content width: 1200px centered
- Sidebar + main content layout for Explore page
- Dashboard uses grid layout
- Always mobile-responsive

## Micro Interactions
- Hover states on all clickable elements
- Smooth transitions: transition-all duration-200
- Loading skeletons instead of spinners where possible
- Score rings animate on mount

## What to Avoid
- White backgrounds
- Generic blue primary color
- Rounded corners above 12px
- Shadows (borders work better in dark mode)
- Any font except Space Mono and DM Sans