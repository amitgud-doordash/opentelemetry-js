'use strict';

const api = require('@opentelemetry/api');
const tracer = require('./tracer')('example-http-server');
// eslint-disable-next-line import/order
const http = require('http');

/** Starts a HTTP server that receives requests on sample server port. */
function startServer(port) {
  // Creates a server
  const server = http.createServer(handleRequest);
  // Starts the server
  server.listen(port, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Node HTTP listening on ${port}`);
  });
}

/** A function which handles requests and send response. */
function handleRequest(request, response) {
  const currentSpan = api.getSpan(api.context.active());
  // display traceid in the terminal
  console.log(`traceid: ${currentSpan.context().traceId}`);
  console.log(`baggage: ${api.getBaggage(api.context.active()).getAllEntries()}`);
  console.log(`baggage foo1: ${api.getBaggage(api.context.active()).getEntry("foo1").value}`);
  console.log(`baggage foo2: ${api.getBaggage(api.context.active()).getEntry("foo2").value}`);

  const span = tracer.startSpan('handleRequest', {
    kind: 1, // server
    attributes: { key: 'value' },
  });
  // Annotate our span to capture metadata about the operation
  span.addEvent('invoking handleRequest');

  http.get('http://localhost:8000', (resp) => {
    console.log(`statusCode: ${resp.statusCode}`)
  }).on("error", (err) => {
    console.log("Error: " + err.message)
  })

  const body = [];
  request.on('error', (err) => console.log(err));
  request.on('data', (chunk) => body.push(chunk));
  request.on('end', () => {
    // deliberately sleeping to mock some action.
    setTimeout(() => {
      span.end();
      response.end('Hello World!');
    }, 2000);
  });
}

startServer(8080);
