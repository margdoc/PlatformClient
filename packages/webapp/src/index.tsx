import * as React from "react";
import { render } from "react-dom";
import { compose, Action as ReduxAction } from "redux";
import { Observable } from "rxjs";
import { epic as effectsEpic } from "utils/Effects";
import * as History from "utils/History";
import * as LocalStorage from "utils/LocalStorage";
import { combineEpics, createStore, mapLoop, Epic, EMPTY, Loop } from "utils/Loop";
import { epic as apiEpic } from "../../api-client/client";
import * as App from "./App";

// ACTIONS

interface AppMsg extends ReduxAction {
  type: "AppMsg";
  action: App.Action;
}

type Action = History.Action | AppMsg;

// STATE INTERFACE AND INITIAL LOOP

interface State {
  app: App.State;
}

const initialLoop: Loop<State, Action> = mapLoop(
  App.initialLoop,
  app => ({ app }),
  action => ({ type: "AppMsg", action })
);

// REDUCER

const reducer = (prevState: State, action: Action): Loop<State, Action> => {
  if (action.type === "AppMsg" && action.action.type === "RouteChanged") {
    const pathString = App.locationFromRoute(action.action.route);
    return [prevState, new History.Push({
      pathname: "/" + ((pathString.paths) ? pathString.paths.join("/") : ""),
      hash: location.hash,
      search: location.search,
      state: undefined
    })];
  }
  switch (action.type) {
    case "RequestLocationChange":
      return [prevState, new History.Push(action.location)];
    case "LocationChanged":
    case "AppMsg": {
      const nestedAction: App.Action =
        action.type === "LocationChanged"
          ? {
              type: "RouteChanged",
              route: App.routeFromLocation(action.location.paths)
            }
          : action.action;

      return mapLoop(
        App.reducer(prevState.app, nestedAction),
        app => ({ app }),
        action => ({ type: "AppMsg", action })
      );
    }
    default:
      return [prevState, EMPTY];
  }
};

// STORE INITIALIZATION

const composeEnhancers =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const epic = combineEpics(History.epic, apiEpic, effectsEpic, LocalStorage.epic) as Epic<
  ReduxAction,
  Action
>;

const store = createStore<State, Action, {}, {}>(
  initialLoop,
  reducer,
  epic,
  composeEnhancers()
);

/*
//the function might be useful in the future; now it's commented not to cause warnings
const requestRouteChange = (route: App.Route) => {
  const partialLocation = App.locationFromRoute(route);
  const location = createLocation(
    History.toPartialHistoryLocation(partialLocation)
  );

  store.dispatch({ type: "RequestLocationChange", location });
};*/

// HISTORY INITIALIZATION

//the function might be useful in the future; now it's commented not to cause warnings
const createLink = () => History.createLink<App.Route>(
  History.history,
  (route: App.Route) =>
    App.locationFromRoute(route),
  location => {
    store.dispatch({ type: "RequestLocationChange", location });
  },
);

const locationChanged = (location: History.HistoryLocation) =>
  store.dispatch({
    type: "LocationChanged",
    location: History.fromHistoryLocation(location)
  });

locationChanged(History.history.location);

History.history.listen(locationChanged);

// VIEW INITIALIZATION

const appDispatch = (action: App.Action) =>
  store.dispatch({ type: "AppMsg", action });

const state$ = new Observable(store[Symbol.observable]().subscribe);

state$.subscribe(state => {
  render(
    <App.render
      state={state.app}
      dispatch={appDispatch}
      createLink={createLink}
    />,
    document.getElementById("root")
  );
});