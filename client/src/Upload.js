import logo from './logo.svg';
import './App.css';
import { Component } from 'react';

class Upload extends Component {
    state = { loading: false };
    fileSelected = evt => {
        const oData = new FormData();
        oData.append("audioFile", evt.target.files[0]);

        var oReq = new XMLHttpRequest();
        oReq.open("POST", "upload", true);
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

    render() {
        return this.state.loading ? 'loading' : (
        <div>
            <h2>Select an mp3</h2>
            <input type="file" accept=".mp3" onChange={this.fileSelected} />
        </div>
        );
    }
}

export default Upload;
