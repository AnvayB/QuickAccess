import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DestinationInput } from './DestinationInput'

type Suggestions = { suggestions: { placePrediction: { placeId: string; text: { toString: () => string } } | null }[] }

const suggestion = (id: string, text: string) => ({ placePrediction: { placeId: id, text: { toString: () => text } } })
const fetchSuggestions = vi.fn<(req: { input: string }) => Promise<Suggestions>>()

function Harness({ mapsReady = true, onValue }: { mapsReady?: boolean; onValue?: (v: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <>
      <label htmlFor="dest">Destination</label>
      <DestinationInput
        id="dest"
        value={value}
        mapsReady={mapsReady}
        onChange={(v) => {
          setValue(v)
          onValue?.(v)
        }}
      />
    </>
  )
}

beforeEach(() => {
  fetchSuggestions.mockReset()
  fetchSuggestions.mockResolvedValue({ suggestions: [] })
  vi.stubGlobal('google', { maps: { places: { AutocompleteSuggestion: { fetchAutocompleteSuggestions: fetchSuggestions } } } })
})

describe('DestinationInput', () => {
  it('has an accessible name from its label', () => {
    render(<Harness />)
    expect(screen.getByRole('combobox', { name: 'Destination' })).toBeInTheDocument()
  })

  it('shows suggestions as you type and fills the field when one is chosen', async () => {
    fetchSuggestions.mockResolvedValue({
      suggestions: [suggestion('1', 'Blue Bottle Coffee, 1 Main St'), suggestion('2', 'Blue Bottle, 9 Oak Ave')],
    })
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('combobox'), 'blue')
    const option = await screen.findByRole('option', { name: 'Blue Bottle Coffee, 1 Main St' })
    await user.click(option)

    expect(screen.getByRole('combobox')).toHaveValue('Blue Bottle Coffee, 1 Main St')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('does not spend an API request on very short input', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), 'ab')
    await new Promise((r) => setTimeout(r, 400))
    expect(fetchSuggestions).not.toHaveBeenCalled()
  })

  it('waits until typing pauses instead of querying on every keystroke', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), 'coffee')
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalled())
    expect(fetchSuggestions).toHaveBeenCalledTimes(1)
    expect(fetchSuggestions).toHaveBeenCalledWith({ input: 'coffee' })
  })

  it('does not query before Google Maps has loaded, but still lets you type', async () => {
    const user = userEvent.setup()
    render(<Harness mapsReady={false} />)
    await user.type(screen.getByRole('combobox'), '123 Main St')
    await new Promise((r) => setTimeout(r, 400))
    expect(fetchSuggestions).not.toHaveBeenCalled()
    expect(screen.getByRole('combobox')).toHaveValue('123 Main St')
  })

  it('supports keyboard selection (arrow keys + Enter) and Escape', async () => {
    fetchSuggestions.mockResolvedValue({ suggestions: [suggestion('1', 'First Place'), suggestion('2', 'Second Place')] })
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('combobox')

    await user.type(input, 'place')
    await screen.findAllByRole('option')
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(input).toHaveValue('Second Place')

    await user.clear(input)
    await user.type(input, 'place')
    await screen.findAllByRole('option')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('Enter with nothing highlighted does not pick a suggestion', async () => {
    fetchSuggestions.mockResolvedValue({ suggestions: [suggestion('1', 'First Place')] })
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), 'first')
    await screen.findByRole('option')
    await user.keyboard('{Enter}')
    expect(screen.getByRole('combobox')).toHaveValue('first')
  })

  it('ignores a slow response that arrives after a newer one', async () => {
    let resolveSlow!: (v: Suggestions) => void
    fetchSuggestions
      .mockImplementationOnce(() => new Promise<Suggestions>((r) => (resolveSlow = r)))
      .mockResolvedValueOnce({ suggestions: [suggestion('new', 'Newer Result')] })
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('combobox')

    await user.type(input, 'old')
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalledTimes(1))
    await user.type(input, 'er')
    await screen.findByRole('option', { name: 'Newer Result' })

    resolveSlow({ suggestions: [suggestion('old', 'Stale Result')] })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('option', { name: 'Stale Result' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Newer Result' })).toBeInTheDocument()
  })

  it('does not reopen the list after a suggestion is chosen while a request is in flight', async () => {
    let resolveLate!: (v: Suggestions) => void
    fetchSuggestions
      .mockResolvedValueOnce({ suggestions: [suggestion('1', 'Chosen Place')] })
      .mockImplementationOnce(() => new Promise<Suggestions>((r) => (resolveLate = r)))
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('combobox')

    await user.type(input, 'cho')
    await user.click(await screen.findByRole('option'))
    resolveLate?.({ suggestions: [suggestion('2', 'Late Result')] })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('closes the list when focus leaves the field', async () => {
    fetchSuggestions.mockResolvedValue({ suggestions: [suggestion('1', 'First Place')] })
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), 'first')
    await screen.findByRole('option')
    fireEvent.blur(screen.getByRole('combobox'))
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('keeps working when the Places request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchSuggestions.mockRejectedValue(new Error('PERMISSION_DENIED'))
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), '1 main st')
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalled())
    expect(screen.getByRole('combobox')).toHaveValue('1 main st')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('skips predictions that have no place (e.g. query suggestions)', async () => {
    fetchSuggestions.mockResolvedValue({ suggestions: [{ placePrediction: null }, suggestion('1', 'Real Place')] })
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('combobox'), 'real')
    expect(await screen.findAllByRole('option')).toHaveLength(1)
  })
})
