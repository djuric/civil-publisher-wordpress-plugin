import * as React from "react";
import * as ReactDOM from "react-dom";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import { Map } from "immutable";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";
import { setMetaMaskEnabled } from "../shared/actions";
import reducers from "../shared/reducer";
import { getMetaMaskEnabled } from "../util";
import App from "./App";

async function init(): Promise<void> {
  const { newsroomAddress, newsroomTxHash } = window.civilNamespace;
  const store = createStore(
    reducers,
    {
      user: Map<string, any>({ address: newsroomAddress, txHash: newsroomTxHash }),
    },
    applyMiddleware(thunk),
  );
  const metaMaskEnabled = await getMetaMaskEnabled();
  store.dispatch(setMetaMaskEnabled(metaMaskEnabled));

  ReactDOM.render(
    <ErrorBoundary section="newsroom-manager">
      <Provider store={store}>
        <App />
      </Provider>
    </ErrorBoundary>,
    document.getElementById("civil-publisher-newsroom-management"),
  );
}

window.onload = init;
