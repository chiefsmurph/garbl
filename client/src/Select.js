import { Component } from 'react';
const file = () => decodeURIComponent(window.location.hash.slice(4).split('?').slice(1).join(''));
export default class extends Component {
    state = { loading: false };
    btnClick = action => (evt) => {

        const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url('act'), true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        this.setState({ loading: true });
        xhr.onload = () => {
            // do something to response
            console.log(xhr.responseText);
            this.props.history.push(`/result?${JSON.parse(xhr.responseText).output}`);
        };
        xhr.send(JSON.stringify({
            file: file(),
            action
        }));
    };

    render() {
        // console.log(this.props.location.search, this.props.location.search.slice(1));
        console.log()
        return this.state.loading ? 'loading' : (
            <div>
                <code>file: {file()}</code><br/><br/>
                <button onClick={this.btnClick('scramble')}>SCRAMBLE</button><br/>
                <button onClick={this.btnClick('unscramble')}>UNSCRAMBLE</button>
            </div>
        );
    }
}