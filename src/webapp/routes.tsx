import * as History from '../utils/history';
import { Loop, mapEffect, EMPTY } from '../utils/loop';

import * as HomePage from './HomePage';
import * as LoginPage from './LoginPage';

import * as App from './App';

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
  const paths = location.filter(item => item !== "");
    
  if (paths.length === 0)
    return { type: "HomePageRoute" };

  switch (paths[0]) {
    case "login":
      return { type: "LoginPageRoute" };
    default:
      return { type: "NotFound"};
  }
}

export const locationFromRoute = (route: Route): Partial<History.Location> => {
  switch (route.type) {
    case "HomePageRoute":
      return { paths: [] };
    case "LoginPageRoute":
      return { paths: ["login"] };
    case "NotFound":
      return { paths: ["not-found"] }
  }
}

export const routeChanged = (route: Route): Loop<App.Page, App.Action> => {
  switch (route.type) {
    case "HomePageRoute":
      return mapEffect(HomePage.initialLoop, action => ({
        type: "HomePageAction",
        action
      }))
    case "LoginPageRoute":
      return mapEffect(LoginPage.initialLoop, action => ({
        type: "LoginPageAction",
        action
      }))
    case "NotFound":
      return [{ type: "NotFound" }, EMPTY];
  }
}