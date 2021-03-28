import logo from './logo.svg';
import './App.css';
import { Component } from 'react';
import FileUpload from './FileUpload';



class Record extends Component {
    maxDuration = 15;
    recordTimeout;
    defaultState = {
        mediaRecorder: null,
        dataArray: [],
        status: 0,  // 0 = nada, 1: recording, 2: finished
    };
    state = this.defaultState;
    startRecording = async () => {
        let audioIN = { audio: true }; 
        const mediaStreamObj = await navigator.mediaDevices.getUserMedia(audioIN) 
        const mediaRecorder = new MediaRecorder(mediaStreamObj);
        mediaRecorder.ondataavailable = ev => {
            this.setState(({ dataArray }) => ({
                dataArray: [...dataArray, ev.data],
            }), () => {
                var audio = document.getElementById('adioplay');
                audio.controls = true;
                var blob = new Blob(this.state.dataArray, { type: 'audio/ogg; codecs=opus' });
                var audioURL = window.URL.createObjectURL(blob);
                audio.src = audioURL;
                console.log("recorder stopped");
                this.setState({ blob, status: 2 });
            });
        };
        this.setState({
            mediaRecorder,
            status: 1
        }, () => {
            console.log('starting');
            mediaRecorder.start();
        });
        this.recordTimeout = setTimeout(() => {
            this.stopRecording();
            setTimeout(() => alert(`max record duration: ${this.maxDuration} seconds`), 100);
        }, this.maxDuration * 1000);
    };
    stopRecording = () => {
        console.log(this.state);
        this.state.mediaRecorder.stop();
        clearTimeout(this.recordTimeout);
    };
    rerecord = () => {
        this.setState(this.defaultState);
        document.getElementById('adioplay').src = null;
        document.getElementById('adioplay').controls = false;
    };
    sendRecording = () =>
        this.props.onBlob(
            this.state.blob
        );
    render() {
        const { status } = this.state;
        const statusText = ['hit record', 'recording...', 'review audio']
        return (
            <div className="recorder-container">
                <div className={`recorder status${status}`}>
                    <h2>{statusText[status]}</h2>
                    <div>
                        {
                            status === 0 && (
                                <button onClick={this.startRecording}>record</button>
                            )
                        }
                        {
                            status === 1 && (
                                <button onClick={this.stopRecording}>stop</button>
                            )
                        }
                        {
                            status === 2 && (
                                <>
                                    <button onClick={this.rerecord}>rerecord</button>
                                    <br/>
                                    <button onClick={this.sendRecording}>send</button>
                                </>
                            )
                        }
                    </div>
                </div>
                <audio id="adioplay"/>
            </div>
        )
    }
}


class Home extends Component {
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

    fileSelected = (evt, forceName) => {
        const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;
        const oData = new FormData();
        oData.append("audioFile", evt.target.files[0]);
        if (forceName) {
            oData.append("forceName", forceName);
        }
        const name = forceName ? `${forceName}.mp3` : evt.target.files[0].name;
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url('upload'), true);
        console.log(evt.target.files[0]);
        this.setState({ statusText: 'loading' });
        const forceAction = forceName 
            ? '&unscramble'
            : name.includes('scrambled')
                ? '&scramble'
                : '';
        xhr.onload = this.onLoadHandler(xhr, () => `/select?file=${name}${forceAction}`);
        xhr.onerror = function () {
            console.log("** An error occurred during the transaction");
        };
        xhr.send(oData);
        evt.preventDefault && evt.preventDefault();
    };

    youtubeSelected = () => {
        const inputVal = document.querySelector('input[type="text"]').value;
        console.log({ inputVal})

        const url = s => window.location.hostname === 'localhost' ? `http://localhost:3009/${s}` : s;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url('fetch'), true);
        xhr.setRequestHeader('Content-type', 'application/json');
        this.setState({ statusText: 'loading' });
        
        xhr.onload = this.onLoadHandler(xhr, () => `/select?${encodeURIComponent(JSON.parse(xhr.responseText).file)}`);
        xhr.send(JSON.stringify({
            url: inputVal
        }));
    }

    handleBlob = blob => {
        const fakeEvent = {
            target: {
                files: [blob]
            }
        };
        const usersDesiredName = window.prompt('what do you want to call this?')
        const forceName = (usersDesiredName || '').split('').filter(char => /[a-zA-Z0-9_]/.test(char)).join('');

        forceName.length &&
            this.fileSelected(
                fakeEvent,
                forceName
            );
    };

    render() {
        return this.state.statusText ? <label>{this.state.statusText}</label> : (
        <div className="upload-page">
            <Record onBlob={this.handleBlob}/>
            <h3>or...</h3>
            <p className="select-mp3">
                <h2>select an mp3</h2>
                <div>
                    <FileUpload onChange={this.fileSelected} />
                </div>
            </p>
            {/* <h3>or...</h3>
            <p>
                <h2>use a youtube url</h2>
                <div className="youtube-selector">
                    <input type="text"/>
                    <input type="submit" onClick={this.youtubeSelected} value="select" />
                </div>
            </p> */}
        </div>
        );
    }
}

export default Home;
