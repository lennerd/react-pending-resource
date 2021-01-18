import { usePendingPromise } from "react-pending-resource";
import ReactDOM from "react-dom";
import React from "react";

interface User {
  name: string;
  age: number;
  country: string;
}

const users: User[] = [
  {
    name: "User 1",
    age: 21,
    country: "Poland"
  },
  {
    name: "User 2",
    age: 42,
    country: "Sweden"
  },
  {
    name: "User 3",
    age: 24,
    country: "Spain"
  },
  {
    name: "User 4",
    age: 12,
    country: "Italy"
  }
];

// Some function to more some async fetch API call …
function fetchUser(id: number): Promise<{ user: User; randomNumber: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: users[id - 1],
        randomNumber: Math.round(10 * Math.random())
      });
    }, Math.round(250 + Math.random() * 1000));
  });
}

interface ProfileProps {
  userId: number;
}

function Profile({ userId }: ProfileProps) {
  const [{ user, randomNumber }, isLoading] = usePendingPromise(
    ["user", userId],
    () => fetchUser(userId),
    {
      deps: [userId],
      timeToSuspense: 500
    }
  );

  return (
    <div>
      {user.name} {randomNumber} {isLoading && <span>(Loading …)</span>}
    </div>
  );
}

function Test() {
  const [{ user, randomNumber }] = usePendingPromise(["user", 1], () =>
    fetchUser(1)
  );

  return (
    <div>
      {user.name} {randomNumber}
    </div>
  );
}

function App() {
  const [userId, setUserId] = React.useState(2);

  return (
    <>
      <h2>Some Profiles</h2>
      <p>
        <button onClick={() => setUserId(1)}>User 1</button>
        <button onClick={() => setUserId(2)}>User 2</button>
        <button onClick={() => setUserId(3)}>User 3</button>
        <button onClick={() => setUserId(4)}>User 4</button>
      </p>
      <React.Suspense fallback="Loading …">
        <Profile userId={userId} />
        <hr />
        <Test />
      </React.Suspense>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
