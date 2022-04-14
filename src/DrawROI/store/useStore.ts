import create from 'zustand'
import createContext from 'zustand/context'

import createDRCoreSlice, { DRCoreSlice } from './createDRCoreSlice'
import createDRDataSlice, { DRDataSlice } from './createDRDataSlice'

export type MyDRState = DRCoreSlice & DRDataSlice

const { Provider, useStore } = createContext<MyDRState>()

const createStore = () =>
  create<MyDRState>((set, get) => ({
    ...createDRCoreSlice(set, get),
    ...createDRDataSlice(set, get)
  }))

export { Provider, useStore, createStore }
