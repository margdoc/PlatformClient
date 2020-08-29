import React, { useEffect } from 'react';

import { Loop, EMPTY, LoopReducer, mapLoop, getState, mapState, defer } from '../_utils/loop';
import * as History from '../_utils/history';
import * as HomePage from './HomePage';
import * as LoginPage from './LoginPage';
import { AuthClient } from '../_services';

import { Route, routeFromLocation, routeChanged } from './routes';

export type Page =
  | { type: "NotFound" }
  | HomePage.State
  | LoginPage.State
;

interface LoggedOffState {
  type: "LoggedOffState";
  page: Page;
  route: Route;
}

interface UserData {

}

interface LoggedInState {
  type: "LoggedInState";
  page: Page;
  userData?: UserData;
}

interface FetchingLocalStorageState {
  type: "FetchingLocalStorageState";
  route: Route;
}

export type State = LoggedInState | LoggedOffState | FetchingLocalStorageState;


interface LogInResponse {
  type: "LogInResponse";
  response: AuthClient.LogInResponse;
}

interface LogOutResponse {
  type: "LogOutResponse";
}

interface Login {
  type: "Login";
}

interface Logout {
  type: "Logout";
}

interface FetchLocalStorage {
  type: "FetchLocalStorage";
}

interface LocalStorageLogIn {
  type: "LocalStorageLogIn";
  authToken?: AuthClient.AuthToken; 
}

interface GotUserData {
  type: "GotUserData";
  data: AuthClient.UserDataResponse;
}

interface RouteChanged {
  type: "RouteChanged";
  route: Route;
}

interface HomePageAction {
  type: "HomePageAction";
  action: HomePage.Action;
}

interface LoginPageAction {
  type: "LoginPageAction";
  action: LoginPage.Action;
}

interface InitAction {
  type: "InitAction";
}

export type Action =
  | InitAction
  | FetchLocalStorage
  | LogInResponse
  | LogOutResponse
  | Login
  | Logout
  | LocalStorageLogIn
  | GotUserData
  | RouteChanged
  | HomePageAction
  | LoginPageAction
;


interface Props {
  state: State;
  dispatch: (action: Action) => void;
}

export const reducer: LoopReducer<State, Action> = (prevState, action) => {
  if (action.type === "InitAction") {
    return [prevState, initialLoop[1]];
  }

  if (prevState.type === "FetchingLocalStorageState") {
    const newRoute = routeFromLocation(window.location.pathname.split("/"));
      
    switch (action.type) {
      case "FetchLocalStorage":
        return [prevState, defer<LocalStorageLogIn>({
          type: "LocalStorageLogIn",
          authToken: AuthClient.getAuthToken(),
        })];
      case "LocalStorageLogIn":
        return action.authToken === undefined 
        ? [{
          type: "LoggedOffState",
          page: routeChanged(newRoute)[0],
          route: prevState.route,
        }, routeChanged(newRoute)[1]]
        : [
          getState(mapState(routeChanged(newRoute), page => {
            return {
              type: "LoggedInState",
              page,
            }
          })),
          AuthClient.apiUserData<GotUserData>(response => ({
            type: "GotUserData",
            data: response,
          }))
        ];
      case "RouteChanged":
        return [{
          ...prevState,
          route: action.route,
        }, routeChanged(newRoute)[1]];
      default:
        [prevState, EMPTY];
    }
  }
  else {
    if (action.type === "LogOutResponse") {
      return [{
          type: "LoggedOffState",
          route: {
            type: "HomePageRoute",
          },
          page: HomePage.initialLoop[0],
        },
        EMPTY,
      ];
    }
  
    if (
      action.type === "HomePageAction" && 
      prevState.page.type === "HomePageState"
    ) {
      return mapLoop(
        HomePage.reducer(prevState.page, action.action),
        homePage => ({
          ...prevState,
          page: homePage
        }),
        homePageAction => ({
          type: "HomePageAction",
          action: homePageAction,
        })
      )
    }
  
    if (
      action.type === "LoginPageAction" &&
      prevState.page.type === "LoginPageState"
    ) {
      return mapLoop(
        LoginPage.reducer(prevState.page, action.action),
        loginPage => ({
          ...prevState,
          page: loginPage
        }),
        loginPageAction => ({
          type: "LoginPageAction",
          action: loginPageAction,
        })
      )
    }
  }

  return [prevState, EMPTY];
}

export const initialLoop: Loop<State, Action> = [{
    type: "FetchingLocalStorageState",
    route: {
      type: "NotFound",
    }
  }, defer<FetchLocalStorage>({ type: "FetchLocalStorage" })
];

/*AuthClient.apiLogin<LogInResponse>(
    { username: "mikgrzebieluch@gmail.com", password: "docend66" }, 
    response => ({
      type: "LogInResponse",
      response: response,
    })
  )*/

export const render: React.FunctionComponent<Props> = ({ state, dispatch }) => {
  const getNavbar = () => {
    
  }

  const getContent = () => {
    if (state.type === "FetchingLocalStorageState")
      return <div>Loading...</div>;

    switch (state.page.type) {
      case "HomePageState":
        return <HomePage.render />;
      case "LoginPageState":
          return <LoginPage.render />
      default:
        return <div>Not Found</div>;
    }
  }
  
  return (
    <div>
      {getNavbar()}
      {getContent()}
    </div>
  );
}