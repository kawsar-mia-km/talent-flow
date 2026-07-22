import { useState } from "react";
import { X, Video, Mic, Upload } from "lucide-react";
import FieldError, { inputErrorClass } from "./FieldError";

export default function ApplyWizard({ job, onClose, onSubmit, submitting }) {
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState("");
  const [skillsTouched, setSkillsTouched] = useState(false);
  const [years, setYears] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const skillsError = skillsTouched && !skills.trim() ? "List at least one skill so TalentFlow can score your resume match." : "";

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Applying to</div>
            <div className="font-semibold text-slate-900 dark:text-slate-50">{job.title} · {job.company}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-5 pt-4">
          {["Resume", "Video", "Voice", "Review"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={
                  "w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center " +
                  (step > i + 1 ? "bg-teal-600 text-white" : step === i + 1 ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500")
                }
              >
                {i + 1}
              </div>
              {i < 3 && <div className={"h-px flex-1 mx-1 " + (step > i + 1 ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700")} />}
            </div>
          ))}
        </div>

        <div className="px-5 py-6">
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Upload your resume</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Attach your resume file, and list your skills (comma separated) so TalentFlow can match them against this role's requirements:{" "}
                <span className="text-slate-700 dark:text-slate-200">{job.requiredSkills.join(", ")}</span>.
              </p>
              <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 text-sm text-slate-500 dark:text-slate-400 mb-3 cursor-pointer hover:border-teal-300">
                <Upload className="w-4 h-4" />
                {resumeFile ? resumeFile.name : "Choose resume file (PDF/DOC)"}
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0] || null)} />
              </label>
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onBlur={() => setSkillsTouched(true)}
                rows={3}
                placeholder="e.g. Python, React, SQL, Java"
                aria-invalid={!!skillsError}
                className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(skillsError)}
              />
              <FieldError message={skillsError} />
              <input
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="Years of experience"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 mt-3"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Video interview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Record on your phone or webcam, then upload the clip: "Walk me through a project you're proud of."
                TalentFlow analyzes it with real face-tracking (MediaPipe) when the AI service is enabled.
              </p>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl aspect-video bg-slate-50 dark:bg-slate-950 mb-3 cursor-pointer hover:border-teal-300 text-center px-4">
                <Video className="w-8 h-8 text-slate-300" />
                <span className="text-sm text-slate-500 dark:text-slate-400">{videoFile ? videoFile.name : "Choose a video file (MP4, MOV, WEBM)"}</span>
                <input type="file" className="hidden" accept="video/*" capture="user" onChange={(e) => setVideoFile(e.target.files[0] || null)} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Voice response</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Upload an audio answer to: "Why are you a good fit for this role?" TalentFlow transcribes it with
                Whisper and analyzes tone/pacing with librosa when the AI service is enabled.
              </p>
              <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 text-sm text-slate-500 dark:text-slate-400 mb-3 cursor-pointer hover:border-teal-300">
                <Mic className="w-4 h-4" />
                {audioFile ? audioFile.name : "Choose an audio file (MP3, WAV, M4A)"}
                <input type="file" className="hidden" accept="audio/*" capture onChange={(e) => setAudioFile(e.target.files[0] || null)} />
              </label>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Review and submit</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">TalentFlow will generate your AI evaluation the moment you submit.</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2"><span className="text-slate-500 dark:text-slate-400">Resume file</span><span className="text-slate-800 dark:text-slate-100 font-medium">{resumeFile?.name || "Not attached"}</span></div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2"><span className="text-slate-500 dark:text-slate-400">Skills listed</span><span className="text-slate-800 dark:text-slate-100 font-medium">{skills || "—"}</span></div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2"><span className="text-slate-500 dark:text-slate-400">Experience</span><span className="text-slate-800 dark:text-slate-100 font-medium">{years || "—"}</span></div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2"><span className="text-slate-500 dark:text-slate-400">Video interview</span><span className="text-teal-700 dark:text-teal-300 font-medium">{videoFile ? videoFile.name : "Not attached"}</span></div>
                <div className="flex justify-between py-2"><span className="text-slate-500 dark:text-slate-400">Voice response</span><span className="text-teal-700 dark:text-teal-300 font-medium">{audioFile ? audioFile.name : "Not attached"}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => (step === 1 ? onClose() : setStep(step - 1))} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !skills.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={() => onSubmit({ skills, years, videoFile, audioFile, resumeFile })}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
