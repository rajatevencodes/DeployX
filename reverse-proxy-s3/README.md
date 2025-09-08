# Learnings

## Core Problem

- To build a platform like Vercel, you must store each deployed project in its own unique subfolder within a single S3 bucket (e.g., `/project-id-1/`, `/project-id-2/`).

- The problem is that the project's code, such as its `index.html` file, is built to find its assets (like CSS and JavaScript) at the root path (e.g., `/assets/script.js`).

-This creates a path mismatch. The browser requests a file at the domain's root, but the file actually lives inside a project-specific subfolder. S3's basic static hosting feature isn't smart enough to bridge this gap, so it returns a misleading 403 Forbidden error.

- You need a component that can intelligently translate the browser's simple request into the correct S3 subfolder path.

The solution to this problem is a reverse proxy.

## Doubt 1 : How does a reverse proxy fix this?

A reverse proxy acts as a smart receptionist for your server.

When a browser requests `project-123.com/assets/style.css`, the request goes to your proxy first. The proxy sees the `project-123` part and knows to look inside the `project-123` folder in your S3 bucket. It invisibly rewrites the path, fetches the correct file, and sends it back to the browser. The browser never knows this translation happened.

## Doubt 2 : How do my CSS and JS files even get to the proxy?

The browser sends a separate request for every single file.
First, it asks your proxy for the `index.html` file.
Then, it reads the HTML and sees that browser needs `/assets/style.css`.
It then sends a new request for `/assets/style.css` to the same address—your proxy.
Your proxy handles each of these requests, one by one.
All this is so fast 🤯

Note : Browser is client :)
