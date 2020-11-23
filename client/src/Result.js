export default () => {
    const audioUrl = `outputs/${window.location.href.split('?').pop()}`;
    return (
        <div>
            <h2>Result</h2>
            <audio controls preload="metadata" style={{ width: '300px' }}>
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio><br/><br/>
            <a href={audioUrl} download>Click to download</a><br/><br/>
            <a href='./'>Click to start over</a><br/>

        </div>
    );
}