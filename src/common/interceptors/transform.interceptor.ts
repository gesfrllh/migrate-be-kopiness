const toCamel = (str: string) => {
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

const camelize = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(camelize)

  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamel(k), camelize(v)])
    )
  }
}