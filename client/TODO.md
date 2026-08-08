# Admin Dashboard Edit/Image Fix

## Steps
- [x] Analyze the admin dashboard edit & image replacement flow (script.js, server.js, index.html)
- [x] Add `updateImagePreview()` to update only the image preview DOM (not re-render the whole form)
- [x] Update `handleImageFile()` to call `updateImagePreview()` instead of re-opening the modal
- [x] Update `removeImage()` to call `updateImagePreview()` instead of re-opening the modal
- [x] Add `id="imageRemoveBtn"` to the "Remove Photography" button in `renderProductForm()`
- [x] Verify the fix in the admin dashboard (edit details + replace image persist)
