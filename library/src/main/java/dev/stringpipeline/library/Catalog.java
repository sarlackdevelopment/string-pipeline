package dev.stringpipeline.library;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/// The transformations a client can choose from, in display order (R1.1, R2.1, D19).
public final class Catalog {

    private final List<Transformation> transformations;
    private final Map<String, Transformation> byId;

    /// A catalog of `transformations`, in the given order.
    ///
    /// @throws IllegalArgumentException for a duplicate transformation id or a duplicate parameter name
    public Catalog(List<Transformation> transformations) {
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
}
