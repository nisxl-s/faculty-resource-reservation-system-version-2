import './LoadingScreen.css';

export default function ErrorScreen({ error }) {
  return (
    <div className="ls-root" role="alert">
      <div className="ls-orb ls-orb-1" />
      <div className="ls-orb ls-orb-2" />
      <div className="ls-orb ls-orb-3" />

      <div className="ls-card">
        <h1 className="ls-title">Something went wrong</h1>
        <p className="ls-error-text">
          {error?.message || "We couldn't load the reservation system."}
        </p>
        <button className="ls-btn" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    </div>
  );
}
