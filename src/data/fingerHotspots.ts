import type { FingerNumber } from "./chordTypes";

export interface FingerHotspot {
  finger: FingerNumber;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FINGER_NAMES: Record<FingerNumber, string> = {
  1: "검지",
  2: "중지",
  3: "약지",
  4: "소지",
};

export const fingerHotspotsByChordId: Record<string, FingerHotspot[]> = {
  "add9-a": [
    { finger: 1, x: 18.46, y: 69.18, width: 8.54, height: 11.44 },
    { finger: 2, x: 35.29, y: 89.64, width: 8.52, height: 11.44 },
    { finger: 3, x: 47.51, y: 24.81, width: 8.52, height: 11.41 },
  ],
  "add9-b": [
    { finger: 1, x: 42.9, y: 49.14, width: 8.52, height: 12.02 },
    { finger: 2, x: 65.18, y: 71.96, width: 8.52, height: 12.02 },
    { finger: 3, x: 85.81, y: 89.04, width: 8.52, height: 12.02 },
    { finger: 4, x: 91.77, y: 25.94, width: 8.52, height: 12.02 },
  ],
  "add9-c": [
    { finger: 1, x: 44, y: 76.29, width: 8.53, height: 12.74 },
    { finger: 2, x: 64.25, y: 27.59, width: 8.53, height: 12.77 },
  ],
  "add9-d": [
    { finger: 1, x: 34.99, y: 89.11, width: 8.54, height: 11.91 },
    { finger: 2, x: 45.84, y: 68.03, width: 8.52, height: 11.91 },
  ],
  "add9-e": [
    { finger: 2, x: 40.85, y: 46.46, width: 8.52, height: 12.04 },
    { finger: 1, x: 40.85, y: 22.09, width: 8.52, height: 12.07 },
    { finger: 3, x: 85.28, y: 88.97, width: 8.52, height: 12.07 },
    { finger: 4, x: 93.02, y: 67.54, width: 8.52, height: 12.07 },
  ],
  "add9-f": [
    { finger: 1, x: 18.78, y: 50.34, width: 8.54, height: 13.29 },
  ],
  "add9-g": [
    { finger: 1, x: 44.35, y: 76.53, width: 8.52, height: 13.01 },
    { finger: 2, x: 68.05, y: 49.94, width: 8.52, height: 13.05 },
  ],
  "major-a": [
    { finger: 1, x: 18.26, y: 69.23, width: 8.51, height: 11.86 },
    { finger: 2, x: 46.38, y: 89.85, width: 8.51, height: 11.91 },
  ],
  "major-b": [
    { finger: 1, x: 45.66, y: 22.14, width: 8.49, height: 12.06 },
    { finger: 1, x: 45.66, y: 46.49, width: 8.49, height: 12.06 },
    { finger: 2, x: 69.24, y: 68.96, width: 8.52, height: 12.06 },
    { finger: 3, x: 92.85, y: 90.65, width: 8.52, height: 12.06 },
  ],
  "major-c": [
    { finger: 3, x: 69.17, y: 36.03, width: 8.47, height: 11.22 },
  ],
  "major-d": [
    { finger: 1, x: 30.4, y: 91.41, width: 8.51, height: 12.54 },
    { finger: 2, x: 38.96, y: 69.39, width: 8.51, height: 12.54 },
    { finger: 3, x: 47.78, y: 48.75, width: 8.51, height: 12.54 },
  ],
  "major-e": [
    { finger: 1, x: 45.33, y: 22.96, width: 8.49, height: 12.32 },
    { finger: 2, x: 76.19, y: 91.49, width: 8.49, height: 12.32 },
    { finger: 3, x: 84.91, y: 69.84, width: 8.49, height: 12.32 },
    { finger: 4, x: 93.73, y: 49.53, width: 8.53, height: 12.32 },
  ],
  "major-f": [
    { finger: 1, x: 18.4, y: 46.78, width: 8.48, height: 11.66 },
    { finger: 2, x: 46.33, y: 90.09, width: 8.48, height: 11.61 },
  ],
  "major-g": [
    { finger: 1, x: 53.18, y: 74.57, width: 7.81, height: 13.68 },
    { finger: 2, x: 57.07, y: 22.85, width: 7.81, height: 13.68 },
    { finger: 3, x: 86.05, y: 47.24, width: 7.81, height: 13.68 },
  ],
  "major7-a": [
    { finger: 1, x: 9.53, y: 89.96, width: 8.43, height: 11.96 },
    { finger: 2, x: 21.96, y: 69.19, width: 8.46, height: 11.92 },
  ],
  "major7-b": [
    { finger: 1, x: 38.07, y: 23.02, width: 8.51, height: 12.01 },
    { finger: 1, x: 40.99, y: 46.84, width: 8.54, height: 12.01 },
    { finger: 2, x: 62, y: 89.8, width: 8.54, height: 12.01 },
    { finger: 3, x: 71.65, y: 68.48, width: 8.51, height: 12.05 },
  ],
  "major7-c": [
    { finger: 2, x: 46.6, y: 34.79, width: 8.51, height: 11.7 },
  ],
  "major7-d": [
    { finger: 1, x: 22.47, y: 83.63, width: 8.13, height: 10.09 },
    { finger: 1, x: 22.47, y: 46.05, width: 8.13, height: 10.09 },
    { finger: 1, x: 22.47, y: 65.71, width: 8.13, height: 10.09 },
    { finger: 1, x: 22.47, y: 27.44, width: 8.13, height: 10.09 },
    { finger: 3, x: 83.75, y: 28.49, width: 8.13, height: 10.09 },
  ],
  "major7-e": [
    { finger: 1, x: 19.29, y: 90.37, width: 8.52, height: 11.47 },
    { finger: 2, x: 46.33, y: 26.34, width: 8.52, height: 11.47 },
    { finger: 3, x: 68.95, y: 69.9, width: 8.52, height: 11.51 },
  ],
  "major7-f": [
    { finger: 2, x: 41.26, y: 81.84, width: 8.43, height: 10.56 },
  ],
  "major7-g": [
    { finger: 1, x: 45.35, y: 24.84, width: 8.51, height: 13.18 },
    { finger: 1, x: 45.35, y: 50.18, width: 8.51, height: 13.18 },
    { finger: 1, x: 46.13, y: 75.52, width: 8.51, height: 13.18 },
  ],
  "minor-a": [
    { finger: 2, x: 46.29, y: 90.85, width: 8.51, height: 11.36 },
  ],
  "minor-b": [
    { finger: 1, x: 23.41, y: 18.46, width: 8.31, height: 11.68 },
    { finger: 1, x: 23.6, y: 40.65, width: 8.31, height: 11.71 },
    { finger: 1, x: 23.73, y: 64.24, width: 8.33, height: 11.68 },
    { finger: 3, x: 86.66, y: 84.26, width: 8.31, height: 11.68 },
  ],
  "minor-c": [
    { finger: 1, x: 23.65, y: 17.85, width: 8.32, height: 13.06 },
    { finger: 1, x: 23.65, y: 67.36, width: 8.32, height: 13.06 },
    { finger: 1, x: 23.65, y: 41.92, width: 8.32, height: 13.06 },
    { finger: 4, x: 94.06, y: 95.95, width: 2.23, height: 4.79 },
  ],
  "minor-d": [
    { finger: 1, x: 24.36, y: 44.48, width: 7.93, height: 12.37 },
    { finger: 2, x: 46.74, y: 90.3, width: 7.93, height: 12.4 },
    { finger: 3, x: 55.79, y: 66.59, width: 7.93, height: 12.37 },
  ],
  "minor-e": [
    { finger: 1, x: 24.19, y: 20.55, width: 8.31, height: 11.49 },
    { finger: 2, x: 55.33, y: 40.57, width: 8.31, height: 11.49 },
    { finger: 3, x: 86.23, y: 62.5, width: 8.31, height: 11.49 },
  ],
  "minor-f": [
    { finger: 1, x: 14.16, y: 90.21, width: 7.93, height: 12.5 },
    { finger: 2, x: 27.1, y: 44.47, width: 7.93, height: 12.5 },
    { finger: 4, x: 87.4, y: 20.34, width: 7.93, height: 12.5 },
  ],
  "minor-g": [
    { finger: 1, x: 28.07, y: 23.47, width: 7.92, height: 13.81 },
    { finger: 2, x: 57.28, y: 73.36, width: 7.92, height: 13.81 },
    { finger: 3, x: 87.52, y: 48.01, width: 7.92, height: 13.78 },
  ],
  "minor6-a": [
    { finger: 1, x: 23.71, y: 43.82, width: 8.31, height: 12.46 },
    { finger: 1, x: 23.71, y: 90.21, width: 8.31, height: 12.46 },
    { finger: 2, x: 55.6, y: 21.07, width: 8.31, height: 12.46 },
    { finger: 3, x: 86.21, y: 67.09, width: 8.31, height: 12.46 },
  ],
  "minor6-b": [
    { finger: 1, x: 27.58, y: 90.32, width: 7.93, height: 12.4 },
    { finger: 2, x: 42.69, y: 67.16, width: 7.93, height: 12.4 },
    { finger: 3, x: 51.51, y: 44.48, width: 7.93, height: 12.4 },
    { finger: 4, x: 59.8, y: 20.35, width: 7.93, height: 12.4 },
  ],
  "minor6-c": [
    { finger: 1, x: 57.48, y: 90.32, width: 7.93, height: 12.4 },
    { finger: 2, x: 72.59, y: 67.16, width: 7.93, height: 12.4 },
    { finger: 3, x: 81.41, y: 44.48, width: 7.93, height: 12.4 },
    { finger: 4, x: 89.7, y: 20.35, width: 7.93, height: 12.4 },
  ],
  "minor6-d": [
    { finger: 1, x: 24.34, y: 44.47, width: 7.93, height: 12.4 },
    { finger: 2, x: 46.73, y: 90.31, width: 7.93, height: 12.37 },
    { finger: 3, x: 55.77, y: 66.6, width: 7.91, height: 12.4 },
    { finger: 4, x: 58.93, y: 21.27, width: 7.93, height: 12.4 },
  ],
  "minor6-e": [
    { finger: 1, x: 27.07, y: 74.58, width: 7.92, height: 13.68 },
    { finger: 2, x: 56.43, y: 22.86, width: 7.94, height: 13.68 },
  ],
  "minor6-f": [
    { finger: 1, x: 17.61, y: 90.21, width: 8.48, height: 11.61 },
    { finger: 1, x: 17.77, y: 47.02, width: 8.48, height: 11.61 },
    { finger: 2, x: 45.54, y: 69.43, width: 8.51, height: 11.57 },
    { finger: 4, x: 69.81, y: 24.82, width: 8.51, height: 11.61 },
  ],
  "minor6-g": [
    { finger: 1, x: 27.85, y: 22.87, width: 7.93, height: 13.69 },
    { finger: 2, x: 58, y: 72.97, width: 7.93, height: 13.69 },
  ],
  "minor7-a": [],
  "minor7-b": [
    { finger: 1, x: 23.35, y: 37.51, width: 8.33, height: 11.67 },
    { finger: 1, x: 23.35, y: 60.28, width: 8.33, height: 11.69 },
    { finger: 1, x: 23.35, y: 81.04, width: 8.33, height: 11.69 },
    { finger: 1, x: 23.35, y: 15.95, width: 8.33, height: 11.69 },
  ],
  "minor7-c": [
    { finger: 1, x: 23.82, y: 66.89, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 89.91, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 17.7, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 41.61, width: 8.33, height: 12.95 },
    { finger: 4, x: 93.76, y: 94.97, width: 1.97, height: 4.19 },
  ],
  "minor7-c-sharp": [
    { finger: 1, x: 23.82, y: 66.89, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 89.91, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 17.7, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 41.61, width: 8.33, height: 12.95 },
    { finger: 4, x: 62.48, y: 94.98, width: 1.95, height: 4.19 },
  ],
  "minor7-d": [
    { finger: 1, x: 27.83, y: 44.94, width: 7.92, height: 12.7 },
    { finger: 2, x: 47.57, y: 90.11, width: 7.94, height: 12.67 },
    { finger: 3, x: 57.51, y: 68.65, width: 7.94, height: 12.7 },
    { finger: 4, x: 86.63, y: 20.71, width: 7.92, height: 12.67 },
  ],
  "minor7-e": [
    { finger: 2, x: 51.59, y: 73.14, width: 7.94, height: 13.55 },
    { finger: 3, x: 58.13, y: 22.8, width: 7.93, height: 13.55 },
  ],
  "minor7-f": [
    { finger: 1, x: 27.2, y: 20.43, width: 7.93, height: 12.53 },
    { finger: 1, x: 27.2, y: 67.97, width: 7.93, height: 12.53 },
    { finger: 1, x: 27.2, y: 43.54, width: 7.93, height: 12.53 },
    { finger: 1, x: 27.2, y: 90.23, width: 7.93, height: 12.53 },
    { finger: 3, x: 86.84, y: 66.96, width: 7.93, height: 12.53 },
    { finger: 4, x: 87.91, y: 20.65, width: 7.93, height: 12.53 },
  ],
  "minor7-f-sharp": [
    { finger: 1, x: 23.71, y: 20.41, width: 8.31, height: 12.52 },
    { finger: 1, x: 23.71, y: 67.92, width: 8.31, height: 12.52 },
    { finger: 1, x: 23.71, y: 43.51, width: 8.31, height: 12.52 },
    { finger: 1, x: 23.71, y: 90.16, width: 8.31, height: 12.52 },
    { finger: 3, x: 86.21, y: 66.91, width: 8.31, height: 12.52 },
    { finger: 4, x: 87.33, y: 20.64, width: 8.31, height: 12.52 },
  ],
  "minor7-flat5-a": [],
  "minor7-flat5-b": [
    { finger: 1, x: 19.26, y: 48.96, width: 8.52, height: 11.7 },
    { finger: 2, x: 38.45, y: 92.08, width: 8.53, height: 11.7 },
    { finger: 3, x: 46.32, y: 69.36, width: 8.53, height: 11.7 },
  ],
  "minor7-flat5-c": [],
  "minor7-flat5-d": [],
  "minor7-flat5-e": [],
  "minor7-flat5-f": [],
  "minor7-flat5-g": [],
  "minor7-g": [
    { finger: 1, x: 25.23, y: 20.91, width: 7.92, height: 14.23 },
    { finger: 1, x: 27.61, y: 45.48, width: 7.92, height: 14.2 },
    { finger: 2, x: 57.43, y: 76.88, width: 7.94, height: 14.23 },
  ],
  "minor7-g-sharp": [
    { finger: 1, x: 27.41, y: 90.32, width: 7.93, height: 12.4 },
    { finger: 2, x: 46.27, y: 44.89, width: 7.93, height: 12.4 },
    { finger: 3, x: 58.27, y: 20.5, width: 7.93, height: 12.4 },
    { finger: 4, x: 82.73, y: 67.15, width: 7.93, height: 12.4 },
  ],
  "seventh-a": [
    { finger: 1, x: 16.7, y: 79.98, width: 8.51, height: 13.76 },
  ],
  "seventh-b": [
    { finger: 1, x: 46.52, y: 46.49, width: 8.51, height: 12.11 },
    { finger: 2, x: 69.3, y: 68.98, width: 8.51, height: 12.11 },
    { finger: 3, x: 92.99, y: 90.69, width: 8.51, height: 12.11 },
  ],
  "seventh-c": [
    { finger: 1, x: 17.61, y: 26.59, width: 8.53, height: 12.87 },
  ],
  "seventh-d": [
    { finger: 2, x: 41.77, y: 91.2, width: 8.51, height: 12.85 },
    { finger: 3, x: 45.86, y: 45.96, width: 8.48, height: 12.8 },
  ],
  "seventh-e": [
    { finger: 1, x: 17.52, y: 90.36, width: 8.53, height: 11.48 },
    { finger: 2, x: 43.1, y: 69.45, width: 8.5, height: 11.48 },
    { finger: 3, x: 48.76, y: 26.06, width: 8.5, height: 11.48 },
  ],
  "seventh-f": [
    { finger: 1, x: 18.4, y: 43.33, width: 8.48, height: 12.41 },
    { finger: 2, x: 46.61, y: 89.45, width: 8.51, height: 12.37 },
    { finger: 3, x: 68.76, y: 67.09, width: 8.48, height: 12.41 },
  ],
  "seventh-g": [
    { finger: 1, x: 27.39, y: 48.32, width: 7.93, height: 13.55 },
    { finger: 2, x: 51.1, y: 75.52, width: 7.93, height: 13.55 },
    { finger: 3, x: 57.22, y: 23.35, width: 7.93, height: 13.55 },
  ],
  "seventh-sus4-a": [
    { finger: 2, x: 43.43, y: 76.58, width: 8.51, height: 12.46 },
  ],
  "seventh-sus4-b": [
    { finger: 1, x: 23.26, y: 60.8, width: 8.33, height: 11.56 },
    { finger: 1, x: 23.26, y: 38.32, width: 8.33, height: 11.53 },
    { finger: 1, x: 23.26, y: 17.04, width: 8.33, height: 11.56 },
    { finger: 1, x: 23.26, y: 81.29, width: 8.33, height: 11.53 },
    { finger: 3, x: 85.17, y: 59.51, width: 8.33, height: 11.56 },
  ],
  "seventh-sus4-c": [
    { finger: 1, x: 27.29, y: 42.49, width: 7.92, height: 15.1 },
    { finger: 1, x: 27.29, y: 16.08, width: 7.92, height: 15.06 },
  ],
  "seventh-sus4-d": [
    { finger: 2, x: 41.58, y: 66.58, width: 7.93, height: 12.33 },
    { finger: 2, x: 57.58, y: 90.39, width: 7.93, height: 12.3 },
    { finger: 3, x: 78.07, y: 42.57, width: 7.93, height: 12.33 },
    { finger: 4, x: 87.26, y: 20.49, width: 7.93, height: 12.33 },
  ],
  "seventh-sus4-e": [
    { finger: 2, x: 44.78, y: 90.2, width: 7.94, height: 12.47 },
    { finger: 3, x: 53.33, y: 67.85, width: 7.93, height: 12.47 },
    { finger: 4, x: 58.31, y: 21.1, width: 7.93, height: 12.47 },
  ],
  "seventh-sus4-f": [
    { finger: 1, x: 27.91, y: 45.17, width: 7.93, height: 12.48 },
    { finger: 2, x: 73.75, y: 90.2, width: 7.92, height: 12.45 },
    { finger: 3, x: 82.29, y: 67.85, width: 7.93, height: 12.48 },
    { finger: 4, x: 87.28, y: 21.12, width: 7.93, height: 12.48 },
  ],
  "seventh-sus4-g": [
    { finger: 1, x: 27.86, y: 48.32, width: 7.92, height: 13.58 },
    { finger: 2, x: 57.46, y: 75.52, width: 7.92, height: 13.54 },
    { finger: 4, x: 87.68, y: 22.78, width: 7.94, height: 13.54 },
  ],
  "sixth-a": [
    { finger: 1, x: 23.71, y: 20.41, width: 8.31, height: 12.52 },
    { finger: 1, x: 23.71, y: 67.92, width: 8.31, height: 12.52 },
    { finger: 1, x: 23.71, y: 43.51, width: 8.31, height: 12.52 },
    { finger: 1, x: 23.71, y: 90.16, width: 8.31, height: 12.52 },
    { finger: 3, x: 86.21, y: 66.91, width: 8.31, height: 12.52 },
    { finger: 4, x: 87.33, y: 20.64, width: 8.31, height: 12.52 },
  ],
  "sixth-b": [
    { finger: 1, x: 27.41, y: 90.32, width: 7.93, height: 12.4 },
    { finger: 2, x: 46.27, y: 44.89, width: 7.93, height: 12.4 },
    { finger: 3, x: 58.27, y: 20.5, width: 7.93, height: 12.4 },
    { finger: 4, x: 82.73, y: 67.15, width: 7.93, height: 12.4 },
  ],
  "sixth-c": [],
  "sixth-d": [
    { finger: 1, x: 17.48, y: 15.95, width: 8.33, height: 11.69 },
    { finger: 1, x: 17.48, y: 81.04, width: 8.33, height: 11.69 },
    { finger: 1, x: 17.48, y: 37.51, width: 8.33, height: 11.67 },
    { finger: 1, x: 17.48, y: 60.28, width: 8.33, height: 11.69 },
  ],
  "sixth-e": [
    { finger: 1, x: 23.82, y: 66.89, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 89.91, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 17.7, width: 8.33, height: 12.97 },
    { finger: 1, x: 23.82, y: 41.61, width: 8.33, height: 12.95 },
    { finger: 4, x: 62.48, y: 94.98, width: 1.95, height: 4.19 },
  ],
  "sixth-f": [
    { finger: 1, x: 27.83, y: 44.94, width: 7.92, height: 12.7 },
    { finger: 2, x: 47.57, y: 90.11, width: 7.94, height: 12.67 },
    { finger: 3, x: 57.51, y: 68.65, width: 7.94, height: 12.7 },
    { finger: 4, x: 86.63, y: 20.71, width: 7.92, height: 12.67 },
  ],
  "sixth-g": [
    { finger: 2, x: 51.59, y: 73.14, width: 7.94, height: 13.55 },
    { finger: 3, x: 58.13, y: 22.8, width: 7.93, height: 13.55 },
  ],
  "sus4-a": [
    { finger: 2, x: 34.92, y: 89.82, width: 8.47, height: 11.95 },
    { finger: 3, x: 46.73, y: 68.86, width: 8.51, height: 11.95 },
  ],
  "sus4-b": [
    { finger: 1, x: 42.66, y: 22.14, width: 8.49, height: 12.06 },
    { finger: 1, x: 42.66, y: 46.49, width: 8.49, height: 12.06 },
    { finger: 3, x: 86.87, y: 90.65, width: 8.49, height: 12.06 },
  ],
  "sus4-c": [
    { finger: 1, x: 18.67, y: 54.22, width: 8.53, height: 12.18 },
    { finger: 3, x: 67.58, y: 30.08, width: 8.5, height: 12.14 },
  ],
  "sus4-d": [
    { finger: 1, x: 37.85, y: 91.41, width: 8.51, height: 12.54 },
    { finger: 2, x: 46.4, y: 69.39, width: 8.51, height: 12.54 },
    { finger: 3, x: 69.3, y: 47.29, width: 8.51, height: 12.54 },
  ],
  "sus4-e": [
    { finger: 1, x: 33.94, y: 84.46, width: 8.88, height: 11.59 },
    { finger: 2, x: 42.87, y: 64.11, width: 8.88, height: 11.59 },
    { finger: 3, x: 66.77, y: 43.69, width: 8.88, height: 11.59 },
  ],
  "sus4-f": [
    { finger: 1, x: 18.43, y: 21.77, width: 8.53, height: 11.99 },
    { finger: 1, x: 18.43, y: 45.86, width: 8.53, height: 11.99 },
    { finger: 3, x: 69.01, y: 90.37, width: 8.46, height: 11.9 },
  ],
  "sus4-g": [
    { finger: 1, x: 54.31, y: 74.57, width: 7.93, height: 13.68 },
    { finger: 3, x: 79.54, y: 47.25, width: 7.93, height: 13.68 },
    { finger: 4, x: 87.65, y: 22.85, width: 7.93, height: 13.68 },
  ],
};
