import { Component } from 'react';
export default class extends Component {
    state = { loading: false };
    btnClick = action => (evt) => {
        const file = this.props.location.search.slice(1);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'act', true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        this.setState({ loading: true });
        xhr.onload = () => {
            // do something to response
            console.log(xhr.responseText);
            this.props.history.push(`/result?${JSON.parse(xhr.responseText).output}`);
        };
        xhr.send(JSON.stringify({
            file,
            action
        }));
    };

    render() {
        return this.state.loading ? 'loading' : (
            <div>
                <code>file: {this.props.location.search.slice(1)}</code><br/><br/>
                <button onClick={this.btnClick('scramble')}>SCRAMBLE</button><br/>
                <button onClick={this.btnClick('unscramble')}>UNSCRAMBLE</button>
            </div>
        );
    }
}