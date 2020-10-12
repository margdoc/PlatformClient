import * as History from "utils/History";
import { mapEffect, EMPTY, Loop } from "utils/Loop";

import * as GamePage from "./GamePage";
import * as HomePage from "./HomePage";
import * as LoginPage from "./LoginPage";
import * as RegisterPage from "./RegisterPage";

import * as App from "./App";

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

interface GamePageRoute {
  type: "GamePageRoute";
  gameId: string;
}

export type Route =
  | { type: "NotFound" }
  | HomePageRoute
  | LoginPageRoute
  | RegisterPageRoute
  | GamePageRoute
;

export const routeFromLocation = (location: Array<string>): Route => {
  const paths = location.filter(item => item !== "");

  if (paths.length === 0) {
    return { type: "HomePageRoute" };
  }

  switch (paths[0]) {
    case "login":
      return { type: "LoginPageRoute" };
    case "register":
      return { type: "RegisterPageRoute" };
    case "game":
      if (paths.length !== 2) {
        return { type: "NotFound"};
      }

      return { type: "GamePageRoute", gameId: paths[1] };
    default:
      return { type: "NotFound"};
  }
};

export const locationFromRoute = (route: Route): Partial<History.Location> => {
  switch (route.type) {
    case "HomePageRoute":
      return { paths: [] };
    case "LoginPageRoute":
      return { paths: ["login"] };
    case "RegisterPageRoute":
      return { paths: ["register"] };
    case "GamePageRoute":
      return { paths: ["game", route.gameId] };
    case "NotFound":
      return { paths: ["not-found"] };
  }
};

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
    case "GamePageRoute":
      return mapEffect(GamePage.initialLoop(route.gameId), action => ({
        type: "GamePageAction",
        action
      }));
    case "NotFound":
      return [{ type: "NotFound" }, EMPTY];
  }
};