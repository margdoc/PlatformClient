import React from "react";
import { Button, Nav, Navbar, Spinner } from "react-bootstrap";

import * as Api from "api-client/client";
import * as Auth from "utils/Auth";
import { defer } from "utils/Effects";
import * as History from "utils/History";
import * as LocalStorage from "utils/LocalStorage";
import { getModel, mapLoop, mapModel, Batch, EMPTY, Loop, LoopReducer } from "utils/Loop";

import * as GamePage from "./GamePage";
import * as HomePage from "./HomePage";
import * as LoginPage from "./LoginPage";
import * as RegisterPage from "./RegisterPage";

import { locationFromRoute, routeChanged, routeFromLocation, Route } from "./routes";

export type Page =
  | { type: "NotFound" }
  | HomePage.State
  | LoginPage.State
  | RegisterPage.State
  | GamePage.State
;

interface LoggedOffState {
  type: "LoggedOffState";
  page: Page;
  route: Route;
}

interface UserData extends Api.User {
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
  response: Api.Token;
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
  authToken?: string;
}

interface GotUserData {
  type: "GotUserData";
  data: Api.User;
}

export interface RouteChanged {
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

interface GamePageAction {
  type: "GamePageAction";
  action: GamePage.Action;
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
  | GamePageAction
;


interface Props {
  state: State;
  dispatch: (action: Action) => void;
  createLink: () => History.LinkType<Route>;
}


export const reducer: LoopReducer<State, Action> = (prevState, action) => {
  if (prevState.type === "FetchingLocalStorageState") {
    const newRoute = routeFromLocation(window.location.pathname.split("/"));

    switch (action.type) {
      case "FetchLocalStorage":
        return [prevState, new LocalStorage.GetItem<LocalStorageLogIn>(Auth.LocalStorageKey, response => ({
            type: "LocalStorageLogIn",
            authToken: response || undefined,
          }))
        ];
      case "LocalStorageLogIn":
        return action.authToken
        ? [
          getModel(mapModel(routeChanged(newRoute), page => {
            return {
              type: "LoggedInState",
              page,
              route: newRoute
            };
          })),
          Api.WebAppClient.getMe<GotUserData>(response => ({
            type: "GotUserData",
            data: response,
          }))
        ]
        : [{
            type: "LoggedOffState",
            page: routeChanged(newRoute)[0],
            route: prevState.route,
          }, routeChanged(newRoute)[1]];
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
    if (action.type === "RouteChanged") {
      const loop = routeChanged(action.route);

      return [{
        ...prevState,
        route: action.route,
        page: loop[0],
      }, loop[1]];
    }

    if (action.type === "LogInResponse") {
      return [{
          type: "FetchingLocalStorageState",
          page: HomePage.initialLoop[0],
          route: { type: "HomePageRoute" }
        }, new LocalStorage.SetItem<FetchLocalStorage>(
          Auth.LocalStorageKey,
          action.response.accessToken,
            () => ({
            type: "FetchLocalStorage",
          })
        )
      ];
    }

    if (action.type === "LogOutResponse") {
      return [{
          type: "LoggedOffState",
          route: {
            type: "HomePageRoute",
          },
          page: HomePage.initialLoop[0],
        }, new LocalStorage.RemoveItem(Auth.LocalStorageKey),
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
      );
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
        loginPageAction => (
          loginPageAction.type === "RouteChanged"
          ? loginPageAction
          : {
            type: "LoginPageAction",
            action: loginPageAction,
          })
      );
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

    if (
      action.type === "GamePageAction" &&
      prevState.page.type === "GamePageState"
    ) {
      return mapLoop(
        GamePage.reducer(prevState.page, action.action),
        gamePage => ({
          ...prevState,
          page: gamePage
        }),
        gamePageAction => ({
              type: "GamePageAction",
              action: gamePageAction,
        })
      );
    }
  }

  return [prevState, EMPTY];
};

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
};

interface NavProps {
  page: NavPage;
  text: string;
}

const NavLink: React.FunctionComponent<NavProps> = ({ page, text }) => {
  const route = navPageToRoute(page);
  const paths = locationFromRoute(route).paths;

  const location = "/".concat(
    paths !== undefined
      ? paths.join("/")
      : ""
  );

  return <Nav.Item>
    <Nav.Link
      eventKey={route}
      href={location}
    >
      {text}
    </Nav.Link>
  </Nav.Item>;
};

export const render: React.FunctionComponent<Props> = ({ state, dispatch, createLink }) => {
  const getNavbar = () => {
    const Link = createLink();

    if (state.type === "FetchingLocalStorageState") {
      return <div>
        <Spinner animation="border" role="status" />
        Loading...
      </div>;
    }

    return <div>
      <Link to={{ type: "HomePageRoute" }}>Home</Link>
      {state.type === "LoggedOffState"
        ? <>
          <Link to={{ type: "LoginPageRoute" }}>Login</Link>
          <Link to={{ type: "RegisterPageRoute" }}>Register</Link>
        </>
        : <>
          <div>{state.userData ? state.userData.username : "..."}</div>
        </>
      }
    </div>;
    /*
    if (state.type === "FetchingLocalStorageState") {
      return <Navbar bg="light" expand="lg">
        <Nav.Item>
          <Spinner animation="border" role="status" />Loading...
        </Nav.Item>
      </Navbar>;
    }


    return <Navbar bg="light" expand="lg">
      <Nav
        activeKey={state.route.type}
        onSelect={(eventKey: any) => {
            const page = eventKey as NavPage;

            if (page === "Logout") {
              dispatch({ type: "LogOutResponse" });
            }
            else {
              dispatch({
                type: "RouteChanged",
                route: navPageToRoute(page)
              });
            }
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
    </Navbar>;*/
  };

  const getContent = () => {
    if (state.type === "FetchingLocalStorageState") {
      return <div>Loading...</div>;
    }

    switch (state.page.type) {
      case "HomePageState":
        return <HomePage.render />;
      case "LoginPageState":
          return <LoginPage.render dispatch={(action: LoginPage.Action) => {
            dispatch({
              type: "LoginPageAction",
              action
            });
          }} />;
      case "RegisterPageState":
          return <RegisterPage.render dispatch={(action: RegisterPage.Action) => {
            dispatch({
              type: "RegisterPageAction",
              action
            });
          }} />;
      case "GamePageState":
        return <GamePage.render />;
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <div>
      {getNavbar()}
      {getContent()}
    </div>
  );
};