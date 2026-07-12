export default function ProgressBar({ progress, label }) {
  return (
    <div style={{ padding: '1em 0' }}>
      {label && <label style={{ display: 'block', marginBottom: '0.5em' }}>{label}</label>}
      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', height: 10 }}>
        <div style={{
          background: 'white',
          height: '100%',
          width: `${progress}%`,
          transition: 'width 0.4s ease',
          borderRadius: 4,
        }} />
      </div>
      <div style={{ fontSize: '50%', textAlign: 'right', marginTop: '0.3em', opacity: 0.5 }}>{progress}%</div>
    </div>
  );
}
