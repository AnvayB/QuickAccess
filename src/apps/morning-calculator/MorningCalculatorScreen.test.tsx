import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MorningCalculatorScreen } from './MorningCalculatorScreen'
import { getCurrentPosition } from './lib/geolocation'
import { estimateTravel } from './lib/travelTime'

vi.mock('./lib/googleMaps', () => ({ loadGoogleMaps: () => Promise.resolve() }))
vi.mock('./lib/geolocation', () => ({ getCurrentPosition: vi.fn() }))
vi.mock('./lib/travelTime', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/travelTime')>()),
  estimateTravel: vi.fn(),
}))

const HERE = { lat: 37.77, lng: -122.42 }
const SAVED_KEY = 'morning-calc:saved-locations'

function renderScreen() {
  return render(
    <MemoryRouter>
      <MorningCalculatorScreen />
    </MemoryRouter>,
  )
}

/** The big time shown under a result label, e.g. figure('Leave by') -> "8:30 AM". */
function figure(label: string): string {
  return screen.getByText(label).nextElementSibling?.textContent ?? ''
}

/** The collapsible routine header ("Morning routine" also labels a result row). */
const routineHeader = () => screen.getByText('Morning routine', { selector: 'summary *' })

const destinationField = () => screen.getByRole('combobox', { name: /where are you going/i })

function setTime(labelText: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(labelText), { target: { value } })
}

beforeEach(() => {
  vi.mocked(getCurrentPosition).mockResolvedValue(HERE)
  vi.mocked(estimateTravel).mockReset()
  vi.mocked(estimateTravel).mockResolvedValue({ minutes: 30, staticMinutes: 30 })
  vi.stubGlobal('google', {
    maps: { places: { AutocompleteSuggestion: { fetchAutocompleteSuggestions: async () => ({ suggestions: [] }) } } },
  })
})

describe('first load', () => {
  it('opens on Travel, the primary mode', () => {
    renderScreen()
    expect(screen.getByRole('button', { name: 'Travel' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Wake up only' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('combobox', { name: /where are you going/i })).toBeInTheDocument()
  })

  it('tells you what to do next instead of showing placeholder times', () => {
    renderScreen()
    expect(screen.getByText('Choose a destination to see your times.')).toBeInTheDocument()
    expect(screen.queryByText('Wake up at')).not.toBeInTheDocument()
  })

  it('asks for a time once a destination is chosen', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '1 Office Way')
    expect(screen.getByText('Set an arrival time to see your alarm and departure.')).toBeInTheDocument()
  })

  it('does not crash on corrupted saved data', () => {
    localStorage.setItem('morning-calc:prefs', '{nope')
    localStorage.setItem(SAVED_KEY, '[[[')
    expect(() => renderScreen()).not.toThrow()
  })

  it('every form field has an accessible label', () => {
    renderScreen()
    expect(screen.getByLabelText(/what time do you need to arrive/i)).toHaveAttribute('type', 'time')
    expect(screen.getByLabelText(/leaving from/i)).toBeInTheDocument()
  })
})

describe('travel: arrive by', () => {
  async function planTrip(user = userEvent.setup()) {
    renderScreen()
    await user.type(destinationField(), '1 Office Way')
    setTime(/arrive/i, '09:00')
    await screen.findByText('Wake up at')
    return user
  }

  it('works backward from arrival: drive time, then routine, then buffer', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '1 Office Way')
    setTime(/arrive/i, '09:00')
    // 30 min drive -> leave 8:30. No routine selected. 15 min buffer -> alarm 8:15.
    await screen.findByText('Wake up at')
    expect(figure('Leave by')).toBe('8:30 AM')
    expect(figure('Wake up at')).toBe('8:15 AM')
  })

  it('includes the selected morning routine in the alarm time', async () => {
    const user = await planTrip()
    await user.click(routineHeader())
    await user.click(screen.getByRole('checkbox', { name: /^shower/i })) // 30 min
    // leave 8:30, start getting ready 8:00, alarm (15 min buffer) 7:45
    expect(figure('Wake up at')).toBe('7:45 AM')
    expect(figure('Leave by')).toBe('8:30 AM')
  })

  it('asks for traffic at the arrival time, anchored as arrive-by', async () => {
    await planTrip()
    const [origin, destination, anchor] = vi.mocked(estimateTravel).mock.calls.at(-1)!
    expect(origin).toEqual(HERE)
    expect(destination).toBe('1 Office Way')
    expect(anchor.kind).toBe('arrive-by')
    expect([anchor.at.getHours(), anchor.at.getMinutes()]).toEqual([9, 0])
  })

  it('shows how much of the drive is traffic', async () => {
    vi.mocked(estimateTravel).mockResolvedValue({ minutes: 40, staticMinutes: 28 })
    await planTrip()
    expect(screen.getByText('40 min (+12 traffic)')).toBeInTheDocument()
  })

  it('does not mention traffic when there is none', async () => {
    await planTrip()
    expect(screen.getByText('Drive time').nextElementSibling).toHaveTextContent(/^30 min$/)
  })

  it('wraps correctly across midnight (arrive 12:20 AM, 30 min drive, 15 min buffer)', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '1 Office Way')
    setTime(/arrive/i, '00:20')
    await screen.findByText('Wake up at')
    expect(figure('Leave by')).toBe('11:50 PM')
    expect(figure('Wake up at')).toBe('11:35 PM')
  })

  it('recalculates when the arrival time changes', async () => {
    await planTrip()
    setTime(/arrive/i, '10:00')
    await waitFor(() => expect(figure('Leave by')).toBe('9:30 AM'))
  })

  it('never shows the previous destination’s times while the new one is loading', async () => {
    // Switching in a single step (tapping a saved place / picking a suggestion) is the case that
    // could leave the old trip's times on screen next to the new destination.
    localStorage.setItem(
      SAVED_KEY,
      JSON.stringify([
        { id: 'office', label: 'Office', address: '1 Office Way' },
        { id: 'airport', label: 'Airport', address: '5 Airport Rd' },
      ]),
    )
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Office' }))
    setTime(/arrive/i, '09:00')
    await screen.findByText('Wake up at')
    expect(figure('Leave by')).toBe('8:30 AM')

    vi.mocked(estimateTravel).mockReturnValue(new Promise(() => {})) // the new lookup never finishes
    await user.click(screen.getByRole('button', { name: 'Airport' }))

    expect(destinationField()).toHaveValue('5 Airport Rd')
    expect(screen.queryByText('Leave by')).not.toBeInTheDocument()
    expect(screen.queryByText('Wake up at')).not.toBeInTheDocument()
    expect(screen.getAllByText('Checking traffic…').length).toBeGreaterThan(0)
  })

  it('shows the new destination’s times once they arrive', async () => {
    localStorage.setItem(
      SAVED_KEY,
      JSON.stringify([
        { id: 'office', label: 'Office', address: '1 Office Way' },
        { id: 'airport', label: 'Airport', address: '5 Airport Rd' },
      ]),
    )
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Office' }))
    setTime(/arrive/i, '09:00')
    await screen.findByText('Wake up at')

    vi.mocked(estimateTravel).mockResolvedValue({ minutes: 60, staticMinutes: 60 })
    await user.click(screen.getByRole('button', { name: 'Airport' }))
    await waitFor(() => expect(figure('Leave by')).toBe('8:00 AM'))
  })

  it('clears the result when the destination is emptied', async () => {
    const user = await planTrip()
    await user.clear(destinationField())
    expect(screen.queryByText('Wake up at')).not.toBeInTheDocument()
    expect(screen.getByText('Choose a destination to see your times.')).toBeInTheDocument()
  })

  it('shows the real error and a clear message in the result when the lookup fails', async () => {
    vi.mocked(estimateTravel).mockRejectedValue(new Error('Could not look up travel time (Routes API not enabled)'))
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '1 Office Way')
    setTime(/arrive/i, '09:00')
    expect(await screen.findByRole('alert')).toHaveTextContent('Routes API not enabled')
    expect(screen.getByText(/couldn't get a drive time/i)).toBeInTheDocument()
    expect(screen.queryByText('Wake up at')).not.toBeInTheDocument()
  })

  it('recovers after an error once the lookup succeeds', async () => {
    vi.mocked(estimateTravel).mockRejectedValueOnce(new Error('No driving route found to that destination'))
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), 'Nowhere')
    setTime(/arrive/i, '09:00')
    await screen.findByRole('alert')

    await user.clear(destinationField())
    await user.type(destinationField(), '1 Office Way')
    await screen.findByText('Wake up at')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('travel: I have an alarm', () => {
  async function planFromAlarm() {
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'I have an alarm' }))
    await user.type(destinationField(), '1 Office Way')
    setTime(/alarm/i, '06:30')
    await screen.findByText('Arrive at')
    return user
  }

  it('works forward: alarm + buffer + routine = leave time, + drive = arrival', async () => {
    const user = await planFromAlarm()
    await user.click(routineHeader())
    await user.click(screen.getByRole('checkbox', { name: /brush teeth/i })) // 3 min
    // 6:30 + 15 buffer = 6:45 start, + 3 routine = leave 6:48, + 30 drive = arrive 7:18
    await waitFor(() => expect(figure('Leave by')).toBe('6:48 AM'))
    expect(figure('Arrive at')).toBe('7:18 AM')
  })

  it('looks up traffic for the computed departure time, anchored as depart-at', async () => {
    await planFromAlarm()
    const anchor = vi.mocked(estimateTravel).mock.calls.at(-1)![2]
    expect(anchor.kind).toBe('depart-at')
    expect([anchor.at.getHours(), anchor.at.getMinutes()]).toEqual([6, 45]) // 6:30 alarm + 15 min buffer, no routine
  })

  it('keeps the entered arrival and alarm times separate when switching back and forth', async () => {
    const user = await planFromAlarm()
    await user.click(screen.getByRole('button', { name: 'Arrive by' }))
    expect(screen.getByLabelText(/arrive/i)).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'I have an alarm' }))
    expect(screen.getByLabelText(/alarm/i)).toHaveValue('06:30')
  })
})

describe('travel: leaving from', () => {
  function seedSaved() {
    localStorage.setItem(SAVED_KEY, JSON.stringify([{ id: 'home', label: 'Home', address: '1 Home St' }]))
  }

  it('defaults to the current location and uses it as the origin', async () => {
    const user = userEvent.setup()
    renderScreen()
    expect(screen.getByLabelText(/leaving from/i)).toHaveValue('current')
    await user.type(destinationField(), '1 Office Way')
    setTime(/arrive/i, '09:00')
    await screen.findByText('Wake up at')
    expect(vi.mocked(estimateTravel).mock.calls.at(-1)![0]).toEqual(HERE)
  })

  it('can start from a saved place instead', async () => {
    seedSaved()
    const user = userEvent.setup()
    renderScreen()
    await user.selectOptions(screen.getByLabelText(/leaving from/i), 'Home')
    await user.type(destinationField(), '1 Office Way')
    setTime(/arrive/i, '09:00')
    await screen.findByText('Wake up at')
    expect(vi.mocked(estimateTravel).mock.calls.at(-1)![0]).toBe('1 Home St')
  })

  it('remembers the chosen origin next time', async () => {
    seedSaved()
    const user = userEvent.setup()
    const first = renderScreen()
    await user.selectOptions(screen.getByLabelText(/leaving from/i), 'Home')
    first.unmount()
    renderScreen()
    expect(screen.getByLabelText(/leaving from/i)).toHaveValue('home')
  })

  it('falls back to the current location if the remembered origin was deleted', () => {
    localStorage.setItem('morning-calc:origin', 'deleted-id')
    renderScreen()
    expect(screen.getByLabelText(/leaving from/i)).toHaveValue('current')
  })

  it('shows a location error only when current location is the origin, and a saved origin avoids it', async () => {
    seedSaved()
    vi.mocked(getCurrentPosition).mockRejectedValue(new Error('User denied Geolocation'))
    const user = userEvent.setup()
    renderScreen()
    expect(await screen.findByRole('alert')).toHaveTextContent('User denied Geolocation')

    await user.selectOptions(screen.getByLabelText(/leaving from/i), 'Home')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not ask for location permission when starting from a saved place', async () => {
    seedSaved()
    localStorage.setItem('morning-calc:origin', 'home')
    renderScreen()
    await new Promise((r) => setTimeout(r, 50))
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })
})

describe('saved places', () => {
  it('saves the destination with a name, then offers it as a one-tap chip', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '12 Fit St')

    await user.click(screen.getByRole('button', { name: /save this place/i }))
    await user.type(screen.getByPlaceholderText(/name this place/i), 'Gym{Enter}')

    const chip = screen.getByRole('button', { name: 'Gym' })
    expect(chip).toHaveAttribute('aria-pressed', 'true') // it matches the current destination
    expect(screen.queryByRole('button', { name: /save this place/i })).not.toBeInTheDocument()
    expect(within(screen.getByLabelText(/leaving from/i)).getByRole('option', { name: 'Gym' })).toBeInTheDocument()
  })

  it('does not save a place without a name', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '12 Fit St')
    await user.click(screen.getByRole('button', { name: /save this place/i }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(localStorage.getItem(SAVED_KEY) ?? '[]').toBe('[]')
    expect(screen.getByPlaceholderText(/name this place/i)).toBeInTheDocument()
  })

  it('can cancel naming', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '12 Fit St')
    await user.click(screen.getByRole('button', { name: /save this place/i }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByPlaceholderText(/name this place/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save this place/i })).toBeInTheDocument()
  })

  it('offers no "save" prompt when there is nothing to save', () => {
    renderScreen()
    expect(screen.queryByRole('button', { name: /save this place/i })).not.toBeInTheDocument()
  })

  it('tapping a saved chip fills in the destination and computes the trip', async () => {
    localStorage.setItem(SAVED_KEY, JSON.stringify([{ id: 'gym', label: 'Gym', address: '12 Fit St' }]))
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Gym' }))
    expect(destinationField()).toHaveValue('12 Fit St')

    setTime(/arrive/i, '09:00')
    await screen.findByText('Wake up at')
    expect(vi.mocked(estimateTravel).mock.calls.at(-1)![1]).toBe('12 Fit St')
  })

  it('keeps saved places after a reload', async () => {
    const user = userEvent.setup()
    const first = renderScreen()
    await user.type(destinationField(), '12 Fit St')
    await user.click(screen.getByRole('button', { name: /save this place/i }))
    await user.type(screen.getByPlaceholderText(/name this place/i), 'Gym{Enter}')
    first.unmount()

    renderScreen()
    expect(screen.getByRole('button', { name: 'Gym' })).toBeInTheDocument()
  })

  it('asks before removing a place, and keeps it if you say no', async () => {
    localStorage.setItem(SAVED_KEY, JSON.stringify([{ id: 'gym', label: 'Gym', address: '12 Fit St' }]))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Remove Gym' }))
    expect(confirm).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Gym' })).toBeInTheDocument()
  })

  it('removes a place once confirmed, including from the origin list', async () => {
    localStorage.setItem(SAVED_KEY, JSON.stringify([{ id: 'gym', label: 'Gym', address: '12 Fit St' }]))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Remove Gym' }))
    expect(screen.queryByRole('button', { name: 'Gym' })).not.toBeInTheDocument()
    expect(within(screen.getByLabelText(/leaving from/i)).queryByRole('option', { name: 'Gym' })).not.toBeInTheDocument()
  })

  it('removing the place you are leaving from falls back to the current location', async () => {
    localStorage.setItem(SAVED_KEY, JSON.stringify([{ id: 'home', label: 'Home', address: '1 Home St' }]))
    localStorage.setItem('morning-calc:origin', 'home')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderScreen()
    expect(screen.getByLabelText(/leaving from/i)).toHaveValue('home')
    await user.click(screen.getByRole('button', { name: 'Remove Home' }))
    expect(screen.getByLabelText(/leaving from/i)).toHaveValue('current')
  })
})

describe('morning routine', () => {
  it('starts open when nothing is remembered so there is something to pick', () => {
    renderScreen()
    expect(screen.getByRole('checkbox', { name: /brush teeth/i })).toBeVisible()
  })

  it('summarises the routine in its header', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('checkbox', { name: /brush teeth/i })) // 3
    await user.click(screen.getByRole('checkbox', { name: /^shower/i })) // 30
    expect(screen.getByText(/2 selected · 33 min · 15 min buffer/)).toBeInTheDocument()
  })

  it('remembers activities, buffer, and direction between visits', async () => {
    const user = userEvent.setup()
    const first = renderScreen()
    await user.click(screen.getByRole('checkbox', { name: /^shower/i }))
    await user.click(screen.getByRole('button', { name: '30 min' }))
    await user.click(screen.getByRole('button', { name: 'I have an alarm' }))
    first.unmount()

    renderScreen()
    expect(screen.getByText(/1 selected · 30 min · 30 min buffer/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I have an alarm' })).toHaveAttribute('aria-pressed', 'true')
    // Routine is collapsed on return visits so the result is the first thing you see.
    expect(screen.getByRole('checkbox', { name: /^shower/i })).not.toBeVisible()
  })

  it('remembers custom activities and keeps ids unique across reloads', async () => {
    const user = userEvent.setup()
    const first = renderScreen()
    await user.type(screen.getByPlaceholderText(/custom activity/i), 'Walk dog')
    await user.type(screen.getByPlaceholderText('min'), '12')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    first.unmount()

    renderScreen()
    await user.click(routineHeader())
    await user.type(screen.getByPlaceholderText(/custom activity/i), 'Meditate')
    await user.type(screen.getByPlaceholderText('min'), '5')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByRole('checkbox', { name: /walk dog/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /meditate/i })).toBeChecked()
    expect(screen.getByText(/2 selected · 17 min/)).toBeInTheDocument()
  })

  it('rejects a custom activity with no name or a non-positive duration', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(screen.getByPlaceholderText('min'), '5')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.clear(screen.getByPlaceholderText('min'))
    await user.type(screen.getByPlaceholderText(/custom activity/i), 'Nothing')
    await user.type(screen.getByPlaceholderText('min'), '0')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText(/0 selected/)).toBeInTheDocument()
  })

  it('removing a custom activity also removes it from the totals', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(screen.getByPlaceholderText(/custom activity/i), 'Walk dog')
    await user.type(screen.getByPlaceholderText('min'), '12')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText(/1 selected · 12 min/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove Walk dog' }))
    expect(screen.getByText(/0 selected · 0 min/)).toBeInTheDocument()
  })

  it('a custom 0-minute buffer ("None") is applied', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '1 Office Way')
    setTime(/arrive/i, '09:00')
    await user.click(screen.getByRole('button', { name: 'None' }))
    await screen.findByText('Wake up at')
    expect(figure('Wake up at')).toBe('8:30 AM') // leave 8:30, no routine, no buffer
  })
})

describe('wake up only mode', () => {
  it('has no destination field and works backward from the leave time', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Wake up only' }))
    expect(screen.queryByRole('combobox', { name: /where are you going/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Leave at' })).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /^shower/i })) // 30
    setTime(/leave the house/i, '08:00')
    // start getting ready 7:30, 15 min buffer -> alarm 7:15
    expect(figure('Set your alarm for')).toBe('7:15 AM')
    expect(estimateTravel).not.toHaveBeenCalled()
  })

  it('works forward from an alarm', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Wake up only' }))
    await user.click(screen.getByRole('button', { name: 'I have an alarm' }))
    await user.click(screen.getByRole('checkbox', { name: /^shower/i }))
    setTime(/alarm/i, '07:00')
    // 7:00 + 15 buffer + 30 shower = leave 7:45
    expect(figure("You'll need to leave at")).toBe('7:45 AM')
  })
})

describe('summary bar (phones)', () => {
  type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void
  let reportVisibility: (visible: boolean) => void

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: ObserverCallback) {
          reportVisibility = (visible) => callback([{ isIntersecting: visible }])
        }
        observe() {}
        disconnect() {}
      },
    )
  })

  async function ready() {
    const user = userEvent.setup()
    renderScreen()
    await user.type(destinationField(), '1 Office Way')
    setTime(/arrive/i, '09:00')
    await screen.findByText('Wake up at')
    return user
  }

  it('is hidden while the full result is on screen', async () => {
    await ready()
    expect(screen.queryByRole('button', { name: /jump to full result/i })).not.toBeInTheDocument()
  })

  it('appears with both times once the result scrolls out of view', async () => {
    await ready()
    reportVisibility(false)
    const bar = await screen.findByRole('button', { name: /jump to full result/i })
    expect(bar).toHaveTextContent('Wake up at')
    expect(bar).toHaveTextContent('8:15 AM')
    expect(bar).toHaveTextContent('Leave by')
    expect(bar).toHaveTextContent('8:30 AM')
  })

  it('never appears before there is a result to show', () => {
    renderScreen()
    reportVisibility(false)
    expect(screen.queryByRole('button', { name: /jump to full result/i })).not.toBeInTheDocument()
  })

  it('scrolls back to the result when tapped', async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const user = await ready()
    reportVisibility(false)
    await user.click(await screen.findByRole('button', { name: /jump to full result/i }))
    expect(scrollIntoView).toHaveBeenCalled()
  })
})
