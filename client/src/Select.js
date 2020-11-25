import { Component } from 'react';
const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;
const file = () => decodeURIComponent(window.location.hash.slice(4).split('?').slice(1).join(''));
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
                return this.messageThenRoute(result, `/result?${output}`);
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
        console.log()
        return this.state.statusText ? this.state.statusText : (
            <div>
                <code>file: {file()}</code><br/><br/>
                <button onClick={this.btnClick('scramble')}>SCRAMBLE</button><br/>
                <button onClick={this.btnClick('unscramble')}>UNSCRAMBLE</button>
            </div>
        );
    }
}