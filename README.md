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

```jsx
import React, { Suspense } from 'react';

function BlogPost({ id }) {
  // Load post by id. Show loading spinner after 200 ms
  const post = usePendingPromise(id, () => fetchPost(id), { timeout: 200 });

  return <div>{post.title}</div>
}

function App() {
  return (
    <Suspense fallback="Loading …">
      <BlogPost />
    </Suspense>
  );
}
```
