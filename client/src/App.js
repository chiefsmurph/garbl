import { HashRouter, Route, Redirect } from "react-router-dom";
 

import Home from './Home';
import Select from './Select';
import Result from './Result';

export default () => (
  <div className="App">
    <div className="App-container">
      <h1>mp3Scrambler</h1>
      <HashRouter>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
        <Route path="/home" component={Home} />
        <Route path="/select" component={Select} />
        <Route path="/result" component={Result} />
      </HashRouter>
    </div>
  </div>
);
