package dev.stringpipeline.library;

/// A problem with one parameter value, shown at its field (D12, D42).
///
/// @param parameter the parameter's name
/// @param message what to fix, written for the person filling in the form
public record ParameterIssue(String parameter, String message) {}
