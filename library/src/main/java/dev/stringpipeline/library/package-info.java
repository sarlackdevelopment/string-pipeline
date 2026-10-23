/// String transformations and the pipeline that chains them (R1.1, R1.2, R3.2).
///
/// This package is the library's public API: [Catalog], [Pipeline], [Transformation], the parameter kinds, the raw
/// values a caller passes in and the results it gets back. The built-in transformations live in
/// `dev.stringpipeline.library.transformations` behind `BuiltIns` (D44).
///
/// Plain Java with no framework dependencies: the web API is one caller of this library, tests are another (D16).
@NullMarked
package dev.stringpipeline.library;

import org.jspecify.annotations.NullMarked;
