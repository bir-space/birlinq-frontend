/**
 * Licence plates are stored the way they are printed on the plate: latin
 * letters and digits only, no separators. Kazakh plates read `123ABC02`.
 *
 * Normalising on every keystroke (rather than on submit) means the field can
 * never hold something the backend would have to reject, and the user sees the
 * canonical form while typing instead of after a round trip.
 */
export function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
