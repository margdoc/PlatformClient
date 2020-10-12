import React from "react";
import { Button, Form } from "react-bootstrap";

import * as Api from "api-client/client";
import { EMPTY, Loop, LoopReducer } from "utils/Loop";

import { Route } from "../index";

type Errors =
 | "INCORRECT_REPEATED_PASSWORD"
 | "EMAIL_VALUE_ERROR"
 | "REGISTER_USER_ALREADY_EXISTS";

export interface State {
  type: "RegisterPageState";
  errors: Array<Errors>;
}

interface RegisterRequest {
  type: "RegisterRequest";
  request: Api.RegisterRequest;
  rpassword: string;
}

interface RegisterResponse {
  type: "RegisterResponse";
  response: Api.User;
}

export type Action = RegisterRequest | RegisterResponse;

export const reducer: LoopReducer<State, Action> = (state: State, action: Action) => {
  switch (action.type) {
    case "RegisterRequest":
      return action.rpassword === action.request.userCreate.password
      ? [state, Api.WebAppClient.register<RegisterResponse>(action.request, response => ({
        type: "RegisterResponse",
        response,
      }))
      ]
      : [{
        ...state,
        response: "INCORRECT_REPEATED_PASSWORD"
      }, EMPTY];
    case "RegisterResponse":
      return [state, EMPTY];
  }
};

export const initialLoop: Loop<State, Action> = [{
    type: "RegisterPageState",
    errors: []
  }, EMPTY
];

interface Props {
  dispatch: (action: Action) => void;
}

export const render: React.FunctionComponent<Props> = ({ dispatch }) => {
  const emailInput = React.createRef<HTMLInputElement>();
  const passwordInput = React.createRef<HTMLInputElement>();
  const rpasswordInput = React.createRef<HTMLInputElement>();
  const usernameInput = React.createRef<HTMLInputElement>();
  const nameInput = React.createRef<HTMLInputElement>();
  const lastnameInput = React.createRef<HTMLInputElement>();

  return <Form>
    <Form.Group controlId="loginForm">
      <Form.Control type="email" placeholder="Email" ref={emailInput} />
      <Form.Control type="text" placeholder="Username" ref={usernameInput} />
      <Form.Control type="password" placeholder="Password" ref={passwordInput} />
      <Form.Control type="password" placeholder="Repeat password" ref={rpasswordInput} />
      <Form.Control type="text" placeholder="Name" ref={nameInput} />
      <Form.Control type="text" placeholder="Last name" ref={lastnameInput} />
    </Form.Group>
    <Button variant="primary" type="button" onClick={() => {
      if (
        emailInput.current === null ||
        passwordInput.current === null ||
        usernameInput.current === null ||
        nameInput.current === null ||
        lastnameInput.current === null ||
        rpasswordInput.current === null
        ) {
        return;
      }

      dispatch({
        type: "RegisterRequest",
        request: {
          userCreate: {
            email: emailInput.current.value,
            password: passwordInput.current.value,
            username: usernameInput.current.value,
            name: nameInput.current.value,
            lastname: lastnameInput.current.value,
          }
        },
        rpassword: rpasswordInput.current.value,
      });
    }}>
      Register
    </Button>
  </Form>;
};