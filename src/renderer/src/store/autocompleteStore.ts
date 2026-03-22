import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AutocompletePopup {
  type: 'character' | 'scene-heading' | 'location' | 'transition'
  items: string[]
  selectedIndex: number
  position: { x: number; y: number }
}

/**
 * Autocomplete memory store — Phase 5.
 *
 * Remembers characters, locations, scene headings extracted from editor content.
 * Also stores manually registered props with their semantic color assignments.
 */
interface AutocompleteState {
  // Remembered entities (auto-populated from editor)
  characters: string[]
  locations: string[]
  sceneHeadings: string[]
  transitions: string[]

  // Manually registered props
  props: string[]

  // Active popup state
  activePopup: AutocompletePopup | null

  // Semantic color mapping (entity name → assigned color index)
  characterColors: Record<string, number>
  locationColors: Record<string, number>
  propColors: Record<string, number>

  // Actions — characters & locations
  addCharacter: (name: string) => void
  addLocation: (name: string) => void
  addSceneHeading: (heading: string) => void
  removeCharacter: (name: string) => void
  removeLocation: (name: string) => void
  clearMemory: () => void

  // Actions — props
  addProp: (name: string) => void
  removeProp: (name: string) => void

  // Popup actions
  showPopup: (popup: AutocompletePopup) => void
  hidePopup: () => void
  navigatePopup: (direction: 'up' | 'down') => void
}

export const useAutocompleteStore = create<AutocompleteState>()(
  persist(
    (set, get) => ({
      characters: [],
      locations: [],
      sceneHeadings: [],
      transitions: ['FADE OUT.', 'CUT TO:', 'DISSOLVE TO:', 'SMASH CUT TO:'],
      props: [],
      activePopup: null,
      characterColors: {},
      locationColors: {},
      propColors: {},

      addCharacter: (name) => {
        const normalized = name.toUpperCase().trim()
        if (!normalized) return
        set((s) => {
          if (s.characters.includes(normalized)) return s
          const colorIndex = Object.keys(s.characterColors).length % 8
          return {
            characters: [...s.characters, normalized].sort(),
            characterColors: { ...s.characterColors, [normalized]: colorIndex },
          }
        })
      },

      addLocation: (name) => {
        const normalized = name.toUpperCase().trim()
        if (!normalized) return
        set((s) => {
          if (s.locations.includes(normalized)) return s
          const colorIndex = Object.keys(s.locationColors).length % 6
          return {
            locations: [...s.locations, normalized].sort(),
            locationColors: { ...s.locationColors, [normalized]: colorIndex },
          }
        })
      },

      addSceneHeading: (heading) => {
        const normalized = heading.toUpperCase().trim()
        if (!normalized) return
        set((s) => ({
          sceneHeadings: [
            normalized,
            ...s.sceneHeadings.filter((h) => h !== normalized),
          ].slice(0, 200),
        }))
      },

      removeCharacter: (name) =>
        set((s) => ({ characters: s.characters.filter((c) => c !== name) })),

      removeLocation: (name) =>
        set((s) => ({ locations: s.locations.filter((l) => l !== name) })),

      clearMemory: () =>
        set({
          characters: [],
          locations: [],
          sceneHeadings: [],
          characterColors: {},
          locationColors: {},
        }),

      addProp: (name) => {
        const normalized = name.toUpperCase().trim()
        if (!normalized) return
        set((s) => {
          if (s.props.includes(normalized)) return s
          const colorIndex = Object.keys(s.propColors).length % 8
          return {
            props: [...s.props, normalized].sort(),
            propColors: { ...s.propColors, [normalized]: colorIndex },
          }
        })
      },

      removeProp: (name) =>
        set((s) => {
          const props = s.props.filter((p) => p !== name)
          const propColors = { ...s.propColors }
          delete propColors[name]
          return { props, propColors }
        }),

      showPopup: (popup) => set({ activePopup: popup }),

      hidePopup: () => set({ activePopup: null }),

      navigatePopup: (direction) =>
        set((s) => {
          if (!s.activePopup) return s
          const count = s.activePopup.items.length
          const delta = direction === 'down' ? 1 : -1
          const selectedIndex =
            (s.activePopup.selectedIndex + delta + count) % count
          return { activePopup: { ...s.activePopup, selectedIndex } }
        }),
    }),
    {
      name: 'scriptodd-autocomplete',
      partialize: (s) => ({
        characters: s.characters,
        locations: s.locations,
        sceneHeadings: s.sceneHeadings,
        transitions: s.transitions,
        props: s.props,
        characterColors: s.characterColors,
        locationColors: s.locationColors,
        propColors: s.propColors,
      }),
    }
  )
)
