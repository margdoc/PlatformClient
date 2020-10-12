import React from "react";
import { Button, Form } from "react-bootstrap";
import styled from "styled-components";

import * as Api from "api-client/client";
import * as Auth from "utils/Auth";
import { defer } from "utils/Effects";
import * as LocalStorage from "utils/LocalStorage";
import { EMPTY, Loop, LoopReducer } from "utils/Loop";

import { Route, RouteChanged } from "../index";

export interface State {
  type: "LoginPageState";
  response?: string;
}

interface LoginRequest {
  type: "LoginRequest";
  request: Api.BodyLoginAuthLoginPost;
}

interface LoginResponse {
  type: "LoginResponse";
  response: Api.Token;
}

interface FetchedAuthToken {
  type: "FetchedAuthToken";
}

export type Action = LoginRequest | LoginResponse | FetchedAuthToken | RouteChanged;

export const reducer: LoopReducer<State, Action> = (state: State, action: Action) => {
  switch (action.type) {
    case "LoginRequest":
      return [
        state, Api.WebAppClient.login<LoginResponse>(action.request, response => ({
          type: "LoginResponse",
          response
        }))
      ];
    case "LoginResponse":
      return [
        state, new LocalStorage.SetItem<FetchedAuthToken>(
          Auth.LocalStorageKey,
          action.response.accessToken,
            () => ({
            type: "FetchedAuthToken",
          })
        )
      ];
    case "FetchedAuthToken":
      return [state, defer<RouteChanged>({
        type: "RouteChanged",
        route: { type: "HomePageRoute" }
      })];
    case "RouteChanged":
      return [state, EMPTY];
  }
};

export const initialLoop: Loop<State, Action> = [{
    type: "LoginPageState",
  }, EMPTY
];

interface Props {
  dispatch: (action: Action) => void;
}

const FormWrapper = styled.div`
`;

export const render: React.FunctionComponent<Props> = ({ dispatch }) => {
  const usernameInput = React.createRef<HTMLInputElement>();
  const passwordInput = React.createRef<HTMLInputElement>();

  return <FormWrapper>
      <Form>
        <Form.Group controlId="loginForm">
          <Form.Control type="username" placeholder="Username" ref={usernameInput} />
          <Form.Control type="password" placeholder="Password" ref={passwordInput} />
        </Form.Group>
        <Button variant="primary" type="button" onClick={() => {
          if (usernameInput.current === null || passwordInput.current === null) {
            return;
          }

          dispatch({
            type: "LoginRequest",
            request: {
              username: usernameInput.current.value,
              password: passwordInput.current.value,
            }
          });
        }}>
          Login
        </Button>
      </Form>
    </FormWrapper>;
};