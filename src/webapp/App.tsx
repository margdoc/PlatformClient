import React, { useEffect } from 'react';
import { Button, Navbar, Nav, Spinner } from 'react-bootstrap';

import { Loop, EMPTY, LoopReducer, mapLoop, getState, mapState, defer, batch } from '../utils/loop';
import { AuthToken, getAuthToken, setAuthToken, removeAuthToken } from '../utils/auth-token';
import * as HomePage from './HomePage';
import * as LoginPage from './LoginPage';
import * as RegisterPage from './RegisterPage';
import { AuthClient, UserClient } from '../services';

import { Route, routeFromLocation, routeChanged, locationFromRoute } from './routes';

export type Page =
  | { type: "NotFound" }
  | HomePage.State
  | LoginPage.State
  | RegisterPage.State
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
  route: Route;
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

interface RegisterPageAction {
  type: "RegisterPageAction";
  action: RegisterPage.Action;
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
  | RegisterPageAction
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
              route: newRoute
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
        route: { type: "HomePageRoute" }
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

    if (
      action.type === "RegisterPageAction" &&
      prevState.page.type === "RegisterPageState"
    ) {
      return mapLoop(
        RegisterPage.reducer(prevState.page, action.action),
        registerPage => ({
          ...prevState,
          page: registerPage
        }),
        registerPageAction => ({
              type: "RegisterPageAction",
              action: registerPageAction,
        })
      );
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

type NavPage = "HomePageRoute" | "LoginPageRoute" | "RegisterPageRoute" | "ProfilePage" | "Logout";

const navPageToRoute = (page: NavPage): Route => {
  switch (page) {
    case "HomePageRoute":
      return { type: "HomePageRoute" };
    case "LoginPageRoute":
      return { type: "LoginPageRoute" };
    case "RegisterPageRoute":
      return { type: "RegisterPageRoute" };
    default:
      return { type: "NotFound" };
  }
}

interface NavProps {
  page: NavPage;
  text: string;
}

const NavLink: React.FunctionComponent<NavProps> = ({ page, text }) => {
  const route = navPageToRoute(page);
  const paths = locationFromRoute(route).paths;

  const location = '/'.concat(
    paths !== undefined
      ? paths.join('/')
      : ''
  );

  return <Nav.Item>
    <Nav.Link 
      eventKey={route} 
      href={location}
    >
      {text}
    </Nav.Link>
  </Nav.Item>
}

export const render: React.FunctionComponent<Props> = ({ state, dispatch }) => {
  const getNavbar = () => {
    if (state.type === "FetchingLocalStorageState")
      return <Navbar bg="light" expand="lg">
        <Nav.Item>
          <Spinner animation="border" role="status" />Loading...
        </Nav.Item>
      </Navbar>


    return <Navbar bg="light" expand="lg">
      <Nav 
        activeKey={state.route.type}
        onSelect={(eventKey: any) => {
            const page = eventKey as NavPage; 

            if (page === "Logout")
              dispatch({ type: "LogOutResponse" });
            else
              dispatch({
                type: "RouteChanged",
                route: navPageToRoute(page)
              });
          }}
      >
        <NavLink page={"HomePageRoute"} text={"Home"} />
        { state.type === "LoggedInState"
          ? <>
            <NavLink page={"ProfilePage"} text={state.userData?.username || "..."} />
            <NavLink page={"Logout"} text={"Logout"} />
          </>
          : <>
            <NavLink page={"LoginPageRoute"} text={"Login"} />
            <NavLink page={"RegisterPageRoute"} text={"Register"} />
          </>
        }
      </Nav>
    </Navbar>
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
      case "RegisterPageState":
          return <RegisterPage.render dispatch={(action: RegisterPage.Action) => {
            dispatch({
              type: "RegisterPageAction",
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