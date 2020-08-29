import React, { useEffect } from 'react';

import { Loop, EMPTY, LoopReducer } from '../_utils/loop';
import * as History from '../_utils/history';
import * as HomePage from './HomePage';
import * as LoginPage from './LoginPage';
import { AuthClient } from '../_services';

import { Route } from './routes';

type Page =
  | { type: "NotFound" }
  | HomePage.State
  | LoginPage.State
;

export interface State {
  page: Page;
}



interface LoginResponse {
  type: "LoginResponse";
  response: AuthClient.LoginResponse;
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
  | LoginResponse
  | RouteChanged
  | HomePageAction
  | LoginPageAction
;



interface Props {
  state: State;
  dispatch: (action: Action) => void;
}

export const reducer: LoopReducer<State, Action> = (prevState, action) => {
  if (action.type === "InitAction")
    return [prevState, AuthClient.apiLogin<LoginResponse>(
      { username: "mikgrzebieluch@gmail.com", password: "docend66" }, 
      response => ({
        type: "LoginResponse",
        response: response,
      })
    )];

  return [prevState, EMPTY];
}

export const initialState: State = {
  page: {
    type: "NotFound",
  },
};

export const render: React.FunctionComponent<Props> = ({ state, dispatch }) => {
  useEffect(() => dispatch({ type: "InitAction" }), []);


  const getContent = () => {
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
      {getContent()}
    </div>
  );
}