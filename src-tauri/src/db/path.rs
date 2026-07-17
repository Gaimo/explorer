/// Normalize filesystem paths used as metadata keys.
///
/// - Trims trailing `/` and `\` (except bare Unix root `/`)
/// - Lowercases on Windows for case-insensitive identity
pub fn normalize_path(path: &str) -> String {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    #[cfg(windows)]
    let mut normalized = trimmed.to_lowercase();
    #[cfg(not(windows))]
    let mut normalized = trimmed.to_string();

    while normalized.len() > 1
        && (normalized.ends_with('\\') || normalized.ends_with('/'))
        && !(normalized.len() == 3
            && normalized.as_bytes()[1] == b':'
            && (normalized.ends_with('\\') || normalized.ends_with('/')))
    {
        // Keep Windows drive roots like "c:\" as "c:" after stripping one slash,
        // then stop (length 2 "c:" is fine).
        normalized.pop();
    }

    // Drive root "c:" is a stable key
    normalized
}

#[cfg(test)]
mod tests {
    use super::normalize_path;

    #[test]
    fn trims_trailing_slashes() {
        let result = normalize_path(r"C:\Users\Admin\");
        assert!(!result.ends_with('\\'));
        assert!(!result.ends_with('/'));
    }
}
