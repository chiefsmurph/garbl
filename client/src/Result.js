export default ({ history }) => {
    const file = window.location.hash.slice(4).split('?').slice(1).join('');
    const audioUrl = `outputs/${file}`;
    return (
        <div className="result-page">
            <div className="result-box"><h2>result: </h2><i>{audioUrl}</i></div>
            <div>
                <audio controls preload="metadata">
                    <source src={audioUrl} type={audioUrl.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg'} />
                    Your browser does not support the audio element.
                </audio>
            </div>
            <br/>
            <a href={audioUrl} download>Click to download</a><br/><br/>
            <a href='#' onClick={() => history.push('/')}>Click to start over</a><br/>
        </div>
    );
}