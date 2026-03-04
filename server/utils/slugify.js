export function toSlug(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function uniqueSlug(base, model) {
  const seed = toSlug(base) || 'restaurant'
  let slug = seed
  let counter = 1

  while (await model.exists({ slug })) {
    slug = `${seed}-${counter}`
    counter += 1
  }

  return slug
}
