# Atomic Design in `components/`

This folder introduces a canonical atomic design surface without forcing breaking path migrations.

## Structure

- `atoms/`: smallest reusable UI units
- `molecules/`: composed UI pieces built from atoms
- `organisms/`: larger domain sections and interactive blocks
- `templates/`: page/screen-level compositions and shells

## Migration policy

- Existing component files remain in place for compatibility.
- New work should import from `components/atomic/*` where possible.
- Legacy imports can be migrated incrementally without cross-folder churn.

## Notes

- This is intentionally non-breaking and scoped to `components/` only.
- Classification can evolve as modules are further normalized.
