import { VoiceCall } from '../../components/VoiceCall'
import { BackToHomeButton } from '../../components/BackToHomeButton'

export default function Call() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
      <div className="w-full max-w-7xl py-4 sm:py-6 text-left">
        <div className="mb-4 sm:mb-6">
          <BackToHomeButton className="mb-2 sm:mb-3" />
        </div>
        <VoiceCall title="Request Emergency Help" />
      </div>
    </div>
  )
}
