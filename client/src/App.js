import { HashRouter, Route, Redirect } from "react-router-dom";
import { useState, useEffect } from 'react';

import Home from './Home';
import Select from './Select';
import Result from './Result';

function Footer() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const url = window.location.hostname === 'localhost' ? 'http://localhost:3009/stats' : '/stats';
    fetch(url).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <footer style={{ marginTop: '3em', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1em', fontSize: '55%', color: 'rgba(255,255,255,0.5)' }}>
      {stats && (
        <p style={{ margin: '0 0 0.5em' }}>
          {stats.scrambles} scramble{stats.scrambles !== 1 ? 's' : ''} &nbsp;·&nbsp; {stats.unscrambles} unscramble{stats.unscrambles !== 1 ? 's' : ''}
        </p>
      )}
      <p style={{ margin: 0 }}>
        For entertainment and research purposes only. This does not guarantee privacy or security.
      </p>
    </footer>
  );
}

export default () => (
  <div className="App">
    <div className="App-container">
      <h1>garbl</h1>
      <HashRouter>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
        <Route path="/home" component={Home} />
        <Route path="/select" component={Select} />
        <Route path="/result" component={Result} />
      </HashRouter>
      <Footer />
    </div>
  </div>
);
