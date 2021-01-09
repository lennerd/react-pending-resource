# React Pending Resource

![CI Status](https://github.com/lennerd/react-pending-resource/workflows/CI/badge.svg)

React Pending Resource is a small library of hooks for async resource loading.
It is still in beta and not fully battle tested yet. A dedicated page with more examples and documentation coming soon.

## Why another async hook library for React?

* Built with TypeScript
* Powerful caching between components by using serializable cache keys
* Easy refetching of resources by using cache keys and more complex dependencies if needed
* Easy preloading of resources for better performance
* Built around Suspense (without using experimental features)
* Easy deferring of rendering suspense fallbacks like loading spinners

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
