import { Volume2, X } from "lucide-react";
import { useChordAudio, type StrumSpeed } from "../audio/ChordAudioProvider";

const SPEED_OPTIONS: { value: StrumSpeed; label: string }[] = [
  { value: "slow", label: "느리게" },
  { value: "normal", label: "보통" },
  { value: "fast", label: "빠르게" },
];

interface AudioSettingsPanelProps {
  highContrast: boolean;
  onToggleContrast: () => void;
  onClose: () => void;
}

export function AudioSettingsPanel({
  highContrast,
  onToggleContrast,
  onClose,
}: AudioSettingsPanelProps) {
  const { available, settings, updateSettings } = useChordAudio();

  return (
    <div id="audio-settings-panel" className="audio-settings-panel" role="group" aria-label="앱 설정">
      <div className="audio-settings-title">
        <span><Volume2 size={17} aria-hidden="true" /> 앱 설정</span>
        <button type="button" data-chord-audio="true" onClick={onClose} aria-label="설정 닫기">
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="contrast-setting-row">
        <span>고대비</span>
        <button
          type="button"
          data-chord-audio="true"
          className="contrast-switch"
          role="switch"
          aria-label="고대비 모드"
          aria-checked={highContrast}
          onClick={onToggleContrast}
        >
          <span aria-hidden="true" />
          {highContrast ? "켬" : "끔"}
        </button>
      </div>
      {!available ? <p className="audio-unavailable">이 브라우저에서는 소리를 재생할 수 없습니다.</p> : null}
      <label className="audio-toggle-row">
        <span>튜닝</span>
        <select
          data-chord-audio="true"
          value={settings.lowG ? "low" : "high"}
          onChange={(event) => updateSettings({ lowG: event.target.value === "low" })}
          disabled={!available}
        >
          <option value="high">High G</option>
          <option value="low">Low G</option>
        </select>
      </label>
      <label className="audio-volume-row">
        <span>볼륨 {Math.round(settings.volume * 100)}%</span>
        <input
          data-chord-audio="true"
          type="range"
          min="0"
          max="100"
          step="5"
          value={Math.round(settings.volume * 100)}
          onChange={(event) => updateSettings({ volume: Number(event.target.value) / 100 })}
          disabled={!available}
        />
      </label>
      <fieldset className="audio-speed-options" disabled={!available}>
        <legend>스트럼 속도</legend>
        <div>
          {SPEED_OPTIONS.map((option) => (
            <label key={option.value}>
              <input
                data-chord-audio="true"
                type="radio"
                name="strum-speed"
                value={option.value}
                checked={settings.speed === option.value}
                onChange={() => updateSettings({ speed: option.value })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
