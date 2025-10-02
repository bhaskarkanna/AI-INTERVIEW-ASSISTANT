import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock DOMMatrix for PDF.js
global.DOMMatrix = vi.fn().mockImplementation(() => ({
  a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
  is2D: true,
  isIdentity: true,
  m11: 1, m12: 0, m13: 0, m14: 0,
  m21: 0, m22: 1, m23: 0, m24: 0,
  m31: 0, m32: 0, m33: 1, m34: 0,
  m41: 0, m42: 0, m43: 0, m44: 1,
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  rotateFromVector: vi.fn(),
  flipX: vi.fn(),
  flipY: vi.fn(),
  skewX: vi.fn(),
  skewY: vi.fn(),
  multiply: vi.fn(),
  inverse: vi.fn(),
  transformPoint: vi.fn(),
  transformVector: vi.fn(),
  toFloat32Array: vi.fn(),
  toFloat64Array: vi.fn(),
  toString: vi.fn(),
}))

// Mock Canvas for PDF.js
global.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
})

// Mock File API
global.File = class File {
  constructor(public content: any[], public name: string, public options: any) {}
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0))
  }
  text() {
    return Promise.resolve('')
  }
}
