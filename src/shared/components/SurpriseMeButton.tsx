interface SurpriseMeButtonProps {
  disabled: boolean
  onPress: () => void
}

export function SurpriseMeButton({ disabled, onPress }: SurpriseMeButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white
        px-4 py-2.5 text-sm font-medium min-h-11 shadow-sm
        disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
    >
      Surprise me
    </button>
  )
}
