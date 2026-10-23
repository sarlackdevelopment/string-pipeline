package dev.stringpipeline.library;

import java.util.List;

/// One kind of step, such as Replace (R1.1). Each transformation is a strategy, and [Catalog] is their registry (D30).
///
/// A transformation never sees raw values. The pipeline first checks them against [#parameters()], then
/// [#configure(Arguments)] makes the checks only the transformation can make (D44). The frontend renders the form from
/// [#parameters()], so a new transformation needs no frontend code (R2.1, D19).
public interface Transformation {

    TransformationInfo info();

    /// The parameters in display order.
    List<Parameter> parameters();

    Configuration configure(Arguments arguments);
}
