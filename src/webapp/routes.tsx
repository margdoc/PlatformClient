import * as History from '../utils/history';
import { Loop, mapEffect, EMPTY } from '../utils/loop';

import * as HomePage from './HomePage';
import * as LoginPage from './LoginPage';
import * as RegisterPage from './RegisterPage';

import * as App from './App';

interface HomePageRoute {
  type: "HomePageRoute";
}

interface LoginPageRoute {
  type: "LoginPageRoute";
  redirect?: Route;
}

interface RegisterPageRoute {
  type: "RegisterPageRoute";
  redirect?: Route;
}
  
export type Route =
  | { type: "NotFound" }
  | HomePageRoute
  | LoginPageRoute
  | RegisterPageRoute
;
  
export const routeFromLocation = (location: Array<string>): Route => {
  const paths = location.filter(item => item !== "");
    
  if (paths.length === 0)
    return { type: "HomePageRoute" };

  switch (paths[0]) {
    case "login":
      return { type: "LoginPageRoute" };
    case "register":
      return { type: "RegisterPageRoute" };
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
    case "RegisterPageRoute":
      return { paths: ["register"] };
    case "NotFound":
      return { paths: ["not-found"] };
  }
}

export const routeChanged = (route: Route): Loop<App.Page, App.Action> => {
  switch (route.type) {
    case "HomePageRoute":
      return mapEffect(HomePage.initialLoop, action => ({
        type: "HomePageAction",
        action
      }));
    case "LoginPageRoute":
      return mapEffect(LoginPage.initialLoop, action => ({
        type: "LoginPageAction",
        action
      }));
    case "RegisterPageRoute":
      return mapEffect(RegisterPage.initialLoop, action => ({
        type: "RegisterPageAction",
        action
      }));
    case "NotFound":
      return [{ type: "NotFound" }, EMPTY];
  }
}