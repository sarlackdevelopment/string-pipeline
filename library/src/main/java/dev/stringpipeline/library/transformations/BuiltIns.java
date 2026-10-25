package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.text;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Example;
import dev.stringpipeline.library.Message;
import dev.stringpipeline.library.Step;
import java.util.List;
import java.util.Map;

/// The transformations that ship with the library, in display order (R1.1, D10), and example chains made of them
/// (D50).
///
/// Adding a transformation means one package-private class in this package and one line below; the frontend renders
/// its form from the catalog (R2.1, D19). An example is data as well, and `ExamplesTest` runs every one of them.
public final class BuiltIns {

    private BuiltIns() {}

    /// A catalog of every built-in transformation and the examples.
    public static Catalog catalog() {
        var replace = new Replace();
        var append = new Append();
        var prepend = new Prepend();
        var changeCase = new ChangeCase();
        var lineOperations = new LineOperations();
        var reformatDates = new ReformatDates();
        var regexExtract = new RegexExtract();
        return new Catalog(
                List.of(
                        replace,
                        append,
                        prepend,
                        new Substring(),
                        changeCase,
                        lineOperations,
                        new Encode(),
                        new Decode(),
                        reformatDates,
                        regexExtract,
                        new RegexReplace()),
                List.of(
                        new Example(
                                "brief",
                                Message.of("example.brief"),
                                "Fake Python",
                                List.of(
                                        new Step(replace, Map.of("old", text("Fake"), "new", text("Real"))),
                                        new Step(append, Map.of("text", text("!"))))),
                        new Example(
                                "titleToSlug",
                                Message.of("example.titleToSlug"),
                                "10 Tips for Better Regular Expressions",
                                List.of(
                                        new Step(changeCase, Map.of("to", text("kebab"))),
                                        new Step(prepend, Map.of("text", text("/blog/"))))),
                        new Example(
                                "sortFileNames",
                                Message.of("example.sortFileNames"),
                                "file10.txt\nfile2.txt\nfile1.txt\nfile2.txt",
                                List.of(
                                        new Step(lineOperations, Map.of("operation", text("unique"))),
                                        new Step(lineOperations, Map.of("operation", text("sort"))))),
                        new Example(
                                "reformatDates",
                                Message.of("example.reformatDates"),
                                "2026-10-29\n2026-12-31",
                                List.of(new Step(reformatDates, Map.of("to", text("d MMMM yyyy"))))),
                        new Example(
                                "findEmailAddresses",
                                Message.of("example.findEmailAddresses"),
                                "Write to anna@example.com or bob@example.org; anna@example.com reads both.",
                                List.of(
                                        new Step(
                                                regexExtract,
                                                Map.of("pattern", text("[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+"))),
                                        new Step(lineOperations, Map.of("operation", text("unique")))))));
    }
}
