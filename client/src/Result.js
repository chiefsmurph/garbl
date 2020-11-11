export default () => (
    <div>
        <h2>Result</h2>
        <a href={`outputs/${window.location.href.split('?').pop()}`} download>Click to download</a><br/>
        <a href='./'>Click to start over</a><br/>

    </div>
);