import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button'

import { Loop, EMPTY, LoopReducer, mapLoop, getState, mapState, defer, batch } from '../utils/loop';
import { AuthToken, getAuthToken, setAuthToken, removeAuthToken } from '../utils/auth-token';
import * as HomePage from './HomePage';
import * as LoginPage from './LoginPage';
import { AuthClient, UserClient } from '../services';

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
  username: string;
  email: string;
  id: string;
  is_active: boolean;
  is_superuser: boolean;
  name: string;
  lastname: string;
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
  authToken?: AuthToken; 
}

interface GotUserData {
  type: "GotUserData";
  data: UserClient.UserDataResponse;
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
          authToken: getAuthToken(),
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
          UserClient.apiUserData<GotUserData>(response => ({
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
    if (action.type === "LogInResponse") {
      //@ts-ignore
      setAuthToken(action.response.access_token, action.response.token_type);

      return [{
        type: "LoggedInState",
        page: HomePage.initialLoop[0],
      }, UserClient.apiUserData<GotUserData>(response => ({
        type: "GotUserData",
        data: response,
      }))];
    }

    if (action.type === "LogOutResponse") {
      removeAuthToken();

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

    if (action.type === "GotUserData") {
      return [{
        ...prevState,
        userData: {
          ...action.data
        }
      }, EMPTY];
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
        loginPageAction => {
          if (
            loginPageAction.type === "LoginResponse" &&
            loginPageAction.response.type === "LogInSuccessResponse")
            return {
              type: "LogInResponse",
              response: loginPageAction.response
            }
          else
            return {
              type: "LoginPageAction",
              action: loginPageAction,
            };
        }
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
    return <>
      <Button href="/">Home</Button>
      { state.type === "LoggedInState" 
        ? <>
          <Button>{state.userData?.username || "..."}</Button>
          <Button onClick={() => {
            dispatch({ type: "LogOutResponse" })
          }}>Logout</Button>
        </>
        : <Button href="/login">Login</Button>
      }
    </>
  };

  const getContent = () => {
    if (state.type === "FetchingLocalStorageState")
      return <div>Loading...</div>;

    switch (state.page.type) {
      case "HomePageState":
        return <HomePage.render />;
      case "LoginPageState":
          return <LoginPage.render dispatch={(action: LoginPage.Action) => {
            dispatch({
              type: "LoginPageAction",
              action
            });
          }} />
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