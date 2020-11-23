import { HashRouter, Route, Redirect } from "react-router-dom";
 

import Upload from './Upload';
import Select from './Select';
import Result from './Result';

export default () => (
  <div className="App">
    <div className="App-container">
      <h1>mp3Scrambler</h1>
      <HashRouter>
        <Route exact path="/">
          <Redirect to="/upload" />
        </Route>
        <Route path="/upload" component={Upload} />
        <Route path="/select" component={Select} />
        <Route path="/result" component={Result} />
      </HashRouter>
    </div>
  </div>
);
