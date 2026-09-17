/**
 * Derived town traits. These turn the raw numbers in towns.json into categories
 * that copy can branch on, so two towns with genuinely different characteristics
 * get genuinely different sentences - not the same sentence with a new name.
 */
export function traits(town) {
  return {
    state: town.state,
    // Population bands, chosen where the character of the place actually changes.
    size: town.pop >= 100000 ? 'large' : town.pop >= 40000 ? 'mid' : 'small',
    // A single-ZIP town is a dense walk-up city; a multi-ZIP one is a spread-out city.
    compact: town.zip_list.length <= 2,
    // Majority-Hispanic changes who the whole market is, not just a slice of it.
    majority: town.hispanic_pct >= 60,
    zips: town.zip_list.length,
  };
}

/** Stable key describing a town's shape, used to seed trait-conditional copy. */
export function traitKey(town) {
  const t = traits(town);
  return `${t.state}:${t.size}:${t.compact ? 'compact' : 'spread'}:${t.majority ? 'maj' : 'plur'}`;
}
