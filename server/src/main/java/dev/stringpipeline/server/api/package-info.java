/// The HTTP API: `GET /api/catalog` and `POST /api/runs`, with request errors as Problem Details (R3.3, D17, D40,
/// D41).
///
/// The classes here only map between JSON and the library's types; the rules live in the library. Wire types follow
/// one naming rule: the parts of a request end in `Request`, the parts of a response in `Response`.
@NullMarked
package dev.stringpipeline.server.api;

import org.jspecify.annotations.NullMarked;
