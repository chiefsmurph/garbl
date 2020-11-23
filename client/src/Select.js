import { Component } from 'react';
const file = () => decodeURIComponent(window.location.hash.slice(4).split('?').slice(1).join(''));
export default class extends Component {
    state = { statusText: '' };

    somethingDidntGoRight = () =>
        this.setState({ statusText: 'sorry, something didn\'t go right'}, () => {
            setTimeout(() => {
                this.props.history.push('/');
            }, 2000);
        });

    onLoadHandler = (xhr, successRoute) => () => {
        // do something to response
        console.log(xhr.responseText);
        const isError = xhr.responseText.includes('Error');
        return isError
            ? this.somethingDidntGoRight()
            : this.props.history.push(successRoute());
    };
    btnClick = action => (evt) => {

        const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url('act'), true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        this.setState({ statusText: `current ${action} in progress` });
        xhr.onload = this.onLoadHandler(xhr, () => `/result?${JSON.parse(xhr.responseText).output}`);
        xhr.send(JSON.stringify({
            file: file(),
            action
        }));
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