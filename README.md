# React Pending Resource

![CI Status](https://github.com/lennerd/react-pending-resource/workflows/CI/badge.svg)

React Pending Resource is a small library of hooks for handling promises (for example when fetching data asynchronously).
Though feature complete it is still in beta and not fully battle tested yet.
A dedicated page with more information, examples and documentation coming soon.

## Why another async hook library for React?

* Powerful caching by using serializable resource keys
* Easy refetching of resources by using resource keys and more complex dependencies if needed
* Easy preloading of resources for better performance
* Built around stable Suspense features (without using experimental APIs)
* Easy deferring of rendering suspense fallbacks like loading spinners

*This library cannot be used in components rendered on the server, as React Suspense does not support server side rendering yet.*

## Example

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { usePromise } from 'react-pending-resource';

async function fetchPost(id) {
  // … fetch a post by id
}

function BlogPost({ id }) {
  const post = usePromise(id, () => fetchPost(id));

  return <div>{post.title}</div>
}

function App() {
  return (
    <React.Suspense fallback="Loading …">
      <BlogPost id={1} />
    </React.Suspense>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
```
