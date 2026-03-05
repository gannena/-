# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **media-only repository** containing 8 Buddhist mantra/chant MP3 audio files. There is no source code, build system, test framework, linting configuration, or application code.

### Repository contents
- 8 MP3 files (MPEG Layer III, 192 kbps, 44.1 kHz, Stereo, ID3v2.4 tags)
- No `package.json`, `requirements.txt`, `Makefile`, or any dependency manifest

### Serving files locally
To browse/play the audio files, use Python's built-in HTTP server:
```
python3 -m http.server 8080 --directory /workspace
```
Then open `http://localhost:8080` in Chrome to see the directory listing and click any MP3 to play it.

### Verifying MP3 integrity
`ffprobe` is available in the environment and can be used to inspect file metadata:
```
ffprobe -v quiet -show_format -show_streams <file.mp3>
```
