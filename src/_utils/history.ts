import { Action as ReduxAction } from "redux";
import { createBrowserHistory, Location as HistoryLocation, LocationState, Search, Hash, LocationKey } from 'history';

import { runFunction } from './loop';

const ABSOLUTE_PATH_PREFIX = "/" + process.env.PATH_PREFIX + "/";

export { Location as HistoryLocation } from "history";

export interface Location<S = LocationState> {
    paths: Array<string>;
    search: Search;
    state: S;
    hash: Hash;
    key?: LocationKey;
}

interface RequestLocationChange extends ReduxAction {
    type: "RequestLocationChange";
    location: HistoryLocation;
}

interface LocationChanged extends ReduxAction {
    type: "LocationChanged";
    location: Location;
}

export type Action = RequestLocationChange | LocationChanged;

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

export const Push = (location: HistoryLocation) => 
    runFunction(() => history.push(location));

export const Replace = (location: HistoryLocation) => 
    runFunction(() => history.replace(location));

export const history = createBrowserHistory();