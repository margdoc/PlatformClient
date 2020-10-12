import {
  createBrowserHistory,
  createLocation,
  Hash,
  History,
  Location as HistoryLocation,
  LocationDescriptorObject,
  LocationKey,
  LocationState,
  Search
} from "history";
import * as React from "react";
import { Action as ReduxAction } from "redux";
import { ignoreElements, tap } from "rxjs/operators";
import { combineEpics, ofType, Epic, SilentEff } from "./Loop";

// CONSTANTS

const ABSOLUTE_PATH_PREFIX = "/" + process.env.PATH_PREFIX + "/";

// ACTIONS

interface RequestLocationChange extends ReduxAction {
  type: "RequestLocationChange";
  location: HistoryLocation;
}

interface LocationChanged extends ReduxAction {
  type: "LocationChanged";
  location: Location;
}

export type Action = RequestLocationChange | LocationChanged;

// EFFECTS

export class Push extends SilentEff {
  readonly type = "History/Push";

  constructor(readonly location: HistoryLocation) {
    super();
  }
}

export class Replace extends SilentEff {
  readonly type = "History/Replace";

  constructor(readonly location: HistoryLocation) {
    super();
  }
}

// EPIC

const pushEpic: Epic<ReduxAction, never> = effect$ =>
  effect$.pipe(
    ofType<Push>("History/Push"),
    tap(({ location }) => {
      history.push(location);
    }),
    ignoreElements()
  );

const replaceEpic: Epic<ReduxAction, never> = effect$ =>
  effect$.pipe(
    ofType<Replace>("History/Replace"),
    tap(({ location }) => {
      history.replace(location);
    }),
    ignoreElements()
  );

export const epic = combineEpics(pushEpic, replaceEpic);

// LOCATION HELPERS

export { Location as HistoryLocation } from "history";

export interface Location<S = LocationState> {
  paths: Array<string>;
  search: Search;
  state: S;
  hash: Hash;
  key?: LocationKey;
}

export const toHistoryLocation = ({
  paths,
  ...rest
}: Location): HistoryLocation => ({
  ...rest,
  pathname: ABSOLUTE_PATH_PREFIX + paths.join("/")
});

export const toPartialHistoryLocation = ({
  paths,
  ...rest
}: Partial<Location>): Partial<HistoryLocation> => ({
  ...rest,
  pathname: paths && ABSOLUTE_PATH_PREFIX + paths.join("/")
});

export const fromHistoryLocation = ({
  pathname,
  ...rest
}: HistoryLocation): Location => ({
  ...rest,
  paths: pathname.replace(ABSOLUTE_PATH_PREFIX, "").split("/")
});

// LINK COMPONENT

export class RequestUrlChange {
  readonly type = "RequestUrlChange";

  constructor(readonly location: HistoryLocation) {}
}

const isModifiedEvent = (event: React.MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

export interface LinkProps<T>
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: T;
  innerRef?: (node: HTMLAnchorElement | null) => void;
}

export type LinkType<T> =
  | React.ClassType<
      LinkProps<T>,
      React.Component<LinkProps<T>>,
      React.ComponentClass<LinkProps<T>>
    >
  | React.FunctionComponent<LinkProps<T>>;


//in case you need to attach a link to one of buttons from ui-toolkit/components/Button.tsx, see pull request 'URL works' to dev
export const createLink = function<T>(
  history: History,
  locationFromRoute: (route: T) => LocationDescriptorObject,
  onUrlChangeRequest: (location: HistoryLocation) => void,
) {
  return class Link extends React.Component<LinkProps<T>> {
    handleClick(
      event: React.MouseEvent<HTMLAnchorElement>,
      toLocation: HistoryLocation
    ) {
      if (this.props.onClick) {
        this.props.onClick(event);
      }

      if (
        !event.defaultPrevented && // onClick prevented default
        event.button === 0 && // ignore everything but left clicks
        (!this.props.target || this.props.target === "_self") && // let browser handle "target=_blank" etc.
        !isModifiedEvent(event) // ignore clicks with modifier keys
      ) {
        event.preventDefault();

        onUrlChangeRequest(toLocation);
      }
    }

    render() {
      const { innerRef, to, ...rest } = this.props;
      const toLocation = createLocation(locationFromRoute(to));
      const href = history.createHref(toLocation);
      return (
        <a
          {...rest}
          onClick={event => this.handleClick(event, toLocation)}
          href={href}
          ref={innerRef}
        />
      );
    }
  };
};


// INITIALIZATION

export const history = createBrowserHistory();