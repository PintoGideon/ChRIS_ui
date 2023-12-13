import { all, fork, put, takeEvery } from "redux-saga/effects";
import { UserActionTypes } from "./types";
import { setAuthError, setAuthTokenSuccess } from "./actions";

// ----------------------------------------------------------------
// Description: List - Get all Users
// ----------------------------------------------------------------

function* handleResponse(action: any) {
  try {
    yield put(
      setAuthTokenSuccess({
        token: action.payload.token,
        username: action.payload.username,
      })
    );
  } catch (error) {
    setAuthError();
  }
}

// This is our watcher function. We use `take*()` functions to watch Redux for a specific action
// type, and run our saga, for example the `handleFetch()` saga above.
function* watchLoginRequest() {
  yield takeEvery(UserActionTypes.SET_TOKEN, handleResponse);
}

export function* userSaga() {
  yield all([fork(watchLoginRequest)]);
}
