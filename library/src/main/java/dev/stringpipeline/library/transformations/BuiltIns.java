package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Catalog;
import java.util.List;

/// The transformations that ship with the library, in display order (R1.1, D10).
///
/// Adding a transformation means one package-private class in this package and one line below; the frontend renders
/// its form from the catalog (R2.1, D19).
public final class BuiltIns {

    private BuiltIns() {}

    /// A catalog of every built-in transformation.
    public static Catalog catalog() {
        return new Catalog(List.of(
                new Replace(),
                new Append(),
                new Prepend(),
                new Substring(),
                new ChangeCase(),
                new LineOperations(),
                new Encode(),
                new Decode(),
                new ReformatDates(),
                new RegexExtract(),
                new RegexReplace()));
    }
}
