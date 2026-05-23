# Tagging System for Conditional Hiding

## Tag Format
- Each page, file, or folder associated with a feature (e.g., restaurants) includes a comment at the top:
  // @tag:restaurant

## Example Usage
- To hide all restaurant-related features, search for `@tag:restaurant` and exclude those files/folders from build, navigation, or UI rendering.

## How to Add More Tags
- Add `// @tag:<feature>` at the top of any file or in a README/tag file in a folder.
- Multiple tags can be added: `// @tag:restaurant,food`

## Automation
- Use a script or code search to find all files with a specific tag.
- Conditional logic in build tools or navigation can check for these tags to include/exclude features.

---

This system is now applied to all restaurant-related files. Repeat for other domains (e.g., dining, shopping) as needed.