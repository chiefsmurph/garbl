import { Component } from 'react';
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
    state = { statusText: '', action: null, statusInterval: null };

    messageThenRoute = (message, route) =>
        this.setState({ statusText: message }, () => {
            setTimeout(() => {
                this.props.history.push(route);
            }, 2000);
        });

    checkStatus = () => {

        const { action } = this.state;
        console.log('checking status of', action)
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url(`status?file=${encodeURIComponent(file())}&action=${action}`), true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onload = () => {
            console.log('response', xhr.responseText);
            const { status, result, error, output } = JSON.parse(xhr.responseText);
            if (error) {
                return this.messageThenRoute('sorry, something didn\'t go right', '/')
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
    }

    btnClick = action => (evt) => {

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url('act'), true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        this.setState({ statusText: `initializing ${action}`, action });
        xhr.send(JSON.stringify({
            file: file(),
            action
        }));
        this.setState({
            statusInterval: setInterval(() => this.checkStatus(), 2000)
        });
    };

    render() {
        // console.log(this.props.location.search, this.props.location.search.slice(1));
        const allActions = ['scramble', 'unscramble'];
        const qsActions = allActions.filter(type => getQueryVariable(type));
        console.log({ qsActions});
        const disabled = qsActions.length ? allActions.filter(action => qsActions.includes(action)) : [];
        return this.state.statusText ? <label>{this.state.statusText}</label> : (
            <div className="select-actions">
                <a href="">click here to go back</a>
                <div className="result-box">
                    <h2>file: </h2><i>inputs/{file()}</i>
                    <div>
                        <audio controls preload="metadata">
                            <source src={`inputs/${file()}`} type={file().endsWith('.wav') ? 'audio/wav' : 'audio/mpeg'} />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
                {/* <div> */}
                {/* </div> */}
                {
                    allActions.map(action => (
                        <button onClick={this.btnClick(action)} disabled={disabled.includes(action)}>{action.toUpperCase()}</button>
                    ))
                }
            </div>
        );
    }
}