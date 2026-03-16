const localStorageMock = (function () {
  let store: Record<string, string> = {}
  return {
    getItem: function (key: string) {
      return store[key] || null
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString()
    },
    removeItem: function (key: string) {
      delete store[key]
    },
    clear: function () {
      store = {}
    },
    key: function (i: number) {
      const keys = Object.keys(store)
      return keys[i] || null
    },
    get length() {
      return Object.keys(store).length
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
})
Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
  writable: true,
})
