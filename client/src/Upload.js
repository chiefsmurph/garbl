import logo from './logo.svg';
import './App.css';
import { Component } from 'react';
import FileUpload from './FileUpload';

class Upload extends Component {
    state = { loading: false };
    fileSelected = evt => {
        const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;
        const oData = new FormData();
        oData.append("audioFile", evt.target.files[0]);

        var oReq = new XMLHttpRequest();
        oReq.open("POST", url('upload'), true);
        console.log(evt.target.files[0]);
        this.setState({ loading: true });
        oReq.onload = () => {
            setTimeout(() => {
                this.setState({ loading: false });
                this.props.history.push(`/select?${evt.target.files[0].name}`);
            }, 2000);
            console.log(oReq.status);
        };

        oReq.send(oData);
        evt.preventDefault();
    };

    youtubeSelected = () => {
        const inputVal = document.querySelector('input[type="text"]').value;
        console.log({ inputVal})

        const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url('fetch'), true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        this.setState({ loading: true });
        xhr.onload = () => {
            // do something to response
            console.log(xhr.responseText);
            this.props.history.push(`/select?${JSON.parse(xhr.responseText).file}`);
        };
        xhr.send(JSON.stringify({
            url: inputVal
        }));
    }

    render() {
        return this.state.loading ? 'loading' : (
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
