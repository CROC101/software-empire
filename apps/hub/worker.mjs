// Workers Free gives a request 10 ms of CPU (error 1102 past it). OpenNext loads the Next server
// with import() inside fetch, so the first request of every new isolate paid for evaluating the
// whole server. Importing it here evaluates it at isolate startup instead (1 s budget, not billed
// to a request). worker.js comes first: its imports set up the globals the server reads.
import worker from "./.open-next/worker.js";
import "./.open-next/server-functions/default/handler.mjs";

export * from "./.open-next/worker.js";
export default worker;
