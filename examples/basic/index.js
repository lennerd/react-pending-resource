import { usePromise } from "react-pending-resource";
import ReactDOM from "react-dom";
import React from "react";

// Some function to more some async fetch API call …
function fetchUser() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name: "Pattern Person", age: 22, country: "Germany" });
    }, 1000);
  });
}

function Basic() {
  // usePromise will try to fetch the user and suspense until finished
  // loading. It also uses the resource key "user" to store the fetched
  // value for subsequent calls.
  const user = usePromise("user", () => fetchUser());

  return <h2>Username: {user.name}</h2>;
}

// Although used twice, the user is only fetched once!
function More() {
  const user = usePromise("user", () => fetchUser());

  return (
    <ul>
      <li>Age: {user.age}</li>
      <li>Country: {user.country}</li>
    </ul>
  );
}

function App() {
  const [showMore, toggleMore] = React.useReducer((state) => !state, false);

  return (
    <React.Suspense fallback="Loading …">
      <Basic />
      <button type="button" onClick={toggleMore}>
        Show more
      </button>
      {showMore && <More />}
    </React.Suspense>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
