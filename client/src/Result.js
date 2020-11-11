export default () => (
    <div>
        <h1>Result</h1>
        <a href={`http://localhost:3008/outputs/${window.location.href.split('?').pop()}`} download>Click to download</a><br/>
        <a href='/'>Click to start over</a><br/>

    </div>
);