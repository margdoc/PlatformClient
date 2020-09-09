import React from 'react';
import { Button, Form } from 'react-bootstrap';
import styled from 'styled-components';
import { AuthClient } from '../../services'; 
import { Loop, LoopReducer, EMPTY } from '../../utils/loop';

import { Route } from '../index';

export interface State {
  type: "LoginPageState";
  response?: string;
}

interface LoginRequest {
  type: "LoginRequest";
  request: AuthClient.LogInRequest;
}

interface LoginResponse {
  type: "LoginResponse";
  response: AuthClient.LogInResponse
}

export type Action = LoginRequest | LoginResponse;

export const reducer: LoopReducer<State, Action> = (state: State, action: Action) => {
  switch (action.type) {
    case "LoginRequest":
      return [state, AuthClient.apiLogin<LoginResponse>(action.request, response => ({
        type: "LoginResponse",
        response
      }))]
  }

  return [state, EMPTY];
}

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
  const emailInput = React.createRef<HTMLInputElement>();
  const passwordInput = React.createRef<HTMLInputElement>();

  return <FormWrapper>
      <Form>
        <Form.Group controlId="loginForm">
          <Form.Control type="email" placeholder="Email" ref={emailInput} />
          <Form.Control type="password" placeholder="Password" ref={passwordInput} />
        </Form.Group>
        <Button variant="primary" type="button" onClick={() => {
          if (emailInput.current === null || passwordInput.current === null)
            return;

          dispatch({
            type: "LoginRequest",
            request: {
              username: emailInput.current.value,
              password: passwordInput.current.value,
            }
          });
        }}>
          Login
        </Button>
      </Form>
    </FormWrapper>;
}