Lenticular
==========
By Graham

A fragment shader thing for making videos &c.

## Overview

This is a fucking trash fire stay away plz.

## Getting Started

Lenticular provides a rudimentary display and recording tool for simple stacks of fragment shaders and 2D canvas context drawings. Mostly the former. It can take webcam input, still frames, or a series of frames from e.g. a video as input.

Programs are defined by JSON files in either "library/programs" or "user/programs," and shaders are defined in "library/shaders" or "user/shaders." Shader paths in program files are relative to these directories. Subdirectories, etc. are allowed.

- To get started, clone the repo, install the deps, etc. and run "yarn run" or equivalent from the project root.

- Specify "?program=[program-name]" or "?p=[program-name]" in the URL to run a program.

- Add a "dim=[n]" parameter to the URL to override program specifications for canvas size (this is sometimes useful on shittier hardware vis-a-vis not crashing your GPU).

## Controls

- \<Tab\>: Start or stop play
- \<Space\>: Increment execution or stop if playing
- \<F\>: Toggle canvas size between contain and cover wrt browser window
- \<Shift+F\>: Toggle webcam viewport in the same fashion
- \<R\>: Reset play to time index 0 and clear buffer textures
- \<Ctrl+S\>: Save current frame to file

## Output

Besides saving individual frames, Lenticular can export sequences of frames to individual PNG images or a video file, provided ffmpeg is installed. Toggle the "Record images" button and "Record video" button to enable or disable these modalities. Not that enabling these *does not cause recording to start* — you must click the "Record" button to actually start recording. Stopping recording will finalize the current video file. Play can be stopped and incremented while record is still active. Frame range to record can be set in the program JSON file.

## Additional Resources

There's a bunch of other crap that I don't entirely remember and can't explain well, but can probs be discovered pretty easily. The bulk image uploader is sort of flaky but should work exactly once per page load. Four additional still images can be loaded into the four "drawing" canvases available in the dropdown. Double click on the canvas to load a file. These are stored in IndexedDB so will persist between sessions in the same browser until cleared. The canvases can also be used for running arbitrary 2D canvas context drawings, which are also specificed in the program JSON file, somehow.
