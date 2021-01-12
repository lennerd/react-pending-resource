import { usePendingPromise, usePendingResource } from "react-pending-resource";
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
function fetchUser(id: number): Promise<User> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(users[id - 1]);
    }, 250 + Math.random() * 1000);
  });
}

interface ProfileProps {
  userId: number;
}

console.log(usePendingResource);

function Profile({ userId }: ProfileProps) {
  const [user] = usePendingPromise(["user", userId], () => fetchUser(userId), {
    initialRender: false,
    timeout: 400
  });

  return <div>{user?.name}</div>;
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
      </React.Suspense>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
