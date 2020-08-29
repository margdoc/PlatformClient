import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Observable } from "rxjs";
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Loop as ReduxLoop, install, LoopReducer as ReduxLoopReducer, StoreCreator } from 'redux-loop';

import { mapLoop, Loop, loopToReduxLoop, EMPTY, LoopReducer, getState } from './_utils/loop';
import * as History from './_utils/history';

import * as App from './App';


interface State {
    type: "AppState";
    app: App.State;
}

interface AppAction {
    type: "AppAction";
    action: App.Action;
}

type Action = History.Action | AppAction;

const reducer: LoopReducer<State, Action> = (prevState: State, action: Action)=> {
    switch (action.type) {
        case "AppAction":
            return mapLoop(
                App.reducer(prevState.app, action.action),
                (app) => ({ type: "AppState", app }),
                (action) => ({ type: "AppAction", action })
            );
        case "RequestLocationChange":
            return [prevState, History.Push(action.location)];
        case "LocationChanged":
            return mapLoop(
                App.reducer(
                    prevState.app,
                    {
                        type: "RouteChanged",
                        route: App.routeFromLocation(action.location.paths),    
                    }),
                (app) => ({ type: "AppState", app }),
                (action) => ({ type: "AppAction", action })
            );
        default:
            return [prevState, EMPTY];
    }
}

const initialState: State = {
    type: "AppState",
    app: App.initialState
};

//@ts-ignore
const liftedReducer: ReduxLoopReducer<State, Action> = (state: State = initialState, action: Action) => {
    return loopToReduxLoop(reducer(state, action));
}

const composeEnhancers =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const enhancedStoreCreator = createStore as StoreCreator;

const enhancer = composeEnhancers(
    applyMiddleware(thunkMiddleware),
    install()
);

const store = enhancedStoreCreator(liftedReducer, initialState, enhancer);


// History
const locationChanged = (location: History.HistoryLocation) =>
  store.dispatch({
    type: "LocationChanged",
    location: History.fromHistoryLocation(location)
  });

locationChanged(History.history.location);

History.history.listen(locationChanged);



const state$ = new Observable(store[Symbol.observable]().subscribe);

state$.subscribe(state => {
    render(
        <App.render 
            state={state.app} 
            dispatch={(action: App.Action) => 
                store.dispatch({ type: "AppAction", action })
            } 
        />,
        document.getElementById('root')
    )
})