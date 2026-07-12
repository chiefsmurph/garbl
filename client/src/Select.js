import { Component } from 'react';
import ProgressBar from './ProgressBar';

const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;
const file = () => decodeURIComponent(getQueryVariable('file'));

function getQueryVariable(variable) {
    var query = window.location.hash.split('?').pop();
    var vars = query.split('&');
    console.log({ query, vars})
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}

export default class extends Component {
    state = { statusText: '', action: null, statusInterval: null, progress: null, progressInterval: null };

    messageThenRoute = (message, route) => {
        clearInterval(this.state.progressInterval);
        this.setState({ progress: 100, statusText: message }, () => {
            setTimeout(() => this.props.history.push(route), 1000);
        });
    };

    checkStatus = () => {
        const { action } = this.state;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url(`status?file=${encodeURIComponent(file())}&action=${action}`), true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onload = () => {
            const { status, result, error, output } = JSON.parse(xhr.responseText);
            if (error) {
                return this.messageThenRoute('sorry, something didn\'t go right', '/');
            } else if (result) {
                return this.messageThenRoute(result, `/result?${encodeURIComponent(output)}`);
            } else {
                this.setState({ statusText: status });
            }
        }
        xhr.send();
    };

    componentWillUnmount() {
        clearInterval(this.state.statusInterval);
        clearInterval(this.state.progressInterval);
    }

    btnClick = action => () => {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url('act'), true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.send(JSON.stringify({ file: file(), action }));

        let p = 5;
        const progressInterval = setInterval(() => {
            p = Math.min(85, p + 2);
            this.setState({ progress: p });
        }, 500);

        this.setState({
            action,
            progress: 5,
            progressInterval,
            statusText: `${action.replace(/e$/, '')}ing...`,
            statusInterval: setInterval(() => this.checkStatus(), 2000),
        });
    };

    render() {
        const { progress, statusText, action } = this.state;
        const allActions = ['scramble', 'unscramble'];
        const qsActions = allActions.filter(type => getQueryVariable(type));
        const disabled = qsActions.length ? allActions.filter(a => qsActions.includes(a)) : [];

        if (progress !== null) {
            return <ProgressBar progress={progress} label={statusText} />;
        }

        return (
            <div className="select-actions">
                <a href="">click here to go back</a>
                <div className="result-box">
                    <h2>file: </h2><i>inputs/{file()}</i>
                    <div>
                        <audio controls preload="metadata">
                            <source src={url(`inputs/${file()}`)} type={file().endsWith('.wav') ? 'audio/wav' : 'audio/mpeg'} />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
                {allActions.map(action => (
                    <button key={action} onClick={this.btnClick(action)} disabled={disabled.includes(action)}>
                        {action.toUpperCase()}
                    </button>
                ))}
            </div>
        );
    }
}
