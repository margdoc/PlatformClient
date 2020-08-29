import * as History from '../_utils/history';

import * as HomePage from './HomePage';
import * as LoginPage from './LoginPage';

interface HomePageRoute {
  type: "HomePageRoute";
}

interface LoginPageRoute {
  type: "LoginPageRoute";
  redirect?: Route;
}
  
export type Route =
  | { type: "NotFound" }
  | HomePageRoute
  | LoginPageRoute
;
  
export const routeFromLocation = (location: Array<string>): Route => {
  return { type: "NotFound"}
}

export const locationFromRoute = (route: Route): Partial<History.Location> => {
  return { paths: [] }
}