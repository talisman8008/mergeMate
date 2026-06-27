import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <>
      <style>{`
        .notfound-container {
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background-color: var(--bg-primary, #17151F);
          font-family: system-ui, -apple-system, sans-serif;
        }
        .notfound-wrapper {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 80px;
          max-width: 1100px;
          width: 100%;
        }
        .notfound-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .notfound-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notfound-img {
          max-width: 100%;
          max-height: 500px;
          object-fit: contain;
          animation: fadein 0.6s ease forwards;
        }
        @keyframes fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .breadcrumb {
          color: var(--text-faint, #6E6A86);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          margin-bottom: 40px;
        }
        /* Mobile styles */
        @media (max-width: 768px) {
          .notfound-wrapper {
            flex-direction: column;
            gap: 40px;
          }
          .notfound-right {
            order: -1; /* image on top */
          }
          .notfound-left {
            text-align: center;
            align-items: center;
          }
          .buttons-container {
            justify-content: center;
          }
          .notfound-subtext {
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>

      <div className="notfound-container">
        <div className="notfound-wrapper">
          <div className="notfound-left">
            <div className="breadcrumb">firstmerge / 404</div>
            
            <div style={{ color: '#9F97F0', fontSize: '96px', fontWeight: 800, lineHeight: 1, marginBottom: '8px' }}>
              404
            </div>
            
            <h1 style={{ color: 'var(--text-primary, #F2F1F7)', fontSize: '36px', fontWeight: 700, marginBottom: '16px', marginTop: 0 }}>
              This PR got rejected.
            </h1>
            
            <p className="notfound-subtext" style={{ color: 'var(--text-muted, #9C99AD)', fontSize: '16px', lineHeight: 1.7, maxWidth: '400px', marginBottom: '32px', marginTop: 0 }}>
              The page you're looking for was never merged — or got lost somewhere between branches.
            </p>
            
            <div className="buttons-container" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/explore" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: '#5B4FE3',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                  Back to Explore →
                </button>
              </Link>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'transparent',
                  border: '1px solid var(--border, #322F42)',
                  color: 'var(--text-muted, #9C99AD)',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  Go Home
                </button>
              </Link>
            </div>
            
            <div style={{
              color: 'var(--text-faint, #6E6A86)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '11px',
              letterSpacing: '0.1em',
              marginTop: '48px',
            }}>
              ERROR_404 · PAGE_NOT_FOUND · VERDICT: TRIVIAL
            </div>
          </div>
          
          <div className="notfound-right">
            <img src="/404-mascot.png" alt="Rejected PR mascot" className="notfound-img" />
          </div>
        </div>
      </div>
    </>
  )
}
