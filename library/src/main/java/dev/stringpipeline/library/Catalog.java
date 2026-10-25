package dev.stringpipeline.library;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/// The transformations a client can choose from, in display order (R1.1, R2.1, D19), and example chains made of them
/// (D50).
public final class Catalog {

    private final List<Transformation> transformations;
    private final Map<String, Transformation> byId;
    private final List<Example> examples;

    /// A catalog of `transformations`, in the given order, without examples.
    ///
    /// @throws IllegalArgumentException for a duplicate transformation id or a duplicate parameter name
    public Catalog(List<Transformation> transformations) {
        this(transformations, List.of());
    }

    /// A catalog of `transformations` and of `examples` made of them, each in the given order.
    ///
    /// @throws IllegalArgumentException for a duplicate transformation id, parameter name or example id, or for an
    ///     example step whose transformation is not one of `transformations`
    public Catalog(List<Transformation> transformations, List<Example> examples) {
        this.transformations = List.copyOf(transformations);
        var index = new HashMap<String, Transformation>();
        for (Transformation transformation : this.transformations) {
            String id = transformation.info().id();
            if (index.putIfAbsent(id, transformation) != null) {
                throw new IllegalArgumentException("Duplicate transformation id: " + id);
            }
            var names = new HashSet<String>();
            for (Parameter parameter : transformation.parameters()) {
                if (!names.add(parameter.name())) {
                    throw new IllegalArgumentException("Duplicate parameter " + parameter.name() + " in " + id);
                }
            }
        }
        this.byId = Map.copyOf(index);
        this.examples = List.copyOf(examples);
        // By identity: a client opens an example by the ids of its transformations and runs the catalog's own, so
        // the example has to be made of those very objects.
        Set<Transformation> own = Collections.newSetFromMap(new IdentityHashMap<>());
        own.addAll(this.transformations);
        var exampleIds = new HashSet<String>();
        for (Example example : this.examples) {
            if (!exampleIds.add(example.id())) {
                throw new IllegalArgumentException("Duplicate example id: " + example.id());
            }
            for (Step step : example.steps()) {
                if (!own.contains(step.transformation())) {
                    throw new IllegalArgumentException("Example " + example.id()
                            + " uses a transformation that is not in the catalog: "
                            + step.transformation().info().id());
                }
            }
        }
    }

    public List<Transformation> transformations() {
        return transformations;
    }

    public Optional<Transformation> find(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    /// The categories with at least one transformation, in display order.
    public List<Category> categories() {
        return Arrays.stream(Category.values())
                .filter(category -> transformations.stream()
                        .anyMatch(transformation -> transformation.info().category() == category))
                .toList();
    }

    /// Ready-made chains to start from, in display order.
    public List<Example> examples() {
        return examples;
    }
}
