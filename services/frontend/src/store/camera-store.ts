import { create } from 'zustand';

interface CameraState {
  stream: MediaStream | null;
  capturedPhoto: string | null; // base64 representation of captured selfie
  isScanning: boolean;
  telemetryLogs: string[];
  setStream: (stream: MediaStream | null) => void;
  setCapturedPhoto: (photo: string | null) => void;
  setScanning: (scanning: boolean) => void;
  addTelemetryLog: (log: string) => void;
  clearTelemetryLogs: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  stream: null,
  capturedPhoto: null,
  isScanning: false,
  telemetryLogs: [],
  setStream: (stream) => set({ stream }),
  setCapturedPhoto: (photo) => set({ capturedPhoto: photo }),
  setScanning: (scanning) => set({ isScanning: scanning }),
  addTelemetryLog: (log) => set((state) => ({ telemetryLogs: [...state.telemetryLogs, log] })),
  clearTelemetryLogs: () => set({ telemetryLogs: [] }),
}));
