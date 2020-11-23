import logo from './logo.svg';
import './App.css';
import { Component } from 'react';
import FileUpload from './FileUpload';

class Upload extends Component {
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

    fileSelected = evt => {
        const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;
        const oData = new FormData();
        oData.append("audioFile", evt.target.files[0]);

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url('upload'), true);
        console.log(evt.target.files[0]);
        this.setState({ statusText: 'loading' });
        xhr.onload = this.onLoadHandler(xhr, () => `/select?${evt.target.files[0].name}`);
        xhr.onerror = function () {
            console.log("** An error occurred during the transaction");
        };
        xhr.send(oData);
        evt.preventDefault();
    };

    youtubeSelected = () => {
        const inputVal = document.querySelector('input[type="text"]').value;
        console.log({ inputVal})

        const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url('fetch'), true);
        xhr.setRequestHeader('Content-type', 'application/json');
        this.setState({ statusText: 'loading' });
        
        xhr.onload = this.onLoadHandler(xhr, () => `/select?${JSON.parse(xhr.responseText).file}`);
        xhr.send(JSON.stringify({
            url: inputVal
        }));
    }

    render() {
        return this.state.statusText ? this.state.statusText : (
        <div className="upload-page">
            <p class="select-mp3">
                <h2>select an mp3</h2>
                <div>
                    <FileUpload onChange={this.fileSelected} />
                </div>
            </p>
            <h3>or...</h3>
            <p>
                <h2>use a youtube url</h2>
                <div className="youtube-selector">
                    <input type="text"/>
                    <input type="submit" onClick={this.youtubeSelected} value="select" />
                </div>
            </p>
        </div>
        );
    }
}

export default Upload;
