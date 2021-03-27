export default () => {
    const file = window.location.hash.slice(4).split('?').slice(1).join('');
    const audioUrl = `outputs/${file}`;
    return (
        <div className="result-page">
            <h2 className="result-box">result: <i>{file}</i></h2>
            <div>
                <audio controls preload="metadata">
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>
            </div>
            <br/>
            <a href={audioUrl} download>Click to download</a><br/><br/>
            <a href='./'>Click to start over</a><br/>

        </div>
    );
}