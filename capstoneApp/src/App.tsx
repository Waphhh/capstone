import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Register from './pages/Register';
import AccoundSetup from './pages/accountSetup';
import Library from './pages/Library';
import ElderlyRequests from './pages/ElderlyRequests';
import MakeRequest from './pages/MakeRequest';
import OTP from './pages/OTP';

/* Admin */
import Admin from './pages/Admin';
import Requests from './pages/Requests';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
// import '@ionic/react/css/palettes/dark.system.css';

import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/login" component={Login} exact={true}/>
        <Route path="/otp" component={OTP} exact={true}/>
        <Route path="/tabs/register" component={Register} exact={true}/>
        <Route path="/tabs/accountsetup" component={AccoundSetup} exact={true}/>
        <Route path="/tabs/home" component={Home} exact={true}/>
        <Route path="/tabs/library" component={Library} exact={true}/>
        <Route path="/tabs/settings" component={Settings} exact={true}/>
        <Route path="/tabs/elderlyrequests" component={ElderlyRequests} exact={true}/>
        <Route path="/tabs/makerequest" component={MakeRequest} exact={true}/>
        <Route path="/admin" component={Admin} exact={true}/>
        <Route path="/requests" component={Requests} exact={true}/>
        <Route exact path="/" render={() => <Redirect to="/login" />}/>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
