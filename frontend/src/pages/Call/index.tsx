import { VoiceCall } from '../../components/VoiceCall'
import { Navbar } from '../../components/Navbar'

export default function Call() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <VoiceCall title="Request Emergency Help" />
      </div>
    </div>
  )
}
