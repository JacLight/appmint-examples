# AppEngine Phone and SMS client examples

Embed calling and SMS inside your own web or mobile application. These examples show the client responsibilities: load assigned lines, register the installation, connect the voice SDK, handle incoming/outgoing calls, send messages, read history and clean up on logout.

## Choose an example

| Example | Run | Purpose |
|---|---|---|
| [Browser client](examples/README.md) | `cd examples && npm run simulate` | The actual browser app shown in the course, with a local provider simulator. |
| [React app](react/README.md) | See its README | React implementation using the shared browser integration helpers. |
| [Flutter app](flutter/README.md) | See its README | Mobile client with a labelled simulation and documented native integration boundary. |
| [Native integration reference](examples/native/README.md) | Reference source | AppEngine registration and actual native SDK integration points from Appmint Mobile. |

The browser simulator requires Node 20+ and no provider credentials. It runs on loopback, uses fixture phone numbers, and stores state only in memory. Simulated call and SMS outcomes do not contact a carrier or transmit microphone audio.

## Source and course

- [Read the written client course](guides/phone-course.md)
- [Watch the course (local documentation server)](http://localhost:4060/videos/appengine-phone-integration-usecase/course/review.html)
- [Maintained AppEngine API reference](https://appengine.appmint.io/documentation/)
- [Source on GitHub](https://github.com/JacLight/appmint-examples/tree/main/appengine-phone-integration)

The `examples/` directory also includes JavaScript, TypeScript, Python, curl and Postman request examples, a built official Appmint JS SDK, and a trusted local host for a configured AppEngine environment. See its README for exact startup settings and prerequisites.

## Connect your own service

Supply an authenticated staff session and a configured AppEngine phone service. Keep the staff bearer on your trusted server for browser use; only the returned voice token belongs in the voice SDK. The live sample host is read-only by default. Enable its documented registration and recipient controls deliberately for your own configured environment.

Real native calling also requires the native SDK, signing/push configuration and device validation described in the native reference. The simulator does not establish real handset ringing, background push or carrier delivery.

No live credentials or private recording state are included. Keep `.env`, session files and private fixtures outside Git.
